import { z } from "zod";

export const updateLeadsSchema = z.object({
  eventId: z.string().uuid(),
  qtd: z.coerce
    .number({ message: "Informe um número" })
    .int("Use um número inteiro")
    .min(0, "Leads não pode ser negativo")
    .max(1_000_000, "Valor muito alto"),
});
