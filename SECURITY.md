# Security Hardening

เว็บนี้เป็น static site จึงไม่มีฐานข้อมูล รหัสผ่าน หรือ backend API ในตัว ความปลอดภัยหลักอยู่ที่การตั้งค่า browser policy และ header บนเซิร์ฟเวอร์จริง

## สิ่งที่ตั้งไว้แล้ว

- Content Security Policy จำกัด resource ให้โหลดจากเว็บตัวเองเท่านั้น
- ปิดการฝังเว็บใน iframe ด้วย `frame-ancestors 'none'`
- ปิด object/embed ด้วย `object-src 'none'`
- ปิด form action ด้วย `form-action 'none'` และ JavaScript ป้องกันการส่งข้อมูลจากหน้า static
- ไม่พึ่งพา font หรือ script ภายนอก ลด supply-chain และ privacy risk
- ปิด browser permissions ที่ไม่ใช้ เช่น camera, microphone, geolocation, payment, USB และ Bluetooth
- ตั้ง referrer policy แบบ `strict-origin-when-cross-origin`

## ผลการตรวจล่าสุด

- ไม่พบ inline event handler, `innerHTML`, `eval`, `document.write`, storage API หรือ URL ภายนอกในไฟล์เว็บ
- ทดสอบใส่ payload HTML/script ในฟอร์มแล้วข้อมูลไม่ถูกส่ง ไม่เข้า URL และไม่ถูกสร้างเป็น DOM
- ตรวจ desktop และ mobile แล้วภาพโหลดครบ เมนูมือถือทำงาน และไม่พบ console error

## เมื่อนำขึ้นเซิร์ฟเวอร์จริง

- ใช้ HTTPS เท่านั้น
- ตั้ง security headers จากไฟล์ `_headers` หรือ `nginx-security.conf`
- เก็บไฟล์ deploy ให้เป็น read-only เท่าที่ทำได้
- อย่าใส่ข้อมูลส่วนบุคคลของผู้ต้องหาเกินกว่าที่เผยแพร่ได้ตามกฎหมาย
- ตรวจรูปภาพก่อนอัปโหลดว่าไม่มีข้อมูลลับหรือ metadata ที่ไม่ควรเผยแพร่
