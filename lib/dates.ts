import { format, formatDistanceToNow, parseISO, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { APP_TIMEZONE } from "@/lib/constants";

/** Interpreta `YYYY-MM-DD` como data civil (sem shift de timezone). */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function formatDateBr(value: string | Date, pattern = "dd/MM/yyyy"): string {
  const date = typeof value === "string" ? parseDateOnly(value) : value;
  return format(date, pattern, { locale: ptBR });
}

export function formatDateShort(value: string | Date): string {
  return formatDateBr(value, "dd/MM");
}

export function formatDateTimeBr(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatRelativeBr(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function daysUntilEvent(dataEvento: string, today = new Date()): number {
  const event = parseDateOnly(dataEvento);
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return differenceInCalendarDays(event, startToday);
}

export function countdownLabel(dataEvento: string, status?: string): string {
  if (status === "realizado") return "Realizado";
  if (status === "cancelado") return "Cancelado";

  const days = daysUntilEvent(dataEvento);
  if (days === 0) return "HOJE";
  if (days === 1) return "D-1";
  if (days > 1) return `D-${days}`;
  if (days === -1) return "Ontem";
  return `Há ${Math.abs(days)}d`;
}

export { APP_TIMEZONE };
