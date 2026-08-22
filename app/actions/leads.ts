"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-log";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateLeadsSchema } from "@/lib/validations/leads";

export type LeadsActionResult = {
  ok: boolean;
  message?: string;
  qtd?: number;
  atualizadoEm?: string;
};

function canWrite(role: string) {
  return role === "admin" || role === "operador";
}

export async function updateEventLeads(input: {
  eventId: string;
  qtd: number;
}): Promise<LeadsActionResult> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão." };
  }

  const parsed = updateLeadsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Valor inválido.",
    };
  }

  const supabase = await createClient();
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, qtd_leads")
    .eq("id", parsed.data.eventId)
    .maybeSingle();

  if (fetchError || !event) {
    return { ok: false, message: fetchError?.message ?? "Evento não encontrado." };
  }

  if (event.qtd_leads === parsed.data.qtd) {
    return { ok: true, qtd: event.qtd_leads };
  }

  const atualizadoEm = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("events")
    .update({
      qtd_leads: parsed.data.qtd,
      qtd_leads_atualizado_em: atualizadoEm,
    })
    .eq("id", parsed.data.eventId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const { error: snapError } = await supabase.from("lead_snapshots").insert({
    event_id: parsed.data.eventId,
    qtd: parsed.data.qtd,
    registrado_por: profile.id,
  });

  if (snapError) {
    return { ok: false, message: snapError.message };
  }

  await logActivity({
    eventId: parsed.data.eventId,
    userId: profile.id,
    acao: "atualizou leads",
    entidade: "events",
    campo: "qtd_leads",
    valorAntigo: String(event.qtd_leads),
    valorNovo: String(parsed.data.qtd),
  });

  revalidatePath("/");
  revalidatePath(`/eventos/${parsed.data.eventId}`);

  return {
    ok: true,
    qtd: parsed.data.qtd,
    atualizadoEm,
    message: "Leads atualizados.",
  };
}
