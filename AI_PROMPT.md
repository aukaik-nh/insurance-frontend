# AI CONTEXT PROMPT — ประกันคุ้มภัย (Insurance Management System)

> **วิธีใช้:** copy ทั้งไฟล์นี้วางเป็นข้อความแรกในเซสชัน AI ใหม่ แล้วต่อท้ายด้วยงานที่ต้องการทำ
> อัปเดตล่าสุด: กรกฎาคม 2026 — ถ้าโค้ดเปลี่ยนไปมาก ให้ AI ตรวจไฟล์จริงก่อนเชื่อเอกสารนี้

---

คุณคือ AI ผู้ช่วยพัฒนาระบบจัดการกรมธรรม์ประกันภัย "ประกันคุ้มภัย" ของตัวแทน/นายหน้าประกันภัยไทย
ตอบเป็น**ภาษาไทย** โค้ด/comment เขียนไทยได้ตามสไตล์เดิมของ codebase

# 1. ภาพรวมระบบ

ระบบมี 2 repo แยกกัน อยู่บนเครื่องเดียวกัน:

| | Path | Repo | Deploy |
|---|---|---|---|
| Frontend | `D:\insurance-frontend` | `aukaik-nh/insurance-frontend` | Vercel (auto จาก `main`) |
| Backend | `D:\insurance-backend` | `aukaik-nh/insurance-backend` | Render free tier Docker (auto จาก `main`) |

- Backend URL: `https://insurance-backend-c2s2.onrender.com` (frontend เรียกผ่าน `VITE_API_URL=.../api`)
- Render dashboard: `https://dashboard.render.com/web/srv-d86fn1q8qa3s73ffo6m0`
- CORS อนุญาต: `localhost:*`, `insuremgr.vercel.app`, `safetypc.vercel.app`

**⚠️ ความจริงสำคัญที่ชื่อหลอก:** โค้ด backend เต็มไปด้วยคำว่า "supabase" แต่**ของจริงไม่ได้ใช้ Supabase แล้ว** —
`services/supabase_shim.py` เป็น drop-in replacement ที่ต่อ **Neon Postgres** (env `NEON_URL`) + **Cloudflare R2** (env `R2_*`) แทน
ทุก `create_client(...)`, `supabase.table(...)`, `supabase.storage.from_(...)` ในโค้ดวิ่งผ่าน shim นี้ทั้งหมด
อย่าสับสน อย่าเพิ่ม dependency supabase จริงกลับเข้าไป

**⚠️ Render free tier spin-down:** backend หลับหลังไม่มี traffic ~15 นาที ตื่น ~50 วิ
Frontend มี logic รับมือ 5 ชั้น (ดูข้อ 4.2) — **ห้ามลบ retry/probe/keep-alive logic**

**ที่มาของข้อมูล:** migrate มาจากระบบเก่า Microsoft Access ชื่อ "Baby78" (มีสคริปต์ migrate .mdb เต็ม backend repo)
convention หลายอย่าง (ชื่อไฟล์ storage, การตั้งชื่อ) ตั้งใจเลียน Baby78 เดิม

---

# 2. Frontend — `D:\insurance-frontend`

## 2.1 Stack

React 19 + Vite 8 + react-router-dom 7 + axios + qrcode + TailwindCSS 4 (ติดตั้งแล้วแต่แทบไม่ใช้ — CSS จริงอยู่ `src/styles.js`)
ไม่มี TypeScript, ไม่มี test

## 2.2 ทุกไฟล์ใน src/

