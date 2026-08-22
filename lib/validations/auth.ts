import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .email("E-mail inválido"),
  password: z.string().min(6, "Senha com pelo menos 6 caracteres"),
});

export const magicLinkSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .email("E-mail inválido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
