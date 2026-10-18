export type StaffRole = 'dentist' | 'admin';

export interface Staff {
  id: string;
  full_name: string;
  role: StaffRole;
  created_at: string;
}

export interface Patient {
  id: string;
  uhid: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  email: string | null;
  address: string | null;
  emergency_contact: string | null;
  medical_history: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
}

export type RecordType = 'general' | 'dental_status';

export interface Visit {
  id: string;
  patient_id: string;
  record_type: RecordType;
  visit_date: string;
  chief_complaint: string | null;
  history_presenting: string | null;
  past_medical: string | null;
  past_surgical: string | null;
  medications: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type ToothSurface = 'mesial' | 'distal' | 'occlusal' | 'buccal' | 'lingual';

export interface ToothCondition {
  id: string;
  visit_id: string;
  tooth_number: number;
  condition: string;
  surface: ToothSurface | null;
  notes: string | null;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  visit_id: string;
  tooth_number: number | null;
  diagnosis: string;
  created_at: string;
}

export interface ClinicalNote {
  id: string;
  visit_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface ConditionDefinition {
  id: string;
  code: string;
  label: string;
  color: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  patient_id: string;
  visit_id: string | null;
  tooth_number: number | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  captured_at: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
