# Commando SSD4

โปรเจกต์เว็บไซต์เสนอข่าวผลการจับกุมและผลการปฏิบัติของ Commando SSD4 แบบ static เปิดใช้งานได้บน GitHub Pages พร้อมหน้ารวมข่าวและระบบข้อมูลข่าวกลาง

## วิธีใช้งาน

1. เปิดไฟล์ `index.html` ในเบราว์เซอร์
2. เพิ่มข่าวจริงผ่านระบบหลังบ้าน local admin server
3. ระบบจะสร้างไฟล์ข่าวใน `news/` และอัปเดต `assets/data/news-data.js`
4. กดเผยแพร่จากหลังบ้าน หรือ commit/push ขึ้น GitHub Pages

## ไฟล์หลัก

- `index.html` โครงหน้าเว็บและเนื้อหา
- `news.html` หน้ารวมข่าวพร้อมค้นหาและกรองหมวด
- `assets/data/news-data.js` ไฟล์ข้อมูลข่าวกลางที่หน้าเว็บอ่านร่วมกัน
- `admin-server.js` local backend สำหรับล็อกอิน เพิ่มข่าว สร้างไฟล์ข่าว และ push ขึ้น GitHub Pages
- `admin-console.html` หน้า console สำหรับลงข่าวจริงผ่าน `admin-server.js`
- `admin.html` หน้าระบบหลังบ้านแบบ static สำหรับร่างข่าวและส่งออกข้อมูลกลาง
- `styles.css` รูปแบบ สี และ responsive layout
- `script.js` เมนูมือถือ ระบบค้นหา/กรองข่าว และ render ข่าวจากข้อมูลกลาง
- `admin.css` และ `admin.js` สำหรับหน้า admin preview
- `assets/ssd4-live-hero.jpg` ภาพหลักของหน้าเว็บ
- `assets/ssd4-live-logo.jpg` ภาพโลโก้ในหัวเว็บ
- `assets/favicon.svg` ไอคอนเว็บและ browser tab
- `_headers` security headers สำหรับโฮสต์ที่รองรับ เช่น Netlify หรือ Cloudflare Pages
- `nginx-security.conf` security headers สำหรับ Nginx
- `SECURITY.md` แนวทางความปลอดภัยก่อนนำเว็บขึ้นใช้งานจริง
- `robots.txt` และ `sitemap.xml` สำหรับ search engine indexing
- `.well-known/security.txt` ช่องทางรับแจ้งปัญหาความปลอดภัย

## ระบบหลังบ้านลงข่าวจริง

GitHub Pages เป็น static hosting จึงเขียนข่าวจากหน้าเว็บสาธารณะโดยตรงไม่ได้ ระบบหลังบ้านจริงของโปรเจกต์นี้จึงเป็น local admin server สำหรับรันในเครื่องเจ้าหน้าที่เท่านั้น

เริ่มใช้งาน:

```powershell
$env:SSD4_ADMIN_PASSWORD='ตั้งรหัสผ่านที่เดายาก'
node admin-server.js
```

จากนั้นเปิด:

```text
http://127.0.0.1:8787/admin-console.html
```

ความสามารถ:

1. ล็อกอินด้วยรหัสผ่านจาก `SSD4_ADMIN_PASSWORD`
2. เพิ่มข่าวใหม่ผ่านฟอร์ม
3. สร้างหน้าข่าวเฉพาะในโฟลเดอร์ `news/`
4. อัปเดตข้อมูลกลาง `assets/data/news-data.js`
5. อัปเดต `sitemap.xml`
6. กด `Commit & Push` เพื่อเผยแพร่ขึ้น GitHub Pages

ข้อควรระวัง:

- server bind ที่ `127.0.0.1` เป็นค่าเริ่มต้น ไม่ควรเปิด public โดยตรง
- ต้องตรวจสอบข้อมูลส่วนบุคคล รูปภาพ และถ้อยคำทางกฎหมายก่อนเผยแพร่
- หากต้องการใช้งานผ่านอินเทอร์เน็ตจริง ควรวางหลัง HTTPS, reverse proxy, firewall และบัญชีผู้ใช้จริง

## ระบบร่างข่าวแบบ static

หน้า `admin.html` ใช้ร่างข่าวในเครื่องและส่งออกไฟล์ `news-data.js` สำหรับนำไปเผยแพร่จริงบน GitHub Pages ข้อมูลร่างถูกเก็บใน `localStorage` ของเบราว์เซอร์ผู้ใช้ ไม่ได้ถูกส่งขึ้นเซิร์ฟเวอร์

ขั้นตอนเผยแพร่ข่าวใหม่:

1. เปิด `admin.html`
2. กรอกหมวดข่าว หัวข้อ วันที่ พื้นที่ สรุปข่าว รูปปก และลิงก์ข่าวเต็ม
3. ติ๊กยืนยันว่าตรวจข้อมูลส่วนบุคคลแล้ว
4. กดบันทึกร่าง
5. กด `ส่งออก news-data.js`
6. นำไฟล์ที่ดาวน์โหลดไปแทนที่ `assets/data/news-data.js`
7. สร้างหน้า HTML ข่าวเต็มในโฟลเดอร์ `news/` ตามลิงก์ที่กรอก
8. commit และ push เพื่อให้ GitHub Pages เผยแพร่
