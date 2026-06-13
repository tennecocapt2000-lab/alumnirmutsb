## เป้าหมาย
ปรับหน้าเว็ปฝั่งผู้ใช้ทั่วไป (หน้าแรก, สมัครสมาชิก, ตรวจสอบสถานะ) ให้แสดงผลบนมือถือ (≤440px) ได้พอดี ไม่มีคำที่ล้นบรรทัด/ตัด ปุ่มกดง่าย และดูเป็นมืออาชีพ

## ขอบเขตการแก้ (เฉพาะ UI/layout ไม่แตะ logic)

### 1. Header (`src/components/site-header.tsx`)
- บนมือถือ ปุ่ม "หน้าแรก / ตรวจสอบสถานะ / สมัครสมาชิก" + โลโก้ ชนกัน → ใช้ grid `grid-cols-[minmax(0,1fr)_auto]`, โลโก้ `truncate`, นำทางเป็นไอคอน-only หรือย่อข้อความบน <sm (เช่น "ตรวจสอบสถานะ" → "สถานะ", "สมัครสมาชิก" → "สมัคร")
- ลด padding ปุ่มบนมือถือ (px-2 sm:px-3)

### 2. หน้าแรก (`src/routes/index.tsx`)
- Hero badge "สมาคมศิษย์เก่า มทร.สุวรรณภูมิ" ยาวล้นบนมือถือ → ใส่ `text-[11px]` + อนุญาต wrap หรือย่อข้อความ
- H1 `text-4xl` ใหญ่เกินบนจอเล็ก → ลดเป็น `text-3xl sm:text-4xl lg:text-5xl` พร้อม `leading-tight`
- การ์ดด้านขวา `p-8` → `p-5 sm:p-8` เพื่อไม่ให้ขอบชิดเกินไป
- ปุ่ม CTA สองตัวบนมือถือให้ `w-full` ในจอเล็ก (`flex-col sm:flex-row`) เพื่อกดถนัด
- ขั้นตอน 3 ช่อง (กรอกข้อมูล/แนบสลิป/รอยืนยัน) — ให้ตัวเลขกลาง + ข้อความ `truncate` หรือลดเป็น `text-[11px]`

### 3. หน้าสมัครสมาชิก (`src/routes/apply.tsx`)
- Stepper บนมือถือซ่อนชื่อ step → เพิ่มบรรทัด "ขั้นที่ X/5: ชื่อ step ปัจจุบัน" เหนือ stepper เพื่อสื่อสารชัดเจน
- การ์ดเนื้อหา `p-5` ลดเหลือ `p-4 sm:p-7` ให้พื้นที่กรอกกว้างขึ้น
- ปุ่ม "ย้อนกลับ / ถัดไป / ส่งใบสมัคร" ที่ container `justify-between` — ตรวจให้ไม่ wrap (ใช้ `gap-2`, ลดข้อความ "ย้อนกลับ" เป็นเฉพาะไอคอน + label ซ่อนใน <sm: `<span className="hidden sm:inline">ย้อนกลับ</span>`)
- ส่วน "ตรวจสอบข้อมูลก่อนส่ง" Row component: ค่ายาว (เช่นชื่อไฟล์สลิป) ทำให้ล้น → เปลี่ยน layout เป็น stack บนมือถือ (`flex-col sm:flex-row`) และ `break-all` ที่ค่า
- QR code: `h-48 w-48` ใหญ่พอแล้ว แต่เพิ่ม `max-w-full`
- ข้อมูลบัญชี: เลขบัญชียาวอาจล้น → `break-all` ที่ค่า

### 4. หน้าตรวจสอบสถานะ (`src/routes/status.tsx`)
- การ์ดผลลัพธ์ header `flex-wrap items-start justify-between` — บนมือถือ badge สถานะอาจตกบรรทัด ทำให้ดูไม่เป็นระเบียบ → ใช้ grid pattern `grid-cols-[minmax(0,1fr)_auto]` ให้ badge อยู่ขวาเสมอ, ชื่อ `truncate`
- ฟอร์มค้นหา: input + ปุ่ม อยู่บรรทัดเดียวกัน — ปุ่มยาว "กำลังค้นหา..." ทำให้ input หด → ลดข้อความเป็น "ค้นหา" เสมอ และให้ปุ่ม `shrink-0`
- placeholder "เช่น 081-234-5678 หรือ สมชาย ใจดี" ยาวเกิน → ย่อเหลือ "เบอร์โทร หรือ ชื่อ"

### 5. ทั่วไป
- ตรวจ container `max-w-*` + `px-4` พอดีแล้ว ไม่ต้องแก้
- ใช้ `min-w-0` กับ flex children ที่มี text เพื่อให้ truncate ทำงาน
- ทดสอบที่ viewport 360, 390, 440 หลังแก้

## ไฟล์ที่จะแก้
- `src/components/site-header.tsx`
- `src/routes/index.tsx`
- `src/routes/apply.tsx`
- `src/routes/status.tsx`

ไม่แตะ business logic, server functions, หรือ database
