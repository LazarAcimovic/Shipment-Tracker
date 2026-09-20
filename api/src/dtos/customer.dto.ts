import { z } from "zod";

export const listCustomersSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export type ListCustomersQuery = z.infer<typeof listCustomersSchema>;
