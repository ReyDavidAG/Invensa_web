import { z } from "zod";

export const notificationTypes = [
  "low_stock",
  "cash_closing",
  "system",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

const typeEnum = z.enum(["low_stock", "cash_closing", "system"]);

export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: typeEnum,
  title: z.string(),
  body: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

// Input for system-triggered create (server-side only).
export const notificationCreateInputSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  type: typeEnum,
  title: z.string().min(1).max(200),
  body: z.string().max(1000).optional(),
  link: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type NotificationCreateInput = z.infer<
  typeof notificationCreateInputSchema
>;
