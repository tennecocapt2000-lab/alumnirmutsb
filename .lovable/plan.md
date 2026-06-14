# แก้บั๊ก: ส่งใบสมัครไม่สำเร็จ

## สาเหตุที่พบ

โค้ดในขั้นตอนส่งใบสมัคร (`src/routes/apply.tsx` บรรทัด 148):

```ts
const { data, error } = await supabase
  .from("applications")
  .insert(payload)
  .select("id")        // ← ตรงนี้คือต้นเหตุ
  .single();
```

ตาราง `public.applications` มี policy เฉพาะ `INSERT` สำหรับ anon และ `UPDATE/DELETE` สำหรับ admin **แต่ไม่มี SELECT policy เลย** ดังนั้นเมื่อใช้ `.select("id")` หลัง insert (PostgREST จะออก `RETURNING id` ซึ่งต้องผ่าน RLS SELECT) → คืนผลว่าง → `.single()` โยน error `PGRST116 "JSON object requested, multiple (or no) rows returned"`

ผล: ผู้สมัครอัปโหลดสลิป + insert แถวสำเร็จจริง แต่ฝั่งหน้าเว็บโชว์ toast แดง "ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่" และผู้ใช้กดส่งซ้ำ → ได้แถวซ้ำในฐานข้อมูล

(ยืนยันจาก `\d applications` และ `pg_policy` — มีเพียง policy ของ admin กับ insert-only ของ anon ไม่มี select policy ใดๆ)

## วิธีแก้ (frontend อย่างเดียว ไม่แตะฐานข้อมูล/policy)

แก้ไฟล์เดียว: `src/routes/apply.tsx` ในฟังก์ชัน `submit()`

1. ลบ `.select("id").single()` ออก เหลือแค่ `.insert(payload)` แล้วเช็ค `error`
2. หลังสำเร็จ ให้ navigate ไป `/status?q=<phone>` (ไม่ต้องส่ง id) — หน้า status อยู่แล้วค้นหาตามเบอร์ผ่าน `lookupApplicationStatus` server function ก็แสดงใบสมัครล่าสุดของเบอร์นั้นได้ปกติ
3. Normalize นามสกุลไฟล์สลิปเป็นตัวพิมพ์เล็ก (`.toLowerCase()`) — กันเคส iOS ส่งไฟล์ `.JPG/.HEIC` แล้วชน whitelist ของ storage policy (jpg/jpeg/png/webp/pdf) แม้ policy เช็ค `lower()` แล้ว แต่ตั้ง path ให้สะอาดเป็น good practice และตัด HEIC ที่จะ fail ออกตั้งแต่ฝั่ง client พร้อมข้อความที่เข้าใจง่าย
4. ปรับข้อความ toast error ให้แสดง `error.message` ที่จริงเวลา debug ในอนาคต (เก็บข้อความภาษาไทยไว้ + console.error ของเดิม)

## สิ่งที่จะไม่ทำ

- ไม่เพิ่ม SELECT policy บน `applications` ให้ anon (จะเปิดช่องให้ใครก็ได้อ่านใบสมัครคนอื่น)
- ไม่แตะหน้า admin / payment_settings / status
- ไม่เปลี่ยน UI/ดีไซน์ของ stepper

## วิธียืนยันว่าหาย

กรอกฟอร์ม `/apply` ครบ 4 ขั้น → แนบสลิป → กดส่งใบสมัคร → toast เขียว "ส่งใบสมัครเรียบร้อยแล้ว" และเด้งไป `/status?q=<เบอร์>` พบใบสมัครที่เพิ่งสร้าง
