import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { GraduationCap, Users, ShieldCheck, ArrowRight, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "สมาคมศิษย์เก่า มทร.สุวรรณภูมิ — ลงทะเบียนสมาชิก" },
      { name: "description", content: "ระบบลงทะเบียนสมาชิกสมาคมศิษย์เก่ามหาวิทยาลัยเทคโนโลยีราชมงคลสุวรรณภูมิ สมัครออนไลน์ ตรวจสอบสถานะได้ตลอดเวลา" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-accent/30">
          <div className="container mx-auto grid items-center gap-10 px-4 py-12 sm:py-20 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:gap-2 sm:px-3 sm:text-xs">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">สมาคมศิษย์เก่า มทร.สุวรรณภูมิ</span>
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                ลงทะเบียนสมาชิก
                <br />
                <span className="text-primary">ออนไลน์ ง่าย รวดเร็ว</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:mt-5 sm:text-base lg:text-lg">
                สมัครสมาชิกสมาคมศิษย์เก่า กรอกข้อมูล แนบสลิปโอนเงิน
                และตรวจสอบสถานะการสมัครได้ทุกที่ทุกเวลา
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Link
                  to="/apply"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:w-auto"
                >
                  เริ่มสมัครสมาชิก <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/status"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border bg-card px-6 py-3 text-base font-medium text-foreground hover:bg-accent sm:w-auto"
                >
                  <Search className="h-4 w-4" /> ตรวจสอบสถานะ
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border bg-card p-5 shadow-xl sm:p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-4">
                    <div className="shrink-0 rounded-md bg-primary/10 p-2 text-primary"><Users className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <div className="font-semibold">ค่าสมัครสมาชิก</div>
                      <div className="text-sm text-muted-foreground">200 บาท (ครั้งเดียว)</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">โอนเงินผ่าน</div>
                    <div className="mt-1 font-semibold">ธนาคารออมสิน</div>
                    <div className="text-sm text-muted-foreground">สมาคมศิษย์เก่ามหาวิทยาลัยเทคโนโลยีราชมงคลสุวรรณภูมิ</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs">
                    {["กรอกข้อมูล", "แนบสลิป", "รอยืนยัน"].map((s, i) => (
                      <div key={s} className="rounded-lg border bg-background p-2 sm:p-3">
                        <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">{i + 1}</div>
                        <div className="mt-2 font-medium">{s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-3">
          {[
            { icon: GraduationCap, t: "เครือข่ายศิษย์เก่า", d: "เชื่อมโยงรุ่นพี่รุ่นน้องและกิจกรรมของสมาคมตลอดทั้งปี" },
            { icon: ShieldCheck, t: "ข้อมูลปลอดภัย", d: "เก็บรักษาข้อมูลส่วนตัวบนระบบคลาวด์ที่ได้มาตรฐาน" },
            { icon: Search, t: "ตรวจสอบสถานะได้เอง", d: "ใช้ชื่อหรือเบอร์โทรค้นหาสถานะการสมัครได้ทันที" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-xl border bg-card p-6 transition hover:shadow-md">
              <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} สมาคมศิษย์เก่ามหาวิทยาลัยเทคโนโลยีราชมงคลสุวรรณภูมิ
        </div>
      </footer>
    </div>
  );
}
