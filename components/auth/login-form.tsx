"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  signInWithMagicLink,
  signInWithPassword,
  type AuthActionState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const initialState: AuthActionState = { ok: false };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");

  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    initialState,
  );

  useEffect(() => {
    if (authError === "auth") {
      toast.error("Falha ao confirmar o link. Tente novamente.");
    }
  }, [authError]);

  useEffect(() => {
    if (passwordState.message && !passwordState.ok) {
      toast.error(passwordState.message);
    }
  }, [passwordState]);

  useEffect(() => {
    if (magicState.message) {
      if (magicState.ok) toast.success(magicState.message);
      else toast.error(magicState.message);
    }
  }, [magicState]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@iamtreinamentos.com.br"
          className="h-9"
        />
      </div>

      <form action={passwordAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="email" value={email} />
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-9"
          />
          {passwordState.fieldErrors?.password?.[0] ? (
            <p className="text-xs text-destructive">
              {passwordState.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={passwordPending || !email}
        >
          {passwordPending ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>

      <form action={magicAction}>
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={magicPending || !email}
        >
          {magicPending ? "Enviando…" : "Receber link mágico"}
        </Button>
      </form>
    </div>
  );
}
