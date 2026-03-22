import { z } from "zod";

export const createServiceReportSchema = z.object({
  workDone: z.string().min(1, "Work description is required"),
  extraCharges: z.coerce.number().min(0, "Extra charges must be 0 or more"),
  remarks: z.string().optional(),
  paymentAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z
    .enum(["cash", "bank_transfer", "card", "ewallet"])
    .optional(),
});

export type CreateServiceReportInput = z.infer<
  typeof createServiceReportSchema
>;
