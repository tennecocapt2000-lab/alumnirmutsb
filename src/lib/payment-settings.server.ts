import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PaymentSettingsInput = {
  id: string | null;
  bank_name: string;
  account_name: string;
  account_number: string;
  application_fee: number;
  qr_code_url: string | null;
  payment_instruction: string;
  show_qr_code: boolean;
  is_active: boolean;
};

export type UploadPaymentQrInput = {
  filename: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
};

export async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการ");
  }
}

export async function uploadPaymentQrFile(userId: string, data: UploadPaymentQrInput) {
  await assertAdmin(userId);

  const ext =
    data.contentType === "image/jpeg"
      ? "jpg"
      : data.contentType === "image/webp"
        ? "webp"
        : "png";
  const path = `qr-${crypto.randomUUID()}.${ext}`;

  const binary = atob(data.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("payment-qr")
    .upload(path, bytes, {
      upsert: false,
      contentType: data.contentType,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrl } = supabaseAdmin.storage.from("payment-qr").getPublicUrl(path);

  return { url: publicUrl.publicUrl, path };
}

export async function savePaymentSettingsRecord(userId: string, data: PaymentSettingsInput) {
  await assertAdmin(userId);

  const payload = {
    bank_name: data.bank_name.trim(),
    account_name: data.account_name.trim(),
    account_number: data.account_number.trim(),
    application_fee: data.application_fee,
    qr_code_url: data.qr_code_url,
    payment_instruction: data.payment_instruction.trim(),
    show_qr_code: data.show_qr_code,
    is_active: data.is_active,
    updated_by: userId,
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

    if (error) {
      throw new Error(error.message);
    }

    return updated;
  }

  const { data: created, error } = await supabaseAdmin
    .from("payment_settings")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return created;
}