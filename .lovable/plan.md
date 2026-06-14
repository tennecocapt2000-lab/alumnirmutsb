# รายงานการตรวจสอบระบบรอบ End-to-End

หลังตรวจ schema, RLS, server functions, ทุกหน้า frontend และจำลอง flow ตั้งแต่ผู้สมัครกรอกฟอร์ม → ส่ง → แอดมิน login → อนุมัติ → ผู้สมัครเช็คสถานะ พบปัญหาที่ต้องแก้ดังนี้

---

## สรุปก่อนลงมือ

| # | ระดับ | โมดูล | ปัญหา |
|---|---|---|---|
| C1 | Critical | Public Status Lookup | leak `admin_note` ทางสาธารณะผ่านเบอร์โทร |
| C2 | Critical | Admin Login | เปิด sign-up สาธารณะ ใครก็สร้างบัญชี auth ได้ |
| C3 | Critical | DB applications | คอลัมน์ `status` ไม่มี CHECK constraint → admin พิมพ์พลาดทำให้ค่าหลุดจาก enum |
| C4 | Critical | DB applications | `member_no` ไม่มี UNIQUE → ออกเลขสมาชิกซ้ำได้ |
| M1 | Major | Admin Detail (`/admin/$id`) | save() ลบ `approved_at`/`approved_by` ทุกครั้งที่ status ≠ confirmed → ทำลายประวัติการอนุมัติเมื่อสลับสถานะ |
| M2 | Major | Apply Step 4 (Review) | แสดงข้อมูลไม่ครบ ผู้สมัครยืนยันไม่ได้ว่ากรอกถูก |
| M3 | Major | Admin Login | password minLength=6 ไม่ตรงกับ server ที่ต้องการ ≥8 |
| n1 | Minor | Payment Settings | ไม่มี singleton constraint เหมือน `site_settings` (สะสมแถวเก่า) — **เลื่อนไว้** เพราะไม่กระทบ flow ปัจจุบัน |

ส่วนที่ตรวจแล้วผ่าน:
- GRANT สิทธิ์ Data API ครบ (`anon`, `authenticated`, `service_role`) ทุกตาราง
- RLS policies ของ `applications`, `payment_settings`, `site_settings`, `user_roles` ถูกต้อง
- Server functions `admin-users.*` มี `assertAdmin` ทุกฟังก์ชัน
- Storage `payment-slips` upload โดย anon, อ่านโดย admin (signed URL 1 ชม.) — ปลอดภัย
- บั๊ก "ส่งใบสมัครไม่สำเร็จ" รอบก่อนแก้แล้ว
- บั๊ก QR code ไม่แสดงบน Android แก้แล้ว

---

## รายละเอียดและวิธีแก้

### C1 — Status lookup รั่ว `admin_note` สู่สาธารณะ

**ไฟล์:** `src/lib/status-lookup.functions.ts`

**สาเหตุ:** `lookupApplicationStatus` เป็น server function ไม่มี auth, ใช้ `supabaseAdmin` (bypass RLS) แล้ว return `admin_note` ออกไปด้วย ใครเดาเบอร์โทรถูกก็เห็นโน้ตภายในของแอดมิน (เช่น "สลิปปลอม" / "ติดต่อไม่ได้")

**ผลกระทบ:** ข้อมูลภายในรั่ว, ละเมิดความเป็นส่วนตัวของผู้สมัคร

**วิธีแก้:** ตัด `admin_note` ออกจาก `select` และจาก type `StatusLookupRow` + ลบส่วนแสดงผลใน `src/routes/status.tsx`

### C2 — เปิด sign-up สาธารณะที่หน้า admin login

**ไฟล์:** `src/routes/admin/login.tsx`

**สาเหตุ:** UI มีปุ่ม "สมัครบัญชีแอดมิน" เรียก `supabase.auth.signUp` ตรง — ใครก็สร้างบัญชีใน `auth.users` ได้ (ไม่ได้สิทธิ์แอดมินก็จริง แต่ pollute ระบบ + เป็นช่องสำหรับ enumeration / spam)

**ผลกระทบ:** มี user สแปมใน auth.users, อาจถูกใช้ทดสอบ brute-force password

**วิธีแก้:** ลบ mode "signup" ออกทั้งหมด แสดงเฉพาะฟอร์ม sign-in. การเพิ่มแอดมินทำผ่านหน้า `/admin/users` (มีอยู่แล้ว ใช้ service-role server fn)

### C3 — `applications.status` ไม่มี CHECK constraint

**สาเหตุ:** column เป็น `text` รับค่าใดก็ได้, frontend bind ผ่าน `<select>` แต่ admin ส่ง update ผ่าน API ตรงๆ ก็ได้

**ผลกระทบ:** ค่า status หลุดจาก enum ทำให้ count/filter/badge พัง

