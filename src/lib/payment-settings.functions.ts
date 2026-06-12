import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการ");
  }
  return supabaseAdmin;
}

export const uploadPaymentQr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uploadQrSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);

    const ext =
      data.contentType === "image/jpeg"
        ? "jpg"
        : data.contentType === "image/webp"
        ? "webp"
        : "png";
    const path = `qr-${crypto.randomUUID()}.${ext}`;

    // decode base64 to Uint8Array (Worker-safe)
    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { error: upErr } = await supabaseAdmin.storage
      .from("payment-qr")
      .upload(path, bytes, {
        upsert: false,
        contentType: data.contentType,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabaseAdmin.storage
      .from("payment-qr")
      .getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });

export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => paymentSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);

    const payload = {
      bank_name: data.bank_name.trim(),
      account_name: data.account_name.trim(),
      account_number: data.account_number.trim(),
      application_fee: data.application_fee,
      qr_code_url: data.qr_code_url,
      payment_instruction: data.payment_instruction.trim(),
      show_qr_code: data.show_qr_code,
      is_active: data.is_active,
      updated_by: context.userId,
    };

    if (data.is_active) {
      const deactivateQuery = supabaseAdmin
        .from("payment_settings")
        .update({ is_active: false })
        .eq("is_active", true);

      const { error: deactivateError } = data.id
        ? await deactivateQuery.neq("id", data.id)
        : await deactivateQuery;

      if (deactivateError) {
        throw new Error(deactivateError.message);
      }
    }

    if (data.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("payment_settings")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return updated;
    }

    const { data: created, error } = await supabaseAdmin
      .from("payment_settings")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return created;
  });
