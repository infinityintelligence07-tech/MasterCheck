"use client";

import Link from "next/link";
import { StatusDot } from "@/components/dashboard/status-dot";
import { LeadsInlineEditor } from "@/components/leads/leads-inline-editor";
import { Badge } from "@/components/ui/badge";
import { checklistProgress } from "@/lib/checklist-progress";
import {
  DASHBOARD_CHECKLIST_COLS,
  itemByTipo,
  type DashboardEvent,
} from "@/lib/dashboard";
import { countdownLabel, formatDateShort } from "@/lib/dates";
import { formatActivityLine } from "@/lib/activity-format";
import type { ItemStatus } from "@/lib/constants";

export function EventsMobileList({
  data,
  canWrite,
}: {
  data: DashboardEvent[];
  canWrite: boolean;
}) {
  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground md:hidden">
        Nenhum evento com esses filtros.
      </p>
    );
  }

  return (
    <div className="space-y-2 md:hidden">
      {data.map((event) => {
        const progress = checklistProgress(event.checklist_items);
        return (
          <article
            key={event.id}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <Link href={`/eventos/${event.id}`} className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {event.cidade}/{event.uf}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {event.nome}
                </p>
              </Link>
              <Badge variant="outline" className="shrink-0">
                {countdownLabel(event.data_evento, event.status)}
              </Badge>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-xs tabular-nums text-muted-foreground">
              <span>{formatDateShort(event.data_evento)}</span>
              <LeadsInlineEditor
                eventId={event.id}
                qtd={event.qtd_leads}
                snapshots={event.lead_snapshots}
                canWrite={canWrite}
              />
              <span>
                {progress.done}/{progress.total}
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {DASHBOARD_CHECKLIST_COLS.map((col) => {
                const item = itemByTipo(event, col.tipo);
                if (!item) return null;
                return (
                  <div key={col.tipo} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {col.short}
                    </span>
                    <StatusDot
                      itemId={item.id}
                      status={item.status as ItemStatus}
                      label={col.label}
                      url={item.url}
                      urlVersions={item.url_versions}
                      httpStatus={item.http_status}
                      testadoEm={item.testado_em}
                      conferidoNome={
                        item.conferido?.nome || item.conferido?.email || null
                      }
                      conferidoEm={item.conferido_em}
                      canWrite={canWrite}
                    />
                  </div>
                );
              })}
            </div>

            {event.ultima_atividade ? (
              <p className="mt-2 text-xs text-muted-foreground" title={event.ultima_atividade.acao}>
                {formatActivityLine({
                  userNome: event.ultima_atividade.user_nome,
                  createdAt: event.ultima_atividade.created_at,
                })}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
