"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DeleteEventButtonProps = {
  eventId: string;
  eventName?: string;
  variant?: "button" | "icon";
};

export function DeleteEventButton({
  eventId,
  eventName,
  variant = "button",
}: DeleteEventButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const label = eventName
      ? `Excluir "${eventName}" permanentemente?`
      : "Excluir este evento permanentemente?";
    if (!window.confirm(label)) return;

    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (result && !result.ok) {
        toast.error(result.message ?? "Falha ao excluir.");
      }
    });
  }

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-md border-border/70 bg-muted/30 text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            disabled={pending}
            aria-label={
              eventName ? `Excluir ${eventName}` : "Excluir evento"
            }
            onClick={handleDelete}
          >
            <Trash2 className="size-[18px]" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Excluir evento</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={handleDelete}
    >
      {pending ? "Excluindo…" : "Excluir"}
    </Button>
  );
}
