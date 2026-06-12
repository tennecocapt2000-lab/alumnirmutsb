## เป้าหมาย
แก้อาการค้างตอนอัปโหลดรูป QR ในหน้าแอดมิน และเก็บ flow บันทึกข้อมูลชำระเงินให้ทำงานได้เสถียร

## ปัญหาที่พบ
1. **อัปโหลด QR มีแนวโน้มติดที่ Storage policy**
   - หน้า `src/routes/admin/payment-settings.tsx` อัปโหลดไฟล์จาก browser ตรงเข้า bucket `payment-qr`
   - policy ปัจจุบันใน `supabase/migrations/20260527134806_fcaf5e79-a711-494c-8326-6395a8843dcd.sql` บังคับ `authenticated + has_role(auth.uid(),'admin')`
   - มีเคสที่ Storage ประเมิน token ฝั่งอัปโหลดไม่ตรง role ทำให้คำขอค้าง/ไม่ผ่าน แม้ผู้ใช้เป็นแอดมิน
2. **ฝั่งบันทึกเคยมี server function 500 จริง**
   - log พบ `Server function info not found for ...savePaymentSettings...`
   - ตอนนี้ route เรียก server function แล้ว แต่ต้องทดสอบต่อเนื่องหลังแก้ flow อัปโหลด
3. **preview ตอนนี้มี dev CSS error เพิ่มอีกจุด**
   - `src/styles.css` มี `@source` คั่นกลางระหว่าง `@import` ทำให้ Vite โชว์ overlay (`@import rules must precede all rules`)
   - อันนี้ทำให้หน้า preview ดูเหมือนระบบรวนเพิ่ม แม้ไม่ใช่ต้นเหตุหลักของการอัปโหลด

## แผนแก้ไข
1. **ย้ายการอัปโหลด QR ไปฝั่ง server function**
   - สร้าง/ปรับ server function สำหรับรับไฟล์หรือ payload ที่จำเป็น
   - ตรวจสิทธิ์แอดมินใน server function
   - ใช้ admin client อัปโหลดเข้าที่เก็บไฟล์จากฝั่ง server เพื่อไม่ให้ติด policy ของ browser upload
2. **ปรับหน้า `payment-settings` ให้แยกสถานะชัดเจน**
   - แยก `uploading` กับ `saving`
   - ปิดปุ่มบันทึกระหว่างอัปโหลด
   - ใส่ timeout/error state สำหรับ upload ด้วย ไม่ปล่อย spinner ค้าง
   - แสดงข้อความผิดพลาดจาก upload แบบตรงจุด
3. **ทำให้ save flow ใช้งานต่อได้ทันทีหลัง upload สำเร็จ**
   - เมื่ออัปโหลดเสร็จ ให้เก็บเฉพาะ URL ที่ได้กลับมา
   - ปุ่มบันทึกส่งเฉพาะข้อมูลฟอร์ม + URL ไปยัง `savePaymentSettings`
4. **แก้ CSS import order**
   - จัดลำดับ `@import`/`@source` ใน `src/styles.css` ให้ถูกต้อง เพื่อตัด Vite overlay ที่ทำให้ดูเหมือนระบบพังทั้งหน้า
5. **ทดสอบเส้นทางใช้งานจริง**
   - ทดสอบอัปโหลดรูป
   - ทดสอบกดบันทึกหลังอัปโหลด
   - เช็ก log/server response อีกรอบว่าไม่เหลือ 500 หรือ upload failure

## Technical details
- ไฟล์หลักที่จะแก้:
  - `src/routes/admin/payment-settings.tsx`
  - `src/lib/payment-settings.functions.ts`
  - `src/styles.css`
- แนวทางหลัก:
  - browser จะไม่อัปโหลดเข้าที่เก็บไฟล์โดยตรงแล้ว
  - server function จะเป็นจุดเดียวที่รับผิดชอบเรื่องสิทธิ์และการอัปโหลด QR
  - หน้าแอดมินจะแสดง error ได้ทันทีถ้าอัปโหลดไม่สำเร็จ

## ผลลัพธ์ที่คาดหวัง
- เลือกรูปแล้วอัปโหลดเสร็จ ไม่ค้าง
- กดบันทึกแล้วบันทึกข้อมูลได้
- หน้า preview ไม่เด้ง error overlay จาก CSS อีก