**วิธีแก้:** สร้าง migration เพิ่ม `CHECK (status IN ('pending','paid','confirmed','rejected'))` (เช็คก่อนว่าค่าปัจจุบันทั้งหมดอยู่ใน set แล้วค่อยใส่)

### C4 — `member_no` ออกซ้ำได้

**สาเหตุ:** ไม่มี unique index, admin พิมพ์ผิดหรือใส่ซ้ำได้

**ผลกระทบ:** สมาชิก 2 คนได้เลขเดียวกัน → status lookup สับสน

**วิธีแก้:** migration `CREATE UNIQUE INDEX ON applications(member_no) WHERE member_no IS NOT NULL`

### M1 — Detail save() ลบประวัติการอนุมัติ

**ไฟล์:** `src/routes/admin/$id.tsx` บรรทัด 53-54

**สาเหตุ:**
```ts
approved_at: row.status === "confirmed" ? new Date().toISOString() : null,
approved_by: row.status === "confirmed" ? user.id : null,
```
ถ้าเคย confirm แล้ว ภายหลังแอดมินสลับเป็น paid/rejected → ค่าทั้งสองถูกเขียนเป็น null + ถ้ากลับมาเป็น confirmed อีกครั้ง วันที่อนุมัติเดิมก็ถูกเขียนทับใหม่

**ผลกระทบ:** เสียประวัติว่าใครอนุมัติเมื่อไหร่ (audit)

**วิธีแก้:**
- ถ้า status = 'confirmed' และของเดิม `approved_at` เป็น null → set ปัจจุบัน, ถ้ามีอยู่แล้ว → คงเดิม
- ถ้า status ≠ 'confirmed' → ไม่แตะ `approved_at`/`approved_by` (เก็บ history ไว้)

### M2 — Step 4 (Review) แสดงข้อมูลไม่ครบ

**ไฟล์:** `src/routes/apply.tsx`

**สาเหตุ:** Row review โชว์แค่ชื่อ/เบอร์/จังหวัด/การศึกษา/วันโอน/สลิป — ตกที่อยู่เต็ม, ที่ทำงาน, เพื่อน, จำนวนเงิน, ธนาคาร

**ผลกระทบ:** ผู้สมัครคลิก "ส่งใบสมัคร" โดยไม่รู้ว่ากรอกที่อยู่/สาขาผิดหรือไม่ → ภาระตกที่แอดมินตามแก้

**วิธีแก้:** เพิ่ม section "ที่อยู่ปัจจุบัน", "ที่ทำงาน (ถ้ามี)", "เพื่อนร่วมรุ่น", "การชำระเงิน" (จำนวน/ธนาคาร/วันโอน) ใน step 4

### M3 — Password minLength ไม่ตรงกัน

**ไฟล์:** `src/routes/admin/login.tsx` บรรทัด 64

**สาเหตุ:** UI ยอม 6 ตัว แต่ `createAdminUser` (server) require ≥8

**ผลกระทบ:** ผู้ใช้รหัส 6-7 ตัวเข้า/รีเซ็ตได้ฝั่งใจกลับเข้าระบบไม่ได้ในอนาคต, สรรพคุณ password ต่ำ

**วิธีแก้:** เปลี่ยน `minLength={6}` → `minLength={8}` + ข้อความช่วยเหลือ

---

## ลำดับการทำงาน (Build Mode)

1. **DB migration** (1 ไฟล์): เพิ่ม CHECK status + UNIQUE member_no
2. **Frontend edits** (4 ไฟล์ขนานกัน):
   - `src/lib/status-lookup.functions.ts` — ลบ admin_note
   - `src/routes/status.tsx` — ลบส่วนแสดง admin_note
   - `src/routes/admin/login.tsx` — ลบ signup mode + minLength=8
   - `src/routes/admin/$id.tsx` — แก้ logic approved_at/approved_by
   - `src/routes/apply.tsx` — เพิ่มข้อมูลใน review step
3. **Regression test ผ่าน browser**: เปิด `/apply` → ส่งใบสมัคร, เปิด `/status?q=<เบอร์>` → ตรวจไม่มี admin_note, เปิด `/admin/login` → ไม่มีปุ่ม signup, เปิด `/admin/$id` → สลับสถานะแล้วเช็คว่า approved_at คงเดิม

## สิ่งที่ไม่ทำในรอบนี้

- ไม่แก้ดีไซน์/สีของหน้าใดๆ
- ไม่เพิ่มฟีเจอร์ใหม่ (เช่น export PDF, dashboard chart) — อยู่นอก scope bug fix
- ไม่ทำ singleton constraint สำหรับ `payment_settings` (จะเสี่ยงต้องล้างแถวเก่าก่อน — เก็บไว้รอบหน้า)
- ไม่ทำ rate-limit `lookupApplicationStatus` — ตัด admin_note ออกแล้วก็เหลือแค่ข้อมูลที่ผู้สมัครเห็นได้อยู่แล้ว
