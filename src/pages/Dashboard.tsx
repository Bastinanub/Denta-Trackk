import { useEffect, useState } from 'react';
import { Users, CalendarPlus, FileText, TrendingUp, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { formatDate, fullName } from '@/lib/format';
import type { Patient, Visit } from '@/lib/types';

interface RecentVisit extends Visit {
  patients: Pick<Patient, 'first_name' | 'last_name' | 'uhid'> | null;
}

export function Dashboard() {
  const { navigate } = useRouter();
  const [stats, setStats] = useState({ patients: 0, visits: 0, thisWeek: 0 });
  const [recent, setRecent] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const [p, v, week, rv] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('visits').select('*', { count: 'exact', head: true }).gte('visit_date', new Date(Date.now() - 7 * 864e5).toISOString()),
        supabase
          .from('visits')
          .select('*, patients(first_name, last_name, uhid)')
          .order('visit_date', { ascending: false })
          .limit(6),
      ]);
      setStats({
        patients: p.count ?? 0,
        visits: v.count ?? 0,
        thisWeek: week.count ?? 0,
      });
      setRecent((rv.data as RecentVisit[]) ?? []);
      setLoading(false);
    })();
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return navigate('/patients');
    navigate(`/patients?q=${encodeURIComponent(q)}`);
  }

  const cards = [
    { label: 'Total Patients', value: stats.patients, icon: Users, tint: 'bg-primary-50 text-primary-700' },
    { label: 'Total Visits', value: stats.visits, icon: FileText, tint: 'bg-accent-50 text-accent-700' },
    { label: 'Visits This Week', value: stats.thisWeek, icon: CalendarPlus, tint: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of patients and recent clinical activity.</p>
        </div>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9 w-64"
              placeholder="Search UHID, name or mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className="text-3xl font-semibold text-slate-900 mt-1">
                    {loading ? <span className="inline-block w-8 h-7 bg-slate-100 rounded animate-pulse" /> : c.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.tint}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Recent Visits
          </h2>
          <button className="btn-ghost text-sm" onClick={() => navigate('/patients')}>All patients →</button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No visits yet. Register a patient and create the first visit.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((v) => (
              <li key={v.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {v.patients ? fullName(v.patients.first_name, v.patients.last_name) : 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500">{v.patients?.uhid ?? '—'} · {formatDate(v.visit_date)}</p>
                </div>
                <span className={`badge ${v.record_type === 'dental_status' ? 'bg-accent-50 text-accent-700' : 'bg-slate-100 text-slate-600'}`}>
                  {v.record_type === 'dental_status' ? 'Dental Status' : 'General'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
