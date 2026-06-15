# Commando SSD4

โปรเจกต์เว็บไซต์เสนอข่าวผลการจับกุมและผลการปฏิบัติของ Commando SSD4 แบบ static เปิดใช้งานได้บน GitHub Pages พร้อมหน้ารวมข่าวและระบบข้อมูลข่าวกลาง

## วิธีใช้งาน

1. เปิดไฟล์ `index.html` ในเบราว์เซอร์
2. เพิ่มหรือแก้ข่าวหลักใน `assets/data/news-data.js`
3. เปิด `admin.html` เพื่อร่างข่าวและส่งออกไฟล์ `news-data.js`
4. นำไฟล์ที่ส่งออกไปแทนที่ `assets/data/news-data.js`
5. commit และ push ขึ้น GitHub Pages

## ไฟล์หลัก

- `index.html` โครงหน้าเว็บและเนื้อหา
- `news.html` หน้ารวมข่าวพร้อมค้นหาและกรองหมวด
- `assets/data/news-data.js` ไฟล์ข้อมูลข่าวกลางที่หน้าเว็บอ่านร่วมกัน
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

## ระบบหลังบ้าน

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
