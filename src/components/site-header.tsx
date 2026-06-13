import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="container mx-auto grid h-16 grid-cols-[minmax(0,auto)_1fr] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-1.5 font-semibold text-primary sm:gap-2">
          <GraduationCap className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
          <span className="truncate text-[13px] sm:text-base">สมาคมศิษย์เก่า มทร.สุวรรณภูมิ</span>
        </Link>
        <nav className="flex shrink-0 items-center justify-end gap-0.5 text-xs sm:gap-1 sm:text-sm">
          <Link
            to="/"
            className="rounded-md px-1.5 py-1.5 text-foreground/80 hover:text-foreground sm:px-3 sm:py-2 sm:hover:bg-accent"
            activeOptions={{ exact: true }}
            activeProps={{ className: "rounded-md px-1.5 py-1.5 sm:px-3 sm:py-2 font-semibold text-primary underline underline-offset-4 decoration-2 sm:no-underline sm:bg-accent sm:text-accent-foreground" }}
          >
            หน้าแรก
          </Link>
          <Link
            to="/status"
            className="rounded-md px-1.5 py-1.5 text-foreground/80 hover:text-foreground sm:px-3 sm:py-2 sm:hover:bg-accent"
            activeProps={{ className: "rounded-md px-1.5 py-1.5 sm:px-3 sm:py-2 font-semibold text-primary underline underline-offset-4 decoration-2 sm:no-underline sm:bg-accent sm:text-accent-foreground" }}
          >
            ตรวจสอบสถานะ
          </Link>
          <Link
            to="/apply"
            className="ml-0.5 shrink-0 rounded-md bg-primary px-2 py-1.5 font-medium text-primary-foreground hover:bg-primary/90 sm:ml-1 sm:px-4 sm:py-2"
          >
            สมัครสมาชิก
          </Link>
        </nav>
      </div>
    </header>
  );
}
