"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";
import { requireProfile } from "@/lib/auth";
import type { ChecklistTipo, ItemStatus } from "@/lib/constants";
import { UFS_BRASIL } from "@/lib/events-meta";
import { createClient } from "@/lib/supabase/server";
import {
  createUrlVersion,
  versionsToJson,
} from "@/lib/url-versions";
import type { Json } from "@/types/database";

const importRowSchema = z.object({
  action: z.enum(["criar", "atualizar"]),
  existingEventId: z.string().uuid().optional(),
  nome: z.string().min(2),
  cidade: z.string().min(2),
  uf: z.enum(UFS_BRASIL),
  data_evento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  qtd_leads: z.number().int().min(0),
  urls: z.record(z.string(), z.string().nullable()).optional(),
  statuses: z.record(z.string(), z.string()).optional(),
});

const importPayloadSchema = z.object({
  rows: z.array(importRowSchema).min(1),
});

export type ImportCsvResult = {
  ok: boolean;
  message?: string;
  created: number;
  updated: number;
};

function canWrite(role: string) {
  return role === "admin" || role === "operador";
}

async function applyChecklist(
  eventId: string,
  urls: Record<string, string | null | undefined> | undefined,
  statuses: Record<string, string> | undefined,
  userId: string,
) {
  const supabase = await createClient();
  const tipos = new Set([
    ...Object.keys(urls ?? {}),
    ...Object.keys(statuses ?? {}),
  ]);

  for (const tipo of tipos) {
    const patch: {
      url?: string | null;
      url_versions?: Json;
      status?: ItemStatus;
      conferido_por?: string | null;
      conferido_em?: string | null;
    } = {};

    if (urls && tipo in urls) {
      const url = urls[tipo] ?? null;
      patch.url = url;
      patch.url_versions = versionsToJson(
        url ? [createUrlVersion({ label: "Principal", url })] : [],
      );
    }
    if (statuses && statuses[tipo]) {
      const status = statuses[tipo] as ItemStatus;
      patch.status = status;
      if (status !== "pendente") {
        patch.conferido_por = userId;
        patch.conferido_em = new Date().toISOString();
      }
    }

    if (Object.keys(patch).length === 0) continue;

    const { error } = await supabase
      .from("checklist_items")
      .update(patch)
      .eq("event_id", eventId)
      .eq("tipo", tipo as ChecklistTipo);

    if (error) throw new Error(error.message);
  }
}

export async function importCsvRows(
  payload: z.infer<typeof importPayloadSchema>,
): Promise<ImportCsvResult> {
  const profile = await requireProfile();
  if (!canWrite(profile.role)) {
    return { ok: false, message: "Sem permissão.", created: 0, updated: 0 };
  }

  const parsed = importPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Payload de importação inválido.", created: 0, updated: 0 };
  }

  const supabase = await createClient();
  let created = 0;
  let updated = 0;

  try {
    for (const row of parsed.data.rows) {
      if (row.action === "atualizar" && row.existingEventId) {
        const { data: before } = await supabase
          .from("events")
          .select("qtd_leads")
          .eq("id", row.existingEventId)
          .maybeSingle();

        const { error } = await supabase
          .from("events")
          .update({
            nome: row.nome,
            cidade: row.cidade,
            uf: row.uf,
            qtd_leads: row.qtd_leads,
            qtd_leads_atualizado_em: new Date().toISOString(),
            status: "em_conferencia",
          })
          .eq("id", row.existingEventId);

        if (error) throw new Error(error.message);

        if (before && before.qtd_leads !== row.qtd_leads) {
          await supabase.from("lead_snapshots").insert({
            event_id: row.existingEventId,
            qtd: row.qtd_leads,
            registrado_por: profile.id,
          });
        }

        await applyChecklist(
          row.existingEventId,
          row.urls,
          row.statuses,
          profile.id,
        );

        await logActivity({
          eventId: row.existingEventId,
          userId: profile.id,
          acao: "importou CSV (atualizou)",
          entidade: "events",
          valorNovo: row.nome,
        });

        updated += 1;
        continue;
      }

      const { data: createdEvent, error } = await supabase
        .from("events")
        .insert({
          nome: row.nome,
          cidade: row.cidade,
          uf: row.uf,
          data_evento: row.data_evento,
          status: "em_conferencia",
          responsavel_id: profile.id,
          qtd_leads: row.qtd_leads,
          qtd_leads_atualizado_em: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error || !createdEvent) {
        throw new Error(error?.message ?? "Falha ao criar evento.");
      }

      if (row.qtd_leads > 0) {
        await supabase.from("lead_snapshots").insert({
          event_id: createdEvent.id,
          qtd: row.qtd_leads,
          registrado_por: profile.id,
        });
      }

      await applyChecklist(createdEvent.id, row.urls, row.statuses, profile.id);

      await logActivity({
        eventId: createdEvent.id,
        userId: profile.id,
        acao: "importou CSV (criou)",
        entidade: "events",
        valorNovo: row.nome,
      });

      created += 1;
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Falha na importação.",
      created,
      updated,
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    message: `Importação concluída: ${created} criados, ${updated} atualizados.`,
    created,
    updated,
  };
}
