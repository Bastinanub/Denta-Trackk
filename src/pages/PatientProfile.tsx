import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Phone, Mail, MapPin, AlertTriangle, Calendar, FileText, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { formatDateTime, formatDate, fullName, ageFromDob } from '@/lib/format';
import type { Patient, Visit } from '@/lib/types';

export function PatientProfile({ patientId }: { patientId: string }) {
  const { navigate } = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [p, v] = await Promise.all([
        supabase.from('patients').select('*').eq('id', patientId).maybeSingle(),
        supabase.from('visits').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false }),
      ]);
      if (p.error) setError(p.error.message);
      setPatient((p.data as Patient | null) ?? null);
      setVisits((v.data as Visit[]) ?? []);
      setLoading(false);
    })();
  }, [patientId]);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 card animate-pulse" />)}</div>;
  }
  if (error || !patient) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">{error ?? 'Patient not found.'}</p>
        <button className="btn-secondary mt-4" onClick={() => navigate('/patients')}>Back to patients</button>
      </div>
    );
  }

  const infoRows = [
    { icon: UserCircle, label: 'UHID', value: patient.uhid },
    { icon: Calendar, label: 'Date of birth', value: `${formatDate(patient.date_of_birth)} (${ageFromDob(patient.date_of_birth)} yrs)` },
    { icon: UserCircle, label: 'Gender', value: patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) },
    { icon: Phone, label: 'Mobile', value: patient.mobile },
    { icon: Mail, label: 'Email', value: patient.email ?? '—' },
    { icon: MapPin, label: 'Address', value: patient.address ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <button className="btn-ghost text-sm" onClick={() => navigate('/patients')}>
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </button>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-lg font-semibold">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{fullName(patient.first_name, patient.last_name)}</h1>
              <p className="text-sm text-primary-700 font-medium">{patient.uhid}</p>
              <p className="text-xs text-slate-400 mt-0.5">Registered {formatDate(patient.created_at)}</p>
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate(`/patients/${patient.id}/visits/new`)}>
            <Plus className="w-4 h-4" /> New Visit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {infoRows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{r.label}</p>
                  <p className="text-sm text-slate-800 capitalize truncate">{r.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {(patient.emergency_contact || patient.medical_history || patient.allergies) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            {patient.emergency_contact && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Emergency contact</p>
                <p className="text-sm text-slate-800">{patient.emergency_contact}</p>
              </div>
            )}
            {patient.medical_history && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Medical history</p>
                <p className="text-sm text-slate-800 whitespace-pre-line">{patient.medical_history}</p>
              </div>
            )}
            {patient.allergies && (
              <div>
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Allergies</p>
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 whitespace-pre-line">{patient.allergies}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" /> Visit History
          </h2>
          <span className="text-xs text-slate-500">{visits.length} visit{visits.length !== 1 ? 's' : ''}</span>
        </div>

        {visits.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No visits recorded yet.
            <div className="mt-3">
              <button className="btn-primary" onClick={() => navigate(`/patients/${patient.id}/visits/new`)}>
                <Plus className="w-4 h-4" /> Create first visit
              </button>
            </div>
          </div>
        ) : (
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5">
            {visits.map((v) => (
              <li key={v.id} className="ml-5">
                <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-primary-600 border-2 border-white" />
                <button
                  className="block w-full text-left card p-4 hover:shadow-card-hover transition-shadow"
                  onClick={() => navigate(`/patients/${patient.id}/visits/${v.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${v.record_type === 'dental_status' ? 'bg-accent-50 text-accent-700' : 'bg-slate-100 text-slate-600'}`}>
                        {v.record_type === 'dental_status' ? 'Dental Status' : 'General'}
                      </span>
                      <span className="text-xs text-slate-400">{formatDateTime(v.visit_date)}</span>
                    </div>
                  </div>
                  {v.chief_complaint && (
                    <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                      <span className="text-slate-400">CC:</span> {v.chief_complaint}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
