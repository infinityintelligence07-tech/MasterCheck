"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { updateChecklistStatus } from "@/app/actions/checklist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTimeBr, formatRelativeBr } from "@/lib/dates";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/constants";
import {
  normalizeUrlVersions,
  type UrlVersion,
} from "@/lib/url-versions";
import type { Json } from "@/types/database";
import { cn } from "@/lib/utils";

type StatusDotProps = {
  itemId: string;
  status: ItemStatus;
  label: string;
  url: string | null;
  urlVersions?: Json | UrlVersion[] | null;
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

const iconButtonClass =
  "flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url);
  toast.success("Link copiado.");
}

function VersionActionList({
  versions,
  mode,
}: {
  versions: UrlVersion[];
  mode: "open" | "copy";
}) {
  return (
    <div className="space-y-1">
      <p className="px-1 text-xs font-medium text-muted-foreground">
        {mode === "open" ? "Abrir versão" : "Copiar versão"}
      </p>
      <ul className="max-h-64 space-y-0.5 overflow-auto">
        {versions.map((version) => (
          <li key={version.id}>
            <button
              type="button"
              className="flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left hover:bg-muted"
              onClick={() => {
                if (mode === "open") openUrl(version.url);
                else void copyUrl(version.url);
              }}
            >
              <span className="text-sm font-medium">{version.label}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {version.url}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinkActionButton({
  versions,
  mode,
  label,
}: {
  versions: UrlVersion[];
  mode: "open" | "copy";
  label: string;
}) {
  const Icon = mode === "open" ? ExternalLink : Copy;
  const tip = mode === "open" ? "Abrir em nova guia" : "Copiar link";
  const aria =
    mode === "open"
      ? `Abrir ${label} em nova guia`
      : `Copiar link de ${label}`;

  if (versions.length === 0) return null;

  if (versions.length === 1) {
    const only = versions[0]!;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={iconButtonClass}
            aria-label={aria}
            onClick={(e) => {
              e.stopPropagation();
              if (mode === "open") openUrl(only.url);
              else void copyUrl(only.url);
            }}
          >
            <Icon className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{tip}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(iconButtonClass, "relative")}
              aria-label={`${aria} (escolher versão)`}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon className="size-3.5" />
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                {versions.length}
              </span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          {tip} · {versions.length} versões
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-72 p-2">
        <VersionActionList versions={versions} mode={mode} />
      </PopoverContent>
    </Popover>
  );
}

export function StatusDot({
  itemId,
  status,
  label,
  url,
  urlVersions,
  httpStatus,
  testadoEm,
  conferidoNome,
  conferidoEm,
  canWrite,
}: StatusDotProps) {
  const [, startTransition] = useTransition();
  const [displayStatus, setDisplayStatus] = useState<ItemStatus>(status);

  useEffect(() => {
    setDisplayStatus(status);
  }, [status]);

  const versions = normalizeUrlVersions(urlVersions, url);

  function changeStatus(next: ItemStatus) {
    if (!canWrite || next === displayStatus) return;

    const previous = displayStatus;
    setDisplayStatus(next);

    startTransition(() => {
      void updateChecklistStatus({ itemId, status: next }).then((result) => {
        if (!result.ok) {
          setDisplayStatus(previous);
          toast.error(result.message ?? "Falha ao atualizar.");
        }
      });
    });
  }

  return (
    <div className="flex items-center justify-center gap-0.5">
      {canWrite ? (
        <Select
          value={displayStatus}
          onValueChange={(value) => changeStatus(value as ItemStatus)}
        >
          <SelectTrigger
            size="sm"
            aria-label={`${label}: ${labelByStatus[displayStatus]}`}
            className="h-9 min-w-[7.5rem] gap-1.5 px-2"
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  colorByStatus[displayStatus],
                )}
                aria-hidden
              />
              <span className="truncate">{labelByStatus[displayStatus]}</span>
            </span>
          </SelectTrigger>
          <SelectContent position="popper" align="start" className="min-w-[9rem]">
            {ITEM_STATUSES.map((itemStatus) => (
              <SelectItem key={itemStatus} value={itemStatus}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      colorByStatus[itemStatus],
                    )}
                    aria-hidden
                  />
                  {labelByStatus[itemStatus]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground"
              aria-label={`${label}: ${labelByStatus[displayStatus]}`}
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  colorByStatus[displayStatus],
                )}
                aria-hidden
              />
              {labelByStatus[displayStatus]}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs space-y-1 text-xs">
            <p className="font-medium">{label}</p>
            <p>Status: {labelByStatus[displayStatus]}</p>
            {versions.length > 0 ? (
              <p className="text-muted-foreground">
                {versions.length} versão(ões)
              </p>
            ) : (
              <p className="text-muted-foreground">Sem URL</p>
            )}
            {httpStatus !== null ? (
              <p>HTTP {httpStatus}</p>
            ) : (
              <p>Sem teste HTTP</p>
            )}
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
      )}

      <LinkActionButton versions={versions} mode="open" label={label} />
      <LinkActionButton versions={versions} mode="copy" label={label} />
    </div>
  );
}