```
src/
├── main.jsx (15)         entry — fetch /health ปลุก backend ทันทีก่อน user login
├── App.jsx (482)         root ทั้งแอป:
│                          - auth gate: ไม่มี token ใน localStorage.auth_token → แสดง LoginPage นอก Router
│                          - Layout: topnav (โลโก้/เมนู/จุดสถานะ server/ปุ่ม dark/logout/hamburger mobile)
│                          - health probe 12 ครั้ง × (8s timeout + 2s delay) → จุด 🟡checking/🟢ready/🔴error
│                          - keep-alive ping /health ทุก 10 นาที (เฉพาะ tab visible)
│                          - เช็ค JWT exp ทุกครั้ง tab กลับมา visible → หมดอายุ = logout ทันที
│                          - lazy routes + prefetch chunk on hover เมนู
│                          - Outlet context: { search, setSearch, page, setPage, notify, setExpiringCount }
├── api.js (32)           axios instance: interceptor แนบ Bearer token / 401 → ลบ token + reload
│                          (ยกเว้น 401 จาก /auth/login = รหัสผิด ไม่ reload)
├── styles.js (2,899)     CSS ทั้งแอปเป็น template string inject ผ่าน <style> ใน App.jsx
│                          - CSS variables light/dark (body.dark), responsive breakpoint หลัก 900px
├── icons.jsx (63)        SVG paths (Heroicons) — ใช้ <Ico n="ชื่อ" s={ขนาด}/>
├── helpers.js (225)      utils กลาง:
│                          - getStatus(end,start) → {cls,label} คุ้มครองอยู่/หมดใน N วัน/หมดอายุ/เริ่มอีก N วัน
│                          - fmtDate(iso) → "24 มิ.ย. 2568" (พ.ศ.)
│                          - POLICY_TYPE_LABEL: M=ประกันรถยนต์ P=พ.ร.บ. FIRE/ASSET/IAR/BURGLAR=อัคคีภัยกลุ่ม
│                            PA/TA/3RD/PUBLIC/MISC/GOLF/MARINE=เบ็ดเตล็ดกลุ่ม STY=ประกันรถยนต์
│                          - policyTypeCategory() → 4 กลุ่มสี motor/prb/fire/pa
│                          - computeDisplayFilename() ⚠️ MIRROR ของ backend _make_display_filename — แก้ต้องแก้คู่
│                          - dedupLatestByCustomer(rows) → 1 ลูกค้า 1 แถว (ฉบับล่าสุด) + _historyCount
│                          - F_SECS / F_LBL = schema ฟอร์มกรมธรรม์ (จุดเดียวที่นิยาม field ทั้งหมดฝั่ง front)
├── pdfUtils.js (161)     - getPdfUrl(policy, apiBase): มี pdf_url เป็น public URL → ใช้ตรง (CDN)
│                            ไม่มี → fallback GET /api/policies/:id/pdf
│                          - blob cache LRU 12 + dedupe in-flight + prefetchPdf() ใช้ตอน hover
│                          ⚠️ public URL ห้ามแนบ Authorization header
├── promptpay.js (53)     EMVCo QR payload + CRC16 ⚠️ MIRROR ของ backend invoice_generator.py
├── pages/
│   ├── LoginPage.jsx (173)    login + retry อัตโนมัติ 3 ครั้ง (เฉพาะ network err/5xx, timeout 30s/ครั้ง)
│   ├── ListPage.jsx (894)     หน้าเดียว 3 tab ผ่าน prop:
│   │                           tab="dashboard" (/) สถิติ+การ์ด 4 ประเภท+ใกล้หมดอายุ
│   │                           tab="policies" (/policies) ตาราง+search+filter(สถานะ/วันที่/มีPDF)+sort+page(10แถว)
│   │                           tab="expiring" (/expiring) ช่วง 1วัน/7วัน/30/60/90/หมดแล้ว
│   │                           - โหลด 2 ก้อน: หน้าปัจจุบัน + ทั้งหมด limit 20000 (ทำ analytics)
│   │                           - hover row → prefetch detail+attachments+PDF
│   │                           - cache localStorage key "policies-cache:*" (ล้างตอน logout)
│   ├── DetailPage.jsx (1,267) ใหญ่สุด: แก้ไข inline ทุก field (ตาม F_SECS) / PDF preview sticky ขวา
│   │                           + lightbox / เปลี่ยนชื่อไฟล์ / อัปโหลดแทน / ลบ PDF / ลบกรมธรรม์
│   │                           / Related PDFs (ค้นชื่อลูกค้าเดียวกัน limit 500) / quick-search
│   │                           / AttachmentsCard / ปุ่มสร้างใบแจ้งหนี้ → /invoice?policy_id=X
│   ├── UploadPage.jsx (434)   ลาก PDF → POST /preview-pdf (AI อ่าน) → ฟอร์ม auto-fill
│   │                           → ชื่อไฟล์ auto (computeDisplayFilename, user แก้เอง = หยุด auto)
│   │                           → เพิ่มไฟล์ พ.ร.บ. คู่ได้ → บันทึก: /upload-pdf-only → /save-policy
│   │                           → POST attachments → navigate detail
│   ├── ManualPage.jsx (75)    ฟอร์มเปล่า → POST /save-policy (ไม่มีไฟล์)
│   ├── InvoicePage.jsx (906)  ใบแจ้งหนี้ DEBIT NOTE: template tm1(สั้น)/tm2(ละเอียด+ข้อมูลรถ)
│   │                           - เปิดพร้อม ?policy_id= → GET /policies/:id → pre-fill
│   │                           - อากร 0.4% ปัดขึ้นบาทเต็ม (override ได้) / VAT 7% / QR พร้อมเพย์จริง
│   │                           - live preview ขวา / submit → POST /invoice/generate (blob) → เปิด tab ใหม่
│   │                           ⚠️ window.open("") ก่อน await เสมอ — กัน popup blocker
│   ├── QuotationPage.jsx (548) ใบเสนอราคาแบบคุ้มภัยโตเกียวมารีน (เพิ่ม ก.ค. 2026):
│   │                           - ทั้งหน้า = ตัวเอกสาร ตัวอักษรสีชมพู #d63384 ทุกจุดเป็น <input> แก้ inline (43 ช่อง)
│   │                           - แถว "เบี้ยรวม พ.ร.บ." คำนวณ auto / ปุ่ม "คำนวณเบี้ยรวม" sum สุทธิ+อากร+VAT
│   │                           - พิมพ์ผ่าน window.print() + @media print (scope ด้วย body.printing-quotation)
│   │                             ซ่อน .no-print + ตัดเส้นประ input → เหมือนเอกสารจริง / A4
│   │                           - render ฝั่ง browser ล้วน ไม่เรียก backend
│   ├── PolicyList.jsx (141)   ☠️ DEAD CODE ลบได้
│   ├── Upload.jsx (195)       ☠️ DEAD CODE ลบได้
│   └── DetailPage.jsx.tmp.*   ☠️ ไฟล์ temp ค้าง ลบได้
└── components/
    ├── Toast.jsx (16)          แจ้งเตือน auto-dismiss — เรียกผ่าน notify(msg, type) จาก outlet context
    ├── QrCode.jsx (24)         qrcode lib → canvas
    ├── PdfPreview.jsx (29)     iframe
    ├── PdfLightbox.jsx (63)    modal PDF เต็มจอ
    ├── FormPanel.jsx (51)      section พับได้
    ├── PolicyForm.jsx (111)    วน render input ตาม F_SECS
    ├── PolicyTable.jsx (205)   ตาราง + sort + badge (b-on/b-soon/b-off/b-pending) + chip ประวัติ
    ├── PremiumGrid.jsx (332)   กรอกเบี้ย → คำนวณอากร 0.4%/VAT 7%/รวม/คอมมิชชั่น auto
    ├── PreviewPanel.jsx (324)  แผงขวา list: ข้อมูลย่อ + PDF + กรมธรรม์ทะเบียนเดียวกัน
    └── AttachmentsCard.jsx (512) CRUD ไฟล์แนบ + สลับ attachment ↔ main PDF
```

