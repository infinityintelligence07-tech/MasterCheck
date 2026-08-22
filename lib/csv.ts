import { formatDateShort, parseDateOnly } from "@/lib/dates";
import type { DashboardEvent } from "@/lib/dashboard";
import { itemByTipo } from "@/lib/dashboard";
import type { ChecklistTipo, ItemStatus } from "@/lib/constants";
import type { UfBrasil } from "@/lib/events-meta";

/** Cabeçalhos na ordem da planilha MasterClass. */
export const CSV_HEADERS = [
  "Última atividade",
  "Evento",
  "Data",
  "Qtd leads / exportar",
  "Link LP inscrição",
  "OK",
  "Link página obrigado",
  "Link do grupo",
  "Link ManyChat inscrição",
  "Link ManyChat é amanhã / é hoje",
  "Teste",
] as const;

export type CsvMappedRow = {
  nome: string;
  cidade: string;
  uf: UfBrasil;
  data_evento: string; // YYYY-MM-DD
  qtd_leads: number;
  urls: Partial<Record<ChecklistTipo, string | null>>;
  statuses: Partial<Record<ChecklistTipo, ItemStatus>>;
  raw: Record<string, string>;
};

export type CsvPreviewRow = CsvMappedRow & {
  action: "criar" | "atualizar";
  existingEventId?: string;
};

