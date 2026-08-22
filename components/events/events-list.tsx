import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checklistProgress } from "@/lib/checklist-progress";
import { countdownLabel, formatDateShort } from "@/lib/dates";
import type { EventWithRelations } from "@/lib/events";
import { EVENT_STATUS_LABELS } from "@/lib/events-meta";
import type { EventStatus } from "@/lib/constants";

export function EventsList({ events }: { events: EventWithRelations[] }) {
  if (events.length === 0) {
    return (
      <Card className="border-dashed border-border bg-card/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Nenhum evento</CardTitle>
          <CardDescription>
            Crie o primeiro MasterClass para começar a conferência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/eventos/novo"
            className="text-sm font-medium text-primary hover:underline"
          >
            Novo evento
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const progress = checklistProgress(event.checklist_items);
        const status = event.status as EventStatus;
        return (
          <Link
            key={event.id}
            href={`/eventos/${event.id}`}
            className="block rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{event.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {event.cidade}/{event.uf} · {formatDateShort(event.data_evento)}
                </p>
              </div>
              <Badge variant="outline" className="tabular-nums">
                {countdownLabel(event.data_evento, event.status)}
              </Badge>
              <Badge variant="secondary">
                {EVENT_STATUS_LABELS[status]}
              </Badge>
              <span className="text-xs tabular-nums text-muted-foreground">
                {progress.done}/{progress.total}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {event.qtd_leads} leads
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-150"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
