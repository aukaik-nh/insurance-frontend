export function getStatus(end, start) {
  if (!end) return { cls: "b-off", label: "ไม่ทราบ" }
  const now = new Date()
  const endD = new Date(end)
  if (isNaN(endD)) return { cls: "b-off", label: "ไม่ทราบ" }
  const diff = (endD - now) / 86400000
  if (diff < 0) return { cls: "b-off", label: "หมดอายุแล้ว" }
  // ⏳ กรมธรรม์ที่ยังไม่ถึงวันเริ่มคุ้มครอง (booked ไว้ล่วงหน้า) — กันไม่ให้ขึ้น "คุ้มครองอยู่" หลอกๆ
  if (start) {
    const startD = new Date(start)
    if (!isNaN(startD) && startD > now) {
      const daysToStart = Math.ceil((startD - now) / 86400000)
      return { cls: "b-pending", label: `เริ่มอีก ${daysToStart} วัน` }
    }
  }
  if (diff < 30) return { cls: "b-soon", label: `หมดใน ${Math.floor(diff)} วัน` }
  return { cls: "b-on", label: "คุ้มครองอยู่" }
}

export const baht = n => n
  ? Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : "—"

const MONTH_TH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                       "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

// แปลง "2025-06-24" หรือ ISO timestamp → "24 มิ.ย. 2568"  (พ.ศ.)
export const fmtDate = iso => {
  if (!iso) return null
  // ตัดเฉพาะส่วนวันที่ก่อน เพื่อไม่ให้ timestamp เช่น
  // 2026-08-24T08:17:46.032912+00:00 แสดงค่า raw ในตาราง
  const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return iso
  const [, year, month, day] = match
  const [y, m, d] = [Number(year), Number(month), Number(day)]
  if (!y || !m || !d || m > 12) return iso
  return `${d} ${MONTH_TH[m]} ${y + 543}`
}

export const POLICY_TYPE_LABEL = {
  M:       "ประกันรถยนต์",
  P:       "พ.ร.บ.",
  FIRE:    "อัคคีภัย",
  ASSET:   "ทรัพย์สิน",
  IAR:     "ทรัพย์สิน (IAR)",
  BURGLAR: "โจรกรรม",
  PA:      "PA",
  TA:      "ประกันเดินทาง",
  GOLF:    "กอล์ฟ",
  MARINE:  "ขนส่ง",
  "3RD":   "บุคคลที่ 3",
  PUBLIC:  "PUBLIC",
  MISC:    "อื่นๆ",
  STY:     "ประกันรถยนต์",
  โจรกรรม: "โจรกรรม",
}
export const policyTypeLabel = t => t ? (POLICY_TYPE_LABEL[t] || t) : null

// คำนวณชื่อไฟล์ PDF ตามประเภทกรมธรรม์ (mirror backend _make_display_filename)
//   - พ.ร.บ. (docType=prb)       → '{ทะเบียน} พรบ.{YY}.pdf'
//   - ประกันรถยนต์ (M/STY)        → '{ทะเบียน} กธ.{YY}.pdf'
//   - อัคคีภัย/ทรัพย์สิน (FIRE)   → '{ที่อยู่ 40 ตัวแรก} กธ.{YY}.pdf'
//   - PA/TA/MISC                  → '{ชื่อ} กธ.{YY}.pdf'
export function computeDisplayFilename({ plate, policy_type, insured_address, insured_name, coverage_end, doc_type = "main" } = {}) {
  const typeThai = { prb: "พรบ", endorsement: "สลักหลัง", main: "กธ" }[doc_type] || "เอกสาร"
  // ปี (YY) — รองรับทั้ง ค.ศ. + พ.ศ.
  let yy = ""
  const ce = (coverage_end || "").toString()
  const m = ce.match(/(\d{4})/)
  if (m) {
    let y = parseInt(m[1], 10)
    if (y < 2500) y += 543
    yy = String(y).slice(-2)
  }
  const plateClean   = (plate || "").replace(/\s+/g, "").trim()
  const nameClean    = (insured_name || "").trim()
  const addressShort = (insured_address || "").split("\n", 1)[0].slice(0, 40).trim()

  const pt = (policy_type || "").toUpperCase().trim()
  const FIRE = new Set(["FIRE", "ASSET", "IAR", "BURGLAR"])
  const NAMES = new Set(["PA", "TA", "3RD", "PUBLIC", "MISC", "GOLF", "MARINE"])

  let ident
  if (doc_type === "prb")       ident = plateClean
  else if (FIRE.has(pt))        ident = addressShort || plateClean || nameClean
  else if (NAMES.has(pt))       ident = nameClean    || plateClean
  else                          ident = plateClean   || nameClean || addressShort  // M/STY/default
  if (!ident) ident = "ไม่ทราบ"

  return yy ? `${ident} ${typeThai}.${yy}.pdf` : `${ident} ${typeThai}.pdf`
}

