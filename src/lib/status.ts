export const STATUSES = [
  { value: "pending", label: "รอตรวจสอบ", color: "warning" },
  { value: "paid", label: "ชำระเงินแล้ว", color: "info" },
  { value: "confirmed", label: "สมาชิกยืนยันแล้ว", color: "success" },
  { value: "rejected", label: "ไม่อนุมัติ / เอกสารไม่ครบ", color: "destructive" },
] as const;

export type StatusValue = (typeof STATUSES)[number]["value"];

export function statusLabel(v: string) {
  return STATUSES.find((s) => s.value === v)?.label ?? v;
}

export function statusBadgeClass(v: string) {
  switch (v) {
    case "pending":
      return "bg-warning/15 text-warning border border-warning/30";
    case "paid":
      return "bg-info/15 text-info border border-info/30";
    case "confirmed":
      return "bg-success/15 text-success border border-success/30";
    case "rejected":
      return "bg-destructive/15 text-destructive border border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border";
  }
}
