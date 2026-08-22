import type { Tables } from "@/types/database";

type ChecklistItemLike = Pick<Tables<"checklist_items">, "status">;

export function checklistProgress(items: ChecklistItemLike[]) {
  const relevant = items.filter((i) => i.status !== "nao_aplica");
  const done = relevant.filter((i) => i.status === "ok").length;
  const total = relevant.length || items.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}
