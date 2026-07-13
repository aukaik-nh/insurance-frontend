# 🛡️ ประกันคุ้มภัย — ระบบจัดการกรมธรรม์ประกันภัย

ระบบ full-stack สำหรับตัวแทน/นายหน้าประกันภัย ใช้จัดการกรมธรรม์รถยนต์ พ.ร.บ. อัคคีภัย และประกันเบ็ดเตล็ด
จุดเด่นคือ **AI อ่านข้อมูลจากไฟล์ PDF กรมธรรม์อัตโนมัติ** + สร้างใบแจ้งหนี้/ใบเสนอราคาได้ในตัว

> เอกสารนี้คือคู่มือฉบับเต็มสำหรับผู้ที่จะรับช่วงต่อ — อ่านจบแล้วควรเข้าใจทั้งระบบและเริ่มแก้โค้ดได้ทันที

---

## สารบัญ

1. [ภาพรวมสถาปัตยกรรม](#1-ภาพรวมสถาปัตยกรรม)
2. [Tech Stack](#2-tech-stack)
3. [โครงสร้างไฟล์ทั้งหมด](#3-โครงสร้างไฟล์ทั้งหมด)
4. [รายละเอียดแต่ละหน้า (Pages)](#4-รายละเอียดแต่ละหน้า-pages)
5. [Components](#5-components)
6. [Core Modules](#6-core-modules)
7. [Backend API Contract](#7-backend-api-contract)
8. [ระบบ Auth](#8-ระบบ-auth)
9. [กลยุทธ์การจัดการ PDF](#9-กลยุทธ์การจัดการ-pdf)
10. [Design System](#10-design-system)
11. [Deployment](#11-deployment)
12. [การรันบนเครื่อง (Local Dev)](#12-การรันบนเครื่อง-local-dev)
13. [Workflow การใช้งานจริง](#13-workflow-การใช้งานจริง)
14. [Scripts](#14-scripts)
15. [Tech Debt และแผนอนาคต](#15-tech-debt-และแผนอนาคต)
16. [Checklist สำหรับผู้รับช่วงต่อ](#16-checklist-สำหรับผู้รับช่วงต่อ)

---

## 1. ภาพรวมสถาปัตยกรรม

```
┌─────────────────┐      HTTPS + JWT       ┌──────────────────┐       ┌─────────────┐
│    Frontend     │ ─────────────────────► │   Backend API    │ ────► │  Supabase   │
│    (Vercel)     │                        │  (Render free)   │       │  Storage    │
│  React + Vite   │ ◄───────────────────── │  Python/FastAPI  │       │  (ไฟล์ PDF)  │
└─────────────────┘                        └──────────────────┘       └─────────────┘
                                                    │
                                                    ├──► Postgres (Supabase) — ข้อมูลกรมธรรม์
                                                    └──► Claude / OpenAI — อ่านข้อมูลจาก PDF
```

| ส่วน | Repo | Deploy | URL |
|---|---|---|---|
| Frontend | `aukaik-nh/insurance-frontend` | Vercel (auto-deploy จาก `main`) | — |
| Backend | `aukaik-nh/insurance-backend` | Render free tier (auto-deploy จาก `main`) | `https://insurance-backend-c2s2.onrender.com` |

**ตัวแปร env สำคัญฝั่ง frontend:**

```
VITE_API_URL=https://insurance-backend-c2s2.onrender.com/api
```

> ⚠️ **Render free tier spin-down** — backend หลับหลังไม่มี traffic ~15 นาที ตื่นใหม่ใช้เวลา ~50 วินาที
> โค้ด frontend หลายจุดถูกออกแบบมารับมือเรื่องนี้โดยเฉพาะ (ดูหัวข้อ [ระบบ Auth](#8-ระบบ-auth) และ [Deployment](#11-deployment))
> **ห้ามลบ logic พวก retry / health probe / keep-alive โดยไม่เข้าใจว่ามีไว้ทำไม**

---

## 2. Tech Stack

### Frontend

| สิ่งที่ใช้ | เวอร์ชัน | หน้าที่ |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | dev server + bundler |
| react-router-dom | 7 | routing (BrowserRouter) |
| axios | 1.x | HTTP client (มี interceptor แนบ JWT) |
| qrcode | 1.5 | สร้าง QR PromptPay |
| TailwindCSS | 4 (ผ่าน `@tailwindcss/vite`) | ติดตั้งแล้วแต่ **ยังใช้น้อย** — สไตล์หลักอยู่ใน `src/styles.js` |

### Backend (repo แยก — สรุปจากมุมมอง frontend)

- Python + FastAPI, รันใน Docker บน Render
- Postgres + Storage บน Supabase
- เรียก Claude/OpenAI เพื่อดึงข้อมูลจากไฟล์ PDF (endpoint `/preview-pdf`)
- สร้าง PDF ใบแจ้งหนี้ (endpoint `/invoice/generate`)

---

## 3. โครงสร้างไฟล์ทั้งหมด

```
insurance-frontend/
├── index.html               # preconnect ไป backend+R2 กัน cold start, preload โลโก้
├── package.json
├── vite.config.js           # Vite + React + Tailwind plugin
├── vercel.json              # SPA rewrite — ทุก path → index.html
├── eslint.config.js
├── .env.development         # VITE_API_URL สำหรับ dev
├── .env.production          # VITE_API_URL ชี้ Render
├── .claude/launch.json      # config dev server สำหรับ Claude Code preview
├── public/
│   ├── logo_no_bg.png       # โลโก้หลัก (ใช้ทั้ง favicon + navbar + เอกสาร)
│   ├── logo.png, image.png, favicon.svg, icons.svg
├── scripts/
│   └── bulk_upload.mjs      # อัปโหลด PDF ทีละโฟลเดอร์ผ่าน API
└── src/
    ├── main.jsx             # entry — ping /health ปลุก backend ก่อน user login
    ├── App.jsx              # (482 บรรทัด) root: auth gate + layout + routes + keep-alive
    ├── api.js               # axios instance + JWT interceptor + 401 auto-logout
    ├── styles.js            # (2,899 บรรทัด) CSS ทั้งแอปเป็น string เดียว inject ใน <style>
    ├── icons.jsx            # SVG icon paths (Heroicons) — ใช้ผ่าน <Ico n="doc" s={20}/>
    ├── helpers.js           # (225 บรรทัด) utils กลาง — ดูรายละเอียดข้างล่าง
    ├── pdfUtils.js          # (161 บรรทัด) PDF blob cache + เลือก URL ที่เร็วสุด
    ├── promptpay.js         # EMVCo payload generator สำหรับ QR พร้อมเพย์
    ├── index.css, App.css   # base CSS (แทบไม่ใช้ — ของจริงอยู่ styles.js)
    ├── pages/
    │   ├── LoginPage.jsx        # (173)  login + retry 3 ครั้งกัน cold start
    │   ├── ListPage.jsx         # (894)  dashboard / รายการ / ใกล้หมดอายุ — หน้าเดียว 3 tab
    │   ├── DetailPage.jsx       # (1,267) รายละเอียด + แก้ไข + PDF + เอกสารแนบ
    │   ├── UploadPage.jsx       # (434)  ลาก PDF → AI อ่าน → ฟอร์ม → บันทึก
    │   ├── ManualPage.jsx       # (75)   บันทึกกรมธรรม์เองโดยไม่มี PDF
    │   ├── InvoicePage.jsx      # (906)  สร้างใบแจ้งหนี้ DEBIT NOTE + QR PromptPay
    │   ├── QuotationPage.jsx    # (548)  ใบเสนอราคาแบบคุ้มภัย — แก้ inline ตรงตัวอักษรสีชมพู
    │   ├── PolicyList.jsx       # ⚠️ dead code — ไม่มี route ชี้มาแล้ว ลบได้
    │   ├── Upload.jsx           # ⚠️ dead code — เวอร์ชันเก่าของ UploadPage ลบได้
    │   └── DetailPage.jsx.tmp.* # ⚠️ ไฟล์ temp ค้าง ลบได้
    └── components/
        ├── Toast.jsx            # (16)  แจ้งเตือนมุมจอ auto-dismiss
        ├── QrCode.jsx           # (24)  wrap lib qrcode → <canvas>
        ├── PdfPreview.jsx       # (29)  iframe แสดง PDF
        ├── PdfLightbox.jsx      # (63)  modal PDF เต็มจอ
        ├── FormPanel.jsx        # (51)  section ฟอร์มพับได้
        ├── PolicyForm.jsx       # (111) ฟอร์มกรมธรรม์ (โครงสร้าง field มาจาก F_SECS)
        ├── PolicyTable.jsx      # (205) ตารางกรมธรรม์ + sort + badge สถานะ
        ├── PremiumGrid.jsx      # (332) ตารางกรอกเบี้ย + คำนวณอากร/VAT อัตโนมัติ
        ├── PreviewPanel.jsx     # (324) แผงขวาแสดง PDF + ข้อมูลเมื่อเลือกแถว
        └── AttachmentsCard.jsx  # (512) จัดการไฟล์แนบ (พ.ร.บ./สลักหลัง) upload/แทนที่/ลบ
```

รวมโค้ด frontend ~**10,200 บรรทัด**

---

## 4. รายละเอียดแต่ละหน้า (Pages)

Routes ทั้งหมดประกาศใน [src/App.jsx](src/App.jsx) — ทุกหน้ายกเว้น List/Login เป็น **lazy load** + มี **prefetch on hover** ที่เมนู (ชี้เมาส์ที่เมนูแล้ว chunk โหลดล่วงหน้า กดแล้วเปิดทันที)

### `/` `/policies` `/expiring` — ListPage (tab: dashboard / policies / expiring)

หน้าเดียวรับ prop `tab` สามค่า:

- **dashboard** — สถิติรวม, การ์ดแยกประเภทกรมธรรม์ 4 กลุ่ม (motor / prb / fire / pa), รายการใกล้หมดอายุ
- **policies** — ตารางกรมธรรม์ทั้งหมด: ค้นหา, filter (สถานะ / ช่วงวันที่ / มี-ไม่มี PDF), sort, pagination (10 แถว/หน้า), มี quick-preset ช่วงวันที่ (วัน/อาทิตย์/เดือน)
- **expiring** — เลือกช่วงหมดอายุ 1 วัน / 1 อาทิตย์ / 1-3 เดือน / หมดอายุแล้ว

จุดสำคัญ:
- **dedup ลูกค้า** — 1 ลูกค้าแสดง 1 แถว (ฉบับปีล่าสุด) แม้มีหลายคัน/หลายปี ที่เหลือดูในหน้า detail (ฟังก์ชัน `dedupLatestByCustomer` ใน helpers.js)
- hover แถว → prefetch ข้อมูล + PDF ล่วงหน้า
- โหลดทั้งหมด (limit 20000) แยกอีกก้อนไว้ทำ analytics บน dashboard
- cache ผลใน `localStorage` key `policies-cache:*` (ล้างตอน logout)

### `/policies/:id` — DetailPage (ไฟล์ใหญ่สุด 1,267 บรรทัด)

- แสดง/แก้ไขข้อมูลกรมธรรม์ inline ทุก field (โครงสร้าง field ตาม `F_SECS` + label ตาม `F_LBL` ใน helpers.js)
- PDF preview ฝั่งขวา (sticky) + lightbox ดับเบิลคลิกดูเต็มจอ + เปลี่ยนชื่อไฟล์ + อัปโหลดแทนที่ + ลบ PDF
- **Related PDFs** — ค้นกรมธรรม์อื่นของลูกค้าชื่อเดียวกัน (ทุกคัน ทุกปี) แสดงเป็นรายการให้สลับดู
- เอกสารแนบ (พ.ร.บ. / สลักหลัง) ผ่าน `AttachmentsCard`
- quick-search ด้านบน — พิมพ์แล้วเด้งไปกรมธรรม์อื่นได้ทันที
- ปุ่มสร้างใบแจ้งหนี้ → เปิด `/invoice?policy_id=X` แบบ pre-fill
- ลบกรมธรรม์ (มี confirm)

### `/upload` — UploadPage

flow อัปโหลดหลัก:

1. ลากไฟล์ PDF ลงมา (หรือคลิกเลือก) — ไฟล์อยู่ใน browser ยังไม่อัปขึ้น server
2. เรียก `POST /preview-pdf` → AI อ่านข้อมูล → เติมลงฟอร์มอัตโนมัติ
3. ชื่อไฟล์ตั้งอัตโนมัติตามข้อมูล (`computeDisplayFilename` — ถ้า user แก้เองจะหยุด auto)
4. เพิ่มไฟล์ พ.ร.บ. คู่กันได้ในหน้าเดียว (AI อ่านแยกอีกไฟล์)
5. กดบันทึก → อัป PDF ขึ้น storage (`/upload-pdf-only`) → `POST /save-policy` → แนบ พ.ร.บ. เป็น attachment → เด้งไปหน้า detail

### `/manual` — ManualPage

ฟอร์มเปล่าสำหรับกรมธรรม์ที่ไม่มีไฟล์ PDF → `POST /save-policy` ตรง ๆ

### `/invoice` — InvoicePage

สร้าง**ใบแจ้งหนี้ (DEBIT NOTE)** เลย์เอาต์เหมือนเอกสารจริงของ บมจ. คุ้มภัยโตเกียวมารีน:

- 2 template: `tm1` (แบบสั้น) / `tm2` (แบบละเอียด + ข้อมูลรถ)
- เปิดจากหน้า detail จะ pre-fill จาก policy อัตโนมัติ (`?policy_id=`)
- คำนวณอัตโนมัติ: อากรแสตมป์ 0.4% ปัดขึ้นบาทเต็ม (override ได้), VAT 7%
- ใส่เบอร์พร้อมเพย์ → gen QR จริง สแกนจ่ายได้ (`promptpay.js`)
- มี live preview ฝั่งขวา, กด "สร้าง PDF" → `POST /invoice/generate` ฝั่ง **backend เป็นคน render PDF** → เปิด tab ใหม่
- ⚠️ เทคนิคสำคัญ: `window.open("")` ถูกเรียก**ก่อน** `await` เพื่อไม่โดน popup blocker

### `/quotation` — QuotationPage ⭐ (เพิ่มล่าสุด ก.ค. 2569)

สร้าง**ใบเสนอราคาประกันภัยรถยนต์** เลียนแบบเอกสารคุ้มภัยต้นฉบับแบบ 1:1:

- **ไม่มีฟอร์มแยก — ทั้งหน้าคือตัวเอกสารเลย** ตัวอักษร**สีชมพู** (`#d63384` ตรงกับสีในเอกสารจริง) ทุกจุดคือ `<input>` คลิกแก้ได้ทันที รวม 43 ช่อง: ชื่อลูกค้า, ข้อมูลรถ, แคมเปญ, ทุนประกัน, เบี้ยทุกช่อง, ความคุ้มครองทุกรายการ, ตัวแทน
- แถว "เบี้ยรวม พ.ร.บ." **คำนวณอัตโนมัติ** (สมัครใจ + พ.ร.บ.)
- ปุ่ม "คำนวณเบี้ยรวม" — auto-sum สุทธิ+อากร+VAT ลงช่องเบี้ยรวม
- ปุ่ม "พิมพ์ / บันทึก PDF" — ใช้ `window.print()` + `@media print` CSS: ซ่อน nav/ปุ่ม, ตัดเส้นประใต้ input ออกให้เหมือนเอกสารจริง, ตั้งค่า A4
- ต่างจาก invoice ตรงที่ **render ฝั่ง browser ล้วน ไม่เรียก backend**

### LoginPage (ไม่มี route — แสดงเมื่อไม่มี token)

- retry อัตโนมัติสูงสุด 3 ครั้ง (เฉพาะ network error / 5xx — ไม่ retry รหัสผิด) timeout ครั้งละ 30 วิ ครอบคลุม cold start
- ข้อความ error แยกชัด: เซิร์ฟเวอร์กำลังตื่น / รหัสผิด / เซิร์ฟเวอร์ล่ม

---

## 5. Components

| Component | ใช้ที่ไหน | รายละเอียด |
|---|---|---|
| `Toast` | ทุกหน้า (ผ่าน `notify()` ใน outlet context) | แจ้งเตือน success/error มุมจอ |
| `QrCode` | InvoicePage | รับ payload string → วาด QR ลง canvas |
| `PdfPreview` | Upload/Detail | iframe ธรรมดา รับ blob URL |
| `PdfLightbox` | Upload/Detail | modal เต็มจอ ปิดด้วย Esc/คลิกพื้นหลัง |
| `FormPanel` | UploadPage | หัวข้อ section พับ-กางได้ |
| `PolicyForm` | Upload/Manual | วน render input ตาม `F_SECS` schema |
| `PolicyTable` | ListPage | ตาราง + sort คลิกหัวคอลัมน์ + badge สถานะ/ประเภท + chip จำนวนฉบับประวัติ |
| `PremiumGrid` | Upload/Detail | กรอกเบี้ย → คำนวณอากร 0.4% / VAT 7% / ยอดรวม / คอมมิชชั่น อัตโนมัติ |
| `PreviewPanel` | ListPage | แผงขวา: ข้อมูลย่อ + PDF + กรมธรรม์อื่นทะเบียนเดียวกัน |
| `AttachmentsCard` | DetailPage | CRUD ไฟล์แนบ + แปลง attachment ↔ main PDF |

---

## 6. Core Modules

### [src/api.js](src/api.js) — HTTP client

```js
import api from "../api"
await api.get("/policies", { params: {...} })
```

- แนบ `Authorization: Bearer <token>` จาก localStorage อัตโนมัติทุก request
- response 401 → ล้าง token + reload (จะเห็นหน้า login) — **ยกเว้น** 401 จาก `/auth/login` เอง (แปลว่ารหัสผิด ต้องโชว์ error ไม่ใช่ reload)

### [src/helpers.js](src/helpers.js) — utilities กลาง

| ฟังก์ชัน | ทำอะไร |
|---|---|
| `getStatus(end, start)` | คืน `{cls, label}` — คุ้มครองอยู่ / หมดใน N วัน / หมดอายุแล้ว / เริ่มอีก N วัน (กรณี book ล่วงหน้า) |
| `fmtDate(iso)` | `"2025-06-24"` → `"24 มิ.ย. 2568"` (พ.ศ.) |
| `baht(n)` | format เงิน 2 ตำแหน่ง comma ไทย |
| `POLICY_TYPE_LABEL` | map รหัสประเภท → ชื่อไทย (`M`=ประกันรถยนต์, `P`=พ.ร.บ., `FIRE`, `PA`, `TA`, ...) |
| `policyTypeCategory(t)` | จัด 4 กลุ่มสี: motor / prb / fire / pa (ใช้กับ badge + dashboard) |
| `computeDisplayFilename({...})` | ตั้งชื่อไฟล์ PDF ตาม convention — **mirror logic ฝั่ง backend** ต้องแก้คู่กันเสมอ |
| `dedupLatestByCustomer(rows)` | จัดกลุ่มตามชื่อลูกค้า → คืนฉบับล่าสุด/กลุ่ม + `_historyCount` |
| `F_SECS` / `F_LBL` | schema ของฟอร์มกรมธรรม์ — **จุดเดียวที่นิยาม field ทั้งหมด** เพิ่ม field ใหม่ให้แก้ที่นี่ |

**convention ชื่อไฟล์ PDF:**

| ประเภท | รูปแบบ |
|---|---|
| พ.ร.บ. | `{ทะเบียน} พรบ.{ปีพ.ศ.2หลัก}.pdf` |
| ประกันรถยนต์ (M/STY) | `{ทะเบียน} กธ.{YY}.pdf` |
| อัคคีภัย/ทรัพย์สิน | `{ที่อยู่ 40 ตัวแรก} กธ.{YY}.pdf` |
| PA/TA/เบ็ดเตล็ด | `{ชื่อผู้เอาประกัน} กธ.{YY}.pdf` |

### [src/pdfUtils.js](src/pdfUtils.js) — PDF loading

- `getPdfUrl(policy, apiBase)` — เลือก URL ที่เร็วสุด (ดู [หัวข้อ 9](#9-กลยุทธ์การจัดการ-pdf))
- blob cache ระดับ module: LRU สูงสุด 12 ไฟล์ + dedupe request ที่กำลังโหลดซ้ำ (hover แล้วคลิกไม่ยิงสองรอบ)
- `prefetchPdf(url)` — ใช้ตอน hover แถวในตาราง

### [src/promptpay.js](src/promptpay.js)

`generatePromptPayPayload(target, amount)` — สร้าง EMVCo payload สำหรับ QR พร้อมเพย์
รองรับเบอร์โทร 10 หลัก / บัตรประชาชน 13 หลัก / e-wallet 15 หลัก + CRC16 checksum
(port มาจาก `services/invoice_generator.py` ฝั่ง backend — สอง implementation ต้องให้ผลตรงกัน)

### [src/styles.js](src/styles.js) — CSS ทั้งแอป (2,899 บรรทัด)

CSS string เดียว inject ผ่าน `<style>{CSS}</style>` ใน App.jsx — ครอบคลุม theme variables, layout, ทุก component class, dark mode, responsive ทั้งหมด

### [src/icons.jsx](src/icons.jsx)

```jsx
<Ico n="doc" s={20} />   // n = ชื่อไอคอน, s = ขนาด px
```
เก็บ SVG path ของ Heroicons ~50 ตัวใน object เดียว

---

## 7. Backend API Contract

Base: `{VITE_API_URL}` = `https://insurance-backend-c2s2.onrender.com/api`
ทุก endpoint ต้องมี `Authorization: Bearer <JWT>` ยกเว้นที่ระบุ

### Auth / Health

| Method | Path | Body/Params | หมายเหตุ |
|---|---|---|---|
| POST | `/auth/login` | `{username, password}` → `{token}` | ไม่ต้อง token |
| GET | `{origin}/health` | — | ไม่ต้อง token, อยู่**นอก** `/api` — ใช้ปลุก/เช็ค backend |

### Policies

| Method | Path | รายละเอียด |
|---|---|---|
| GET | `/policies` | params: `page, limit, search, sort, order, status, type, has_pdf, date_from, date_to` → `{items, total}` |
| GET | `/policies/:id` | รายละเอียดเต็ม |
| PUT | `/policies/:id` | partial update — ส่งเฉพาะ field ที่แก้ |
| DELETE | `/policies/:id` | ลบทั้ง record |
| POST | `/save-policy` | สร้างใหม่ (มี/ไม่มี PDF ก็ได้) |

### PDF

| Method | Path | รายละเอียด |
|---|---|---|
| POST | `/preview-pdf` | FormData ไฟล์ → AI อ่าน คืน JSON ข้อมูล **ไม่บันทึก** |
| POST | `/upload-pdf-only` | FormData ไฟล์ → อัปขึ้น storage คืน `{pdf_url, pdf_filename, pdf_size}` |
| GET | `/policies/:id/pdf` | stream ไฟล์ (fallback เมื่อไม่มี public URL) |
| DELETE | `/policies/:id/pdf` | ลบเฉพาะไฟล์ ไม่ลบข้อมูล |

### Attachments (พ.ร.บ. / สลักหลัง)

| Method | Path |
|---|---|
| GET / POST | `/policies/:id/attachments` |
| PUT / DELETE | `/policies/:id/attachments/:attId` |

### Invoice

| Method | Path | รายละเอียด |
|---|---|---|
| POST | `/invoice/generate` | body: template + buyer/seller + items + extra_fees + promptpay_target + field tm1/tm2 → **คืน PDF binary** (`responseType: "blob"`) |

### Field หลักของ policy record

`policy_number, company_code, app_number, policy_type, new_renew, insured_name, insured_address, phone, agent_code, broker_name, broker_license, license_plate, license_province, chassis_no, car_make, car_model, car_year, sum_insured, coverage_start, coverage_end, date_notify, date_cancel, date_policy_receive, net_premium, stamp_duty, vat, total_premium, third_party_per_person, third_party_per_accident, own_damage, prepaid_tax_1pct, commission_pct, commission_baht, wht_10pct, rounding, collected_amount, notes, pdf_url, pdf_filename, pdf_size`

---

## 8. ระบบ Auth

- JWT เก็บใน `localStorage.auth_token` — ไม่มี refresh token, หมดอายุแล้วต้อง login ใหม่
- **App.jsx (root):** ถ้าไม่มี token → แสดง LoginPage (นอก Router), login สำเร็จ → เก็บ token + mount Router
- **เช็คหมดอายุ:** ทุกครั้งที่ tab กลับมา visible → decode `payload.exp` → หมดแล้ว logout ทันที (ไม่ต้องรอ API ตอบ 401)
- **Logout:** ลบ token + ล้าง cache `policies-cache:*` ทั้งหมด (กันข้อมูลค้างข้าม account)

### กลไกรับมือ Render cold start (4 ชั้น)

1. [index.html](index.html) — `<link rel="preconnect">` เปิด TCP+TLS กับ backend ตั้งแต่ parse HTML
2. [main.jsx](src/main.jsx) — `fetch /health` ทันทีที่ JS โหลด (ปลุกก่อน user ทัน login)
3. [App.jsx](src/App.jsx) Layout — probe `/health` 12 ครั้ง × (8s timeout + 2s delay) ≈ window 120 วิ → แสดงจุดสถานะบน nav: 🟡 กำลังปลุก / 🟢 พร้อม / 🔴 ไม่ตอบสนอง + probe ใหม่ทุกครั้งที่ tab กลับมา visible
4. [App.jsx](src/App.jsx) root — keep-alive ping ทุก 10 นาที (เฉพาะ tab visible) กัน spin-down ระหว่างใช้งาน
5. [LoginPage.jsx](src/pages/LoginPage.jsx) — retry login สูงสุด 3 ครั้ง เฉพาะ network error/5xx

---

## 9. กลยุทธ์การจัดการ PDF

**เลือก URL (getPdfUrl):**

```
มี pdf_url แบบ Supabase public (มี /storage/v1/object/public/)?
  ├─ ใช่ → โหลดจาก Supabase CDN ตรง (เร็วสุด, ไม่ผ่าน Render, ไม่ต้องแนบ JWT)
  └─ ไม่ → GET /api/policies/:id/pdf ผ่าน backend (รองรับ base64 เก่า / legacy)
```

**Cache:** blob URL cache แบบ LRU 12 รายการ + dedupe in-flight — เข้าๆ ออกๆ หน้าเดิมไม่โหลดซ้ำ, hover ตารางแล้ว prefetch ล่วงหน้า

**ข้อควรระวัง:** Supabase public URL **ห้ามแนบ** header Authorization (จะโดน reject + browser ไม่ใช้ disk cache) — โค้ดใน pdfUtils จัดการให้แล้ว

---

## 10. Design System

สไตล์ทั้งหมดอยู่ใน [src/styles.js](src/styles.js) — CSS variables + class names

### Theme tokens

```css
/* Light (default) */
--blue: #319795        /* primary teal — สี branding "คุ้มภัย" */
--blue-bg: #E6FFFA     /* พื้นหลัง active/selected */
--sur: #FFFFFF  --sur2: #F7F8FA        /* surfaces */
--brd: #E3E5EA  --brd2: #C5CAD3        /* borders */
--t1: #0B1020   --t2: #3A4253  --t3: #6B7383   /* text ลำดับความเข้ม */
--amber: #B45309  --red: #DC2626        /* warning / error */

/* Dark — override ผ่าน body.dark */
```

Dark mode: toggle บน navbar → `body.classList.toggle("dark")` + เก็บใน `localStorage.theme`

### Class สำคัญ

| Class | ใช้ทำอะไร |
|---|---|
| `.page-wrap` `.page-hd` `.page-body` | โครงหน้า: header bar (ปุ่มกลับ+ชื่อ+ปุ่มขวา) + เนื้อหา |
| `.detail-split` | grid 2 คอลัมน์ `1fr / 1.15fr` — ฟอร์มซ้าย preview ขวา |
| `.detail-aside` | คอลัมน์ขวา sticky (`top:84px`) |
| `.info-card` `.info-card-hd` `.info-card-bd` | การ์ด section ฟอร์ม |
| `.info-row` (`.fw` = เต็มแถว) `.info-field` `.info-label` | grid 2 ช่องใน card |
| `.btn .btn-b` | ปุ่มหลัก gradient teal |
| `.btn .btn-w` | ปุ่มรอง outline |
| `.bnr .er` | error banner |
| `.b-on .b-soon .b-off .b-pending` | badge สถานะกรมธรรม์ (เขียว/เหลือง/แดง/เทา) |

### Responsive

Breakpoint หลัก **900px** — `.detail-split` ยุบเป็นคอลัมน์เดียว, ตารางเลื่อนแนวนอนใน container, ปุ่ม header ซ่อน label เหลือไอคอน (`≤520px`)

### ฟอนต์เอกสาร (invoice/quotation)

เอกสารทางการใช้ `'Sarabun','Noto Sans Thai',sans-serif` บนพื้นขาวเสมอ (ไม่ตาม dark mode) — สีชมพูฟิลด์แก้ไขได้ = `#d63384`

---

## 11. Deployment

### Frontend — Vercel

- push ขึ้น `main` → deploy อัตโนมัติ ไม่มีขั้นตอนเพิ่ม
- [vercel.json](vercel.json) มี SPA rewrite แล้ว (ทุก path → index.html — จำเป็นสำหรับ BrowserRouter)
- ตั้ง env `VITE_API_URL` ใน Vercel dashboard (และใน `.env.production` สำหรับ build local)

### Backend — Render free tier

- Docker service `insurance-backend` — dashboard: `https://dashboard.render.com/web/srv-d86fn1q8qa3s73ffo6m0`
- push `main` ของ repo backend → deploy อัตโนมัติ
- **ปัญหาที่เคยเจอ:** Docker build cache ค้าง โค้ดใหม่ไม่ขึ้น → แก้ด้วย Manual Deploy → **"Clear build cache & deploy"**
- โควตา free tier: 750 ชม./เดือน/workspace

---

## 12. การรันบนเครื่อง (Local Dev)

```powershell
cd D:\insurance-frontend
npm install
npm run dev        # → http://localhost:5173
```

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server + HMR |
| `npm run build` | production build → `dist/` |
| `npm run preview` | serve ตัว build |
| `npm run lint` | ESLint |

**ชี้ backend:**
- default (ไม่ตั้ง env): `http://localhost:8000/api` — ต้องรัน backend local
- หรือแก้ `.env.development` ชี้ Render production ได้เลย (ใช้ข้อมูลจริง — ระวัง)

**สำหรับ Claude Code:** มี [.claude/launch.json](.claude/launch.json) config ชื่อ `vite` แล้ว — ใช้ browser preview ทดสอบได้ทันที

---

## 13. Workflow การใช้งานจริง

### เพิ่มกรมธรรม์ใหม่จาก PDF
`/upload` → ลากไฟล์ → AI เติมฟอร์ม → ตรวจ/แก้ → (เพิ่มไฟล์ พ.ร.บ. คู่กันได้) → บันทึก → เด้งไปหน้า detail

### หาลูกค้า + ดูประวัติ
หน้า list ค้นชื่อ/ทะเบียน → คลิกแถว → detail แสดงกรมธรรม์ทุกฉบับของลูกค้าคนนั้น (ทุกคัน ทุกปี) ใน Related PDFs

### ต่ออายุ / เช็คงานใกล้หมด
เมนู "ใกล้หมดอายุ" → เลือกช่วง (1 วัน – 3 เดือน) → โทรตามลูกค้า → พอได้กรมธรรม์ใหม่ก็อัปโหลดตามปกติ (ระบบ dedup จะแสดงปีล่าสุดแทนเอง)

### ออกใบแจ้งหนี้
detail → "สร้างใบแจ้งหนี้" → ฟอร์ม pre-fill → เลือก tm1/tm2 → ใส่เบอร์พร้อมเพย์ (ได้ QR จ่ายจริง) → สร้าง PDF (backend render) → เปิด tab ใหม่ ส่งลูกค้าได้เลย

### ออกใบเสนอราคา
เมนู "ใบเสนอราคา" → คลิกแก้ตัวอักษรสีชมพูตรง ๆ บนเอกสาร → "คำนวณเบี้ยรวม" → "พิมพ์ / บันทึก PDF" (browser print → Save as PDF)

---

## 14. Scripts

### [scripts/bulk_upload.mjs](scripts/bulk_upload.mjs) — อัปโหลด PDF ยกโฟลเดอร์

```powershell
$env:API_URL  = "https://insurance-backend-c2s2.onrender.com/api"
$env:USERNAME = "..."
$env:PASSWORD = "..."
$env:PDF_DIR  = "C:\path\to\pdfs"
$env:DRY_RUN  = "1"     # optional: ทดสอบ AI อ่านอย่างเดียว ไม่บันทึก
node scripts/bulk_upload.mjs
```

login → วนทีละไฟล์: preview (AI อ่าน) → upload → save — delay 800ms/ไฟล์ (ปรับผ่าน `DELAY_MS`)

---

## 15. Tech Debt และแผนอนาคต

| ลำดับ | รายการ | รายละเอียด |
|---|---|---|
| 1 | ลบ dead code | `pages/PolicyList.jsx`, `pages/Upload.jsx`, `pages/DetailPage.jsx.tmp.*` — ไม่มีอะไรอ้างถึงแล้ว |
| 2 | แตก `DetailPage.jsx` (1,267 บ.) | ควรแยก: edit form / PDF panel / related list เป็น component ย่อย |
| 3 | จัดการ `styles.js` (2,899 บ.) | แยกไฟล์ตามโซน หรือย้ายไป Tailwind เต็มตัว (plugin ติดตั้งพร้อมแล้ว) |
| 4 | ไม่มี TypeScript | schema ระหว่าง front-back ไม่มีอะไรบังคับ — แก้ field ต้องไล่เช็คเอง (`F_SECS`/`F_LBL` คือ source of truth ฝั่ง front) |
| 5 | ไม่มี test | แนะนำ Vitest + React Testing Library เริ่มจาก helpers.js (pure functions ทดสอบง่าย) |
| 6 | Quotation ยัง print ฝั่ง browser | ถ้าอยากได้ PDF คุณภาพคงที่เหมือน invoice → เพิ่ม endpoint `POST /quotation/generate` ฝั่ง backend แล้ว submit แบบเดียวกับ InvoicePage |
| 7 | `computeDisplayFilename` มี 2 ที่ | ฝั่ง front (helpers.js) mirror ฝั่ง back (`_make_display_filename`) — แก้ฝั่งหนึ่งต้องแก้อีกฝั่งเสมอ |
| 8 | `promptpay.js` มี 2 ที่ | เช่นกัน — mirror `services/invoice_generator.py` |

---

## 16. Checklist สำหรับผู้รับช่วงต่อ

- [ ] ขอสิทธิ์เข้าถึง 2 repos: `insurance-frontend`, `insurance-backend` (GitHub user: `aukaik-nh`)
- [ ] ขอสิทธิ์ Vercel project (frontend) + Render dashboard (backend `srv-d86fn1q8qa3s73ffo6m0`)
- [ ] ขอสิทธิ์ Supabase project (Postgres + Storage bucket) — credentials อยู่ใน env ฝั่ง backend
- [ ] เช็ค API key ของ Claude/OpenAI ใน Render env (ใช้ตอน AI อ่าน PDF)
- [ ] Clone + `npm install` + `npm run dev` → login ด้วย user ที่ได้รับ → ทดสอบ workflow ทั้ง 5 ในหัวข้อ 13
- [ ] อ่าน git log ล่าสุด (`git log --oneline -20`) เพื่อเห็นทิศทางงานช่วงหลัง
- [ ] ทำความเข้าใจกลไก cold start (หัวข้อ 8) ก่อนแตะโค้ด retry/probe ใด ๆ
- [ ] จด: **แก้ชื่อไฟล์/พร้อมเพย์ ต้องแก้ 2 ฝั่ง** (ข้อ 7-8 ใน Tech Debt)

---

*อัปเดตล่าสุด: กรกฎาคม 2569 (2026) — เอกสารนี้เขียนแทน README boilerplate เดิมของ Vite template*
