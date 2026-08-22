import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventActivityLog } from "@/lib/activity-log";
import { ChecklistPanel } from "@/components/checklist/checklist-panel";
import { ActivityTimeline } from "@/components/events/activity-timeline";
import { DuplicateEventButton } from "@/components/events/duplicate-event-button";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { LeadsPanel } from "@/components/leads/leads-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { checklistProgress } from "@/lib/checklist-progress";
import { countdownLabel, formatDateBr } from "@/lib/dates";
import { getEventById, getLeadSnapshots } from "@/lib/events";
import { EVENT_STATUS_LABELS } from "@/lib/events-meta";
import type { EventStatus } from "@/lib/constants";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [event, profile, snapshots, activity] = await Promise.all([
    getEventById(id),
    getCurrentProfile(),
    getLeadSnapshots(id),
    getEventActivityLog(id),
  ]);

  if (!event) notFound();

  const progress = checklistProgress(event.checklist_items);
  const canWrite = profile?.role === "admin" || profile?.role === "operador";
  const isAdmin = profile?.role === "admin";
  const status = event.status as EventStatus;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{event.nome}</h1>
            <Badge variant="secondary">{EVENT_STATUS_LABELS[status]}</Badge>
            <Badge variant="outline">
              {countdownLabel(event.data_evento, event.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {event.cidade}/{event.uf} · {formatDateBr(event.data_evento)}
            {event.hora_evento ? ` · ${event.hora_evento.slice(0, 5)}` : ""}
            {event.responsavel
              ? ` · Resp.: ${event.responsavel.nome || event.responsavel.email}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <>
              <Button asChild size="sm">
                <Link href={`/eventos/${event.id}/editar`}>Editar</Link>
              </Button>
              <DuplicateEventButton event={event} />
            </>
          ) : null}
          {isAdmin ? <DeleteEventButton eventId={event.id} /> : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <LeadsPanel
              eventId={event.id}
              qtd={event.qtd_leads}
              atualizadoEm={event.qtd_leads_atualizado_em}
              snapshots={snapshots}
              canWrite={canWrite}
            />

            <Card className="border-border bg-card shadow-none lg:col-span-2">
              <CardHeader className="pb-2">
                <CardDescription>Resumo do checklist</CardDescription>
                <CardTitle className="text-base tabular-nums">
                  {progress.done}/{progress.total} · {progress.percent}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <ChecklistPanel
            eventId={event.id}
            items={event.checklist_items}
            canWrite={canWrite}
          />

          {event.observacoes ? (
            <Card className="border-border bg-card shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {event.observacoes}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-16 xl:self-start">
          <ActivityTimeline entries={activity} />
        </div>
      </div>
    </div>
  );
}
