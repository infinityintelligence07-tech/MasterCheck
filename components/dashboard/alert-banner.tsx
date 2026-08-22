import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { AlertItem } from "@/lib/dashboard";

export function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const when =
          alert.days === 0
            ? "hoje"
            : alert.days === 1
              ? "em 1 dia"
              : `em ${alert.days} dias`;
        return (
          <Link
            key={alert.eventId}
            href={`/eventos/${alert.eventId}`}
            className="flex items-start gap-2 rounded-lg border border-status-erro/40 bg-status-erro/10 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-status-erro/15"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-erro" />
            <span>
              ⚠️ {alert.nome} acontece {when} e tem {alert.pendentes}{" "}
              {alert.pendentes === 1 ? "item pendente" : "itens pendentes"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
