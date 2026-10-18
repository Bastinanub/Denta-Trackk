import { useState, type FormEvent } from 'react';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { audit } from '@/lib/audit';
import type { Patient } from '@/lib/types';

interface Form {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  email: string;
  address: string;
  emergency_contact: string;
  medical_history: string;
  allergies: string;
}

const empty: Form = {
  first_name: '', last_name: '', date_of_birth: '', gender: 'male',
  mobile: '', email: '', address: '', emergency_contact: '', medical_history: '', allergies: '',
};

export function RegisterPatient() {
  const { navigate } = useRouter();
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Form>(key: K, val: Form[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const insert = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        mobile: form.mobile.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        emergency_contact: form.emergency_contact.trim() || null,
        medical_history: form.medical_history.trim() || null,
        allergies: form.allergies.trim() || null,
      };
      const { data, error: err } = await supabase.from('patients').insert(insert).select().single();
      if (err) throw err;
      await audit('patient_register', 'patients', (data as Patient).id, { uhid: (data as Patient).uhid }, );
      navigate(`/patients/${(data as Patient).id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register patient.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button className="btn-ghost text-sm" onClick={() => navigate('/patients')}>
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Register New Patient</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          A unique UHID will be generated automatically when you save.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card p-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Demographics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First name *</label>
              <input className="input" required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Last name *</label>
              <input className="input" required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Date of birth *</label>
              <input type="date" className="input" required value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value as Form['gender'])}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Mobile *</label>
              <input className="input" required value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="e.g. +1 555 0100" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <textarea className="input min-h-[80px]" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Emergency contact</label>
              <input className="input" value={form.emergency_contact} onChange={(e) => set('emergency_contact', e.target.value)} placeholder="Name and phone" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Medical Background</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">Medical history</label>
              <textarea className="input min-h-[80px]" value={form.medical_history} onChange={(e) => set('medical_history', e.target.value)} placeholder="Conditions, chronic illnesses, previous surgeries…" />
            </div>
            <div>
              <label className="label">Allergies</label>
              <textarea className="input min-h-[60px]" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Drug / food / material allergies" />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" className="btn-secondary" onClick={() => navigate('/patients')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save patient
          </button>
        </div>
      </form>
    </div>
  );
}
