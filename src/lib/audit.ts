import { supabase } from './supabase';

export async function audit(
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      actor_id: data.user?.id ?? null,
      action,
      entity,
      entity_id: entityId ?? null,
      details: details ?? null,
    });
  } catch {
    // Best-effort; never block the main operation on audit failure.
  }
}
