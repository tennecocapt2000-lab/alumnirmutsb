## What’s actually broken

การกด **บันทึก** ที่ `/admin/payment-settings` ตอนนี้ไม่ได้ช้าเฉย ๆ แต่ **เรียก server function ไม่สำเร็จ** ทำให้บันทึกไม่ได้เลย

หลักฐานที่เจอ:
- runtime log มี error ชัดเจน: `Server function info not found for src_lib_payment-settings_functions_ts--savePaymentSettings_createServerFn_handler`
- ไฟล์ `src/lib/payment-settings.functions.ts` มี helper `assertAdmin` อยู่ในไฟล์เดียวกับ `createServerFn` ซึ่งเป็น pattern ที่ TanStack Start พังได้ใน production/runtime split
- `payment_settings` table และ policy มีอยู่แล้ว แต่ตอนนี้ยังไม่มีข้อมูลแถวล่าสุด จึงยืนยันได้ว่าปัญหาอยู่ที่ save flow มากกว่าข้อมูลเดิมในฐานข้อมูล
- `src/styles.css` ยังมีลำดับ `@import/@source` ที่ผิด ทำให้มี Vite error overlay ซ้อนอยู่ด้วย และอาจทำให้ดูเหมือนหน้า “ค้าง” เพิ่มขึ้น

## Plan

1. แยก logic ฝั่งเซิร์ฟเวอร์ออกจาก `src/lib/payment-settings.functions.ts`
   - ย้าย `assertAdmin` และ logic ที่แตะ admin client ไปไว้ในไฟล์ใหม่ `src/lib/payment-settings.server.ts`
   - ให้ไฟล์ `.functions.ts` เหลือเฉพาะ `createServerFn` แบบบาง ๆ ตาม pattern ที่ TanStack ต้องการ

2. แก้ `savePaymentSettings` และ `uploadPaymentQr` ให้เรียก helper จากไฟล์ `.server.ts`
   - ลดความเสี่ยงจาก server-function splitting/runtime resolution
   - คง validation และสิทธิ์แอดมินเดิมไว้

3. ปรับหน้า `src/routes/admin/payment-settings.tsx` ให้แสดง error ของการบันทึกชัดขึ้น
   - กันสถานะ loading/saving ค้างเมื่อ server function fail
   - แสดงข้อความผิดพลาดจาก save ให้ชัดเจนทันที

4. แก้ `src/styles.css` ให้ไม่มี Vite overlay รบกวนการทดสอบ
   - เรียง `@import` / `@source` ให้ถูกลำดับ

5. ตรวจซ้ำหลังแก้
   - เปิด `/admin/payment-settings`
   - กรอกข้อมูลโดยไม่อัปโหลดรูป แล้วกดบันทึก
   - ทดสอบอัปโหลด QR แล้วกดบันทึกอีกครั้ง
   - เช็ก logs ว่าไม่มี `Server function info not found` แล้ว และมีข้อมูลถูกสร้าง/อัปเดตใน `payment_settings`

## Technical details

ไฟล์ที่คาดว่าจะเปลี่ยน:
- `src/lib/payment-settings.functions.ts`
- `src/lib/payment-settings.server.ts` (ใหม่)
- `src/routes/admin/payment-settings.tsx`
- `src/styles.css`

ผลลัพธ์ที่คาดหวัง:
- ปุ่มบันทึกทำงานจริง
- ไม่ค้างหลังอัปโหลด QR
- ไม่มี 500 จาก save server function
- ไม่มี Vite overlay มาบังหน้าแอดมิน

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>