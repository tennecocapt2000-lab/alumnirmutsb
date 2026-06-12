import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Upload, ChevronLeft, QrCode, Save } from "lucide-react";

export const Route = createFileRoute("/admin/payment-settings")({
  head: () => ({ meta: [{ title: "ตั้งค่าการชำระเงิน — แอดมิน" }] }),
  component: PaymentSettingsPage,
});

type Settings = {
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

const initial: Settings = {
  id: null,
  bank_name: "",
  account_name: "",
  account_number: "",
  application_fee: 200,
  qr_code_url: null,
  payment_instruction: "กรุณาโอนเงินและแนบสลิปเพื่อให้แอดมินตรวจสอบ",
  show_qr_code: true,
  is_active: true,
};

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function PaymentSettingsPage() {
  const navigate = useNavigate();
  const admin = useAdmin();
  const saveSettings = useServerFn(savePaymentSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Settings>(initial);

  useEffect(() => {
    if (!admin.loading && !admin.isAdmin) navigate({ to: "/admin/login" });
  }, [admin, navigate]);

  useEffect(() => {
    if (admin.loading || !admin.isAdmin) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast.error("โหลดข้อมูลไม่สำเร็จ");
      } else if (data) {
        setForm({
          id: data.id,
          bank_name: data.bank_name ?? "",
          account_name: data.account_name ?? "",
          account_number: data.account_number ?? "",
          application_fee: Number(data.application_fee ?? 200),
          qr_code_url: data.qr_code_url ?? null,
          payment_instruction: data.payment_instruction ?? "",
          show_qr_code: !!data.show_qr_code,
          is_active: !!data.is_active,
        });
      }
      setLoading(false);
    })();
  }, [admin.loading, admin.isAdmin]);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  async function onUploadQr(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ jpg, png, webp");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `qr-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-qr")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("payment-qr").getPublicUrl(path);
      update("qr_code_url", data.publicUrl);
      toast.success("อัปโหลด QR Code สำเร็จ");
    } catch (e) {
      console.error(e);
      toast.error("อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (saving) return;
    if (!form.bank_name.trim() || !form.account_name.trim() || !form.account_number.trim()) {
      toast.error("กรุณากรอกชื่อธนาคาร ชื่อบัญชี และเลขบัญชี");
      return;
    }
    if (!Number.isFinite(form.application_fee) || form.application_fee <= 0) {
      toast.error("กรุณาระบุจำนวนเงินค่าสมัครที่ถูกต้องที่");
      return;
    }
    setSaving(true);
    const timeoutId = setTimeout(() => {
      setSaving((s) => {
        if (s) toast.error("หมดเวลาเชื่อมต่อ กรุณาลองใหม่");
        return false;
      });
    }, 20000);

    try {
      const saved = await saveSettings({
        data: {
          id: form.id,
          bank_name: form.bank_name.trim(),
          account_name: form.account_name.trim(),
          account_number: form.account_number.trim(),
          application_fee: form.application_fee,
          qr_code_url: form.qr_code_url,
          payment_instruction: form.payment_instruction,
          show_qr_code: form.show_qr_code,
          is_active: form.is_active,
        },
      });

      setForm({
        id: saved.id,
        bank_name: saved.bank_name ?? "",
        account_name: saved.account_name ?? "",
        account_number: saved.account_number ?? "",
        application_fee: Number(saved.application_fee ?? 200),
        qr_code_url: saved.qr_code_url ?? null,
        payment_instruction: saved.payment_instruction ?? "",
        show_qr_code: !!saved.show_qr_code,
        is_active: !!saved.is_active,
      });

      clearTimeout(timeoutId);
      toast.success("บันทึกสำเร็จ");
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error("[payment-settings] save error", e);
      toast.error(e?.message || e?.error_description || "บันทึกไม่สำเร็จ");
    } finally {
      clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  if (admin.loading || !admin.isAdmin) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> กลับหน้าหลัก
          </Link>
          <h1 className="text-base font-semibold">ตั้งค่าการชำระเงิน</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">ข้อมูลบัญชีรับชำระเงิน</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ข้อมูลนี้จะแสดงในขั้นตอนชำระเงินของผู้สมัคร
            </p>

            {loading ? (
              <div className="mt-5 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Field label="ชื่อธนาคาร" required>
                  <input className={inputCls} value={form.bank_name} onChange={(e) => update("bank_name", e.target.value)} />
                </Field>
                <Field label="ชื่อบัญชี" required>
                  <input className={inputCls} value={form.account_name} onChange={(e) => update("account_name", e.target.value)} />
                </Field>
                <Field label="เลขที่บัญชี" required>
                  <input className={inputCls} value={form.account_number} onChange={(e) => update("account_number", e.target.value)} />
                </Field>
                <Field label="จำนวนเงินค่าสมัคร (บาท)" required>
                  <input
                    type="number" min={0} step="1"
                    className={inputCls}
                    value={form.application_fee}
                    onChange={(e) => update("application_fee", Number(e.target.value))}
                  />
                </Field>
                <Field label="ข้อความแนะนำการชำระเงิน">
                  <textarea
                    rows={3} className={inputCls}
                    value={form.payment_instruction}
                    onChange={(e) => update("payment_instruction", e.target.value)}
                  />
                </Field>

                <Field label="QR Code สำหรับรับชำระเงิน">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground hover:bg-accent">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span>{uploading ? "กำลังอัปโหลด..." : "เลือกรูป QR (jpg, png, webp ≤2MB)"}</span>
                      <input
                        type="file" accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onUploadQr(f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {form.qr_code_url && (
                      <img src={form.qr_code_url} alt="QR Preview" loading="lazy" className="h-32 w-32 rounded-md border object-contain" />
                    )}
                  </div>
                </Field>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.show_qr_code} onChange={(e) => update("show_qr_code", e.target.checked)} />
                    แสดง QR Code ในหน้าผู้สมัคร
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
                    เปิดใช้งานเป็นบัญชีปัจจุบัน
                  </label>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            )}
          </section>

          {/* Preview */}
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">ตัวอย่างที่ผู้สมัครจะเห็น</h2>
            <p className="mt-1 text-sm text-muted-foreground">Preview แบบเรียลไทม์</p>

            <div className="mt-5 rounded-lg border bg-accent/30 p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">โอนเงินค่าสมัคร</div>
              <div className="mt-2 text-2xl font-bold text-primary">
                {form.application_fee.toLocaleString("th-TH")} บาท
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div><span className="text-muted-foreground">ธนาคาร: </span><span className="font-medium">{form.bank_name || "-"}</span></div>
                <div><span className="text-muted-foreground">ชื่อบัญชี: </span><span className="font-medium">{form.account_name || "-"}</span></div>
                <div><span className="text-muted-foreground">เลขที่บัญชี: </span><span className="font-medium">{form.account_number || "-"}</span></div>
              </div>
              {form.show_qr_code && form.qr_code_url && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <img src={form.qr_code_url} alt="QR Code" loading="lazy" className="h-48 w-48 rounded-md border bg-white object-contain p-2" />
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <QrCode className="h-3 w-3" /> สแกนเพื่อชำระเงิน
                  </div>
                </div>
              )}
              {form.payment_instruction && (
                <p className="mt-4 rounded-md bg-background/60 p-3 text-sm text-muted-foreground">
                  {form.payment_instruction}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}
