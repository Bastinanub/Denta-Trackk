import { useState, type FormEvent } from 'react';
import { Activity, Loader2, Lock, Mail, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { audit } from '@/lib/audit';

export function AuthPage() {
  const { refreshStaff } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'dentist' | 'admin'>('dentist');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          const { error: staffError } = await supabase.from('staff').upsert(
            { id: data.user.id, full_name: fullName.trim(), role },
            { onConflict: 'id' },
          );
          if (staffError) throw staffError;
          await audit('staff_signup', 'staff', data.user.id, { role });
          await refreshStaff(data.user.id);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        await audit('staff_signin', 'staff');
        await refreshStaff(data.user.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Brand panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -left-16 bottom-10 w-72 h-72 rounded-full bg-white" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            DentaTrack
          </div>
          <p className="mt-2 text-primary-100 text-sm">Clinical record system for modern dental practices.</p>
        </div>
        <div className="relative space-y-4 mt-12 lg:mt-0">
          <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
            Patient records, visits and the dental chart — all in one place.
          </h1>
          <ul className="space-y-2 text-primary-50/90 text-sm">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-200" />Search and register patients with auto-generated UHID</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-200" />Build clickable FDI odontograms per visit</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-200" />Attach timestamped clinical media securely</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-200" />Review complete chronological patient history</li>
          </ul>
        </div>
        <p className="relative text-primary-100/70 text-xs mt-10">Private &amp; secure. Role-based access, audit logged.</p>
      </div>

      {/* Form panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-slate-900">
            {mode === 'signin' ? 'Sign in to your clinic' : 'Create a clinic account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin' ? 'Enter your credentials to continue.' : 'Register as a dentist or admin to get started.'}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className="input pl-9" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Dr. Jane Smith" />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@clinic.com" />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" className="input pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="label">Role</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value as 'dentist' | 'admin')}>
                  <option value="dentist">Dentist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            {mode === 'signin' ? "Don't have an account? " : 'Already registered? '}
            <button
              className="text-primary-700 font-medium hover:underline"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
