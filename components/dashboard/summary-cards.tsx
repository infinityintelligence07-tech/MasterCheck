import Link from "next/link";
import { CalendarClock, ClipboardList, Megaphone, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { countdownLabel, formatDateShort } from "@/lib/dates";
import type { DashboardEvent } from "@/lib/dashboard";

type Summary = {
  eventosAtivos: number;
  conferenciasPendentes: number;
  leadsMes: number;
  proximo: DashboardEvent | null;
};

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Eventos ativos</CardDescription>
          <Megaphone className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl tabular-nums">
            {summary.eventosAtivos}
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Conferências pendentes</CardDescription>
          <ClipboardList className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl tabular-nums">
            {summary.conferenciasPendentes}
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Leads no mês</CardDescription>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl tabular-nums">
            {summary.leadsMes}
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Próximo evento</CardDescription>
          <CalendarClock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {summary.proximo ? (
            <Link
              href={`/eventos/${summary.proximo.id}`}
              className="block space-y-0.5 hover:opacity-90"
            >
              <CardTitle className="truncate text-base">
                {summary.proximo.nome}
              </CardTitle>
              <p className="text-xs tabular-nums text-muted-foreground">
                {formatDateShort(summary.proximo.data_evento)} ·{" "}
                {countdownLabel(
                  summary.proximo.data_evento,
                  summary.proximo.status,
                )}
              </p>
            </Link>
          ) : (
            <CardTitle className="text-base text-muted-foreground">
              Nenhum agendado
            </CardTitle>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
