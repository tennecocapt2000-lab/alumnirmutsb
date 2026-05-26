import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = { q?: string; id?: string };

export const Route = createFileRoute("/status")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({ meta: [{ title: "ตรวจสอบสถานะการสมัคร" }] }),
  component: StatusPage,
});

type AppRow = {
  id: string; prefix: string; full_name: string; phone: string;
  status: string; member_no: string | null; admin_note: string | null;
  created_at: string; payment_date: string | null;
};

function StatusPage() {
  const { q, id } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AppRow[] | null>(null);

  async function search(qStr: string) {
    if (!qStr.trim()) return;
    setLoading(true);
    try {
      const term = qStr.trim();
      const { data, error } = await supabase
        .from("applications")
        .select("id,prefix,full_name,phone,status,member_no,admin_note,created_at,payment_date")
        .or(`phone.ilike.%${term}%,full_name.ilike.%${term}%,member_no.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setResults(data ?? []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (q) search(q);
  }, [q]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold sm:text-3xl">ตรวจสอบสถานะการสมัคร</h1>
        <p className="mt-1 text-sm text-muted-foreground">ค้นหาด้วยเบอร์โทรศัพท์, ชื่อ-นามสกุล หรือเลขสมาชิก</p>

        <form
          onSubmit={(e) => { e.preventDefault(); search(query); }}
          className="mt-5 flex gap-2"
        >
          <input
            className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="เช่น 081-234-5678 หรือ สมชาย ใจดี"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="inline-flex items-center gap-1 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Search className="h-4 w-4" /> ค้นหา
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> กำลังค้นหา...
            </div>
          )}
          {results && !loading && results.length === 0 && (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
              ไม่พบใบสมัคร กรุณาตรวจสอบคำค้นหา
            </div>
          )}
          {results && results.map((r) => (
            <div key={r.id} className={`rounded-xl border bg-card p-5 shadow-sm transition ${r.id === id ? "ring-2 ring-primary" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{r.prefix} {r.full_name}</div>
                  <div className="text-sm text-muted-foreground">โทร. {r.phone}</div>
                  {r.member_no && (
                    <div className="mt-1 text-sm">เลขสมาชิก: <span className="font-mono font-semibold text-primary">{r.member_no}</span></div>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(r.status)}`}>
                  {statusLabel(r.status)}
                </span>
              </div>
              {r.admin_note && (
                <div className="mt-3 rounded-md border bg-accent/30 p-3 text-sm">
                  <div className="text-xs font-medium text-muted-foreground">หมายเหตุจากแอดมิน</div>
                  <div className="mt-1">{r.admin_note}</div>
                </div>
              )}
              <div className="mt-3 text-xs text-muted-foreground">
                สมัครเมื่อ {new Date(r.created_at).toLocaleString("th-TH")}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
