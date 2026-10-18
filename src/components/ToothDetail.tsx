import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TOOTH_SURFACES } from '@/lib/fdi';
import type { ToothCondition, ToothSurface, ConditionDefinition } from '@/lib/types';

interface Props {
  visitId: string;
  toothNumber: number;
  conditions: ToothCondition[];
  definitions: ConditionDefinition[];
  onClose: () => void;
  onChanged: () => void;
}

export function ToothDetail({ visitId, toothNumber, conditions, definitions, onClose, onChanged }: Props) {
  const [condition, setCondition] = useState('');
  const [surface, setSurface] = useState<ToothSurface | ''>('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCondition() {
    if (!condition) { setError('Pick a condition.'); return; }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from('tooth_conditions').insert({
      visit_id: visitId,
      tooth_number: toothNumber,
      condition,
      surface: surface || null,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setCondition(''); setSurface(''); setNotes('');
    onChanged();
  }

  async function removeCondition(id: string) {
    await supabase.from('tooth_conditions').delete().eq('id', id);
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Tooth {toothNumber}</h3>
            <p className="text-xs text-slate-500">Add condition / diagnosis and surface</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {conditions.length > 0 && (
            <ul className="space-y-2">
              {conditions.map((c) => {
                const def = definitions.find((d) => d.code === c.condition);
                return (
                  <li key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: def?.color ?? '#94a3b8' }} />
                        <span className="text-sm font-medium text-slate-800">{def?.label ?? c.condition}</span>
                        {c.surface && <span className="badge bg-slate-100 text-slate-600 capitalize">{c.surface}</span>}
                      </div>
                      {c.notes && <p className="text-xs text-slate-500 mt-1">{c.notes}</p>}
                    </div>
                    <button onClick={() => removeCondition(c.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-3">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Add marking</p>
            <div>
              <label className="label">Condition</label>
              <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="">Select…</option>
                {definitions.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Surface</label>
              <select className="input" value={surface} onChange={(e) => setSurface(e.target.value as ToothSurface | '')}>
                <option value="">Whole tooth</option>
                {TOOTH_SURFACES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button className="btn-primary w-full" onClick={addCondition} disabled={busy}>
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
