import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  savePaymentSettingsRecord,
  uploadPaymentQrFile,
} from "@/lib/payment-settings.server";

const paymentSettingsSchema = z.object({
  id: z.string().uuid().nullable(),
  bank_name: z.string().trim().min(1).max(255),
  account_name: z.string().trim().min(1).max(255),
  account_number: z.string().trim().min(1).max(255),
  application_fee: z.number().positive(),
  qr_code_url: z.string().url().nullable(),
  payment_instruction: z.string().max(4000),
  show_qr_code: z.boolean(),
  is_active: z.boolean(),
});

const uploadQrSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  // base64 (no data: prefix); ~2MB binary => ~2.8MB base64
  base64: z.string().min(8).max(4_000_000),
});

export const uploadPaymentQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uploadQrSchema.parse(input))
  .handler(async ({ data, context }) => uploadPaymentQrFile(context.userId, data));

export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => paymentSettingsSchema.parse(input))
  .handler(async ({ data, context }) => savePaymentSettingsRecord(context.userId, data));