## 2.3 Routes (App.jsx)

| Path | Component | หมายเหตุ |
|---|---|---|
| `/` | ListPage tab=dashboard | eager |
| `/policies` | ListPage tab=policies | eager |
| `/expiring` | ListPage tab=expiring | eager |
| `/upload` | UploadPage | lazy |
| `/manual` | ManualPage | lazy, ไม่มีเมนู (เข้าตรง) |
| `/invoice` | InvoicePage | lazy, รับ `?policy_id=` |
| `/quotation` | QuotationPage | lazy |
| `/policies/:id` | DetailPage | lazy |

เมนู nav: NAV_VIEW = ภาพรวม, ใกล้หมดอายุ(badge จำนวน) / NAV_ACTION = อัปโหลด PDF, ใบแจ้งหนี้, ใบเสนอราคา

## 2.4 Design system (styles.js)

```css
--blue:#319795 (teal หลัก) --blue-bg:#E6FFFA --sur:#FFF --sur2:#F7F8FA
--brd:#E3E5EA --t1:#0B1020 --t2:#3A4253 --t3:#6B7383 --amber:#B45309 --red:#DC2626
dark mode: body.dark override ทุกตัว (--blue เปลี่ยนเป็น #7C7FF7)
```

Class โครงหลัก: `.page-wrap > .page-hd (ปุ่มกลับ+title+ปุ่มขวา) + .page-body`
`.detail-split` (grid 1fr/1.15fr, ขวา sticky) / `.info-card > .info-card-hd + .info-card-bd > .info-row (2 คอลัมน์, .fw=1)`
ปุ่ม: `.btn.btn-b` (gradient teal) / `.btn.btn-w` (outline) / banner error: `.bnr.er`
เอกสาร (invoice/quotation): ฟอนต์ `'Sarabun','Noto Sans Thai'` พื้นขาวเสมอไม่ตาม dark mode, สีฟิลด์แก้ได้ = ชมพู #d63384

