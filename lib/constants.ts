/** Timezone oficial da aplicação */
export const APP_TIMEZONE = "America/Sao_Paulo";

export const CHECKLIST_TIPOS = [
  "lp_inscricao",
  "pagina_obrigado",
  "grupo_whatsapp",
  "manychat_inscricao",
  "manychat_e_amanha",
  "manychat_e_hoje",
  "exportacao_leads",
  "teste_ponta_a_ponta",
] as const;

export type ChecklistTipo = (typeof CHECKLIST_TIPOS)[number];

export const CHECKLIST_LABELS_PADRAO: Record<ChecklistTipo, string> = {
  lp_inscricao: "LP inscrição",
  pagina_obrigado: "Página de obrigado",
  grupo_whatsapp: "Grupo WhatsApp",
  manychat_inscricao: "ManyChat inscrição",
  manychat_e_amanha: "ManyChat é amanhã",
  manychat_e_hoje: "ManyChat é hoje",
  exportacao_leads: "Exportação de leads",
  teste_ponta_a_ponta: "Teste ponta a ponta",
};

export const USER_ROLES = ["admin", "operador", "leitor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EVENT_STATUSES = [
  "rascunho",
  "em_conferencia",
  "pronto",
  "realizado",
  "cancelado",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ITEM_STATUSES = [
  "pendente",
  "ok",
  "erro",
  "nao_aplica",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];