const CITY_UF: Record<string, UfBrasil> = {
  "belo horizonte": "MG",
  "são paulo": "SP",
  "sao paulo": "SP",
  curitiba: "PR",
  "rio de janeiro": "RJ",
  brasilia: "DF",
  brasília: "DF",
  salvador: "BA",
  fortaleza: "CE",
  recife: "PE",
  manaus: "AM",
  belém: "PA",
  belem: "PA",
  goiania: "GO",
  goiânia: "GO",
  florianopolis: "SC",
  florianópolis: "SC",
  portoalegre: "RS",
  "porto alegre": "RS",
  campinas: "SP",
  "ribeirão preto": "SP",
  "ribeirao preto": "SP",
  uberlandia: "MG",
  uberândia: "MG",
  londrina: "PR",
  maringa: "PR",
  maringá: "PR",
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const normalized = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]!;
    const next = normalized[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }

  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);

  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function titleCaseCity(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function extractCidadeFromEvento(evento: string): string {
  const cleaned = evento
    .trim()
    .replace(/^mc\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return titleCaseCity(cleaned);
}

export function guessUf(cidade: string): UfBrasil {
  const key = cidade
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const keyAccent = cidade.toLowerCase().trim();
  return CITY_UF[keyAccent] ?? CITY_UF[key] ?? "SP";
}

/** Aceita dd/MM, dd/MM/yy, dd/MM/yyyy */
export function parseSpreadsheetDate(
  value: string,
  fallbackYear = new Date().getFullYear(),
): string | null {
  const raw = value.trim();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = m[3] ? Number(m[3]) : fallbackYear;
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  // valida calendário
  const d = parseDateOnly(iso);
  if (d.getFullYear() !== year || d.getMonth() + 1 !== month || d.getDate() !== day) {
    return null;
  }
  return iso;
}

function extractUrls(value: string): string[] {
  const matches = value.match(/https?:\/\/[^\s|,;]+/gi);
  return matches ?? [];
}

function statusFromOk(value: string): ItemStatus {
  const v = value.trim().toLowerCase();
  if (v === "ok" || v === "sim" || v === "yes") return "ok";
  if (v === "erro" || v === "error" || v === "fail") return "erro";
  if (v === "n/a" || v === "na" || v === "nao_aplica" || v === "não se aplica") {
    return "nao_aplica";
  }
  return "pendente";
}

function statusFromTeste(value: string): ItemStatus {
  const v = value.trim().toLowerCase();
  if (!v) return "pendente";
  if (v === "ok" || v === "feito" || v === "sim" || v === "x") return "ok";
  return "pendente";
}

export function rowsToMapped(csvRows: string[][]): {
  mapped: CsvMappedRow[];
  errors: string[];
} {
  if (csvRows.length === 0) {
    return { mapped: [], errors: ["CSV vazio."] };
  }

  const header = csvRows[0]!.map(normalizeHeader);
  const indexOf = (aliases: string[]) => {
    for (const alias of aliases) {
      const idx = header.findIndex((h) => h === normalizeHeader(alias));
      if (idx >= 0) return idx;
    }
    // match parcial
    for (const alias of aliases) {
      const idx = header.findIndex((h) => h.includes(normalizeHeader(alias)));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxEvento = indexOf(["evento"]);
  const idxData = indexOf(["data"]);
  const idxLeads = indexOf(["qtd leads / exportar", "qtd leads", "leads"]);
  const idxLp = indexOf(["link lp inscrição", "link lp inscricao", "lp inscrição"]);
  const idxOk = indexOf(["ok"]);
  const idxObrigado = indexOf(["link página obrigado", "link pagina obrigado", "obrigado"]);
  const idxGrupo = indexOf(["link do grupo", "grupo"]);
  const idxMcInsc = indexOf(["link manychat inscrição", "manychat inscrição", "manychat inscricao"]);
  const idxMcReminders = indexOf([
    "link manychat é amanhã / é hoje",
    "link manychat e amanha / e hoje",
    "manychat é amanhã",
  ]);
  const idxTeste = indexOf(["teste"]);

  if (idxEvento < 0 || idxData < 0) {
    return {
      mapped: [],
      errors: ["CSV precisa das colunas Evento e Data (formato da planilha)."],
    };
  }

  const mapped: CsvMappedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < csvRows.length; i++) {
    const cells = csvRows[i]!;
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");

    const evento = get(idxEvento);
    const dataRaw = get(idxData);
    if (!evento && !dataRaw) continue;

    const data_evento = parseSpreadsheetDate(dataRaw);
    if (!data_evento) {
      errors.push(`Linha ${i + 1}: data inválida "${dataRaw}". Use dd/MM ou dd/MM/yyyy.`);
      continue;
    }

    const cidade = extractCidadeFromEvento(evento);
    if (!cidade) {
      errors.push(`Linha ${i + 1}: evento sem cidade reconhecível.`);
      continue;
    }

    const leadsRaw = get(idxLeads).replace(/[^\d]/g, "");
    const qtd_leads = leadsRaw ? Number(leadsRaw) : 0;

    const mcUrls = extractUrls(get(idxMcReminders));
    const urls: CsvMappedRow["urls"] = {
      lp_inscricao: get(idxLp) || null,
      pagina_obrigado: get(idxObrigado) || null,
      grupo_whatsapp: get(idxGrupo) || null,
      manychat_inscricao: get(idxMcInsc) || null,
      manychat_e_amanha: mcUrls[0] ?? (get(idxMcReminders) || null),
      manychat_e_hoje: mcUrls[1] ?? mcUrls[0] ?? null,
    };

    // limpa URLs vazias / inválidas simples
    for (const key of Object.keys(urls) as ChecklistTipo[]) {
      const v = urls[key];
      if (v && !/^https?:\/\//i.test(v)) {
        urls[key] = null;
      }
    }

    const statuses: CsvMappedRow["statuses"] = {
      lp_inscricao: statusFromOk(get(idxOk)),
      teste_ponta_a_ponta: statusFromTeste(get(idxTeste)),
    };

    mapped.push({
      nome: evento.toUpperCase().startsWith("MC")
        ? `MC ${cidade}`
        : evento.trim() || `MC ${cidade}`,
      cidade,
      uf: guessUf(cidade),
      data_evento,
      qtd_leads: Number.isFinite(qtd_leads) ? qtd_leads : 0,
      urls,
      statuses,
      raw: {
        evento,
        data: dataRaw,
        leads: get(idxLeads),
      },
    });
  }

  return { mapped, errors };
}

function normalizeCityKey(cidade: string): string {
  return cidade
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function buildImportPreview(
  mapped: CsvMappedRow[],
  existing: Array<{ id: string; cidade: string; data_evento: string }>,
): CsvPreviewRow[] {
  return mapped.map((row) => {
    const match = existing.find(
      (e) =>
        normalizeCityKey(e.cidade) === normalizeCityKey(row.cidade) &&
        e.data_evento === row.data_evento,
    );
    if (match) {
      return { ...row, action: "atualizar", existingEventId: match.id };
    }
    return { ...row, action: "criar" };
  });
}

export function eventsToCsv(events: DashboardEvent[]): string {
  const lines = [CSV_HEADERS.map((h) => escapeCsvCell(h)).join(",")];

  for (const event of events) {
    const lp = itemByTipo(event, "lp_inscricao");
    const obrigado = itemByTipo(event, "pagina_obrigado");
    const grupo = itemByTipo(event, "grupo_whatsapp");
    const mcInsc = itemByTipo(event, "manychat_inscricao");
    const mcAmanha = itemByTipo(event, "manychat_e_amanha");
    const mcHoje = itemByTipo(event, "manychat_e_hoje");
    const teste = itemByTipo(event, "teste_ponta_a_ponta");

    const atividade = event.ultima_atividade
      ? `${event.ultima_atividade.user_nome} · ${event.ultima_atividade.created_at}`
      : "";

    const manychatReminders = [mcAmanha?.url, mcHoje?.url]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(" | ");

    const cells = [
      atividade,
      event.nome,
      formatDateShort(event.data_evento),
      String(event.qtd_leads),
      lp?.url ?? "",
      lp?.status === "ok" ? "ok" : "",
      obrigado?.url ?? "",
      grupo?.url ?? "",
      mcInsc?.url ?? "",
      manychatReminders,
      teste?.status === "ok" ? "ok" : "",
    ];

    lines.push(cells.map((c) => escapeCsvCell(c)).join(","));
  }

  return lines.join("\n") + "\n";
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
