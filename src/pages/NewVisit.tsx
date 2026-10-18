import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Save, Loader2, AlertCircle, Stethoscope, ClipboardList as ToothIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { fullName, formatDate, ageFromDob } from '@/lib/format';
import type { Patient, Visit, RecordType } from '@/lib/types';

export function NewVisit({ patientId }: { patientId: string }) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [recordType, setRecordType] = useState<RecordType>('general');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyPresenting, setHistoryPresenting] = useState('');
  const [pastMedical, setPastMedical] = useState('');
  const [pastSurgical, setPastSurgical] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('patients').select('*').eq('id', patientId).maybeSingle().then(({ data }) => {
      setPatient((data as Patient | null) ?? null);
      if (data) {
        setPastMedical((data as Patient).medical_history ?? '');
      }
    });
  }, [patientId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const insert = {
        patient_id: patientId,
        record_type: recordType,
        chief_complaint: chiefComplaint.trim() || null,
        history_presenting: historyPresenting.trim() || null,
        past_medical: pastMedical.trim() || null,
        past_surgical: pastSurgical.trim() || null,
        medications: medications.trim() || null,
        notes: notes.trim() || null,
        created_by: user?.id ?? null,
      };
      const { data, error: err } = await supabase.from('visits').insert(insert).select().single();
      if (err) throw err;
      await audit('visit_create', 'visits', (data as Visit).id, { patient_id: patientId, record_type: recordType });
      navigate(`/patients/${patientId}/visits/${(data as Visit).id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save visit.');
    } finally {
      setBusy(false);
    }
  }

  if (!patient) {
    return <div className="h-24 card animate-pulse" />;
  }

  const types: { value: RecordType; label: string; desc: string; icon: typeof Stethoscope }[] = [
    { value: 'general', label: 'General', desc: 'Case history & consultation', icon: Stethoscope },
    { value: 'dental_status', label: 'Dental Status', desc: 'Tooth-by-tooth charting', icon: ToothIcon },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button className="btn-ghost text-sm" onClick={() => navigate(`/patients/${patient.id}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to patient
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Visit</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {fullName(patient.first_name, patient.last_name)} · {patient.uhid} · {ageFromDob(patient.date_of_birth)} yrs · {formatDate(patient.created_at)}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="card p-5">
          <label className="label">Record type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {types.map((t) => {
              const Icon = t.icon;
              const active = recordType === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setRecordType(t.value)}
                  className={`text-left p-4 rounded-lg border transition-all flex items-start gap-3 ${
                    active ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.label}</p>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Choose <b>General</b> for case history, or <b>Dental Status</b> if you will chart the odontogram after saving.
          </p>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Case History</h2>

          <div>
            <label className="label">Chief Complaint</label>
            <textarea className="input min-h-[70px]" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} placeholder="Patient's main complaint in their own words" />
          </div>
          <div>
            <label className="label">History of Presenting Illness</label>
            <textarea className="input min-h-[80px]" value={historyPresenting} onChange={(e) => setHistoryPresenting(e.target.value)} placeholder="Onset, duration, progression, aggravating/relieving factors" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Past Medical History</label>
              <textarea className="input min-h-[70px]" value={pastMedical} onChange={(e) => setPastMedical(e.target.value)} />
            </div>
            <div>
              <label className="label">Past Surgical History</label>
              <textarea className="input min-h-[70px]" value={pastSurgical} onChange={(e) => setPastSurgical(e.target.value)} placeholder="Previous surgeries, hospitalizations" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Medications</label>
              <textarea className="input min-h-[60px]" value={medications} onChange={(e) => setMedications(e.target.value)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Examination findings, observations" />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/patients/${patient.id}`)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save visit
          </button>
        </div>
      </form>
    </div>
  );
}
