import { useEffect, useState } from 'react';
import { Search, UserPlus, Users as UsersIcon, Phone, Hash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter, getQuery } from '@/lib/router';
import { formatDate, fullName, ageFromDob } from '@/lib/format';
import type { Patient } from '@/lib/types';

export function PatientsPage() {
  const { path, navigate } = useRouter();
  const initialQ = getQuery(path).q ?? '';
  const [q, setQ] = useState(initialQ);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  async function search(term: string) {
    setLoading(true);
    const t = term.trim();
    if (!t) {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setPatients((data as Patient[]) ?? []);
    } else {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .or(`uhid.ilike.%${t}%,first_name.ilike.%${t}%,last_name.ilike.%${t}%,mobile.ilike.%${t}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      setPatients((data as Patient[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { search(initialQ); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Search by UHID, name or mobile number.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/patients/new')}>
          <UserPlus className="w-4 h-4" /> Register Patient
        </button>
      </div>

      <div className="card p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); navigate(`/patients?q=${encodeURIComponent(q.trim())}`); search(q); }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by UHID, name or mobile"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn-primary" type="submit">Search</button>
          {initialQ && (
            <button type="button" className="btn-ghost" onClick={() => { setQ(''); navigate('/patients'); search(''); }}>
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-slate-500 text-sm">No patients found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {patients.map((p) => (
              <li
                key={p.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-medium text-sm shrink-0">
                    {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{fullName(p.first_name, p.last_name)}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Hash className="w-3 h-3" />{p.uhid}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{p.mobile}</span>
                  <span>{ageFromDob(p.date_of_birth)} yrs</span>
                  <span className="capitalize">{p.gender}</span>
                  <span className="text-slate-400">Reg. {formatDate(p.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
