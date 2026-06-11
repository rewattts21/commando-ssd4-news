# Commando SSD4

โปรเจกต์เว็บไซต์เสนอข่าวผลการจับกุมและผลการปฏิบัติของ Commando SSD4 แบบ static เปิดใช้งานได้ทันทีจากไฟล์ `index.html`

## วิธีใช้งาน

1. เปิดไฟล์ `index.html` ในเบราว์เซอร์
2. แก้ข้อความข่าวจับกุม ภารกิจ หมวดข่าว และข้อมูลติดต่อใน `index.html`
3. เปลี่ยนภาพหลักได้ที่ `assets/hero-unit.png`
4. เปลี่ยนลิงก์โซเชียลได้ที่ส่วน `social-block` ใน `index.html`

## ไฟล์หลัก

- `index.html` โครงหน้าเว็บและเนื้อหา
- `styles.css` รูปแบบ สี และ responsive layout
- `script.js` เมนูมือถือ
- `assets/ssd4-live-hero.jpg` ภาพหลักของหน้าเว็บ
- `assets/ssd4-live-logo.jpg` ภาพโลโก้ในหัวเว็บ
- `assets/favicon.svg` ไอคอนเว็บและ browser tab
- `_headers` security headers สำหรับโฮสต์ที่รองรับ เช่น Netlify หรือ Cloudflare Pages
- `nginx-security.conf` security headers สำหรับ Nginx
- `SECURITY.md` แนวทางความปลอดภัยก่อนนำเว็บขึ้นใช้งานจริง
- `robots.txt` และ `sitemap.xml` สำหรับ search engine indexing
