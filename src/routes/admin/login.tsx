import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "เข้าสู่ระบบแอดมิน" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("เข้าสู่ระบบสำเร็จ");
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("สร้างบัญชีแล้ว — กรุณายืนยันอีเมล (หรือเข้าสู่ระบบหากปิดยืนยัน)");
        toast.message("ต้องให้ผู้ดูแลกำหนดสิทธิ์ admin ในฐานข้อมูลก่อนจึงจะใช้งาน Dashboard ได้");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-xl">
        <div className="mb-5 flex items-center gap-2 text-primary">
          <ShieldCheck className="h-6 w-6" />
          <div className="font-semibold">ระบบหลังบ้าน — สมาคมศิษย์เก่า</div>
        </div>
        <h1 className="text-2xl font-bold">
          {mode === "signin" ? "เข้าสู่ระบบแอดมิน" : "สร้างบัญชีแอดมิน"}
        </h1>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">อีเมล</span>
            <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">รหัสผ่าน</span>
            <input type="password" required minLength={6} className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครบัญชี"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "ยังไม่มีบัญชี? สมัครบัญชีแอดมิน" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
        </button>
      </div>
    </div>
  );
}
