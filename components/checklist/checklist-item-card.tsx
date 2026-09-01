"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Minus,
  RefreshCw,
  ShieldQuestion,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  testChecklistLink,
  updateChecklistObservacao,
  updateChecklistStatus,
  updateChecklistUrl,
  updateChecklistUrlVersions,
} from "@/app/actions/checklist";
import { UrlVersionsEditor } from "@/components/checklist/url-versions-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTimeBr, formatRelativeBr } from "@/lib/dates";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/constants";
import type { EventWithRelations } from "@/lib/events";
import {
  normalizeUrlVersions,
  primaryUrlFromVersions,
  type UrlVersion,
} from "@/lib/url-versions";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ItemStatus, string> = {
  pendente: "Pendente",
  ok: "OK",
  erro: "Erro",
  nao_aplica: "N/A",
};

type ChecklistItem = EventWithRelations["checklist_items"][number];

function httpBadge(httpStatus: number | null, veredictoHint?: string) {
  if (httpStatus === null || httpStatus === undefined) return null;

  if (httpStatus === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-status-erro">
        <X className="size-3" /> Rede/timeout
      </span>
    );
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-status-ok">
        <Check className="size-3" /> HTTP {httpStatus}
      </span>
    );
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    httpStatus === 302 ||
    veredictoHint === "nao_verificavel"
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ShieldQuestion className="size-3" /> HTTP {httpStatus} · não verificável
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-status-erro">
      <X className="size-3" /> HTTP {httpStatus}
    </span>
  );
}

