"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { testChecklistLink } from "@/app/actions/checklist";
import { ChecklistItemCard } from "@/components/checklist/checklist-item-card";
import { Button } from "@/components/ui/button";
import { checklistProgress } from "@/lib/checklist-progress";
import type { EventWithRelations } from "@/lib/events";

export function ChecklistPanel({
  items,
  canWrite,
}: {
  eventId: string;
  items: EventWithRelations["checklist_items"];
  canWrite: boolean;
}) {
  const router = useRouter();
  const progress = useMemo(() => checklistProgress(items), [items]);
  const [pending, startTransition] = useTransition();
  const [batchProgress, setBatchProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  function testAll() {
    if (!canWrite) return;
    const withUrl = items.filter((i) => i.url);
    if (withUrl.length === 0) {
      toast.error("Nenhum item com URL para testar.");
      return;
    }

    startTransition(async () => {
      setBatchProgress({ done: 0, total: withUrl.length });
      let done = 0;

      const settled = await Promise.allSettled(
        withUrl.map(async (item) => {
          const result = await testChecklistLink(item.id);
          done += 1;
          setBatchProgress({ done, total: withUrl.length });
          return result;
        }),
      );

      const okCount = settled.filter(
        (s) => s.status === "fulfilled" && s.value.ok,
      ).length;

      setBatchProgress(null);
      toast.success(`Teste em lote: ${okCount}/${withUrl.length} concluídos.`);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Checklist</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {progress.done}/{progress.total} · {progress.percent}% · o teste HTTP
            não marca como conferido
          </p>
        </div>
        {canWrite ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={testAll}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {batchProgress
              ? `Testando ${batchProgress.done}/${batchProgress.total}`
              : "Testar todos os links"}
          </Button>
        ) : null}
      </div>

      <div className="mb-1 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-150"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <ChecklistItemCard key={item.id} item={item} canWrite={canWrite} />
        ))}
      </div>
    </section>
  );
}
