"use client";

import { useMemo, useState } from "react";
import { CalendarOff, FilterX } from "lucide-react";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { DashboardFiltersBar } from "@/components/dashboard/dashboard-filters";
import { EventsDataTable } from "@/components/dashboard/events-data-table";
import { EventsMobileList } from "@/components/dashboard/events-mobile-list";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { EmptyState } from "@/components/ui/empty-state";
import type { Profile } from "@/lib/auth";
import {
  buildAlerts,
  buildSummary,
  emptyFilters,
  filterEvents,
  type DashboardEvent,
  type DashboardFilters,
} from "@/lib/dashboard";

function filtersActive(filters: DashboardFilters) {
  return (
    filters.q !== emptyFilters.q ||
    filters.status !== emptyFilters.status ||
    filters.responsavelId !== emptyFilters.responsavelId ||
    filters.de !== emptyFilters.de ||
    filters.ate !== emptyFilters.ate ||
    filters.soPendentes !== emptyFilters.soPendentes
  );
}

export function DashboardView({
  events,
  operators,
  canWrite,
  isAdmin,
}: {
  events: DashboardEvent[];
  operators: Profile[];
  canWrite: boolean;
  isAdmin: boolean;
}) {
  const [filters, setFilters] = useState<DashboardFilters>(emptyFilters);

  const filtered = useMemo(
    () => filterEvents(events, filters),
    [events, filters],
  );
  const alerts = useMemo(() => buildAlerts(events), [events]);
  const summary = useMemo(() => buildSummary(events), [events]);
  const hasActiveFilters = filtersActive(filters);

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Conferência das MasterClasses — status, leads e links em uma grade.
          </p>
        </div>
        <EmptyState
          icon={CalendarOff}
          title="Nenhum evento cadastrado"
          description="Crie o primeiro MasterClass para começar a conferência de links e leads."
          action={
            canWrite
              ? { label: "Novo evento", href: "/eventos/novo" }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Conferência das MasterClasses — status, leads e links em uma grade.
        </p>
      </div>

      <AlertBanner alerts={alerts} />
      <SummaryCards summary={summary} />
      <DashboardFiltersBar
        filters={filters}
        onChange={setFilters}
        operators={operators}
        canWrite={canWrite}
        filteredEvents={filtered}
        allEvents={events}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FilterX}
          title="Nenhum evento com esses filtros"
          description="Ajuste os filtros ou limpe a busca para ver todos os eventos."
          secondaryAction={
            hasActiveFilters
              ? {
                  label: "Limpar filtros",
                  onClick: () => setFilters(emptyFilters),
                }
              : undefined
          }
        />
      ) : (
        <>
          <EventsDataTable
            data={filtered}
            canWrite={canWrite}
            isAdmin={isAdmin}
          />
          <EventsMobileList data={filtered} canWrite={canWrite} />
        </>
      )}
    </div>
  );
}
