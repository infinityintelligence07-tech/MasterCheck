"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { formatDateShort } from "@/lib/dates";
import type { EventSearchItem } from "@/lib/events";
import { cn } from "@/lib/utils";

type CommandPaletteProps = {
  events: EventSearchItem[];
  canWrite: boolean;
  canManageUsers: boolean;
  className?: string;
};

export function CommandPalette({
  events,
  canWrite,
  canManageUsers,
  className,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "hidden h-8 max-w-[220px] flex-1 justify-start gap-2 border-border/80 bg-muted/30 px-2.5 text-muted-foreground sm:flex lg:max-w-xs",
          className,
        )}
        onClick={() => setOpen(true)}
        aria-label="Abrir busca rápida"
      >
        <Search className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate text-xs">Buscar eventos...</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline">
          Ctrl+K
        </kbd>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
      >
        <Search className="size-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Busca rápida"
        description="Navegue pelo MasterCheck ou encontre um evento"
      >
        <Command>
          <CommandInput placeholder="Evento, cidade ou comando..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

            <CommandGroup heading="Navegação">
              <CommandItem onSelect={() => navigate("/")}>
                <LayoutDashboard />
                Dashboard
              </CommandItem>
              {canWrite ? (
                <CommandItem onSelect={() => navigate("/eventos/novo")}>
                  <Plus />
                  Novo evento
                </CommandItem>
              ) : null}
              {canManageUsers ? (
                <CommandItem onSelect={() => navigate("/configuracoes")}>
                  <Settings />
                  Configurações
                </CommandItem>
              ) : null}
            </CommandGroup>

            {events.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Eventos">
                  {events.map((event) => (
                    <CommandItem
                      key={event.id}
                      value={`${event.nome} ${event.cidade} ${event.uf} ${formatDateShort(event.data_evento)}`}
                      onSelect={() => navigate(`/eventos/${event.id}`)}
                    >
                      <Calendar />
                      <span className="min-w-0 truncate">
                        {event.cidade}/{event.uf} — {event.nome}
                      </span>
                      <CommandShortcut>
                        {formatDateShort(event.data_evento)}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
