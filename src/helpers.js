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
  {
    label: "ข้อมูลกรมธรรม์",
    ico: "doc",
    keys: ["policy_number", "company_code", "app_number", "policy_type", "new_renew"],
  },
  {
    label: "ตัวแทน / นายหน้า",
    ico: "person",
    keys: ["agent_code", "broker_name", "broker_license"],
  },
  {
    label: "ผู้เอาประกัน",
    ico: "person",
    keys: ["insured_name", "phone", "insured_address"],
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
  notes:                      "หมายเหตุ",
}
