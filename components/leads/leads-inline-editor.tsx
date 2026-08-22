"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEventLeads } from "@/app/actions/leads";
import { LeadSparkline } from "@/components/leads/lead-sparkline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateShort, formatRelativeBr } from "@/lib/dates";
import type { LeadPoint } from "@/lib/leads-chart";
import { cn } from "@/lib/utils";

export function LeadsInlineEditor({
  eventId,
  qtd,
  snapshots,
  canWrite,
}: {
  eventId: string;
  qtd: number;
  snapshots: LeadPoint[];
  canWrite: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(qtd));
  const [pending, startTransition] = useTransition();
  const [optimisticQtd, addOptimistic] = useOptimistic(
    qtd,
    (_curr, next: number) => next,
  );
  const [localSnaps, setLocalSnaps] = useState(snapshots);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (!canWrite) return;
    setDraft(String(optimisticQtd));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const next = Number.parseInt(draft, 10);
    if (Number.isNaN(next) || next < 0) {
      toast.error("Informe um número válido.");
      setDraft(String(optimisticQtd));
      setEditing(false);
      return;
    }
    if (next === optimisticQtd) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      addOptimistic(next);
      setEditing(false);
      const result = await updateEventLeads({ eventId, qtd: next });
      if (!result.ok) {
        toast.error(result.message ?? "Falha ao salvar leads.");
        return;
      }
      setLocalSnaps((prev) => [
        ...prev,
        { qtd: next, created_at: result.atualizadoEm ?? new Date().toISOString() },
      ]);
      toast.success("Leads atualizados.");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setDraft(String(optimisticQtd));
              setEditing(false);
            }
          }}
          className="h-7 w-16 rounded-md border border-input bg-background px-1.5 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Editar quantidade de leads"
          disabled={pending}
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={!canWrite}
          className={cn(
            "rounded px-1 text-sm tabular-nums",
            canWrite && "hover:bg-muted",
            pending && "opacity-60",
          )}
          aria-label={canWrite ? "Clique para editar leads" : "Leads"}
        >
          {optimisticQtd}
        </button>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rounded p-0.5 hover:bg-muted"
            aria-label="Histórico de leads"
          >
            <LeadSparkline points={localSnaps} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 space-y-2 p-3">
          <p className="text-xs font-medium">Histórico de leads</p>
          <LeadSparkline points={localSnaps} width={200} height={48} />
          <ul className="max-h-32 space-y-1 overflow-auto text-xs text-muted-foreground">
            {[...localSnaps].reverse().slice(0, 8).map((snap) => (
              <li key={`${snap.created_at}-${snap.qtd}`} className="flex justify-between gap-2">
                <span className="tabular-nums text-foreground">{snap.qtd}</span>
                <span>
                  {formatDateShort(snap.created_at.slice(0, 10))} ·{" "}
                  {formatRelativeBr(snap.created_at)}
                </span>
              </li>
            ))}
            {localSnaps.length === 0 ? <li>Sem histórico ainda.</li> : null}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
