"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity-log";
import { requireProfile } from "@/lib/auth";
import { CHECKLIST_TIPOS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  createUrlVersion,
  normalizeUrlVersions,
  versionsToJson,
} from "@/lib/url-versions";
import {
  duplicateEventSchema,
  eventFormSchema,
} from "@/lib/validations/events";

export type EventActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function canWrite(role: string) {
  return role === "admin" || role === "operador";
}

function formDataToObject(formData: FormData) {
  const urls: Record<string, string> = {};
  for (const tipo of CHECKLIST_TIPOS) {
    const key = `url_${tipo}`;
    if (formData.has(key)) {
      urls[tipo] = String(formData.get(key) ?? "");
    }
  }

  const responsavelRaw = String(formData.get("responsavel_id") ?? "");

  return {
    nome: String(formData.get("nome") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
    uf: String(formData.get("uf") ?? ""),
    data_evento: String(formData.get("data_evento") ?? ""),
    hora_evento: String(formData.get("hora_evento") ?? ""),
    status: String(formData.get("status") ?? "rascunho"),
    responsavel_id: responsavelRaw === "" ? null : responsavelRaw,
    observacoes: String(formData.get("observacoes") ?? ""),
    urls,
  };
}

async function applyChecklistUrls(
  eventId: string,
  urls: Partial<Record<(typeof CHECKLIST_TIPOS)[number], string | null | undefined>>,
) {
  const supabase = await createClient();
  for (const tipo of CHECKLIST_TIPOS) {
    const url = urls[tipo];
    if (url === undefined) continue;
    const normalized = url?.trim() ? url.trim() : null;

    if (tipo === "lp_inscricao") {
      const { data: current } = await supabase
        .from("checklist_items")
        .select("url, url_versions")
        .eq("event_id", eventId)
        .eq("tipo", tipo)
        .maybeSingle();

      let versions = normalizeUrlVersions(
        current?.url_versions,
        current?.url ?? null,
      );

      if (normalized === null) {
        versions = [];
      } else if (versions.length === 0) {
        versions = [createUrlVersion({ label: "Principal", url: normalized })];
      } else {
        versions = [{ ...versions[0]!, url: normalized }, ...versions.slice(1)];
      }

      const { error } = await supabase
        .from("checklist_items")
        .update({
          url: normalized,
          url_versions: versionsToJson(versions),
        })
        .eq("event_id", eventId)
        .eq("tipo", tipo);
      if (error) throw new Error(error.message);
      continue;
    }

    const { error } = await supabase
      .from("checklist_items")
      .update({
        url: normalized,
        url_versions: versionsToJson(
          normalized
            ? [createUrlVersion({ label: "Principal", url: normalized })]
            : [],
        ),
      })
      .eq("event_id", eventId)
      .eq("tipo", tipo);
    if (error) throw new Error(error.message);
  }
}

export async function createEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão para criar eventos." };
  }

  const parsed = eventFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      nome: data.nome,
      cidade: data.cidade,
      uf: data.uf,
      data_evento: data.data_evento,
      hora_evento: data.hora_evento ?? null,
      status: data.status,
      responsavel_id: data.responsavel_id ?? profile.id,
      observacoes: data.observacoes ?? null,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, message: error?.message ?? "Falha ao criar evento." };
  }

  if (data.urls) {
    try {
      await applyChecklistUrls(created.id, data.urls);
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Evento criado, mas URLs falharam.",
      };
    }
  }

  await logActivity({
    eventId: created.id,
    userId: profile.id,
    acao: "criou evento",
    valorNovo: data.nome,
  });

  revalidatePath("/");
  redirect(`/eventos/${created.id}`);
}

export async function updateEvent(
  eventId: string,
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão para editar eventos." };
  }

  const parsed = eventFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({
      nome: data.nome,
      cidade: data.cidade,
      uf: data.uf,
      data_evento: data.data_evento,
      hora_evento: data.hora_evento ?? null,
      status: data.status,
      responsavel_id: data.responsavel_id,
      observacoes: data.observacoes ?? null,
    })
    .eq("id", eventId);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (data.urls) {
    try {
      await applyChecklistUrls(eventId, data.urls);
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Falha ao atualizar URLs.",
      };
    }
  }

  await logActivity({
    eventId,
    userId: profile.id,
    acao: "atualizou evento",
    valorNovo: data.nome,
  });

  revalidatePath("/");
  revalidatePath(`/eventos/${eventId}`);
  redirect(`/eventos/${eventId}`);
}

export async function duplicateEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão para duplicar eventos." };
  }

  const parsed = duplicateEventSchema.safeParse({
    event_id: formData.get("event_id"),
    nome: formData.get("nome"),
    cidade: formData.get("cidade"),
    uf: formData.get("uf"),
    data_evento: formData.get("data_evento"),
    hora_evento: formData.get("hora_evento"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Dados inválidos para duplicar.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();
  const source = parsed.data;

  const { data: original, error: fetchError } = await supabase
    .from("events")
    .select("*, checklist_items(*)")
    .eq("id", source.event_id)
    .maybeSingle();

  if (fetchError || !original) {
    return { ok: false, message: "Evento original não encontrado." };
  }

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      nome: source.nome,
      cidade: source.cidade,
      uf: source.uf,
      data_evento: source.data_evento,
      hora_evento: source.hora_evento ?? null,
      status: "rascunho",
      responsavel_id: profile.id,
      observacoes: original.observacoes,
      qtd_leads: 0,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, message: error?.message ?? "Falha ao duplicar." };
  }

  const items = (original.checklist_items ?? []) as Array<{
    tipo: (typeof CHECKLIST_TIPOS)[number];
    url: string | null;
    url_versions?: unknown;
  }>;

  for (const item of items) {
    await supabase
      .from("checklist_items")
      .update({
        url: item.url,
        url_versions: (item.url_versions as never) ?? [],
        status: "pendente",
      })
      .eq("event_id", created.id)
      .eq("tipo", item.tipo);
  }

  await logActivity({
    eventId: created.id,
    userId: profile.id,
    acao: "duplicou evento",
    valorAntigo: original.nome,
    valorNovo: source.nome,
  });

  revalidatePath("/");
  redirect(`/eventos/${created.id}`);
}

export async function deleteEvent(eventId: string): Promise<EventActionState> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    return { ok: false, message: "Apenas admin pode excluir eventos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
