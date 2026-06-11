export function getStatus(end) {
  if (!end) return { cls: "b-off", label: "ไม่ทราบ" }
  const d = new Date(end), diff = (d - new Date()) / 86400000
  if (isNaN(d)) return { cls: "b-off", label: "ไม่ทราบ" }
  if (diff < 0)  return { cls: "b-off",  label: "หมดอายุแล้ว" }
  if (diff < 30) return { cls: "b-soon", label: `หมดใน ${Math.floor(diff)} วัน` }
  return { cls: "b-on", label: "คุ้มครองอยู่" }
}

export const baht = n => n
  ? Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : "—"

const MONTH_TH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                       "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

// แปลง "2025-06-24" → "24 มิ.ย. 2568"  (พ.ศ.)
export const fmtDate = iso => {
  if (!iso) return null
  const parts = String(iso).split("-")
  if (parts.length < 3) return iso
  const [y, m, d] = parts.map(Number)
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
  motor: { bg: "#E6F1FB", fg: "#0C447C" },
  prb:   { bg: "#E1F5EE", fg: "#085041" },
  fire:  { bg: "#FAECE7", fg: "#712B13" },
  pa:    { bg: "#EEEDFE", fg: "#3C3489" },
  other: { bg: "#F1EFE8", fg: "#444441" },
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
