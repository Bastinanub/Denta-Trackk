import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface RouterState {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterState | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname + window.location.search);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) return;
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo<RouterState>(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterState {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

// Parse a path like "/patients/:id/visits/:visitId" against the actual path.
export function matchRoute(pattern: string, actual: string): Record<string, string> | null {
  const cleanActual = actual.split('?')[0];
  const pParts = pattern.split('/').filter(Boolean);
  const aParts = cleanActual.split('/').filter(Boolean);
  if (pParts.length !== aParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':')) {
      params[pParts[i].slice(1)] = decodeURIComponent(aParts[i]);
    } else if (pParts[i] !== aParts[i]) {
      return null;
    }
  }
  return params;
}

export function getQuery(path: string): Record<string, string> {
  const qIndex = path.indexOf('?');
  if (qIndex === -1) return {};
  const params = new URLSearchParams(path.slice(qIndex + 1));
  const out: Record<string, string> = {};
  params.forEach((v, k) => (out[k] = v));
  return out;
}