## 2.5 Dev

```powershell
cd D:\insurance-frontend ; npm run dev   # :5173
# .env.development / .env.production → VITE_API_URL
# .claude/launch.json มี config "vite" สำหรับ browser preview
```

---

# 3. Backend — `D:\insurance-backend`

## 3.1 Stack

Python 3.11 + FastAPI + uvicorn, Docker (มี tesseract-ocr-tha ใน image)
DB: **Neon Postgres** / Storage: **Cloudflare R2** — ทั้งคู่ผ่าน `services/supabase_shim.py`
AI: **Gemini Vision (google-genai) เป็นตัวหลัก** อ่านข้อมูลจาก PDF / มี claude_parser (anthropic) และ Tesseract+PyMuPDF เป็นตัวเลือก
PDF generation: reportlab / QR: qrcode[pil] / Auth: PyJWT HS256

## 3.2 โครงสร้างหลัก

```
insurance-backend/
├── main.py (193)          FastAPI app:
│                           - _run_migrations(): รัน SQL CREATE TABLE IF NOT EXISTS ตอน start ทุกครั้ง
│                             (auto-migration — เพิ่มคอลัมน์ใหม่ = แก้ _INIT_SQL ในไฟล์นี้)
│                           - CORS: localhost regex + insuremgr.vercel.app + safetypc.vercel.app
│                           - global exception handler (ให้ CORS header ติดแม้ 500)
│                           - รวม routers prefix /api ทุกตัว auth ผ่าน Depends(require_auth)
│                             ยกเว้น auth router / GET|HEAD /health / GET /
│                           - LINE notify scheduler ถูก**ปิดไว้** (เคยส่งผิดเวลา)
├── Dockerfile             python:3.11-slim + tesseract-ocr(-tha,-eng)
├── requirements.txt       fastapi, httpx, supabase(ไม่ใช้จริง), google-genai, anthropic, pymupdf,
│                          pytesseract, psycopg2-binary, boto3, reportlab, qrcode[pil], PyJWT, apscheduler...
├── routes/
│   ├── auth.py (68)        POST /auth/login — user เดียวจาก env APP_USERNAME/APP_PASSWORD
│   │                        (default admin/admin1234!) username เทียบ case-insensitive
│   │                        JWT HS256 อายุ 30 วัน secret=env JWT_SECRET / require_auth dependency
│   ├── policies.py (304)   - GET /policies: filter search(or: policy_number/insured_name/license_plate ilike)
│   │                          + status(active/expiring/expired เทียบ coverage_end)+date_from/to+has_pdf
│   │                          + sort whitelist SORTABLE + pagination → {data, page, total}
│   │                          ⚠️ LIST_COLUMNS ไม่รวม pdf_data (base64 ใหญ่) — เพิ่มคอลัมน์ใหม่ต้องเพิ่มที่นี่ด้วย
│   │                        - GET /policies/:id — คอลัมน์เดียวกัน
│   │                        - GET /policies/:id/pdf?download=0|1 — ลำดับ: R2/Supabase public URL → stream
│   │                          ผ่าน httpx / Google Drive legacy → googleapiclient / base64 pdf_data ใน DB
│   │                          (Content-Disposition ใช้ RFC5987 filename*= รองรับชื่อไทย)
│   │                        - PUT /policies/:id — update dict ตรงๆ + set manually_edited=true
│   │                        - DELETE /policies/:id / DELETE /policies/:id/pdf (ลบไฟล์จาก R2 + clear fields)
│   ├── upload.py (371)     - POST /preview-pdf — Gemini อ่านอย่างเดียว ไม่บันทึก → {parsed,...}
│   │                        - POST /upload-pdf-only — อัปขึ้น R2 อย่างเดียว → {pdf_url, pdf_filename, pdf_size}
│   │                        - POST /upload-pdf — OCR + upload พร้อมกัน (asyncio.gather)
│   │                        - POST /save-policy — validate: ALLOWED_COLUMNS whitelist / INT_FIELDS /
│   │                          FLOAT_FIELDS / DATE_FIELDS + _clean_thai_number (เลขไทย→อารบิก, ตัด comma)
│   │                          + _normalize_date (DD/MM/YYYY พ.ศ. → YYYY-MM-DD ค.ศ.)
│   │                        - _make_display_filename() ⚠️ MIRROR กับ frontend computeDisplayFilename
│   │                        - _baby78_storage_key(): storage key = "policies/{ชื่อไทยตรงๆ}.pdf"
│   │                          ซ้ำ → เติม _0001 (เช็คผ่าน boto3 head_object)
│   ├── attachments.py (301) CRUD /policies/:id/attachments — doc_type: prb|endorsement|other
│   │                        (main อยู่ในคอลัมน์ pdf_* ของ insurance_policies)
│   │                        attachment มี field เบี้ยด้วย (net_premium..coverage_end) ใช้กับ พ.ร.บ. รายปี
│   ├── invoice.py (189)    POST /invoice/generate — Pydantic InvoiceRequest
│   │                        template: default|tm1|tm2 → เรียก build_* ใน invoice_generator → PDF bytes
│   └── notify.py (35)      LINE endpoints — **ปิดอยู่** (ไม่ include ใน main)
├── services/
│   ├── supabase_shim.py (368) ⭐ ตัวกลางทุกอย่าง: Postgres query builder เลียน supabase-py
│   │                        (eq/gt/gte/lt/lte/ilike/is_/not_/or_/in_/order/range/execute→.data,.count)
│   │                        + connection pool 5 conn / storage → boto3 R2 (upload/get_public_url/remove)
│   │                        env: NEON_URL หรือ DATABASE_URL_POOLER หรือ DATABASE_URL
│   │                             R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_PUBLIC_URL
│   ├── gemini_parser.py (262) ⭐ AI หลัก — ส่งภาพหน้า PDF เข้า Gemini พร้อม system prompt ไทยละเอียดมาก
│   │                        (กฎอ่านเลขกรมธรรม์ D≠0≠8, ห้ามอ่าน barcode, วันที่แปลง พ.ศ.→ค.ศ., เงินไม่มี comma)
│   │                        env: GEMINI_API_KEY — แก้ prompt การอ่าน = แก้ที่ _PROMPT ในไฟล์นี้
│   ├── claude_parser.py (474) parser สำรองผ่าน anthropic (ปัจจุบัน upload.py ใช้ Gemini เท่านั้น)
│   ├── pdf_extractor.py (165) PyMuPDF text layer → fallback Tesseract OCR (DPI 250, ไทย)
│   ├── invoice_generator.py (1,180) ⭐ reportlab สร้าง PDF 3 แบบ:
│   │                        build_invoice_pdf (default) / build_debit_note_template1 (tm1)
│   │                        / build_debit_note_template2 (tm2) + gen QR พร้อมเพย์
│   │                        ⚠️ มีสูตร PromptPay EMVCo ที่ MIRROR กับ frontend promptpay.js
│   │                        ฟอนต์ไทย + โลโก้อยู่ services/assets/
│   ├── line_notify.py (81)  LINE broadcast/multicast + apscheduler cron — **ปิดอยู่**
│   └── filename_matcher(_v2).py จับคู่ชื่อไฟล์ PDF ↔ record (ใช้ตอน batch migration)
├── migrations/            SQL เก่า 2 ไฟล์ (ตอนนี้ auto-migration ใน main.py แทน)
├── scripts/ + root *.py   สคริปต์ migrate จาก Access Baby78 (.mdb), batch import/upload,
│                          backup (Neon + R2 + PDFs), audit, cleanup orphans ฯลฯ — one-off tools
└── venv/                  virtualenv local
```

