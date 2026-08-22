import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className="mb-3 size-10 text-muted-foreground/70"
          aria-hidden
        />
      ) : null}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
