import { checklistProgress } from "@/lib/checklist-progress";
import { daysUntilEvent } from "@/lib/dates";
import type { EventWithRelations } from "@/lib/events";
import type { ChecklistTipo, ItemStatus } from "@/lib/constants";

export const DASHBOARD_CHECKLIST_COLS: Array<{
  tipo: ChecklistTipo;
  label: string;
  short: string;
}> = [
  { tipo: "lp_inscricao", label: "LP inscrição", short: "LP" },
  { tipo: "pagina_obrigado", label: "Página de obrigado", short: "Obrigado" },
  { tipo: "grupo_whatsapp", label: "Grupo WhatsApp", short: "Grupo" },
  { tipo: "manychat_inscricao", label: "ManyChat inscrição", short: "MC Insc" },
  { tipo: "manychat_e_amanha", label: "ManyChat é amanhã", short: "MC Amanhã" },
  { tipo: "manychat_e_hoje", label: "ManyChat é hoje", short: "MC Hoje" },
  { tipo: "teste_ponta_a_ponta", label: "Teste ponta a ponta", short: "Teste" },
];

export type UltimaAtividade = {
  acao: string;
  created_at: string;
  user_nome: string;
};

export type DashboardEvent = EventWithRelations & {
  ultima_atividade: UltimaAtividade | null;
  lead_snapshots: Array<{ qtd: number; created_at: string }>;
};

export type AlertItem = {
  eventId: string;
  nome: string;
  days: number;
  pendentes: number;
};

export function buildAlerts(events: DashboardEvent[]): AlertItem[] {
  return events
    .filter((e) => e.status !== "cancelado" && e.status !== "realizado")
    .map((e) => {
      const days = daysUntilEvent(e.data_evento);
      const progress = checklistProgress(e.checklist_items);
      const pendentes = progress.total - progress.done;
      return { eventId: e.id, nome: e.nome, days, pendentes };
    })
    .filter((a) => a.days >= 0 && a.days <= 3 && a.pendentes > 0)
    .sort((a, b) => a.days - b.days);
}

export function buildSummary(events: DashboardEvent[]) {
  const ativos = events.filter(
    (e) => !["cancelado", "realizado"].includes(e.status),
  );

  const conferenciasPendentes = ativos.filter((e) => {
    const p = checklistProgress(e.checklist_items);
    return p.done < p.total;
  }).length;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const leadsMes = events
    .filter((e) => {
      const d = new Date(e.data_evento + "T12:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + e.qtd_leads, 0);

  const proximos = ativos
    .filter((e) => daysUntilEvent(e.data_evento) >= 0)
    .sort(
      (a, b) =>
        daysUntilEvent(a.data_evento) - daysUntilEvent(b.data_evento),
    );

  const proximo = proximos[0] ?? null;

  return {
    eventosAtivos: ativos.length,
    conferenciasPendentes,
    leadsMes,
    proximo,
  };
}

export function itemByTipo(
  event: EventWithRelations,
  tipo: ChecklistTipo,
) {
  return event.checklist_items.find((i) => i.tipo === tipo) ?? null;
}

export function nextStatus(current: ItemStatus): ItemStatus {
  switch (current) {
    case "pendente":
      return "ok";
    case "ok":
      return "erro";
    case "erro":
      return "nao_aplica";
    case "nao_aplica":
      return "pendente";
    default: {
      const _exhaustive: never = current;
      return _exhaustive;
    }
  }
}

export type DashboardFilters = {
  q: string;
  status: string;
  responsavelId: string;
  de: string;
  ate: string;
  soPendentes: boolean;
};

export const emptyFilters: DashboardFilters = {
  q: "",
  status: "todos",
  responsavelId: "todos",
  de: "",
  ate: "",
  soPendentes: false,
};

export function filterEvents(
  events: DashboardEvent[],
  filters: DashboardFilters,
): DashboardEvent[] {
  return events.filter((event) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = `${event.nome} ${event.cidade} ${event.uf}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.status !== "todos" && event.status !== filters.status) {
      return false;
    }
    if (
      filters.responsavelId !== "todos" &&
      event.responsavel_id !== filters.responsavelId
    ) {
      return false;
    }
    if (filters.de && event.data_evento < filters.de) return false;
    if (filters.ate && event.data_evento > filters.ate) return false;
    if (filters.soPendentes) {
      const p = checklistProgress(event.checklist_items);
      if (p.done >= p.total) return false;
      if (["cancelado", "realizado"].includes(event.status)) return false;
    }
    return true;
  });
}
