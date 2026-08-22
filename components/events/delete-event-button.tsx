"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Excluir este evento permanentemente?")) return;
        startTransition(async () => {
          const result = await deleteEvent(eventId);
          if (result && !result.ok) {
            toast.error(result.message ?? "Falha ao excluir.");
          }
        });
      }}
    >
      {pending ? "Excluindo…" : "Excluir"}
    </Button>
  );
}
