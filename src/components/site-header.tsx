import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="container mx-auto grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold text-primary">
          <GraduationCap className="h-6 w-6 shrink-0" />
          <span className="hidden truncate sm:inline">สมาคมศิษย์เก่า มทร.สุวรรณภูมิ</span>
          <span className="truncate sm:hidden">สมาคมศิษย์เก่า</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-2 py-2 text-foreground/80 hover:bg-accent hover:text-foreground sm:px-3" activeOptions={{ exact: true }} activeProps={{ className: "rounded-md px-2 sm:px-3 py-2 bg-accent text-accent-foreground font-medium" }}>
            หน้าแรก
          </Link>
          <Link to="/status" className="rounded-md px-2 py-2 text-foreground/80 hover:bg-accent hover:text-foreground sm:px-3" activeProps={{ className: "rounded-md px-2 sm:px-3 py-2 bg-accent text-accent-foreground font-medium" }}>
            <span className="hidden sm:inline">ตรวจสอบสถานะ</span>
            <span className="sm:hidden">สถานะ</span>
          </Link>
          <Link to="/apply" className="ml-1 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90 sm:px-4">
            สมัคร<span className="hidden sm:inline">สมาชิก</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
