import { z } from "zod";

/** Matches UUID format (8-4-4-4-12 hex) without enforcing RFC 4122 version bits. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accepts digits, dashes, spaces, and optional + prefix. */
const PHONE_PATTERN = /^[+\d][\d\s-]*$/;

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number is too short")
    .max(15, "Phone number is too long")
    .regex(PHONE_PATTERN, "Please enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
  problemDescription: z.string().min(1, "Problem description is required"),
  serviceTypeId: z.string().regex(UUID_PATTERN, "Please select a service type"),
  quotedPrice: z.coerce.number().min(0, "Price must be positive"),
  technicianId: z
    .string()
    .regex(UUID_PATTERN)
    .optional()
    .or(z.literal("")),
  scheduledAt: z.string().optional().or(z.literal("")),
  adminNotes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
