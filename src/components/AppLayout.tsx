import { type ReactNode } from 'react';
import { Activity, LayoutDashboard, Users, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';

export function AppLayout({ children }: { children: ReactNode }) {
  const { staff, signOut } = useAuth();
  const { navigate, path } = useRouter();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/', active: path === '/' },
    { label: 'Patients', icon: Users, to: '/patients', active: path.startsWith('/patients') },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5 text-lg font-semibold text-slate-900">
            <div className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            DentaTrack
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <UserCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{staff?.full_name ?? 'Staff'}</p>
              <p className="text-xs text-slate-500 capitalize">{staff?.role ?? '—'}</p>
            </div>
            <button onClick={signOut} className="text-slate-400 hover:text-red-600 transition-colors" title="Sign out">
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          DentaTrack
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{staff?.full_name}</span>
          <button onClick={signOut} className="text-slate-400 hover:text-red-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="md:hidden flex gap-2 px-4 py-2 bg-white border-b border-slate-200 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                item.active ? 'bg-primary-50 text-primary-700' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