## 3.3 Database schema (Neon Postgres — สร้างอัตโนมัติจาก main.py `_INIT_SQL`)

**ตาราง `insurance_policies`** (หลัก):
- id uuid PK, created_at
- เอกสาร: policy_number, company_code, app_number, policy_type, new_renew
- คน: insured_name, insured_address, phone
- ตัวแทน: agent_code, broker_name, broker_license
- รถ: license_plate, license_province, chassis_no, car_make, car_model, car_year(int), sum_insured
- วันที่ (เก็บเป็น varchar สำหรับ coverage_*, date สำหรับ date_*): coverage_start, coverage_end,
  date_notify, date_cancel, date_policy_receive
- เงิน (numeric): net_premium, stamp_duty, vat, total_premium, third_party_per_person,
  third_party_per_accident, own_damage
- คอมมิชชั่น: prepaid_tax_1pct, commission_pct, commission_baht, wht_10pct, rounding, collected_amount
- ไฟล์: pdf_url, pdf_filename, pdf_data(base64 legacy), pdf_size
- flags: manually_edited, notes

**ตาราง `policy_attachments`**:
- id, policy_id FK (CASCADE), doc_type CHECK in ('main','prb','endorsement','other'), label, note
- pdf_url, pdf_filename, pdf_size
- เบี้ย: net_premium, stamp_duty, vat, total_premium, coverage_start(date), coverage_end(date)

