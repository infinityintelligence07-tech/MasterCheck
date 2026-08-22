import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ActivityEntryLike = {
  acao: string;
  campo: string | null;
  valor_antigo: string | null;
  valor_novo: string | null;
  entidade?: string | null;
};

/** Formata tempo relativo compacto em pt-BR: "há 2 h", "há 3 dias". */
export function formatActivityRelative(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  const strict = formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: ptBR,
  });

  return strict
    .replace(/cerca de /g, "")
    .replace(/ horas?/g, " h")
    .replace(/ minutos?/g, " min")
    .replace(/ segundos?/g, " s");
}

export function formatActivityLine(input: {
  userNome: string;
  createdAt: string;
}): string {
  const first = input.userNome.trim().split(/\s+/)[0] || "Alguém";
  return `${first} · ${formatActivityRelative(input.createdAt)}`;
}

export function describeActivity(entry: ActivityEntryLike): string {
  const { acao, campo, valor_antigo, valor_novo } = entry;

  if (acao.includes("leads") && valor_antigo && valor_novo) {
    return `Leads: ${valor_antigo} → ${valor_novo}`;
  }
  if (acao.includes("status") && valor_novo) {
    return `Status${campo ? ` (${campo})` : ""}: ${valor_antigo ?? "—"} → ${valor_novo}`;
  }
  if (acao.includes("URL") || acao.includes("url")) {
    return valor_novo ? "Atualizou URL" : "Removeu URL";
  }
  if (acao.includes("testou")) {
    return valor_novo ? `Testou link · HTTP ${valor_novo}` : "Testou link";
  }
  if (acao.includes("importou")) {
    return acao;
  }
  if (acao.includes("duplicou") && valor_novo) {
    return `Duplicou → ${valor_novo}`;
  }
  if (acao.includes("criou")) {
    return valor_novo ? `Criou ${valor_novo}` : "Criou evento";
  }
  if (acao.includes("atualizou")) {
    return valor_novo ? `Atualizou ${valor_novo}` : "Atualizou evento";
  }

  return acao;
}
