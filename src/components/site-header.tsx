import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <GraduationCap className="h-6 w-6" />
          <span className="hidden sm:inline">สมาคมศิษย์เก่า มทร.สุวรรณภูมิ</span>
          <span className="sm:hidden">สมาคมศิษย์เก่า</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-3 py-2 text-foreground/80 hover:bg-accent hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "rounded-md px-3 py-2 bg-accent text-accent-foreground font-medium" }}>
            หน้าแรก
          </Link>
          <Link to="/status" className="rounded-md px-3 py-2 text-foreground/80 hover:bg-accent hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-2 bg-accent text-accent-foreground font-medium" }}>
            ตรวจสอบสถานะ
          </Link>
          <Link to="/apply" className="ml-1 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">
            สมัครสมาชิก
          </Link>
        </nav>
      </div>
    </header>
  );
}
