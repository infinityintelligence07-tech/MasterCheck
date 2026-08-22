import { createClient } from "@/lib/supabase/server";

export type ActivityEntry = {
  id: string;
  event_id: string;
  acao: string;
  entidade: string | null;
  campo: string | null;
  valor_antigo: string | null;
  valor_novo: string | null;
  created_at: string;
  user: { id: string; nome: string; email: string } | null;
};

export type LogActivityInput = {
  eventId: string;
  userId: string;
  acao: string;
  entidade?: string;
  campo?: string | null;
  valorAntigo?: string | null;
  valorNovo?: string | null;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_log").insert({
    event_id: input.eventId,
    user_id: input.userId,
    acao: input.acao,
    entidade: input.entidade ?? "events",
    campo: input.campo ?? null,
    valor_antigo: input.valorAntigo ?? null,
    valor_novo: input.valorNovo ?? null,
  });

  if (error) {
    console.error("[activity_log]", error.message);
  }
}

export async function getEventActivityLog(
  eventId: string,
  limit = 50,
): Promise<ActivityEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select(
      `
      id,
      event_id,
      acao,
      entidade,
      campo,
      valor_antigo,
      valor_novo,
      created_at,
      user:profiles!activity_log_user_id_fkey (id, nome, email)
    `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const user = Array.isArray(row.user) ? row.user[0] : row.user;
    return {
      id: row.id,
      event_id: row.event_id,
      acao: row.acao,
      entidade: row.entidade,
      campo: row.campo,
      valor_antigo: row.valor_antigo,
      valor_novo: row.valor_novo,
      created_at: row.created_at,
      user: user
        ? { id: user.id, nome: user.nome, email: user.email }
        : null,
    };
  });
}
