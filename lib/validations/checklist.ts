import { z } from "zod";
import { ITEM_STATUSES } from "@/lib/constants";

export const checklistStatusSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(ITEM_STATUSES),
});

export const checklistUrlSchema = z.object({
  itemId: z.string().uuid(),
  url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.union([z.null(), z.string().url("URL inválida")])),
});

export const checklistObservacaoSchema = z.object({
  itemId: z.string().uuid(),
  observacao: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export const testLinkSchema = z.object({
  itemId: z.string().uuid(),
});
