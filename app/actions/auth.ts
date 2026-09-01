"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, magicLinkSchema } from "@/lib/validations/auth";

export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }
  if (lower.includes("rate limit")) {
    return "Muitas tentativas. Aguarde um momento.";
  }
  return message || "Não foi possível autenticar.";
}

export async function signInWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, message: mapAuthError(error.message) };
  }

  const rawNext = String(formData.get("next") || "/");
  const next =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    rawNext !== "/signin" &&
    !rawNext.startsWith("/signin/")
      ? rawNext
      : "/";
  redirect(next);
}

export async function signInWithMagicLink(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "E-mail inválido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { ok: false, message: mapAuthError(error.message) };
  }

  return {
    ok: true,
    message: "Link mágico enviado. Confira sua caixa de entrada.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
