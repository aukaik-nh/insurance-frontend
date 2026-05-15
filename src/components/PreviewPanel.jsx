import { Ico } from "../icons"
import { getStatus } from "../helpers"

export function PreviewPanel({ p, onClose, onOpen }) {
  const st = getStatus(p.coverage_end)
  const fmtNum = v => v != null ? Number(v).toLocaleString("th-TH") : null

  const secs = [
    { title: "กรมธรรม์", fields: [
      ["ใบคำขอ",    p.app_number],
      ["เลขกรมธรรม์", p.policy_number],
      ["บ.ประกัน",  p.company_code],
      ["ประเภท",    p.policy_type],
      ["N/R",       p.new_renew === "N" ? "ใหม่" : p.new_renew === "R" ? "ต่ออายุ" : p.new_renew],
    ]},
    { title: "ผู้เอาประกัน", fields: [
      ["ชื่อ",   p.insured_name],
      ["เบอร์โทร", p.phone],
      ["ที่อยู่", p.insured_address],
    ]},
    { title: "ยานพาหนะ", fields: [
      ["ทะเบียน",  p.license_plate ? `${p.license_plate}${p.license_province ? " " + p.license_province : ""}` : null],
      ["ยี่ห้อ/รุ่น", [p.car_make, p.car_model].filter(Boolean).join(" ")],
      ["ปีรถ",     p.car_year],
      ["เลขตัวถัง", p.chassis_no],
    ]},
    { title: "ระยะเวลา", fields: [
      ["แจ้งงาน",       p.date_notify],
      ["คุ้มครองเริ่ม", p.coverage_start],
      ["คุ้มครองสิ้นสุด", p.coverage_end],
      ["วันรับกรมธรรม์", p.date_policy_receive],
      ["วันยกเลิก",     p.date_cancel],
    ]},
    { title: "เบี้ยประกัน", fields: [
      ["ทุนเอาประกัน", fmtNum(p.sum_insured)],
      ["เบี้ยสุทธิ",   fmtNum(p.net_premium)],
      ["อากร",         fmtNum(p.stamp_duty)],
      ["ภาษี",         fmtNum(p.vat)],
      ["รวมเบี้ย",     fmtNum(p.total_premium)],
    ]},
    { title: "ตัวแทน", fields: [
      ["รหัส", p.agent_code],
      ["ชื่อ",  p.broker_name],
    ]},
  ]

  return (
    <div className="pvp">
      <div className="pvp-hd">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pvp-title">{p.insured_name || "ไม่ระบุชื่อ"}</div>
          <div style={{ marginTop: 4 }}>
            <span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span>
          </div>
        </div>
        <button className="pvp-close" onClick={onClose}><Ico n="x" s={16} /></button>
      </div>

      <div className="pvp-body">
        {secs.map(sec => {
          const visible = sec.fields.filter(([, v]) => v != null && v !== "")
          if (!visible.length) return null
          return (
            <div key={sec.title} className="pvp-sec">
              <div className="pvp-sec-title">{sec.title}</div>
              {visible.map(([lbl, val]) => (
                <div key={lbl} className="pvp-row">
                  <span className="pvp-lbl">{lbl}</span>
                  <span className="pvp-val">{val}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="pvp-foot">
        <button className="btn btn-b" style={{ width: "100%", justifyContent: "center" }} onClick={onOpen}>
          <Ico n="expand" s={14} /> ดูข้อมูลทั้งหมด
        </button>
      </div>
    </div>
  )
}
