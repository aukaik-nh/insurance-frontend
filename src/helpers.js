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

export const F_SECS = [
  { label: "ข้อมูลกรมธรรม์",    ico: "doc",      keys: ["policy_number", "broker_name"] },
  { label: "ผู้เอาประกัน",      ico: "person",   keys: ["insured_name", "phone", "insured_address"] },
  { label: "ข้อมูลรถ",          ico: "car",      keys: ["license_plate", "chassis_no", "car_make", "car_model", "car_year"] },
  { label: "ระยะเวลาคุ้มครอง",  ico: "cal",      keys: ["coverage_start", "coverage_end"] },
  { label: "เบี้ยประกัน",       ico: "banknote", keys: ["net_premium", "stamp_duty", "vat", "total_premium"] },
]

export const F_LBL = {
  policy_number:  "เลขกรมธรรม์",
  broker_name:    "ชื่อตัวแทน",
  insured_name:   "ชื่อผู้เอาประกัน",
  insured_address:"ที่อยู่",
  phone:          "เบอร์โทรศัพท์",
  license_plate:  "ทะเบียนรถ",
  chassis_no:     "เลขตัวถัง",
  car_make:       "ยี่ห้อรถ",
  car_model:      "รุ่นรถ",
  car_year:       "ปีรถ",
  coverage_start: "วันเริ่มคุ้มครอง",
  coverage_end:   "วันสิ้นสุดคุ้มครอง",
  net_premium:    "เบี้ยสุทธิ",
  stamp_duty:     "อากรแสตมป์",
  vat:            "ภาษีมูลค่าเพิ่ม",
  total_premium:  "รวมเบี้ยประกัน",
  notes:          "หมายเหตุ",
}
