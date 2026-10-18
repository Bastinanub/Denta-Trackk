import { useEffect, useState, useRef } from 'react';
import { Upload, Loader2, Trash2, X, Play, Image as ImageIcon, Calendar } from 'lucide-react';
import { supabase, CLINICAL_MEDIA_BUCKET } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import type { MediaItem, ConditionDefinition } from '@/lib/types';

interface Props {
  patientId: string;
  visitId: string;
  definitions?: ConditionDefinition[];
  refreshKey?: number;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export function MediaGallery({ patientId, visitId, refreshKey = 0 }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; item: MediaItem } | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const capturedRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('media').select('*').eq('visit_id', visitId).order('captured_at', { ascending: false, nullsFirst: false });
    const list = (data as MediaItem[]) ?? [];
    setItems(list);
    setLoading(false);
    // signed URLs
    const map: Record<string, string> = {};
    await Promise.all(list.map(async (m) => {
      const { data: signed } = await supabase.storage.from(CLINICAL_MEDIA_BUCKET).createSignedUrl(m.storage_path, 300);
      if (signed) map[m.id] = signed.signedUrl;
    }));
    setUrls(map);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [visitId, refreshKey]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED.includes(file.type)) {
          setError(`Unsupported file type: ${file.type}`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`File too large (max 50 MB): ${file.name}`);
          continue;
        }
        const captured = capturedRef.current?.value || null;
        const path = `${patientId}/${visitId}/${crypto.randomUUID()}/${file.name}`;
        const { error: upErr } = await supabase.storage.from(CLINICAL_MEDIA_BUCKET).upload(path, file, { upsert: false });
        if (upErr) { setError(upErr.message); continue; }
        const { error: dbErr } = await supabase.from('media').insert({
          patient_id: patientId,
          visit_id: visitId,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          captured_at: captured ? new Date(captured).toISOString() : null,
          uploaded_by: user?.id ?? null,
        });
        if (dbErr) setError(dbErr.message);
      }
      if (fileRef.current) fileRef.current.value = '';
      if (capturedRef.current) capturedRef.current.value = '';
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(m: MediaItem) {
    if (!confirm(`Delete "${m.file_name}"?`)) return;
    await supabase.storage.from(CLINICAL_MEDIA_BUCKET).remove([m.storage_path]);
    await supabase.from('media').delete().eq('id', m.id);
    await load();
  }

  const isVideo = (mt: string) => mt.startsWith('video/');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="label">Captured at (optional)</label>
          <input type="datetime-local" ref={capturedRef} className="input" />
        </div>
        <div>
          <input ref={fileRef} type="file" multiple accept={ALLOWED.join(',')} className="hidden" onChange={onUpload} />
          <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload photos / videos
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="mt-2">No media uploaded for this visit yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((m) => {
            const url = urls[m.id];
            return (
              <div key={m.id} className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <div className="aspect-square flex items-center justify-center bg-slate-100">
                  {url ? (
                    isVideo(m.mime_type) ? (
                      <video src={url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={url} alt={m.file_name} className="w-full h-full object-cover" />
                    )
                  ) : <ImageIcon className="w-6 h-6 text-slate-300" />}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-700 truncate">{m.file_name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {m.captured_at ? formatDateTime(m.captured_at) : formatDateTime(m.uploaded_at)}
                  </p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => url && setViewer({ url, item: m })} className="w-7 h-7 rounded-md bg-white/90 text-slate-700 hover:bg-white flex items-center justify-center">
                    {isVideo(m.mime_type) ? <Play className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => onDelete(m)} className="w-7 h-7 rounded-md bg-white/90 text-red-600 hover:bg-white flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewer && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4" onClick={() => setViewer(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
          <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {viewer.item.mime_type.startsWith('video/') ? (
              <video src={viewer.url} controls className="max-h-[80vh] max-w-full rounded-lg" />
            ) : (
              <img src={viewer.url} alt={viewer.item.file_name} className="max-h-[80vh] max-w-full rounded-lg" />
            )}
            <p className="text-white/80 text-sm mt-3 text-center">{viewer.item.file_name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
