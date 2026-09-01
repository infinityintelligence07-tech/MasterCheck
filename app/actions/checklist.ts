"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-log";
import { requireProfile } from "@/lib/auth";
import { probeUrl, type LinkProbeResult } from "@/lib/link-test";
import { createClient } from "@/lib/supabase/server";
import {
  createUrlVersion,
  normalizeUrlVersions,
  primaryUrlFromVersions,
  versionsToJson,
  type UrlVersion,
} from "@/lib/url-versions";
import {
  checklistObservacaoSchema,
  checklistStatusSchema,
  checklistUrlSchema,
  checklistUrlVersionsSchema,
  testLinkSchema,
} from "@/lib/validations/checklist";
import type { ItemStatus } from "@/lib/constants";
import type { Tables } from "@/types/database";
export type ChecklistActionResult = {
  ok: boolean;
  message?: string;
  httpStatus?: number;
  veredicto?: LinkProbeResult["veredicto"];
  testadoEm?: string;
};

type ChecklistItem = Tables<"checklist_items">;

function canWrite(role: string) {
  return role === "admin" || role === "operador";
}

async function logChecklistActivity(input: {
  eventId: string;
  userId: string;
  acao: string;
  campo?: string;
  valorAntigo?: string | null;
  valorNovo?: string | null;
}) {
  await logActivity({
    ...input,
    entidade: "checklist_items",
  });
}

async function getItemOrThrow(itemId: string): Promise<ChecklistItem> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Item não encontrado.");
  }
  return data;
}

async function persistProbe(
  item: ChecklistItem,
  userId: string,
): Promise<ChecklistActionResult> {
  if (!item.url) {
    return { ok: false, message: "Item sem URL para testar." };
  }

  const probe = await probeUrl(item.url);
  const testadoEm = new Date().toISOString();
  const supabase = await createClient();

  const { error } = await supabase
    .from("checklist_items")
    .update({
      http_status: probe.httpStatus,
      testado_em: testadoEm,
    })
    .eq("id", item.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logChecklistActivity({
    eventId: item.event_id,
    userId,
    acao: "testou link",
    campo: "http_status",
    valorNovo: String(probe.httpStatus),
  });

  return {
    ok: true,
    message: probe.mensagem,
    httpStatus: probe.httpStatus,
    veredicto: probe.veredicto,
    testadoEm,
  };
}

export async function updateChecklistStatus(input: {
  itemId: string;
  status: ItemStatus;
}): Promise<ChecklistActionResult> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão." };
  }

  const parsed = checklistStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Status inválido." };
  }

  const item = await getItemOrThrow(parsed.data.itemId);
  const supabase = await createClient();

  const isConferido = parsed.data.status !== "pendente";
  const { error } = await supabase
    .from("checklist_items")
    .update({
      status: parsed.data.status,
      conferido_por: isConferido ? profile.id : null,
      conferido_em: isConferido ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.itemId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logChecklistActivity({
    eventId: item.event_id,
    userId: profile.id,
    acao: "alterou status do checklist",
    campo: "status",
    valorAntigo: item.status,
    valorNovo: parsed.data.status,
  });

  revalidatePath(`/eventos/${item.event_id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function updateChecklistUrl(input: {
  itemId: string;
  url: string;
}): Promise<ChecklistActionResult> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão." };
  }

  const parsed = checklistUrlSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "URL inválida.",
    };
  }

  const item = await getItemOrThrow(parsed.data.itemId);
  const supabase = await createClient();

  let versions = normalizeUrlVersions(item.url_versions, item.url);

  if (parsed.data.url === null) {
    versions = [];
  } else if (versions.length === 0) {
    versions = [createUrlVersion({ label: "Principal", url: parsed.data.url })];
  } else {
    versions = [
      { ...versions[0]!, url: parsed.data.url },
      ...versions.slice(1),
    ];
  }

  const { error } = await supabase
    .from("checklist_items")
    .update({
      url: parsed.data.url,
      url_versions: versionsToJson(versions),
    })
    .eq("id", parsed.data.itemId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logChecklistActivity({
    eventId: item.event_id,
    userId: profile.id,
    acao: "atualizou URL do checklist",
    campo: "url",
    valorAntigo: item.url,
    valorNovo: parsed.data.url,
  });

  revalidatePath(`/eventos/${item.event_id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function updateChecklistUrlVersions(input: {
  itemId: string;
  versions: UrlVersion[];
}): Promise<ChecklistActionResult> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão." };
  }

  const parsed = checklistUrlVersionsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Versões inválidas.",
    };
  }

  const item = await getItemOrThrow(parsed.data.itemId);
  const versions = parsed.data.versions;
  const primary = primaryUrlFromVersions(versions);
  const supabase = await createClient();

  const { error } = await supabase
    .from("checklist_items")
    .update({
      url: primary,
      url_versions: versionsToJson(versions),
    })
    .eq("id", parsed.data.itemId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logChecklistActivity({
    eventId: item.event_id,
    userId: profile.id,
    acao: "atualizou versões de URL",
    campo: "url_versions",
    valorAntigo: item.url,
    valorNovo: primary
      ? `${versions.length} versão(ões) · ${primary}`
      : "sem URL",
  });

  revalidatePath(`/eventos/${item.event_id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function updateChecklistObservacao(input: {
  itemId: string;
  observacao: string | null;
}): Promise<ChecklistActionResult> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão." };
  }

  const parsed = checklistObservacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Observação inválida." };
  }

  const item = await getItemOrThrow(parsed.data.itemId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ observacao: parsed.data.observacao })
    .eq("id", parsed.data.itemId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logChecklistActivity({
    eventId: item.event_id,
    userId: profile.id,
    acao: "atualizou observação do checklist",
    campo: "observacao",
    valorAntigo: item.observacao,
    valorNovo: parsed.data.observacao,
  });

  revalidatePath(`/eventos/${item.event_id}`);
  return { ok: true };
}

export async function testChecklistLink(
  itemId: string,
): Promise<ChecklistActionResult> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão." };
  }

  const parsed = testLinkSchema.safeParse({ itemId });
  if (!parsed.success) {
    return { ok: false, message: "Item inválido." };
  }

  const item = await getItemOrThrow(parsed.data.itemId);
  const result = await persistProbe(item, profile.id);

  if (result.ok) {
    revalidatePath(`/eventos/${item.event_id}`);
    revalidatePath("/");
  }

  return result;
}

export async function testAllChecklistLinks(eventId: string): Promise<{
  ok: boolean;
  message?: string;
  results: Array<{
    itemId: string;
    label: string;
    result: ChecklistActionResult;
  }>;
}> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão.", results: [] };
  }

  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("event_id", eventId)
    .order("ordem");

  if (error) {
    return { ok: false, message: error.message, results: [] };
  }

  const withUrl = (items ?? []).filter((i) => Boolean(i.url));

  const settled = await Promise.allSettled(
    withUrl.map(async (item) => {
      const result = await persistProbe(item, profile.id);
      return { itemId: item.id, label: item.label, result };
    }),
  );

  const results = settled.map((entry, index) => {
    if (entry.status === "fulfilled") return entry.value;
    return {
      itemId: withUrl[index]!.id,
      label: withUrl[index]!.label,
      result: { ok: false, message: "Falha inesperada" } as ChecklistActionResult,
    };
  });

  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/");

  return {
    ok: true,
    message: `Testados ${results.length} links.`,
    results,
  };
}
