"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Settings } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { CommandPalette } from "@/components/layout/command-palette";
import { MasterCheckLogo } from "@/components/layout/mastercheck-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/auth";
import type { EventSearchItem } from "@/lib/events";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/eventos/novo", label: "Novo evento" },
] as const;

function initials(nome: string, email: string) {
  const base = nome.trim() || email;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function NavLinks({
  pathname,
  canManageUsers,
  onNavigate,
  className,
}: {
  pathname: string;
  canManageUsers: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      {canManageUsers ? (
        <Link
          href="/configuracoes"
          onClick={onNavigate}
          className={cn(
            "rounded-md px-2.5 py-2 text-sm transition-colors",
            pathname.startsWith("/configuracoes")
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          Configurações
        </Link>
      ) : null}
    </nav>
  );
}

export function AppHeader({
  profile,
  searchEvents,
}: {
  profile: Profile;
  searchEvents: EventSearchItem[];
}) {
  const pathname = usePathname();
  const canManageUsers = profile.role === "admin";
  const canWrite = profile.role === "admin" || profile.role === "operador";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>

      <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-2 px-4 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 sm:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="sr-only">MasterCheck</SheetTitle>
                <MasterCheckLogo size="md" />
              </SheetHeader>
              <NavLinks
                pathname={pathname}
                canManageUsers={canManageUsers}
                className="mt-4"
              />
              <SheetClose asChild>
                <Button type="button" variant="outline" className="mt-6 w-full">
                  Fechar
                </Button>
              </SheetClose>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="shrink-0 focus-visible:outline-none"
            aria-label="MasterCheck — início"
          >
            <MasterCheckLogo size="md" priority />
          </Link>
        </div>

        <NavLinks
          pathname={pathname}
          canManageUsers={canManageUsers}
          className="hidden sm:flex sm:flex-row sm:items-center sm:gap-1"
        />

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <CommandPalette
            events={searchEvents}
            canWrite={canWrite}
            canManageUsers={canManageUsers}
          />

          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Menu do usuário"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary/15 text-xs text-primary">
                    {initials(profile.nome, profile.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="space-y-0.5 font-normal">
                <p className="truncate text-sm font-medium">
                  {profile.nome || "Usuário"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.email}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {profile.role}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManageUsers ? (
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes">
                    <Settings className="size-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  void signOut();
                }}
              >
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
