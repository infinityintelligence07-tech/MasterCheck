import {
  describeActivity,
  formatActivityRelative,
} from "@/lib/activity-format";
import type { ActivityEntry } from "@/lib/activity-log";
import { formatDateTimeBr } from "@/lib/dates";

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <aside className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Nenhuma atividade registrada ainda.
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-border bg-card p-4 shadow-none">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Atividade</h2>
      <ol className="relative space-y-0 border-l border-border pl-4">
        {entries.map((entry) => {
          const nome = entry.user?.nome || entry.user?.email || "Sistema";
          const first = nome.trim().split(/\s+/)[0] || "Alguém";
          return (
            <li key={entry.id} className="relative pb-4 last:pb-0">
              <span
                className="absolute -left-[1.28rem] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary"
                aria-hidden
              />
              <div className="space-y-0.5">
                <p className="text-sm text-foreground">
                  {describeActivity(entry)}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground/80">{first}</span>
                  {" · "}
                  <time
                    dateTime={entry.created_at}
                    title={formatDateTimeBr(entry.created_at)}
                  >
                    {formatActivityRelative(entry.created_at)}
                  </time>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
