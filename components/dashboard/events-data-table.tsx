"use client";

import Link from "next/link";
import {
  createColumnHelper,
  FlexRender,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { StatusDot } from "@/components/dashboard/status-dot";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { LeadsInlineEditor } from "@/components/leads/leads-inline-editor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { checklistProgress } from "@/lib/checklist-progress";
import {
  DASHBOARD_CHECKLIST_COLS,
  itemByTipo,
  type DashboardEvent,
} from "@/lib/dashboard";
import { formatActivityLine } from "@/lib/activity-format";
import { countdownLabel, formatDateShort } from "@/lib/dates";
import type { ItemStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, DashboardEvent>();

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

export function EventsDataTable({
  data,
  canWrite,
  isAdmin,
}: {
  data: DashboardEvent[];
  canWrite: boolean;
  isAdmin: boolean;
}) {
  const columns = columnHelper.columns([
    columnHelper.accessor((row) => `${row.cidade}/${row.uf}`, {
      id: "evento",
      header: "Evento",
      cell: ({ row }) => (
        <Link
          href={`/eventos/${row.original.id}`}
          className="block min-w-[140px] font-medium hover:underline"
        >
          <span className="block truncate text-sm">{row.original.cidade}</span>
          <span className="block text-xs text-muted-foreground">
            {row.original.uf} · {row.original.nome}
          </span>
        </Link>
      ),
    }),
    columnHelper.accessor("data_evento", {
      header: "Data",
      cell: ({ row }) => (
        <div className="flex min-w-[88px] flex-col gap-1">
          <span className="text-sm tabular-nums">
            {formatDateShort(row.original.data_evento)}
          </span>
          <Badge variant="outline" className="w-fit px-1.5 py-0 text-[10px]">
            {countdownLabel(row.original.data_evento, row.original.status)}
          </Badge>
        </div>
      ),
    }),
    columnHelper.display({
      id: "progresso",
      header: "Progresso",
      cell: ({ row }) => {
        const p = checklistProgress(row.original.checklist_items);
        return (
          <div className="min-w-[100px] space-y-1">
            <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
              <span>
                {p.done}/{p.total}
              </span>
              <span>{p.percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${p.percent}%` }}
              />
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("qtd_leads", {
      header: "Leads",
      cell: ({ row }) => (
        <LeadsInlineEditor
          eventId={row.original.id}
          qtd={row.original.qtd_leads}
          snapshots={row.original.lead_snapshots}
          canWrite={canWrite}
        />
      ),
    }),
    ...DASHBOARD_CHECKLIST_COLS.map((col) =>
      columnHelper.display({
        id: col.tipo,
        header: col.short,
        cell: ({ row }) => {
          const item = itemByTipo(row.original, col.tipo);
          if (!item) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
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
          );
        },
      }),
    ),
    columnHelper.display({
      id: "responsavel",
      header: "Resp.",
      cell: ({ row }) => {
        const nome =
          row.original.responsavel?.nome ||
          row.original.responsavel?.email ||
          "?";
        return (
          <Avatar className="size-7" title={nome}>
            <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
              {initials(nome)}
            </AvatarFallback>
          </Avatar>
        );
      },
    }),
    columnHelper.display({
      id: "atividade",
      header: "Última atividade",
      cell: ({ row }) => {
        const a = row.original.ultima_atividade;
        if (!a) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div
            className="min-w-[120px] text-xs text-muted-foreground"
            title={a.acao}
          >
            {formatActivityLine({
              userNome: a.user_nome,
              createdAt: a.created_at,
            })}
          </div>
        );
      },
    }),
    ...(isAdmin
      ? [
          columnHelper.display({
            id: "acoes",
            header: () => <span className="sr-only">Ações</span>,
            cell: ({ row }) => (
              <div className="flex justify-center py-0.5">
                <DeleteEventButton
                  eventId={row.original.id}
                  eventName={`${row.original.cidade}/${row.original.uf}`}
                  variant="icon"
                />
              </div>
            ),
          }),
        ]
      : []),
  ]);

  const table = useTable({
    features,
    columns,
    data,
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const actionsColumnIndex = isAdmin ? columns.length - 1 : -1;

  return (
    <div className="hidden overflow-auto rounded-lg border border-border md:block">
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <thead className="bg-muted/40">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header, index) => (
                <th
                  key={header.id}
                  className={cn(
                    "h-9 px-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground",
                    index === 0 &&
                      "sticky left-0 z-10 bg-muted/95 backdrop-blur-sm",
                    index === actionsColumnIndex &&
                      "sticky right-0 z-10 w-14 bg-muted/95 px-1 text-center backdrop-blur-sm",
                  )}
                >
                  {header.isPlaceholder ? null : (
                    <FlexRender header={header} />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 px-3 text-center text-sm text-muted-foreground"
              >
                Nenhum evento com esses filtros.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="h-12 border-b border-border/80 hover:bg-muted/30"
              >
                {row.getAllCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-2 align-middle",
                      index === 0 &&
                        "sticky left-0 z-10 bg-background/95 backdrop-blur-sm",
                      index === actionsColumnIndex &&
                        "sticky right-0 z-10 w-14 bg-background/95 px-1 text-center backdrop-blur-sm",
                    )}
                  >
                    <FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
