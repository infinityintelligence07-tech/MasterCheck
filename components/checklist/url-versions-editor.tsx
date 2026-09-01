"use client";

import { useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUrlVersion,
  type UrlVersion,
} from "@/lib/url-versions";

type Props = {
  versions: UrlVersion[];
  onChange: (next: UrlVersion[]) => void;
  onCommit: (next: UrlVersion[]) => void;
  canWrite: boolean;
  pending?: boolean;
};

export function UrlVersionsEditor({
  versions,
  onChange,
  onCommit,
  canWrite,
  pending,
}: Props) {
  const latestRef = useRef(versions);
  latestRef.current = versions;

  function setVersions(next: UrlVersion[]) {
    latestRef.current = next;
    onChange(next);
  }

  function patch(index: number, partial: Partial<UrlVersion>) {
    setVersions(
      versions.map((version, i) =>
        i === index ? { ...version, ...partial } : version,
      ),
    );
  }

  function remove(index: number) {
    const next = versions.filter((_, i) => i !== index);
    setVersions(next);
    onCommit(next);
  }

  function add() {
    setVersions([
      ...versions,
      createUrlVersion({
        label: `Versão ${versions.length + 1}`,
        url: "",
      }),
    ]);
  }

  function commitLatest() {
    if (canWrite) onCommit(latestRef.current);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">Versões / páginas da LP</Label>
        {canWrite ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={pending || versions.length >= 20}
            onClick={add}
          >
            <Plus className="size-3.5" />
            Nova versão
          </Button>
        ) : null}
      </div>

      {versions.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
          Nenhuma versão cadastrada. Adicione a LP principal e variantes (A/B,
          tráfego, orgânico, etc.).
        </p>
      ) : (
        <ul className="space-y-2">
          {versions.map((version, index) => (
            <li
              key={version.id}
              className="grid gap-2 rounded-md border border-border bg-muted/20 p-2 sm:grid-cols-[140px_1fr_auto]"
            >
              <Input
                value={version.label}
                disabled={!canWrite || pending}
                placeholder="Nome (ex.: V1)"
                className="h-9"
                onChange={(e) => patch(index, { label: e.target.value })}
                onBlur={commitLatest}
                aria-label={`Nome da versão ${index + 1}`}
              />
              <Input
                value={version.url}
                disabled={!canWrite || pending}
                placeholder="https://"
                className="h-9"
                onChange={(e) => patch(index, { url: e.target.value })}
                onBlur={commitLatest}
                aria-label={`URL da versão ${index + 1}`}
              />
              {canWrite ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={pending}
                  aria-label={`Remover ${version.label || `versão ${index + 1}`}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">
        A primeira versão com URL válida é usada no teste HTTP. No dashboard,
        com 2+ versões, abrir/copiar mostra a lista.
      </p>
    </div>
  );
}
