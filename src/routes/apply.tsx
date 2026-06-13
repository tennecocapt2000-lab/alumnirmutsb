import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Upload, Loader2, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentSettings = {
  bank_name: string;
  account_name: string;
  account_number: string;
  application_fee: number;
  qr_code_url: string | null;
  payment_instruction: string | null;
  show_qr_code: boolean;
};

export const Route = createFileRoute("/apply")({
  head: () => ({ meta: [{ title: "สมัครสมาชิก — สมาคมศิษย์เก่า" }] }),
  component: ApplyPage,
});

const steps = ["ข้อมูลส่วนตัว", "ที่อยู่", "การศึกษา", "ชำระเงิน", "ตรวจสอบ"];

type FormState = {
  prefix: string;
  full_name: string;
  birth_date: string;
  phone: string;
  current_house_no: string; current_moo: string; current_soi: string; current_road: string;
  current_subdistrict: string; current_district: string; current_province: string; current_postal_code: string;
  work_house_no: string; work_moo: string; work_soi: string; work_road: string;
  work_subdistrict: string; work_district: string; work_province: string; work_postal_code: string; work_phone: string;
  education_level: string; student_id: string; enrollment_year: string; major: string; study_period: string;
  friend_1: string; friend_2: string;
  payment_date: string; note: string;
};

