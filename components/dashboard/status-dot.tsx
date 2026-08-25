"use client";

import { useOptimistic, useTransition } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { updateChecklistStatus } from "@/app/actions/checklist";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTimeBr, formatRelativeBr } from "@/lib/dates";
import { nextStatus } from "@/lib/dashboard";
import type { ItemStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

type StatusDotProps = {
  itemId: string;
  status: ItemStatus;
  label: string;
  url: string | null;
  httpStatus: number | null;
  testadoEm: string | null;
  conferidoNome: string | null;
  conferidoEm: string | null;
  canWrite: boolean;
};

const colorByStatus: Record<ItemStatus, string> = {
  ok: "bg-status-ok",
  pendente: "bg-status-pendente",
  erro: "bg-status-erro",
  nao_aplica: "bg-status-na",
};

const labelByStatus: Record<ItemStatus, string> = {
  ok: "OK",
  pendente: "Pendente",
  erro: "Erro",
  nao_aplica: "N/A",
};

export function StatusDot({
  itemId,
  status,
  label,
  url,
  httpStatus,
  testadoEm,
  conferidoNome,
  conferidoEm,
  canWrite,
}: StatusDotProps) {
  const [pending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(
    status,
    (_curr, next: ItemStatus) => next,
  );

  function cycle() {
    if (!canWrite) return;
    const next = nextStatus(optimistic);
    startTransition(async () => {
      addOptimistic(next);
      const result = await updateChecklistStatus({ itemId, status: next });
      if (!result.ok) {
        toast.error(result.message ?? "Falha ao atualizar.");
      }
    });
  }

  async function copyLink(e: React.MouseEvent) {
    e.stopPropagation();
    if (!url) {
      toast.error("Sem URL.");
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  }

  return (
    <div className="flex items-center justify-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={!canWrite || pending}
            onClick={cycle}
            aria-label={`${label}: ${labelByStatus[optimistic]}. Clique para alternar.`}
            className={cn(
              "flex size-9 items-center justify-center rounded-md transition-colors duration-150",
              canWrite && "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pending && "opacity-60",
            )}
          >
            <span
              className={cn(
                "size-3 rounded-full",
                colorByStatus[optimistic],
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs space-y-1 text-xs">
          <p className="font-medium">{label}</p>
          <p>Status: {labelByStatus[optimistic]}</p>
          {url ? (
            <p className="break-all text-muted-foreground">{url}</p>
          ) : (
            <p className="text-muted-foreground">Sem URL</p>
          )}
          {httpStatus !== null ? <p>HTTP {httpStatus}</p> : <p>Sem teste HTTP</p>}
          {testadoEm ? <p>Testado {formatRelativeBr(testadoEm)}</p> : null}
          {conferidoNome && conferidoEm ? (
            <p>
              Conferido por {conferidoNome} em {formatDateTimeBr(conferidoEm)}
            </p>
          ) : (
            <p>Ainda não conferido</p>
          )}
        </TooltipContent>
      </Tooltip>
      {url ? (
        <button
          type="button"
          onClick={(e) => void copyLink(e)}
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Copiar link de ${label}`}
        >
          <Copy className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
