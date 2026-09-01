import type { ItemStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LEGEND: Array<{ status: ItemStatus; label: string; color: string }> = [
  { status: "pendente", label: "Pendente", color: "bg-status-pendente" },
  { status: "ok", label: "OK", color: "bg-status-ok" },
  { status: "erro", label: "Erro", color: "bg-status-erro" },
  { status: "nao_aplica", label: "N/A", color: "bg-status-na" },
];

export function StatusLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground",
        className,
      )}
      role="list"
      aria-label="Legenda de status do checklist"
    >
      <span className="font-medium text-foreground/80">Legenda:</span>
      {LEGEND.map((item) => (
        <span
          key={item.status}
          role="listitem"
          className="inline-flex items-center gap-1.5"
        >
          <span
            className={cn("size-2.5 shrink-0 rounded-full", item.color)}
            aria-hidden
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
