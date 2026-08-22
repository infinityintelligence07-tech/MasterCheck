"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEventLeads } from "@/app/actions/leads";
import { LeadSparkline } from "@/components/leads/lead-sparkline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTimeBr, formatRelativeBr } from "@/lib/dates";
import { buildSparklinePath, type LeadPoint } from "@/lib/leads-chart";

export function LeadsPanel({
  eventId,
  qtd,
  atualizadoEm,
  snapshots,
  canWrite,
}: {
  eventId: string;
  qtd: number;
  atualizadoEm: string | null;
  snapshots: LeadPoint[];
  canWrite: boolean;
}) {
  const [draft, setDraft] = useState(String(qtd));
  const [pending, startTransition] = useTransition();
  const [optimisticQtd, addOptimistic] = useOptimistic(
    qtd,
    (_c, next: number) => next,
  );
  const [localSnaps, setLocalSnaps] = useState(snapshots);
  const [localAtualizado, setLocalAtualizado] = useState(atualizadoEm);

  const chart = buildSparklinePath(localSnaps, 480, 140, 8);

  function save() {
    if (!canWrite) return;
    const next = Number.parseInt(draft, 10);
    if (Number.isNaN(next) || next < 0) {
      toast.error("Informe um número válido.");
      return;
    }
    if (next === optimisticQtd) {
      toast.message("Sem alteração.");
      return;
    }

    startTransition(async () => {
      addOptimistic(next);
      const result = await updateEventLeads({ eventId, qtd: next });
      if (!result.ok) {
        toast.error(result.message ?? "Falha ao salvar.");
        setDraft(String(qtd));
        return;
      }
      const ts = result.atualizadoEm ?? new Date().toISOString();
      setLocalSnaps((prev) => [...prev, { qtd: next, created_at: ts }]);
      setLocalAtualizado(ts);
      toast.success("Leads atualizados.");
    });
  }

  return (
    <Card className="border-border bg-card shadow-none lg:col-span-1">
      <CardHeader className="pb-2">
        <CardDescription>Leads</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{optimisticQtd}</CardTitle>
        {localAtualizado ? (
          <p className="text-xs text-muted-foreground">
            Atualizado {formatRelativeBr(localAtualizado)}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {canWrite ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="leads-qtd" className="text-xs">
                Atualizar contagem
              </Label>
              <Input
                id="leads-qtd"
                type="number"
                min={0}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-9 w-28 tabular-nums"
                disabled={pending}
              />
            </div>
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Histórico</p>
          {localSnaps.length >= 2 ? (
            <svg
              viewBox="0 0 480 140"
              className="h-36 w-full text-primary"
              role="img"
              aria-label="Gráfico de evolução de leads"
            >
              <path d={chart.area} fill="currentColor" opacity={0.12} />
              <path
                d={chart.line}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              Precisa de ao menos 2 registros para o gráfico.
              <span className="sr-only">
                <LeadSparkline points={localSnaps} />
              </span>
            </div>
          )}

          <ul className="max-h-36 space-y-1 overflow-auto text-xs text-muted-foreground">
            {[...localSnaps].reverse().map((snap) => (
              <li
                key={`${snap.created_at}-${snap.qtd}`}
                className="flex justify-between gap-2 border-b border-border/50 py-1 last:border-0"
              >
                <span className="tabular-nums text-foreground">{snap.qtd}</span>
                <span>{formatDateTimeBr(snap.created_at)}</span>
              </li>
            ))}
            {localSnaps.length === 0 ? (
              <li>Nenhum snapshot ainda. Salve uma contagem para iniciar.</li>
            ) : null}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
