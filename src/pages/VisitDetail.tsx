import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Stethoscope, ClipboardList as ToothIcon, Camera, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { formatDateTime } from '@/lib/format';
import { Odontogram } from '@/components/Odontogram';
import { ToothDetail } from '@/components/ToothDetail';
import { MediaGallery } from '@/components/MediaGallery';
import type { Patient, Visit, ToothCondition, Diagnosis, ConditionDefinition } from '@/lib/types';

type Tab = 'history' | 'chart' | 'media';

export function VisitDetail({ patientId, visitId }: { patientId: string; visitId: string }) {
  const { navigate } = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [conditions, setConditions] = useState<ToothCondition[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [definitions, setDefinitions] = useState<ConditionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('history');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    const [p, v, c, d, defs] = await Promise.all([
      supabase.from('patients').select('*').eq('id', patientId).maybeSingle(),
      supabase.from('visits').select('*').eq('id', visitId).maybeSingle(),
      supabase.from('tooth_conditions').select('*').eq('visit_id', visitId).order('created_at', { ascending: true }),
      supabase.from('diagnoses').select('*').eq('visit_id', visitId).order('created_at', { ascending: false }),
      supabase.from('condition_definitions').select('*').eq('is_active', true).order('label', { ascending: true }),
    ]);
    const queryError = [p.error, v.error, c.error, d.error, defs.error].find(Boolean);
    if (queryError) setLoadError(queryError.message);
    const loadedVisit = (v.data as Visit | null) ?? null;
    setPatient((p.data as Patient | null) ?? null);
    setVisit(loadedVisit);
    setConditions((c.data as ToothCondition[]) ?? []);
    setDiagnoses((d.data as Diagnosis[]) ?? []);
    setDefinitions((defs.data as ConditionDefinition[]) ?? []);
    if (loadedVisit?.record_type === 'dental_status') setTab('chart');
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [visitId, patientId, refreshKey]);

  async function addDiagnosis() {
    if (!newDiagnosis.trim()) return;
    const { error } = await supabase.from('diagnoses').insert({
      visit_id: visitId,
      diagnosis: newDiagnosis.trim(),
    });
    if (!error) { setNewDiagnosis(''); setRefreshKey((k) => k + 1); }
  }

  async function deleteDiagnosis(id: string) {
    await supabase.from('diagnoses').delete().eq('id', id);
    setRefreshKey((k) => k + 1);
  }

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 card animate-pulse" />)}</div>;
  if (loadError) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-700 font-medium">We couldn’t load this clinical record.</p>
        <p className="text-sm text-slate-500 mt-2">{loadError}</p>
        <button className="btn-secondary mt-4" onClick={() => load()}>Try again</button>
      </div>
    );
  }
  if (!patient || !visit) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">Visit not found.</p>
        <button className="btn-secondary mt-4" onClick={() => navigate(`/patients/${patientId}`)}>Back</button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Stethoscope }[] = [
    { id: 'history', label: 'Case History', icon: Stethoscope },
    { id: 'chart', label: 'Dental Chart', icon: ToothIcon },
    { id: 'media', label: 'Media', icon: Camera },
  ];

  const historyFields = [
    { label: 'Chief Complaint', value: visit.chief_complaint },
    { label: 'History of Presenting Illness', value: visit.history_presenting },
    { label: 'Past Medical History', value: visit.past_medical },
    { label: 'Past Surgical History', value: visit.past_surgical },
    { label: 'Current Medications', value: visit.medications },
    { label: 'Notes', value: visit.notes },
  ];

  return (
    <div className="space-y-6">
      <button className="btn-ghost text-sm" onClick={() => navigate(`/patients/${patient.id}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to patient
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`badge ${visit.record_type === 'dental_status' ? 'bg-accent-50 text-accent-700' : 'bg-slate-100 text-slate-600'}`}>
              {visit.record_type === 'dental_status' ? 'Dental Status' : 'General'}
            </span>
            <h1 className="text-xl font-semibold text-slate-900">{formatDateTime(visit.visit_date)}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{patient.uhid} · {patient.first_name} {patient.last_name}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                active ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'history' && (
        <div className="space-y-6">
          <div className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {historyFields.map((f) => (
              <div key={f.label}>
                <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">{f.label}</p>
                <p className="text-sm text-slate-800 mt-1 whitespace-pre-line">{f.value || <span className="text-slate-400">—</span>}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-slate-900">Diagnoses</h3>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                className="input"
                placeholder="Add diagnosis (e.g. Chronic apical periodontitis 36)"
                value={newDiagnosis}
                onChange={(e) => setNewDiagnosis(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDiagnosis(); } }}
              />
              <button className="btn-primary" onClick={addDiagnosis}><Plus className="w-4 h-4" /> Add</button>
            </div>
            {diagnoses.length === 0 ? (
              <p className="text-sm text-slate-400">No diagnoses recorded.</p>
            ) : (
              <ul className="space-y-2">
                {diagnoses.map((d) => (
                  <li key={d.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="text-sm text-slate-800">{d.diagnosis}</p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(d.created_at)}</p>
                    </div>
                    <button onClick={() => deleteDiagnosis(d.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'chart' && (
        <div className="space-y-4">
          <div className="card p-6">
            <p className="text-sm text-slate-500 mb-4">
              Click any tooth to record its condition, surface and notes. Markings are saved against this visit.
            </p>
            <Odontogram
              conditions={conditions}
              definitions={definitions}
              selectedTooth={selectedTooth}
              onSelectTooth={(n) => setSelectedTooth(n)}
            />
          </div>

          {conditions.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Charted teeth ({new Set(conditions.map((c) => c.tooth_number)).size})</h3>
              <ul className="divide-y divide-slate-100">
                {Array.from(new Set(conditions.map((c) => c.tooth_number))).sort((a, b) => a - b).map((n) => {
                  const cs = conditions.filter((c) => c.tooth_number === n);
                  return (
                    <li key={n} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Tooth {n}</p>
                        <p className="text-xs text-slate-500">
                          {cs.map((c) => {
                            const def = definitions.find((d) => d.code === c.condition);
                            return `${def?.label ?? c.condition}${c.surface ? ` · ${c.surface}` : ''}`;
                          }).join(', ')}
                        </p>
                      </div>
                      <button className="btn-ghost text-xs" onClick={() => setSelectedTooth(n)}>Edit</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'media' && (
        <div className="card p-6">
          <MediaGallery patientId={patient.id} visitId={visit.id} definitions={definitions} />
        </div>
      )}

      {selectedTooth !== null && (
        <ToothDetail
          visitId={visit.id}
          toothNumber={selectedTooth}
          conditions={conditions.filter((c) => c.tooth_number === selectedTooth)}
          definitions={definitions}
          onClose={() => setSelectedTooth(null)}
          onChanged={() => { setRefreshKey((k) => k + 1); }}
        />
      )}

    </div>
  );
}
