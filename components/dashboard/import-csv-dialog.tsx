"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { importCsvRows } from "@/app/actions/csv";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  buildImportPreview,
  parseCsv,
  rowsToMapped,
  type CsvPreviewRow,
} from "@/lib/csv";
import { formatDateShort } from "@/lib/dates";

type ExistingEvent = {
  id: string;
  cidade: string;
  data_evento: string;
};

export function ImportCsvDialog({
  existingEvents,
  canWrite,
}: {
  existingEvents: ExistingEvent[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<CsvPreviewRow[]>([]);

  const summary = useMemo(() => {
    const criar = preview.filter((r) => r.action === "criar").length;
    const atualizar = preview.filter((r) => r.action === "atualizar").length;
    return { criar, atualizar };
  }, [preview]);

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseCsv(text);
      const { mapped, errors } = rowsToMapped(rows);
      setParseErrors(errors);
      setPreview(buildImportPreview(mapped, existingEvents));
      if (mapped.length === 0 && errors.length === 0) {
        toast.error("Nenhuma linha válida encontrada no CSV.");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function confirmImport() {
    if (preview.length === 0) {
      toast.error("Nada para importar.");
      return;
    }

    startTransition(async () => {
      const result = await importCsvRows({
        rows: preview.map((row) => ({
          action: row.action,
          existingEventId: row.existingEventId,
          nome: row.nome,
          cidade: row.cidade,
          uf: row.uf,
          data_evento: row.data_evento,
          qtd_leads: row.qtd_leads,
          urls: row.urls as Record<string, string | null>,
          statuses: row.statuses as Record<string, string>,
        })),
      });

      if (!result.ok) {
        toast.error(result.message ?? "Falha na importação.");
        return;
      }

      toast.success(result.message);
      setOpen(false);
      setPreview([]);
      setParseErrors([]);
      router.refresh();
    });
  }

  if (!canWrite) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPreview([]);
          setParseErrors([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Upload className="size-3.5" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
          <DialogDescription>
            Use o export da planilha atual. Eventos existentes são atualizados por
            cidade + data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />

          {parseErrors.length > 0 ? (
            <div className="rounded-md border border-status-erro/40 bg-status-erro/10 px-3 py-2 text-xs text-foreground">
              {parseErrors.slice(0, 5).map((err) => (
                <p key={err}>{err}</p>
              ))}
              {parseErrors.length > 5 ? (
                <p>…e mais {parseErrors.length - 5} erros.</p>
              ) : null}
            </div>
          ) : null}

          {preview.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Preview: {summary.criar} criar · {summary.atualizar} atualizar
              </p>
              <div className="max-h-64 overflow-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr className="border-b border-border text-left">
                      <th className="px-2 py-1.5">Ação</th>
                      <th className="px-2 py-1.5">Evento</th>
                      <th className="px-2 py-1.5">Data</th>
                      <th className="px-2 py-1.5">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr
                        key={`${row.cidade}-${row.data_evento}-${row.nome}`}
                        className="border-b border-border/60"
                      >
                        <td className="px-2 py-1.5">
                          <Badge
                            variant={
                              row.action === "criar" ? "default" : "secondary"
                            }
                          >
                            {row.action}
                          </Badge>
                        </td>
                        <td className="px-2 py-1.5">
                          {row.nome}
                          <span className="block text-muted-foreground">
                            {row.cidade}/{row.uf}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatDateShort(row.data_evento)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {row.qtd_leads}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={pending || preview.length === 0}
            onClick={confirmImport}
          >
            {pending ? "Importando…" : "Confirmar importação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