## 3.4 Env vars ฝั่ง backend (ตั้งใน Render)

```
JWT_SECRET, APP_USERNAME, APP_PASSWORD
NEON_URL (หรือ DATABASE_URL_POOLER / DATABASE_URL)
SUPABASE_URL, SUPABASE_KEY        # ยังถูกอ่านโดย create_client แต่ shim ใช้ NEON/R2 จริง
R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_PUBLIC_URL
GEMINI_API_KEY                    # AI อ่าน PDF
ANTHROPIC_API_KEY                 # claude_parser (สำรอง)
GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   # Drive legacy PDFs
LINE_CHANNEL_ACCESS_TOKEN, LINE_NOTIFY_USER_IDS               # ปิดใช้อยู่
```

## 3.5 รัน backend local

```powershell
cd D:\insurance-backend
venv\Scripts\activate          # มี venv อยู่แล้ว
uvicorn main:app --reload --port 8000
# ต้องมี .env (NEON_URL, R2_*, GEMINI_API_KEY, JWT_SECRET, APP_USERNAME/PASSWORD)
```

---

# 4. API Contract (frontend ↔ backend)

Base: `{VITE_API_URL}` — ทุก endpoint ต้อง `Authorization: Bearer <JWT>` ยกเว้น login/health

| Method | Path | ใช้โดย (frontend) |
|---|---|---|
| POST | `/auth/login` {username,password}→{token,username} | LoginPage |
| GET/HEAD | `{origin}/health` (นอก /api) | main.jsx, App.jsx probe |
| GET | `/policies?page&limit&search&sort&order&status&date_from&date_to&has_pdf` → {data,page,total} | ListPage, DetailPage(related), PreviewPanel |
| GET | `/policies/:id` | DetailPage, InvoicePage prefill |
| PUT | `/policies/:id` (partial dict) | DetailPage, AttachmentsCard |
| DELETE | `/policies/:id` | DetailPage |
| GET | `/policies/:id/pdf?download=` | pdfUtils fallback |
| DELETE | `/policies/:id/pdf` | DetailPage |
| POST | `/preview-pdf` (FormData file) → {parsed,...} | UploadPage |
| POST | `/upload-pdf-only` (FormData file) → {pdf_url,pdf_filename,pdf_size} | UploadPage, DetailPage, AttachmentsCard |
| POST | `/save-policy` (dict) → {success,id} | UploadPage, ManualPage |
| GET/POST | `/policies/:id/attachments` | AttachmentsCard, ListPage |
| PUT/DELETE | `/policies/:id/attachments/:attId` | AttachmentsCard, DetailPage |
| POST | `/invoice/generate` (InvoiceRequest) → PDF blob | InvoicePage |

---

# 5. Data conventions (สำคัญมาก — ผิดแล้วข้อมูลเพี้ยน)

1. **วันที่:** DB เก็บ ค.ศ. `YYYY-MM-DD` / จอแสดง พ.ศ. — backend `_normalize_date` แปลง `DD/MM/YYYY` พ.ศ.→ค.ศ. ให้อัตโนมัติตอน save / frontend `fmtDate` แปลงกลับตอนแสดง
2. **เลขไทย ๐-๙:** backend `_clean_thai_number` แปลงเป็นอารบิก + ตัด comma ตอน save
3. **ชื่อไฟล์แสดงผล:** `{ident} {กธ|พรบ|สลักหลัง}.{ปีพ.ศ. 2 หลัก}.pdf` โดย ident เลือกตามประเภท —
   พ.ร.บ.→ทะเบียน / M,STY→ทะเบียน / FIRE กลุ่ม→ที่อยู่ 40 ตัวแรก / PA,TA กลุ่ม→ชื่อ
