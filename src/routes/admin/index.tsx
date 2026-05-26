import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { STATUSES, statusBadgeClass, statusLabel } from "@/lib/status";
import { Loader2, LogOut, Search, Download, ShieldAlert, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — แอดมิน" }] }),
  component: AdminDashboard,
});

type Row = {
  id: string; prefix: string; full_name: string; phone: string;
  status: string; member_no: string | null;
  created_at: string; payment_date: string | null;
};

const PAGE_SIZE = 20;

function AdminDashboard() {
  const navigate = useNavigate();
  const admin = useAdmin();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!admin.loading && !admin.isAdmin) {
      // not admin — but still might want to allow viewing? we redirect non-logged in to /admin/login
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) navigate({ to: "/admin/login" });
      });
    }
  }, [admin, navigate]);

  async function loadCounts() {
    const results = await Promise.all(
      STATUSES.map((s) =>
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", s.value)
      )
    );
    const c: Record<string, number> = {};
    STATUSES.forEach((s, i) => (c[s.value] = results[i].count ?? 0));
    setCounts(c);
  }

  async function loadRows() {
    setLoading(true);
    try {
      let q = supabase
        .from("applications")
        .select("id,prefix,full_name,phone,status,member_no,created_at,payment_date", { count: "exact" })
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search.trim()) {
        const t = search.trim();
        q = q.or(`full_name.ilike.%${t}%,phone.ilike.%${t}%,member_no.ilike.%${t}%`);
      }
      if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);
      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      setRows(data ?? []);
      setTotal(count ?? 0);
    } catch (e) {
      console.error(e);
      toast.error("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (admin.isAdmin) {
      loadCounts();
      loadRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin.isAdmin, statusFilter, dateFrom, dateTo, page]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  async function exportCsv() {
    const { data, error } = await supabase
      .from("applications").select("*").order("created_at", { ascending: false });
    if (error || !data) return toast.error("ส่งออกไม่สำเร็จ");
    const headers = Object.keys(data[0] ?? {});
    const csv = [
      headers.join(","),
      ...data.map((r) => headers.map((h) => csvCell((r as Record<string, unknown>)[h])).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalAll = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (admin.loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!admin.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-warning" />
        <h1 className="mt-3 text-xl font-bold">บัญชีนี้ยังไม่มีสิทธิ์แอดมิน</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          กรุณาให้ผู้ดูแลระบบเพิ่มสิทธิ์ admin ในตาราง <code className="rounded bg-muted px-1">user_roles</code> ให้กับบัญชี {admin.email}
        </p>
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
            <Link to="/admin/users" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">จัดการแอดมิน</Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">{admin.email}</span>
            <button onClick={logout} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
              <LogOut className="h-4 w-4" /> ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="ทั้งหมด" value={totalAll} />
          {STATUSES.map((s) => (
            <StatCard key={s.value} label={s.label} value={counts[s.value] ?? 0} status={s.value} />
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  placeholder="ชื่อ, เบอร์, เลขสมาชิก"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); loadRows(); } }}
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">สถานะ</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <option value="all">ทั้งหมด</option>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">ตั้งแต่</label>
              <input type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">ถึง</label>
              <input type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} />
            </div>
            <div className="flex items-end md:col-span-1">
              <button onClick={exportCsv} className="inline-flex w-full items-center justify-center gap-1 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
                <Download className="h-4 w-4" /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">ผู้สมัคร</th>
                  <th className="px-4 py-3">โทรศัพท์</th>
                  <th className="px-4 py-3">เลขสมาชิก</th>
                  <th className="px-4 py-3">วันที่สมัคร</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">ไม่มีข้อมูล</td></tr>
                )}
                {!loading && rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">{r.prefix} {r.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.phone}</td>
                    <td className="px-4 py-3 font-mono">{r.member_no ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("th-TH")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(r.status)}`}>{statusLabel(r.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/admin/$id" params={{ id: r.id }} className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">เปิด</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">ทั้งหมด {total.toLocaleString("th-TH")} รายการ</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-2 py-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span>หน้า {page + 1} / {totalPages}</span>
              <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-2 py-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, status }: { label: string; value: number; status?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <div className="text-2xl font-bold">{value.toLocaleString("th-TH")}</div>
        {status && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(status)}`}>●</span>}
      </div>
    </div>
  );
}

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}
