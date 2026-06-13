import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ChevronLeft, Save } from "lucide-react";

export const Route = createFileRoute("/admin/homepage-settings")({
  head: () => ({ meta: [{ title: "ตั้งค่าหน้าแรก — แอดมิน" }] }),
  component: HomepageSettingsPage,
});

type Settings = {
  id: string | null;
  hero_badge: string;
  hero_title_line1: string;
  hero_title_line2: string;
};

const initial: Settings = {
  id: null,
  hero_badge: "สมาคมศิษย์เก่า มทร.สุวรรณภูมิ",
  hero_title_line1: "ลงทะเบียนสมาชิก",
  hero_title_line2: "ออนไลน์ ง่าย รวดเร็ว",
};

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function HomepageSettingsPage() {
  const navigate = useNavigate();
  const admin = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Settings>(initial);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!admin.loading && !admin.isAdmin) navigate({ to: "/admin/login" });
  }, [admin, navigate]);

  useEffect(() => {
    if (admin.loading || !admin.isAdmin) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (error) toast.error("โหลดข้อมูลไม่สำเร็จ: " + error.message);
      else if (data) {
        setForm({
          id: data.id,
          hero_badge: data.hero_badge ?? "",
          hero_title_line1: data.hero_title_line1 ?? "",
          hero_title_line2: data.hero_title_line2 ?? "",
        });
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [admin.loading, admin.isAdmin]);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  async function save() {
    if (saving) return;
    if (!form.hero_badge.trim() || !form.hero_title_line1.trim() || !form.hero_title_line2.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("กรุณาเข้าสู่ระบบใหม่");

      const payload = {
        hero_badge: form.hero_badge.trim(),
        hero_title_line1: form.hero_title_line1.trim(),
        hero_title_line2: form.hero_title_line2.trim(),
        updated_by: user.id,
      };

      const { data: saved, error } = form.id
        ? await supabase.from("site_settings").update(payload).eq("id", form.id).select("*").single()
        : await supabase.from("site_settings").insert(payload).select("*").single();

      if (error || !saved) throw error ?? new Error("ไม่สามารถบันทึกได้");
      setForm({
        id: saved.id,
        hero_badge: saved.hero_badge,
        hero_title_line1: saved.hero_title_line1,
        hero_title_line2: saved.hero_title_line2,
      });
      toast.success("บันทึกสำเร็จ");
    } catch (e: any) {
      const msg = e?.message || "ไม่ทราบสาเหตุ";
      setErr("บันทึกไม่สำเร็จ: " + msg);
      toast.error("บันทึกไม่สำเร็จ: " + msg);
    } finally {
      setSaving(false);
    }
  }

  if (admin.loading || !admin.isAdmin) {
    return <div className="min-h-screen p-6"><Skeleton className="h-8 w-64" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> กลับหน้าหลัก
          </Link>
          <h1 className="text-base font-semibold">ตั้งค่าหน้าแรก</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">ข้อความบนหน้าแรก (Hero)</h2>
            <p className="mt-1 text-sm text-muted-foreground">แก้ไขแถบป้ายและหัวข้อใหญ่ที่แสดงบนหน้าแรกของเว็บไซต์</p>

            {loading ? (
              <div className="mt-5 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {err && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>
                )}
                <Field label="แถบป้าย (Badge)" required>
                  <input className={inputCls} value={form.hero_badge} onChange={(e) => update("hero_badge", e.target.value)} />
                </Field>
                <Field label="หัวข้อบรรทัดที่ 1" required>
                  <input className={inputCls} value={form.hero_title_line1} onChange={(e) => update("hero_title_line1", e.target.value)} />
                </Field>
                <Field label="หัวข้อบรรทัดที่ 2 (สีหลัก)" required>
                  <input className={inputCls} value={form.hero_title_line2} onChange={(e) => update("hero_title_line2", e.target.value)} />
                </Field>

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

          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">ตัวอย่างที่ผู้ใช้จะเห็น</h2>
            <p className="mt-1 text-sm text-muted-foreground">Preview แบบเรียลไทม์</p>

            <div className="mt-5 rounded-lg border bg-gradient-to-br from-primary/5 via-background to-accent/30 p-6">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                {form.hero_badge || "—"}
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                {form.hero_title_line1 || "—"}
                <br />
                <span className="text-primary">{form.hero_title_line2 || "—"}</span>
              </h1>
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
