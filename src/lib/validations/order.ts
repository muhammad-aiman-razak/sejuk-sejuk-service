import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  problemDescription: z.string().min(1, "Problem description is required"),
  serviceTypeId: z.string().uuid("Invalid service type"),
  quotedPrice: z.coerce.number().min(0, "Price must be positive"),
  technicianId: z.string().uuid().optional().or(z.literal("")),
  scheduledAt: z.string().optional().or(z.literal("")),
  adminNotes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
