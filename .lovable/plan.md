## เป้าหมาย
ปรับแถบเมนูบนมือถือให้แสดงครบทุกคำ (ไม่ย่อ/ไม่ซ่อน) และดูเรียบร้อย professional

## ขอบเขต
แก้เฉพาะ `src/components/site-header.tsx` ไม่แตะ logic อื่น

## รายละเอียด

### ปัญหาปัจจุบัน
- active state เป็น pill สีเทา (`bg-accent`) ดูหนา/แปลกบนจอเล็ก
- คำ "ตรวจสอบสถานะ" / "สมัครสมาชิก" ยาว ทำให้ชิดกันเกินไป
- padding ของลิงก์และปุ่ม CTA ใหญ่เกินความจำเป็น

### การแก้ไข

1. **แสดงคำเต็มทุกคำ** บนมือถือ (<sm)
   - "หน้าแรก" / "ตรวจสอบสถานะ" / "สมัครสมาชิก" แสดงครบ ไม่ย่อเป็น "สถานะ" หรือ "สมัคร"

2. **ปรับ active state บนมือถือ**
   - จาก pill background (`bg-accent`) เปลี่ยนเป็น **text-primary + underline** (ไม่มีพื้นหลัง)
   - บน desktop (≥sm) คง active pill ไว้เหมือนเดิม

3. **ลดขนาดและระยะห่างบนมือถือ**
   - font nav ลงเป็น `text-xs`
   - padding ลิงก์ลดเป็น `px-1.5 py-1`
   - ปุ่ม CTA "สมัครสมาชิก" ลดเป็น `px-2 py-1.5 text-xs`
   - gap ระหว่างลิงก์ลดเป็น `gap-0.5`

4. **ปรับ logo บนมือถือ**
   - ข้อความ truncate เป็น "สมาคมศิษย์เก่า มทร.สุวรรณภูมิ" แต่ลด font size เล็กน้อยเพื่อให้พอดี
   - ถ้ายังไม่พอใช้ `text-[11px]` พร้อม truncate

5. **ป้องกัน overflow**
   - ใช้ `grid-cols-[minmax(0,1fr)_auto]` สำหรับ logo + nav container
   - `min-w-0` กับ text container ทุกตัว
   - `shrink-0` กับไอคอน/ปุ่ม

## ไม่แตะ
- ไม่แตะ desktop layout (≥sm)
- ไม่แตะ business logic, server functions, database