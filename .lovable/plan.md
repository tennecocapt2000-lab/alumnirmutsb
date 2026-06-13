## เป้าหมาย
เพิ่มเมนู "ตั้งค่าหน้าแรก" ในแอดมิน เพื่อให้แอดมินแก้ Hero ของหน้าแรกได้แก่:
- ป้าย/Badge ด้านบน Hero (ปัจจุบัน: "สมาคมศิษย์เก่า มทร.สุวรรณภูมิ")
- หัวข้อใหญ่บรรทัดบน (ปัจจุบัน: "ลงทะเบียนสมาชิก")
- หัวข้อใหญ่บรรทัดล่าง — สี primary (ปัจจุบัน: "ออนไลน์ ง่าย รวดเร็ว")

## งานที่จะทำ

### 1) ฐานข้อมูล (migration)
สร้างตาราง `public.site_settings` แบบ key/value ง่ายๆ ใช้ singleton row:
- คอลัมน์ domain: `hero_badge`, `hero_title_line1`, `hero_title_line2`
- RLS: ทุกคน (anon + authenticated) อ่านได้ / เฉพาะ admin (`has_role`) แก้ได้
- GRANT: anon SELECT, authenticated SELECT/UPDATE/INSERT, service_role ALL
- Seed แถวเริ่มต้นด้วยข้อความปัจจุบัน

### 2) หน้าแอดมินใหม่
- `src/routes/admin/homepage-settings.tsx` — ฟอร์ม 3 ฟิลด์ + ปุ่มบันทึก (รูปแบบเดียวกับ `payment-settings`)
- เพิ่มการ์ดลิงก์ "ตั้งค่าหน้าแรก" ในหน้า `/admin` (dashboard)

### 3) หน้าแรก
- ใน `src/routes/index.tsx` โหลด `site_settings` ผ่าน supabase client (เหมือนที่ทำกับ payment_settings)
- แทนข้อความ badge / title 2 บรรทัด ด้วยค่าจาก DB (มี fallback เป็นข้อความปัจจุบัน)

## สิ่งที่จะ "ไม่" ทำ
- ไม่แก้ subtitle / 3 ขั้นตอน / features (ผู้ใช้เลือกเฉพาะ badge + title)
- ไม่เปลี่ยน layout, สี, หรือดีไซน์ของหน้าแรก
