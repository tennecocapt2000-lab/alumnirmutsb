## ปัญหา

หน้า `/apply` โหลดข้อมูลจากตาราง `payment_settings` ผ่าน Supabase client (anon key) แต่ตารางนี้ **ไม่มี GRANT** ให้ role `anon` / `authenticated` — มีแค่ RLS policy เท่านั้น

ผลคือทุก request ถูกปฏิเสธก่อนถึง RLS → `data` กลับมาเป็น `null` → หน้าสมัครไม่แสดงบัญชี/QR ที่ตั้งค่าไว้

ตรวจสอบจาก DB:
- Policy "Anyone can read active payment settings" มีอยู่ ✅
- `information_schema.role_table_grants` ไม่มี anon/authenticated ❌

## แก้ไข

สร้าง migration เดียวเพื่อเพิ่ม grants:

```sql
GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
```

- `anon` + `authenticated` SELECT → ให้หน้าสมัคร (ทั้งคนล็อกอินและไม่ล็อกอิน) อ่าน active row ได้ ตาม policy ที่มีอยู่
- `authenticated` INSERT/UPDATE/DELETE → ให้หน้าแอดมินบันทึก/แก้ไขได้ (RLS จะกรองเฉพาะ admin ผ่าน `has_role`)
- `service_role` ALL → สำหรับ server function

## ไฟล์ที่แก้

- สร้างไฟล์ migration ใหม่ใน `supabase/migrations/`

ไม่แตะ frontend, ไม่แตะ logic อื่น