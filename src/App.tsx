import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { RouterProvider, useRouter, matchRoute } from '@/lib/router';
import { AppLayout } from '@/components/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { PatientsPage } from '@/pages/PatientsPage';
import { RegisterPatient } from '@/pages/RegisterPatient';
import { PatientProfile } from '@/pages/PatientProfile';
import { NewVisit } from '@/pages/NewVisit';
import { VisitDetail } from '@/pages/VisitDetail';
import { Loader2 } from 'lucide-react';

function Routes() {
  const { path, navigate } = useRouter();
  const { user, staff, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  // User exists in auth but staff row not provisioned (e.g. OAuth or edge case).
  if (user && !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 max-w-md text-center">
          <h2 className="font-semibold text-slate-900">Finishing your profile</h2>
          <p className="text-sm text-slate-500 mt-2">Your clinic profile is being set up. If this persists, sign out and sign up again.</p>
          <button className="btn-secondary mt-4" onClick={() => { /* refresh */ window.location.reload(); }}>Retry</button>
        </div>
      </div>
    );
  }

  // Route matching
  let m;
  if (path === '/' || path === '') return <AppLayout><Dashboard /></AppLayout>;
  if (path === '/patients') return <AppLayout><PatientsPage /></AppLayout>;
  if (path === '/patients/new') return <AppLayout><RegisterPatient /></AppLayout>;
  if ((m = matchRoute('/patients/:id', path))) return <AppLayout><PatientProfile patientId={m.id} /></AppLayout>;
  if ((m = matchRoute('/patients/:id/visits/new', path))) return <AppLayout><NewVisit patientId={m.id} /></AppLayout>;
  if ((m = matchRoute('/patients/:id/visits/:visitId', path))) {
    return <AppLayout><VisitDetail patientId={m.id} visitId={m.visitId} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="card p-12 text-center">
        <p className="text-slate-600">Page not found.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>Go to dashboard</button>
      </div>
    </AppLayout>
  );
}

function RedirectRoot() {
  const { path, navigate } = useRouter();
  useEffect(() => {
    if (path === '' ) navigate('/');
  }, [path, navigate]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <RedirectRoot />
        <Routes />
      </RouterProvider>
    </AuthProvider>
  );
}
