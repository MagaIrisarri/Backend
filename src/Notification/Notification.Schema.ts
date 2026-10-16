import { z } from "zod";

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de notificación inválido"),
  }),
});