4. **Storage key R2:** `policies/{ชื่อไทยตรงๆ}.pdf` ซ้ำเติม `_0001` (สไตล์ Baby78)
5. **policy_type codes:** M, P, STY, FIRE, ASSET, IAR, BURGLAR, PA, TA, 3RD, PUBLIC, MISC, GOLF, MARINE
6. **สูตรเงิน:** อากรแสตมป์ = 0.4% ของเบี้ยสุทธิ **ปัดขึ้นบาทเต็ม** / VAT 7% ของ (สุทธิ+ความคุ้มครองเพิ่ม+อากร)

# 6. ⚠️ โค้ด MIRROR 2 ฝั่ง — แก้ฝั่งเดียว = bug เงียบ

| Logic | Frontend | Backend |
|---|---|---|
| ตั้งชื่อไฟล์ PDF | `src/helpers.js` computeDisplayFilename | `routes/upload.py` _make_display_filename |
| PromptPay EMVCo | `src/promptpay.js` | `services/invoice_generator.py` |
| นับสถานะ expiring | `src/helpers.js` getStatus (30 วัน) | `routes/policies.py` status=expiring (30 วัน) |

# 7. รายการ field ฟอร์มกรมธรรม์ (source of truth: helpers.js F_SECS + upload.py ALLOWED_COLUMNS)

ข้อมูลกรมธรรม์: policy_number, company_code, app_number, policy_type, new_renew
ผู้เอาประกัน: insured_name, phone, insured_address / ตัวแทน: agent_code, broker_name, broker_license
รถ: license_plate, license_province, chassis_no, car_make, car_model, car_year, sum_insured
คุ้มครอง: coverage_start, coverage_end, date_notify, date_cancel, date_policy_receive
เบี้ย: net_premium, stamp_duty, vat, total_premium, third_party_per_person, third_party_per_accident, own_damage
คอมมิชชั่น: prepaid_tax_1pct, commission_pct, commission_baht, wht_10pct, rounding, collected_amount
อื่น: notes, pdf_url, pdf_filename, pdf_size, manually_edited

**เพิ่ม field ใหม่ต้องแก้ 4 ที่:** main.py `_INIT_SQL` (ALTER ADD COLUMN) → upload.py `ALLOWED_COLUMNS` (+ INT/FLOAT/DATE set) → policies.py `LIST_COLUMNS` → frontend helpers.js `F_SECS`/`F_LBL`

# 8. Tech debt ปัจจุบัน (กรกฎาคม 2026)

1. Dead code frontend: `pages/PolicyList.jsx`, `pages/Upload.jsx`, `pages/DetailPage.jsx.tmp.*`
2. `DetailPage.jsx` 1,267 บรรทัด / `styles.js` 2,899 บรรทัด — รอ refactor
3. ไม่มี TypeScript / ไม่มี test ทั้งสองฝั่ง
4. LINE notify เขียนเสร็จแต่ปิดใช้ (เคยส่งผิดเวลา — ปัญหา timezone/scheduler)
5. Quotation ยัง print ฝั่ง browser — อนาคตอาจย้ายไป backend reportlab เหมือน invoice
6. backend root รกมาก — สคริปต์ migration one-off ปนกับโค้ดจริง (ของจริงคือ main.py + routes/ + services/)
7. ชื่อ "supabase" ทั่ว codebase ทั้งที่ใช้ Neon+R2 — misleading แต่ยังไม่ rename

# 9. กติกาการทำงาน

- ตอบภาษาไทย / โค้ดตามสไตล์เดิม (comment ไทยได้, ไม่ over-engineer)
- Read ไฟล์ก่อนแก้เสมอ — เอกสารนี้อาจ outdated
- แก้ UI → ทดสอบผ่าน browser preview (`.claude/launch.json` config "vite")
- แก้ field ข้อมูล → ไล่ครบ 4 ที่ตามข้อ 7 / แตะ logic mirror → แก้ 2 ฝั่งตามข้อ 6
- อย่าลบ retry/probe/keep-alive (รับมือ Render cold start)
- commit เมื่อ user สั่งเท่านั้น / push `main` = deploy จริงทันทีทั้งสอง repo

---

## 🎯 งานที่ต้องการทำ

[ใส่รายละเอียดงานตรงนี้]
