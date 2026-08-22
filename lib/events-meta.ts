import {
  CHECKLIST_TIPOS,
  EVENT_STATUSES,
  type ChecklistTipo,
  type EventStatus,
} from "@/lib/constants";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  rascunho: "Rascunho",
  em_conferencia: "Em conferência",
  pronto: "Pronto",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export const UFS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type UfBrasil = (typeof UFS_BRASIL)[number];

export const CHECKLIST_URL_FIELDS = CHECKLIST_TIPOS.filter(
  (t) =>
    t !== "exportacao_leads" && t !== "teste_ponta_a_ponta",
) as ChecklistTipo[];

export { EVENT_STATUSES, CHECKLIST_TIPOS };
