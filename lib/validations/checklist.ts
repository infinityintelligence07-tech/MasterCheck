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

const urlVersionSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().url("URL inválida"),
});

export const checklistUrlVersionsSchema = z.object({
  itemId: z.string().uuid(),
  versions: z.array(urlVersionSchema).max(20),
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
