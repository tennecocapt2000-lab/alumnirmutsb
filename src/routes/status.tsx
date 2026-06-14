import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { Skeleton } from "@/components/ui/skeleton";
import { lookupApplicationStatus, type StatusLookupRow } from "@/lib/status-lookup.functions";

type SearchParams = { q?: string; id?: string };

export const Route = createFileRoute("/status")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({ meta: [{ title: "ตรวจสอบสถานะการสมัคร" }] }),
  component: StatusPage,
});

type AppRow = StatusLookupRow;

function StatusPage() {
  const { q, id } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AppRow[] | null>(null);
  const lookup = useServerFn(lookupApplicationStatus);

  async function search(qStr: string) {
    const term = qStr.trim();
    if (term.length < 3) return;
    setLoading(true);
    try {
      const rows = await lookup({ data: { term } });
      setResults(rows ?? []);
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
        <p className="mt-1 text-sm text-muted-foreground">ค้นหาด้วยเบอร์โทรศัพท์ที่ลงทะเบียน หรือเลขสมาชิก (ต้องตรงทั้งหมด)</p>


        <form
          onSubmit={(e) => { e.preventDefault(); search(query); }}
          className="mt-5 flex gap-2"
        >
          <input
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="เบอร์โทร หรือ ชื่อ"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button disabled={loading} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:px-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} ค้นหา
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {loading && Array.from({ length: 2 }).map((_, i) => (
            <div key={`sk-${i}`} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-3 w-40" />
            </div>
          ))}
          {results && !loading && results.length === 0 && (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
              ไม่พบใบสมัคร กรุณาตรวจสอบคำค้นหา
            </div>
          )}
          {!loading && results && results.map((r) => (
            <div key={r.id} className={`rounded-xl border bg-card p-4 shadow-sm transition sm:p-5 ${r.id === id ? "ring-2 ring-primary" : ""}`}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold sm:text-lg">{r.prefix} {r.full_name}</div>
                  <div className="truncate text-sm text-muted-foreground">โทร. {r.phone}</div>
                  {r.member_no && (
                    <div className="mt-1 truncate text-sm">เลขสมาชิก: <span className="font-mono font-semibold text-primary">{r.member_no}</span></div>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:text-xs ${statusBadgeClass(r.status)}`}>
                  {statusLabel(r.status)}
                </span>
              </div>
              {/* admin_note ถูกตัดออกจาก public lookup เพื่อกันการรั่วของโน้ตภายใน */}
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
