import { createClient } from "@/lib/supabase/server";
import { checklistProgress } from "@/lib/checklist-progress";
import type { Tables } from "@/types/database";

export type EventRow = Tables<"events">;
export type ChecklistItemRow = Tables<"checklist_items">;
export type ProfileRow = Tables<"profiles">;

export { checklistProgress };

export type EventWithRelations = EventRow & {
  responsavel: Pick<ProfileRow, "id" | "nome" | "email" | "avatar_url"> | null;
  checklist_items: Array<
    ChecklistItemRow & {
      conferido: Pick<ProfileRow, "id" | "nome" | "email"> | null;
    }
  >;
};

function normalizeEventRow(row: {
  responsavel?: unknown;
  checklist_items?: unknown;
  [key: string]: unknown;
}): EventWithRelations {
  const items = (row.checklist_items ?? []) as Array<
    ChecklistItemRow & {
      conferido?:
        | Pick<ProfileRow, "id" | "nome" | "email">
        | Pick<ProfileRow, "id" | "nome" | "email">[]
        | null;
    }
  >;

  return {
    ...(row as unknown as EventRow),
    responsavel: Array.isArray(row.responsavel)
      ? ((row.responsavel[0] as EventWithRelations["responsavel"]) ?? null)
      : ((row.responsavel as EventWithRelations["responsavel"]) ?? null),
    checklist_items: items
      .map((item) => ({
        ...item,
        conferido: Array.isArray(item.conferido)
          ? (item.conferido[0] ?? null)
          : (item.conferido ?? null),
      }))
      .sort((a, b) => a.ordem - b.ordem),
  };
}

export type EventSearchItem = Pick<
  EventRow,
  "id" | "nome" | "cidade" | "uf" | "data_evento"
>;

export async function listEventSearchItems(): Promise<EventSearchItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, nome, cidade, uf, data_evento")
    .order("data_evento", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listEvents(): Promise<EventWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      responsavel:profiles!events_responsavel_id_fkey (id, nome, email, avatar_url),
      checklist_items (
        *,
        conferido:profiles!checklist_items_conferido_por_fkey (id, nome, email)
      )
    `,
    )
    .order("data_evento", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeEventRow(row));
}

export async function getEventById(
  id: string,
): Promise<EventWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      responsavel:profiles!events_responsavel_id_fkey (id, nome, email, avatar_url),
      checklist_items (
        *,
        conferido:profiles!checklist_items_conferido_por_fkey (id, nome, email)
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  return normalizeEventRow(data);
}

export async function listOperators(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "operador"])
    .order("nome");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listDashboardEvents(): Promise<
  Array<
    EventWithRelations & {
      ultima_atividade: {
        acao: string;
        created_at: string;
        user_nome: string;
      } | null;
      lead_snapshots: Array<{ qtd: number; created_at: string }>;
    }
  >
> {
  const events = await listEvents();
  if (events.length === 0) return [];

  const supabase = await createClient();
  const ids = events.map((e) => e.id);

  const [{ data: logs, error: logError }, { data: snaps, error: snapError }] =
    await Promise.all([
      supabase
        .from("activity_log")
        .select(
          `
      event_id,
      acao,
      created_at,
      user:profiles!activity_log_user_id_fkey (nome, email)
    `,
        )
        .in("event_id", ids)
        .order("created_at", { ascending: false }),
      supabase
        .from("lead_snapshots")
        .select("event_id, qtd, created_at")
        .in("event_id", ids)
        .order("created_at", { ascending: true }),
    ]);

  if (logError) throw new Error(logError.message);
  if (snapError) throw new Error(snapError.message);

  const latestByEvent = new Map<
    string,
    { acao: string; created_at: string; user_nome: string }
  >();

  for (const log of logs ?? []) {
    if (latestByEvent.has(log.event_id)) continue;
    const user = Array.isArray(log.user) ? log.user[0] : log.user;
    latestByEvent.set(log.event_id, {
      acao: log.acao,
      created_at: log.created_at,
      user_nome: user?.nome || user?.email || "Alguém",
    });
  }

  const snapsByEvent = new Map<string, Array<{ qtd: number; created_at: string }>>();
  for (const snap of snaps ?? []) {
    const list = snapsByEvent.get(snap.event_id) ?? [];
    list.push({ qtd: snap.qtd, created_at: snap.created_at });
    snapsByEvent.set(snap.event_id, list);
  }

  return events.map((event) => ({
    ...event,
    ultima_atividade: latestByEvent.get(event.id) ?? null,
    lead_snapshots: snapsByEvent.get(event.id) ?? [],
  }));
}

export async function getLeadSnapshots(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_snapshots")
    .select("qtd, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