const init: FormState = {
  prefix: "นาย", full_name: "", birth_date: "", phone: "",
  current_house_no: "", current_moo: "", current_soi: "", current_road: "",
  current_subdistrict: "", current_district: "", current_province: "", current_postal_code: "",
  work_house_no: "", work_moo: "", work_soi: "", work_road: "",
  work_subdistrict: "", work_district: "", work_province: "", work_postal_code: "", work_phone: "",
  education_level: "ปริญญาตรี", student_id: "", enrollment_year: "", major: "", study_period: "เช้า",
  friend_1: "", friend_2: "",
  payment_date: "", note: "",
};

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

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function ApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(init);
  const [slip, setSlip] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentError, setPaymentError] = useState(false);

  useEffect(() => {
    (async () => {
      setPaymentLoading(true);
      const { data, error } = await supabase
        .from("payment_settings")
        .select("bank_name,account_name,account_number,application_fee,qr_code_url,payment_instruction,show_qr_code")
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) {
        setPaymentError(true);
      } else {
        setPayment({
          bank_name: data.bank_name,
          account_name: data.account_name,
          account_number: data.account_number,
          application_fee: Number(data.application_fee),
          qr_code_url: data.qr_code_url,
          payment_instruction: data.payment_instruction,
          show_qr_code: !!data.show_qr_code,
        });
      }
      setPaymentLoading(false);
    })();
  }, []);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((s) => ({ ...s, [k]: v }));

  function canNext(): boolean {
    if (step === 0) return form.full_name.trim().length > 0 && form.phone.trim().length >= 9;
    if (step === 1) return form.current_province.trim().length > 0;
    if (step === 2) return form.education_level.trim().length > 0;
    if (step === 3) return !!slip && !!form.payment_date;
    return true;
  }

  async function submit() {
    if (!slip || !form.payment_date) {
      toast.error("กรุณาแนบสลิปและระบุวันที่โอนเงิน");
      setStep(3);
      return;
    }
    setSubmitting(true);
    try {
      const ext = slip.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-slips").upload(path, slip, { upsert: false });
      if (upErr) throw upErr;

      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        payment_date: form.payment_date || null,
        payment_amount: payment?.application_fee ?? 200,
        payment_slip_url: path,
        payment_bank_name: payment?.bank_name ?? null,
        payment_account_name: payment?.account_name ?? null,
        payment_account_number: payment?.account_number ?? null,
        payment_qr_code_url: payment?.qr_code_url ?? null,
        status: "pending",
      };
      const { data, error } = await supabase.from("applications").insert(payload).select("id").single();
      if (error) throw error;
      toast.success("ส่งใบสมัครเรียบร้อยแล้ว");
      navigate({ to: "/status", search: { q: form.phone, id: data.id } as never });
    } catch (e) {
      console.error(e);
      toast.error("ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">แบบฟอร์มสมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-muted-foreground">กรอกข้อมูลให้ครบถ้วนเพื่อสมัครเป็นสมาชิกสมาคม</p>

        {/* Mobile step indicator */}
        <p className="mt-4 text-sm font-medium text-primary sm:hidden">
          ขั้นที่ {step + 1}/{steps.length}: {steps[step]}
        </p>

        {/* Stepper */}
        <ol className="mt-4 grid grid-cols-5 gap-2 sm:mt-6">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-col items-center text-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold sm:h-9 sm:w-9 ${i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`mt-1 hidden text-xs sm:block ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm sm:p-7">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="คำนำหน้า" required>
                <select className={inputCls} value={form.prefix} onChange={(e) => update("prefix", e.target.value)}>
                  <option>นาย</option><option>นาง</option><option>นางสาว</option>
                </select>
              </Field>
              <Field label="ชื่อ-นามสกุล" required>
                <input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
              </Field>
              <Field label="วัน/เดือน/ปีเกิด">
                <input type="date" className={inputCls} value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
              </Field>
              <Field label="โทรศัพท์" required>
                <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08x-xxx-xxxx" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-3 text-lg font-semibold">ที่อยู่ปัจจุบัน</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="บ้านเลขที่"><input className={inputCls} value={form.current_house_no} onChange={(e) => update("current_house_no", e.target.value)} /></Field>
                  <Field label="หมู่ที่"><input className={inputCls} value={form.current_moo} onChange={(e) => update("current_moo", e.target.value)} /></Field>
                  <Field label="ซอย"><input className={inputCls} value={form.current_soi} onChange={(e) => update("current_soi", e.target.value)} /></Field>
                  <Field label="ถนน"><input className={inputCls} value={form.current_road} onChange={(e) => update("current_road", e.target.value)} /></Field>
                  <Field label="แขวง/ตำบล"><input className={inputCls} value={form.current_subdistrict} onChange={(e) => update("current_subdistrict", e.target.value)} /></Field>
                  <Field label="เขต/อำเภอ"><input className={inputCls} value={form.current_district} onChange={(e) => update("current_district", e.target.value)} /></Field>
                  <Field label="จังหวัด" required><input className={inputCls} value={form.current_province} onChange={(e) => update("current_province", e.target.value)} /></Field>
                  <Field label="รหัสไปรษณีย์"><input className={inputCls} value={form.current_postal_code} onChange={(e) => update("current_postal_code", e.target.value)} /></Field>
                </div>
              </div>
              <div>
                <h2 className="mb-3 text-lg font-semibold">ที่ทำงาน <span className="text-sm font-normal text-muted-foreground">(ถ้ามี)</span></h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="เลขที่"><input className={inputCls} value={form.work_house_no} onChange={(e) => update("work_house_no", e.target.value)} /></Field>
                  <Field label="หมู่ที่"><input className={inputCls} value={form.work_moo} onChange={(e) => update("work_moo", e.target.value)} /></Field>
                  <Field label="ซอย"><input className={inputCls} value={form.work_soi} onChange={(e) => update("work_soi", e.target.value)} /></Field>
                  <Field label="ถนน"><input className={inputCls} value={form.work_road} onChange={(e) => update("work_road", e.target.value)} /></Field>
                  <Field label="แขวง/ตำบล"><input className={inputCls} value={form.work_subdistrict} onChange={(e) => update("work_subdistrict", e.target.value)} /></Field>
                  <Field label="เขต/อำเภอ"><input className={inputCls} value={form.work_district} onChange={(e) => update("work_district", e.target.value)} /></Field>
                  <Field label="จังหวัด"><input className={inputCls} value={form.work_province} onChange={(e) => update("work_province", e.target.value)} /></Field>
                  <Field label="รหัสไปรษณีย์"><input className={inputCls} value={form.work_postal_code} onChange={(e) => update("work_postal_code", e.target.value)} /></Field>
                  <Field label="โทรศัพท์ที่ทำงาน"><input className={inputCls} value={form.work_phone} onChange={(e) => update("work_phone", e.target.value)} /></Field>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ระดับการศึกษา" required>
                <select className={inputCls} value={form.education_level} onChange={(e) => update("education_level", e.target.value)}>
                  <option>ปวช.</option><option>ปวส.</option><option>ปริญญาตรี</option><option>ปริญญาโท</option><option>ปริญญาเอก</option>
                </select>
              </Field>
              <Field label="เลขประจำตัวนักศึกษา">
                <input className={inputCls} value={form.student_id} onChange={(e) => update("student_id", e.target.value)} />
              </Field>
              <Field label="ปีที่เข้าเรียน">
                <input className={inputCls} value={form.enrollment_year} onChange={(e) => update("enrollment_year", e.target.value)} placeholder="พ.ศ." />
              </Field>
              <Field label="สาขาวิชา">
                <input className={inputCls} value={form.major} onChange={(e) => update("major", e.target.value)} />
              </Field>
              <Field label="รอบ/ภาคการศึกษา">
                <select className={inputCls} value={form.study_period} onChange={(e) => update("study_period", e.target.value)}>
                  <option>เช้า</option><option>บ่าย</option><option>สมทบ</option>
                </select>
              </Field>
              <Field label="เพื่อนร่วมรุ่นที่ติดต่อได้ 1">
                <input className={inputCls} value={form.friend_1} onChange={(e) => update("friend_1", e.target.value)} />
              </Field>
              <Field label="เพื่อนร่วมรุ่นที่ติดต่อได้ 2">
                <input className={inputCls} value={form.friend_2} onChange={(e) => update("friend_2", e.target.value)} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {paymentLoading ? (
                <div className="rounded-lg border bg-accent/30 p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-3 h-8 w-40" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="mt-4 h-40 w-40" />
                </div>
              ) : paymentError || !payment ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
                  ยังไม่ได้ตั้งค่าข้อมูลการชำระเงิน กรุณาติดต่อแอดมิน
                </div>
              ) : (
                <div className="rounded-lg border bg-accent/30 p-5">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">โอนเงินค่าสมัคร</div>
                  <div className="mt-2 text-2xl font-bold text-primary">
                    {payment.application_fee.toLocaleString("th-TH")} บาท
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div><span className="text-muted-foreground">ธนาคาร: </span><span className="font-medium break-words">{payment.bank_name}</span></div>
                    <div><span className="text-muted-foreground">ชื่อบัญชี: </span><span className="font-medium break-words">{payment.account_name}</span></div>
                    <div><span className="text-muted-foreground">เลขที่บัญชี: </span><span className="font-medium break-all font-mono">{payment.account_number}</span></div>
                  </div>
                  {payment.show_qr_code && payment.qr_code_url && (
                    <QrImage url={payment.qr_code_url} />
                  )}
                  {payment.payment_instruction && (
                    <p className="mt-4 rounded-md bg-background/60 p-3 text-sm text-muted-foreground">
                      {payment.payment_instruction}
                    </p>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="วันที่โอนเงิน" required>
                  <input type="date" className={inputCls} value={form.payment_date} onChange={(e) => update("payment_date", e.target.value)} />
                </Field>
                <Field label="แนบสลิปโอนเงิน" required>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    <span className="truncate">{slip ? slip.name : "เลือกไฟล์รูปสลิป"}</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setSlip(e.target.files?.[0] ?? null)} />
                  </label>
                </Field>
              </div>
              <Field label="หมายเหตุ">
                <textarea className={inputCls} rows={3} value={form.note} onChange={(e) => update("note", e.target.value)} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">ตรวจสอบข้อมูลก่อนส่ง</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Row k="ชื่อ-นามสกุล" v={`${form.prefix} ${form.full_name}`} />
                <Row k="โทรศัพท์" v={form.phone} />
                <Row k="วันเกิด" v={form.birth_date || "-"} />
                <Row k="จังหวัด (ปัจจุบัน)" v={form.current_province || "-"} />
                <Row k="ระดับการศึกษา" v={form.education_level} />
                <Row k="สาขา" v={form.major || "-"} />
                <Row k="ปีที่เข้าเรียน" v={form.enrollment_year || "-"} />
                <Row k="รอบ" v={form.study_period} />
                <Row k="วันที่โอนเงิน" v={form.payment_date || "-"} />
                <Row k="สลิป" v={slip?.name || "-"} />
              </dl>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-2 border-t pt-5">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-40 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">ย้อนกลับ</span>
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => canNext() ? setStep((s) => s + 1) : toast.error("กรุณากรอกข้อมูลที่จำเป็น")}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-5"
              >
                ถัดไป <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 disabled:opacity-60 sm:px-6"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "กำลังส่ง..." : "ส่งใบสมัคร"}
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          เคยสมัครแล้ว? <Link to="/status" className="text-primary underline">ตรวจสอบสถานะ</Link>
        </p>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground sm:text-sm">{k}</dt>
      <dd className="break-all text-sm font-medium sm:text-right">{v}</dd>
    </div>
  );
}