export function ChecklistItemCard({
  item,
  canWrite,
}: {
  item: ChecklistItem;
  canWrite: boolean;
}) {
  const isLp = item.tipo === "lp_inscricao";
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(item.url ?? "");
  const [versions, setVersions] = useState<UrlVersion[]>(() =>
    normalizeUrlVersions(item.url_versions, item.url),
  );
  const [observacao, setObservacao] = useState(item.observacao ?? "");
  const [testing, setTesting] = useState(false);
  const [localHttp, setLocalHttp] = useState(item.http_status);
  const [localTestadoEm, setLocalTestadoEm] = useState(item.testado_em);
  const [localVeredicto, setLocalVeredicto] = useState<string | undefined>();
  const [displayStatus, setDisplayStatus] = useState<ItemStatus>(
    item.status as ItemStatus,
  );

  useEffect(() => {
    setDisplayStatus(item.status as ItemStatus);
  }, [item.status]);

  function changeStatus(next: ItemStatus) {
    if (!canWrite || next === displayStatus) return;

    const previous = displayStatus;
    setDisplayStatus(next);

    startTransition(() => {
      void updateChecklistStatus({
        itemId: item.id,
        status: next,
      }).then((result) => {
        if (!result.ok) {
          setDisplayStatus(previous);
          toast.error(result.message ?? "Falha ao atualizar status.");
        }
      });
    });
  }

  function saveUrl() {
    if (!canWrite) return;
    startTransition(async () => {
      const result = await updateChecklistUrl({ itemId: item.id, url });
      if (!result.ok) toast.error(result.message ?? "URL inválida.");
      else toast.success("URL salva.");
    });
  }

  function saveVersions(next: UrlVersion[]) {
    if (!canWrite) return;
    const cleaned = next
      .map((v) => ({
        ...v,
        label: v.label.trim() || "Versão",
        url: v.url.trim(),
      }))
      .filter((v) => v.url !== "");

    startTransition(async () => {
      const result = await updateChecklistUrlVersions({
        itemId: item.id,
        versions: cleaned,
      });
      if (!result.ok) {
        toast.error(result.message ?? "Não foi possível salvar as versões.");
        return;
      }
      setVersions(cleaned);
      setUrl(primaryUrlFromVersions(cleaned) ?? "");
      toast.success(
        cleaned.length > 1
          ? `${cleaned.length} versões salvas.`
          : "Versão da LP salva.",
      );
    });
  }

  function saveObservacao() {
    if (!canWrite) return;
    startTransition(async () => {
      const result = await updateChecklistObservacao({
        itemId: item.id,
        observacao: observacao.trim() === "" ? null : observacao,
      });
      if (!result.ok) toast.error(result.message ?? "Falha ao salvar.");
      else toast.success("Observação salva.");
    });
  }

  async function copyUrl() {
    const target = isLp ? primaryUrlFromVersions(versions) : url;
    if (!target) {
      toast.error("Sem URL para copiar.");
      return;
    }
    await navigator.clipboard.writeText(target);
    toast.success("Link copiado.");
  }

  async function testNow() {
    if (!canWrite) return;
    setTesting(true);
    try {
      const result = await testChecklistLink(item.id);
      if (!result.ok) {
        toast.error(result.message ?? "Falha no teste.");
        return;
      }
      setLocalHttp(result.httpStatus ?? null);
      setLocalTestadoEm(result.testadoEm ?? new Date().toISOString());
      setLocalVeredicto(result.veredicto);
      if (result.veredicto === "ok") toast.success(result.message);
      else if (result.veredicto === "nao_verificavel")
        toast.message(result.message);
      else toast.error(result.message);
    } finally {
      setTesting(false);
    }
  }

  const openTarget = isLp ? primaryUrlFromVersions(versions) : url;

  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-card p-3",
        pending && "opacity-90",
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">{item.label}</h3>
          <p className="text-xs text-muted-foreground">
            Ordem {item.ordem} · {item.tipo}
            {isLp && versions.length > 1
              ? ` · ${versions.length} versões`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2.5 rounded-full",
              displayStatus === "ok" && "bg-status-ok",
              displayStatus === "pendente" && "bg-status-pendente",
              displayStatus === "erro" && "bg-status-erro",
              displayStatus === "nao_aplica" && "bg-status-na",
            )}
            aria-hidden
          />
          {canWrite ? (
            <Select
              value={displayStatus}
              onValueChange={(value) => changeStatus(value as ItemStatus)}
            >
              <SelectTrigger className="h-8 w-[140px]" aria-label="Status do item">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground">
              {STATUS_LABELS[displayStatus]}
            </span>
          )}
        </div>
      </div>

      {isLp ? (
        <UrlVersionsEditor
          versions={versions}
          onChange={setVersions}
          onCommit={saveVersions}
          canWrite={canWrite}
          pending={pending}
        />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`url-${item.id}`} className="text-xs">
            URL
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={`url-${item.id}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => {
                if (canWrite && url !== (item.url ?? "")) saveUrl();
              }}
              placeholder="https://"
              disabled={!canWrite}
              className="h-9 min-w-[200px] flex-1"
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!openTarget}
          onClick={() =>
            window.open(openTarget!, "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="size-3.5" />
          Abrir
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!openTarget}
          onClick={() => void copyUrl()}
        >
          <Copy className="size-3.5" />
          Copiar
        </Button>
        {canWrite ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!openTarget || testing}
            onClick={() => void testNow()}
          >
            {testing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Testar agora
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {httpBadge(localHttp, localVeredicto) ?? (
          <span className="inline-flex items-center gap-1">
            <Minus className="size-3" /> Sem teste HTTP
          </span>
        )}
        {localTestadoEm ? (
          <span>testado {formatRelativeBr(localTestadoEm)}</span>
        ) : null}
        {item.conferido && item.conferido_em ? (
          <span>
            Conferido por {item.conferido.nome || item.conferido.email} em{" "}
            {formatDateTimeBr(item.conferido_em)}
          </span>
        ) : (
          <span>Ainda não conferido</span>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor={`obs-${item.id}`} className="text-xs">
          Observação
        </Label>
        <Textarea
          id={`obs-${item.id}`}
          rows={2}
          value={observacao}
          disabled={!canWrite}
          onChange={(e) => setObservacao(e.target.value)}
          onBlur={() => {
            if (canWrite && observacao !== (item.observacao ?? "")) {
              saveObservacao();
            }
          }}
          placeholder="Notas deste item"
        />
      </div>
    </article>
  );
}
