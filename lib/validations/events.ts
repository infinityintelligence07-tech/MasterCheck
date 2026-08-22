import { z } from "zod";
import { CHECKLIST_TIPOS, EVENT_STATUSES } from "@/lib/constants";
import { UFS_BRASIL } from "@/lib/events-meta";

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.union([z.null(), z.string().url("URL inválida")]))
  .optional();

const checklistUrlsSchema = z.object(
  Object.fromEntries(CHECKLIST_TIPOS.map((tipo) => [tipo, optionalUrl])) as Record<
    (typeof CHECKLIST_TIPOS)[number],
    typeof optionalUrl
  >,
);

export const eventFormSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do evento").max(120),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  uf: z.enum(UFS_BRASIL, { message: "UF inválida" }),
  data_evento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  hora_evento: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z.union([
        z.null(),
        z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:mm)"),
      ]),
    )
    .optional(),
  status: z.enum(EVENT_STATUSES),
  responsavel_id: z
    .string()
    .uuid("Responsável inválido")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  observacoes: z
    .string()
    .trim()
    .max(5000)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  urls: checklistUrlsSchema.optional(),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;

export const updateEventSchema = eventFormSchema;

export const duplicateEventSchema = z.object({
  event_id: z.string().uuid(),
  nome: z.string().trim().min(2).max(120),
  cidade: z.string().trim().min(2).max(80),
  uf: z.enum(UFS_BRASIL),
  data_evento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_evento: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z.union([
        z.null(),
        z.string().regex(/^\d{2}:\d{2}$/),
      ]),
    )
    .optional(),
});
