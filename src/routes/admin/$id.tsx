import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { STATUSES, statusBadgeClass, statusLabel } from "@/lib/status";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Trash2, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/$id")({
  head: () => ({ meta: [{ title: "รายละเอียดใบสมัคร" }] }),
  component: ApplicationDetail,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppDetail = Record<string, any>;

function ApplicationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const admin = useAdmin();
  const [row, setRow] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!admin.loading && !admin.isAdmin) navigate({ to: "/admin/login" });
  }, [admin, navigate]);

  useEffect(() => {
    if (!admin.isAdmin) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
      if (error) toast.error("โหลดไม่สำเร็จ");
      setRow(data);
      if (data?.payment_slip_url) {
        const { data: signed } = await supabase.storage.from("payment-slips").createSignedUrl(data.payment_slip_url, 3600);
        setSlipUrl(signed?.signedUrl ?? null);
      }
      setLoading(false);
    })();
  }, [id, admin.isAdmin]);

  async function save() {
    if (!row) return;
    setSaving(true);
    const update = {
      status: row.status,
      member_no: row.member_no || null,
      admin_note: row.admin_note || null,
      approved_at: row.status === "confirmed" ? new Date().toISOString() : null,
      approved_by: row.status === "confirmed" ? (await supabase.auth.getUser()).data.user?.id ?? null : null,
    };
    const { error } = await supabase.from("applications").update(update).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("บันทึกเรียบร้อย");
  }

  async function remove() {
    if (!confirm("ลบใบสมัครนี้?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("ลบเรียบร้อย");
    navigate({ to: "/admin" });
  }

  if (loading || admin.loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!row) return <div className="p-10 text-center">ไม่พบใบสมัคร</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center gap-3 px-4">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> กลับ Dashboard
          </Link>
        </div>
      </header>
      <main className="container mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{row.prefix} {row.full_name}</h1>
                <div className="mt-1 text-sm text-muted-foreground">โทร. {row.phone} · สมัคร {new Date(row.created_at).toLocaleString("th-TH")}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(row.status)}`}>{statusLabel(row.status)}</span>
            </div>
          </div>

          <Section title="ข้อมูลส่วนตัว">
            <Info k="คำนำหน้า" v={row.prefix} />
            <Info k="ชื่อ-นามสกุล" v={row.full_name} />
            <Info k="วันเกิด" v={row.birth_date} />
            <Info k="โทรศัพท์" v={row.phone} />
          </Section>

          <Section title="ที่อยู่ปัจจุบัน">
            <Info k="บ้านเลขที่" v={row.current_house_no} />
            <Info k="หมู่ที่" v={row.current_moo} />
            <Info k="ซอย" v={row.current_soi} />
            <Info k="ถนน" v={row.current_road} />
            <Info k="แขวง/ตำบล" v={row.current_subdistrict} />
            <Info k="เขต/อำเภอ" v={row.current_district} />
            <Info k="จังหวัด" v={row.current_province} />
            <Info k="รหัสไปรษณีย์" v={row.current_postal_code} />
          </Section>

          <Section title="ที่ทำงาน">
            <Info k="เลขที่" v={row.work_house_no} />
            <Info k="หมู่ที่" v={row.work_moo} />
            <Info k="ซอย" v={row.work_soi} />
            <Info k="ถนน" v={row.work_road} />
            <Info k="แขวง/ตำบล" v={row.work_subdistrict} />
            <Info k="เขต/อำเภอ" v={row.work_district} />
            <Info k="จังหวัด" v={row.work_province} />
            <Info k="รหัสไปรษณีย์" v={row.work_postal_code} />
            <Info k="โทรศัพท์ที่ทำงาน" v={row.work_phone} />
          </Section>

          <Section title="ประวัติการศึกษา">
            <Info k="ระดับ" v={row.education_level} />
            <Info k="เลขนักศึกษา" v={row.student_id} />
            <Info k="ปีที่เข้าเรียน" v={row.enrollment_year} />
            <Info k="สาขา" v={row.major} />
            <Info k="รอบ" v={row.study_period} />
            <Info k="เพื่อน 1" v={row.friend_1} />
            <Info k="เพื่อน 2" v={row.friend_2} />
          </Section>

          <Section title="การชำระเงิน">
            <Info k="จำนวนเงิน" v={`${row.payment_amount} บาท`} />
            <Info k="วันที่โอน" v={row.payment_date} />
            <Info k="หมายเหตุผู้สมัคร" v={row.note} />
          </Section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">หลักฐานการโอนเงิน</h3>
            {slipUrl ? (
              <a href={slipUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-md border">
                <img src={slipUrl} alt="สลิป" loading="lazy" className="w-full" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div className="flex items-center justify-center gap-2 border-t bg-muted/30 py-2 text-sm">
                  <FileText className="h-4 w-4" /> เปิดไฟล์ขนาดเต็ม
                </div>
              </a>
            ) : <div className="mt-2 text-sm text-muted-foreground">ไม่มีไฟล์แนบ</div>}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">จัดการสถานะ</h3>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">สถานะ</span>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={row.status} onChange={(e) => setRow({ ...row, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">เลขสมาชิก</span>
              <input className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono" value={row.member_no ?? ""} onChange={(e) => setRow({ ...row, member_no: e.target.value })} placeholder="เช่น 0001/2569" />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">หมายเหตุแอดมิน</span>
              <textarea rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={row.admin_note ?? ""} onChange={(e) => setRow({ ...row, admin_note: e.target.value })} />
            </label>
            <button disabled={saving} onClick={save} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} บันทึก
            </button>
            <button onClick={remove} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-destructive/40 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> ลบใบสมัคร
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function Info({ k, v }: { k: string; v: unknown }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed py-1.5 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v ? String(v) : "-"}</dd>
    </div>
  );
}
