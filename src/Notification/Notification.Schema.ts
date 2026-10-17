import { z } from "zod";

// L-31: `unread=1` trae solo las no leídas; `cursor` (el `next` de la página anterior) sigue la lista.
export const listNotificationsSchema = z.object({
  query: z.object({
    unread: z.enum(['0', '1']).optional(),
    cursor: z.string().max(100).optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID de notificación inválido"),
  }),
});