// จัดกลุ่มกรมธรรม์ตามชื่อลูกค้า (1 ชื่อ = 1 แถว) แสดง "ฉบับปีล่าสุด" ของลูกค้ารายนั้น
// เอกสารอื่นๆ ของลูกค้าคนเดียวกัน (ทุกคัน/ทุกปี/พรบ./สลักหลัง) จะถูกซ่อนในหน้า list
// → ไปดูครบในหน้า detail (related PDFs จะหาให้ตามชื่อ)
//
// แถวที่แสดง: ใช้ "absolute latest" — ฉบับที่ coverage_start ใหม่สุดในกลุ่ม
//   แม้ฉบับล่าสุดจะเป็น metadata-only (ไม่มี PDF) ก็แสดงตามนั้น เพราะ user ต้องการเห็นปีล่าสุดจริงๆ
//   (PDF เปิดไม่ได้บน row นั้นก็ไม่เป็นไร — กดเข้าหน้า detail จะเห็น PDF ของปีเก่าๆ ในรายการ)
//
// _historyCount = จำนวน "ฉบับอื่นที่มี PDF" (ไม่นับ row ที่แสดง) — ตรงกับ DetailPage.relatedPdfs
//   ถ้า display ไม่มี PDF → chip = (PDFs ทั้งกลุ่ม) → detail นับเท่า chip
//   ถ้า display มี PDF → chip = (PDFs ทั้งกลุ่ม - 1) → detail นับ chip+1
const _hasPdf = (r) => !!(r?.pdf_url || r?.pdf_filename || r?.pdf_size)

