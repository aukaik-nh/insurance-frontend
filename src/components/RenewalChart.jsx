import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./RenewalChart.css"

const money = n => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n)
const count = n => n.toLocaleString("th-TH")
const monthName = d => d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })
function dateOnly(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null
}

export function RenewalChart({ rows, loading }) {
  const [metric, setMetric] = useState("count")
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const months = Array.from({ length: 12 }, (_, i) => ({ date: new Date(today.getFullYear(), today.getMonth() + i, 1), rows: [], count: 0, premium: 0, missing: 0 }))
  let unknownDates = 0
  for (const row of rows) {
    const end = dateOnly(row.coverage_end)
    if (!end) { unknownDates++; continue }
    if (end < today) continue
    const index = (end.getFullYear() - today.getFullYear()) * 12 + end.getMonth() - today.getMonth()
    if (index < 0 || index >= 12) continue
    const bucket = months[index]
    bucket.rows.push(row)
    bucket.count++
    const premium = Number(row.total_premium)
    if (Number.isFinite(premium) && premium > 0) bucket.premium += premium
    else bucket.missing++
  }
  const total = months.reduce((sum, m) => sum + m.count, 0)
  const premium = months.reduce((sum, m) => sum + m.premium, 0)
  const missing = months.reduce((sum, m) => sum + m.missing, 0)
  const peak = months.reduce((best, m) => m.count > best.count ? m : best, months[0])
  const max = Math.max(1, ...months.map(m => m[metric]))
  const current = months[selected]
  const sorted = [...current.rows].sort((a, b) => String(a.coverage_end).localeCompare(String(b.coverage_end)))
  return <section className="renewal card" aria-label="วางแผนต่ออายุกรมธรรม์">
    <header className="renewal-header">
      <div><span className="renewal-eyebrow">วางแผนงานต่ออายุ</span><h2>มองงานล่วงหน้า จัดลำดับการติดต่อลูกค้า</h2><p>ตั้งแต่วันนี้ถึง {new Date(today.getFullYear(), today.getMonth() + 12, 0).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })} · เดือนแรกนับเฉพาะวันที่ยังไม่หมดอายุ</p></div>
      <div className="renewal-switch" aria-label="ข้อมูลที่แสดงในกราฟ">
        <button type="button" aria-pressed={metric === "count"} onClick={() => setMetric("count")}>จำนวนกรมธรรม์</button>
        <button type="button" aria-pressed={metric === "premium"} onClick={() => setMetric("premium")}>เบี้ยเดิม</button>
      </div>
    </header>
    <div className="renewal-summary">
      <div><span>ครบกำหนดในช่วงนี้</span><strong>{count(total)} <small>ฉบับ</small></strong></div>
      <div><span>เบี้ยเดิมรวมที่มีข้อมูล</span><strong>฿{money(premium)}</strong></div>
      <div><span>เดือนที่มีงานมากที่สุด</span><strong>{total ? monthName(peak.date) : "—"} <small>{total ? `${count(peak.count)} ฉบับ` : "ไม่มีรายการ"}</small></strong></div>
    </div>
    {loading && <p role="status">กำลังปรับปรุงข้อมูล…</p>}
    <div className="renewal-chart-caption"><strong>{metric === "count" ? "จำนวนกรมธรรม์ที่ครบกำหนด / เดือน" : "เบี้ยเดิมของกรมธรรม์ที่ครบกำหนด / เดือน (บาท)"}</strong><span>เลือกแท่งเพื่อดูรายการด้านล่าง</span></div>
    <div className="renewal-bars" role="group" aria-label="กราฟรายเดือน">
      {months.map((m, i) => <button key={i} type="button" className={`renewal-month${i === selected ? " selected" : ""}`} aria-pressed={i === selected} aria-label={`${monthName(m.date)} ${m.count} ฉบับ เบี้ยเดิม ${money(m.premium)} บาท`} onClick={() => setSelected(i)}>
        <span className="renewal-bar-track"><span className="renewal-bar" style={{ height: `${m[metric] / max * 80}%` }}><b>{metric === "count" ? count(m.count) : new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(m.premium)}</b></span></span>
        <span className="renewal-month-label">{monthName(m.date)}</span>
      </button>)}
    </div>
    <div className="renewal-selection" aria-live="polite"><div><h3>{monthName(current.date)} <span>· {count(current.count)} ฉบับ</span></h3><p>เบี้ยเดิม ฿{money(current.premium)} {current.missing > 0 && `· ไม่พบเบี้ยที่ใช้รวมได้ ${current.missing} ฉบับ`}</p></div><span>เรียงวันหมดอายุใกล้ที่สุด</span></div>
    <div className="renewal-records">
      {sorted.length === 0 ? <p className="renewal-empty">ไม่มีกรมธรรม์ครบกำหนดในเดือนนี้</p> : sorted.map(r => <button key={r.id} type="button" className="renewal-record" onClick={() => navigate(`/policies/${r.id}`)}>
        <span className="renewal-record-date">{dateOnly(r.coverage_end).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
        <span className="renewal-record-person"><strong>{r.insured_name || "ไม่ระบุผู้เอาประกัน"}</strong><small>{r.policy_number || "ไม่มีเลขกรมธรรม์"}{r.license_plate ? ` · ${r.license_plate}` : ""}</small></span>
        <span className="renewal-record-money">{Number(r.total_premium) > 0 ? `฿${money(Number(r.total_premium))}` : "ไม่ระบุเบี้ย"}</span><span aria-hidden="true">↗</span>
      </button>)}
    </div>
    <footer className="renewal-note">เบี้ยเดิมใช้ประเมินมูลค่างาน ไม่ใช่รายได้หรือยอดต่ออายุที่ยืนยันแล้ว · นับทุกฉบับตามวันหมดอายุ ยังไม่ได้หักฉบับที่ต่ออายุแล้ว{missing > 0 && ` · ${missing} ฉบับไม่มีเบี้ยที่ใช้รวมได้`}{unknownDates > 0 && ` · อีก ${count(unknownDates)} ฉบับไม่มีวันหมดอายุที่ถูกต้อง จึงไม่รวมในกราฟ`}</footer>
  </section>
}
