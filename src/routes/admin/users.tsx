import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  setUserBanned,
  revokeAdmin,
  deleteAdminUser,
  type AdminUserRow,
} from "@/lib/admin-users.functions";
import {
  Loader2, LogOut, GraduationCap, UserPlus, ShieldAlert, ArrowLeft,
  Ban, CheckCircle2, KeyRound, Trash2, ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "จัดการผู้ใช้แอดมิน" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const admin = useAdmin();
  const list = useServerFn(listAdminUsers);
  const create = useServerFn(createAdminUser);
  const update = useServerFn(updateAdminUser);
  const ban = useServerFn(setUserBanned);
  const revoke = useServerFn(revokeAdmin);
  const del = useServerFn(deleteAdminUser);

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    if (!admin.loading && !admin.isAdmin) {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) navigate({ to: "/admin/login" });
      });
    }
  }, [admin, navigate]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await list();
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (admin.isAdmin) refresh(); /* eslint-disable-next-line */ }, [admin.isAdmin]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  async function handleBan(row: AdminUserRow) {
    const isBanned = !!row.banned_until && new Date(row.banned_until) > new Date();
    if (!confirm(isBanned ? `เปิดใช้งานบัญชี ${row.email}?` : `ปิดใช้งานบัญชี ${row.email}?`)) return;
    try {
      await ban({ data: { id: row.id, banned: !isBanned } });
      toast.success(isBanned ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ไม่สำเร็จ");
    }
  }

  async function handleRevoke(row: AdminUserRow) {
    if (!confirm(`ถอดสิทธิ์แอดมินของ ${row.email}? (บัญชียังคงอยู่ แต่จะใช้หลังบ้านไม่ได้)`)) return;
    try {
      await revoke({ data: { id: row.id } });
      toast.success("ถอดสิทธิ์แล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ไม่สำเร็จ");
    }
  }

  async function handleDelete(row: AdminUserRow) {
    if (!confirm(`ลบบัญชี ${row.email} ออกจากระบบถาวร?`)) return;
    try {
      await del({ data: { id: row.id } });
      toast.success("ลบบัญชีแล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ไม่สำเร็จ");
    }
  }

  if (admin.loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!admin.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-warning" />
        <h1 className="mt-3 text-xl font-bold">ไม่มีสิทธิ์เข้าใช้งาน</h1>
        <button onClick={logout} className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-accent">ออกจากระบบ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2 font-semibold text-primary">
            <GraduationCap className="h-5 w-5" /> หลังบ้านสมาคม
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{admin.email}</span>
            <button onClick={logout} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
              <LogOut className="h-4 w-4" /> ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> กลับ Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold">จัดการผู้ใช้แอดมิน</h1>
            <p className="text-sm text-muted-foreground">เพิ่ม แก้ไข หรือปิดใช้งานบัญชีแอดมิน</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <UserPlus className="h-4 w-4" /> เพิ่มแอดมิน
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">อีเมล</th>
                  <th className="px-4 py-3">เข้าระบบล่าสุด</th>
                  <th className="px-4 py-3">สร้างเมื่อ</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">ยังไม่มีผู้ใช้แอดมิน</td></tr>
                )}
                {!loading && rows.map((r) => {
                  const isBanned = !!r.banned_until && new Date(r.banned_until) > new Date();
                  const isSelf = r.email === admin.email;
                  return (
                    <tr key={r.id} className="border-t hover:bg-accent/30">
                      <td className="px-4 py-3 font-medium">
                        {r.email} {isSelf && <span className="ml-1 text-xs text-muted-foreground">(คุณ)</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleString("th-TH") : "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        {isBanned ? (
                          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">ปิดใช้งาน</span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">ใช้งานได้</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditing(r)} title="แก้ไข" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent">
                            <KeyRound className="h-3.5 w-3.5" /> แก้ไข
                          </button>
                          <button disabled={isSelf} onClick={() => handleBan(r)} title={isBanned ? "เปิดใช้งาน" : "ปิดใช้งาน"} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-40">
                            {isBanned ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                            {isBanned ? "เปิด" : "ปิด"}
                          </button>
                          <button disabled={isSelf} onClick={() => handleRevoke(r)} title="ถอดสิทธิ์แอดมิน" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-40">
                            <ShieldOff className="h-3.5 w-3.5" /> ถอดสิทธิ์
                          </button>
                          <button disabled={isSelf} onClick={() => handleDelete(r)} title="ลบบัญชี" className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40">
                            <Trash2 className="h-3.5 w-3.5" /> ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateDialog
          onClose={() => setShowCreate(false)}
          onSubmit={async (email, password) => {
            await create({ data: { email, password } });
            toast.success("เพิ่มแอดมินใหม่แล้ว");
            setShowCreate(false);
            refresh();
          }}
        />
      )}
      {editing && (
        <EditDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (email, password) => {
            await update({ data: { id: editing.id, email: email || undefined, password: password || undefined } });
            toast.success("บันทึกการแก้ไขแล้ว");
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function CreateDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Dialog title="เพิ่มแอดมินใหม่" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try { await onSubmit(email, password); }
          catch (err) { toast.error(err instanceof Error ? err.message : "ไม่สำเร็จ"); }
          finally { setSaving(false); }
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">อีเมล</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</label>
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">ยกเลิก</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function EditDialog({ user, onClose, onSubmit }: { user: AdminUserRow; onClose: () => void; onSubmit: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Dialog title={`แก้ไข ${user.email}`} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try { await onSubmit(email, password); }
          catch (err) { toast.error(err instanceof Error ? err.message : "ไม่สำเร็จ"); }
          finally { setSaving(false); }
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">อีเมล</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)</label>
          <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">ยกเลิก</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} บันทึก
          </button>
        </div>
      </form>
    </Dialog>
  );
}
