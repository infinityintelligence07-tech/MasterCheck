"use client";

import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { ImportCsvDialog } from "@/components/dashboard/import-csv-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { DashboardEvent, DashboardFilters } from "@/lib/dashboard";
import { downloadCsv, eventsToCsv } from "@/lib/csv";
import { EVENT_STATUS_LABELS, EVENT_STATUSES } from "@/lib/events-meta";
import type { Profile } from "@/lib/auth";

type Props = {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  operators: Profile[];
  canWrite: boolean;
  filteredEvents: DashboardEvent[];
  allEvents: DashboardEvent[];
};

export function DashboardFiltersBar({
  filters,
  onChange,
  operators,
  canWrite,
  filteredEvents,
  allEvents,
}: Props) {
  function patch(partial: Partial<DashboardFilters>) {
    onChange({ ...filters, ...partial });
  }

  function exportCsv() {
    if (filteredEvents.length === 0) {
      toast.error("Nenhum evento filtrado para exportar.");
      return;
    }
    const csv = eventsToCsv(filteredEvents);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`mastercheck-eventos-${stamp}.csv`, csv);
    toast.success(`${filteredEvents.length} eventos exportados.`);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/40 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1 space-y-1">
          <Label htmlFor="filter-q" className="text-xs">
            Buscar cidade/evento
          </Label>
          <Input
            id="filter-q"
            value={filters.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Curitiba, SP…"
            className="h-8"
          />
        </div>

        <div className="w-[160px] space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => patch({ status: value })}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {EVENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {EVENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px] space-y-1">
          <Label className="text-xs">Responsável</Label>
          <Select
            value={filters.responsavelId}
            onValueChange={(value) => patch({ responsavelId: value })}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {operators.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.nome || op.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filter-de" className="text-xs">
            De
          </Label>
          <Input
            id="filter-de"
            type="date"
            value={filters.de}
            onChange={(e) => patch({ de: e.target.value })}
            className="h-8 w-[140px]"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filter-ate" className="text-xs">
            Até
          </Label>
          <Input
            id="filter-ate"
            type="date"
            value={filters.ate}
            onChange={(e) => patch({ ate: e.target.value })}
            className="h-8 w-[140px]"
          />
        </div>

        <div className="flex h-8 items-center gap-2 rounded-md border border-border px-2">
          <Switch
            id="so-pendentes"
            checked={filters.soPendentes}
            onCheckedChange={(checked) => patch({ soPendentes: checked })}
          />
          <Label htmlFor="so-pendentes" className="text-xs">
            Só pendentes
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {canWrite ? (
          <Button asChild size="sm">
            <Link href="/eventos/novo">
              <Plus className="size-3.5" />
              Novo evento
            </Link>
          </Button>
        ) : null}
        <ImportCsvDialog
          canWrite={canWrite}
          existingEvents={allEvents.map((e) => ({
            id: e.id,
            cidade: e.cidade,
            data_evento: e.data_evento,
          }))}
        />
        <Button type="button" size="sm" variant="outline" onClick={exportCsv}>
          <Download className="size-3.5" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}