export function dedupLatestByCustomer(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return []
  const groups = new Map()
  for (const r of rows) {
    const name = (r.insured_name || "").trim().toLowerCase()
    // ไม่มีชื่อ → ไม่จัดกลุ่ม (อยู่เดี่ยวๆ ทุกแถว) เพื่อกัน null-grouping
    const key = name || `__id__${r.id}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }
  const out = []
  for (const list of groups.values()) {
    // sort desc โดยวันที่
    list.sort((a, b) => {
      const ax = a.coverage_start || a.coverage_end || a.created_at || ""
      const bx = b.coverage_start || b.coverage_end || b.created_at || ""
      return String(bx).localeCompare(String(ax))
    })
    const display = list[0]  // absolute latest — แสดง "ปีล่าสุด" ตามที่ user ต้องการ
    // chip = จำนวนฉบับ-มี-PDF อื่นๆ (ไม่นับ display row)
    const historyCount = list.slice(1).filter(_hasPdf).length
    out.push({ ...display, _historyCount: historyCount })
  }
  return out
}

// แบ่ง 4 กลุ่ม Baby78: motor / prb / fire / pa — ใช้กับ badge สีในตาราง
export const policyTypeCategory = (t) => {
  const pt = (t || "").toUpperCase().trim()
  if (pt === "M") return "motor"
  if (pt === "P") return "prb"
  if (["FIRE","ASSET","IAR","BURGLAR"].includes(pt)) return "fire"
  if (["PA","TA","3RD","PUBLIC","MISC","GOLF","MARINE"].includes(pt)) return "pa"
  return "other"
}
// สี badge ของแต่ละ category (ตรงกับ dashboard type-grid)
export const TYPE_CAT_STYLE = {
  motor: { bg: "#E5EEF0", fg: "#245863" },
  prb:   { bg: "#E6EDE9", fg: "#2E5044" },
  fire:  { bg: "#F0EAE4", fg: "#6A3A24" },
  pa:    { bg: "#E7E9EF", fg: "#3A3E62" },
  other: { bg: "#EDEEEF", fg: "#464B4E" },
}

export const F_SECS = [
  {
    label: "ข้อมูลกรมธรรม์",
    ico: "doc",
    keys: ["policy_number", "company_code", "app_number", "policy_type", "new_renew"],
  },
  {
    label: "ผู้เอาประกัน",
    ico: "person",
    keys: ["insured_name", "phone", "insured_address"],
  },
  {
    label: "ตัวแทน / นายหน้า",
    ico: "person",
    keys: ["agent_code", "broker_name", "broker_license"],
  },
  {
    label: "ข้อมูลรถ",
    ico: "car",
    keys: ["license_plate", "license_province", "chassis_no", "car_make", "car_model", "car_year", "sum_insured"],
  },
  {
    label: "ระยะเวลาคุ้มครอง",
    ico: "cal",
    keys: ["coverage_start", "coverage_end", "date_notify", "date_cancel", "date_policy_receive"],
  },
  {
    label: "เบี้ยประกัน",
    ico: "banknote",
    keys: ["net_premium", "stamp_duty", "vat", "total_premium",
           "third_party_per_person", "third_party_per_accident", "own_damage"],
  },
  {
    label: "ค่าคอมมิชชั่น / หัก ณ ที่จ่าย / ปัดเศษ",
    ico: "banknote",
    keys: ["prepaid_tax_1pct", "commission_pct", "commission_baht",
           "wht_10pct", "rounding", "collected_amount"],
  },
]

export const F_LBL = {
  policy_number:              "เลขกรมธรรม์",
  company_code:               "รหัสบริษัท",
  app_number:                 "เลขใบคำขอ",
  policy_type:                "ประเภทกรมธรรม์",
  new_renew:                  "ใหม่/ต่ออายุ (N/R)",
  agent_code:                 "รหัสตัวแทน",
  broker_name:                "ชื่อตัวแทน / นายหน้า",
  broker_license:             "เลขที่ใบอนุญาต",
  insured_name:               "ชื่อผู้เอาประกัน",
  insured_address:            "ที่อยู่",
  phone:                      "เบอร์โทรศัพท์",
  license_plate:              "ทะเบียนรถ",
  license_province:           "จังหวัดทะเบียน",
  chassis_no:                 "เลขตัวถัง",
  car_make:                   "ยี่ห้อรถ",
  car_model:                  "รุ่นรถ",
  car_year:                   "ปีรถ",
  sum_insured:                "ทุนเอาประกัน (฿)",
  coverage_start:             "วันเริ่มคุ้มครอง",
  coverage_end:               "วันสิ้นสุดคุ้มครอง",
  date_notify:                "วันแจ้งงาน",
  date_cancel:                "วันยกเลิก",
  date_policy_receive:        "วันรับกรมธรรม์",
  net_premium:                "เบี้ยสุทธิ",
  stamp_duty:                 "อากรแสตมป์",
  vat:                        "ภาษีมูลค่าเพิ่ม (VAT)",
  total_premium:              "รวมเบี้ยประกัน",
  third_party_per_person:     "บุคคลภายนอก/คน",
  third_party_per_accident:   "บุคคลภายนอก/ครั้ง",
  own_damage:                 "ความเสียหายต่อรถ",
  prepaid_tax_1pct:           "1% (ภาษีล่วงหน้า)",
  commission_pct:             "CM %",
  commission_baht:            "CM (บาท)",
  wht_10pct:                  "ภาษี 10% (หัก ณ ที่จ่าย)",
  rounding:                   "ปัดเศษ",
  collected_amount:           "เรียกเก็บ",
  notes:                      "หมายเหตุ",
}
