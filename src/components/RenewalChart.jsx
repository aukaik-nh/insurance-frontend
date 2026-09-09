import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./RenewalChart.css"

const count = n => n.toLocaleString("th-TH")
const monthName = d => d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })
function dateOnly(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null
}

function smoothPath(points) {
  if (!points.length) return ""
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const midX = (previous.x + point.x) / 2
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

export function RenewalChart({ rows, loading, onOpenPolicy }) {
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const months = Array.from({ length: 12 }, (_, i) => ({ date: new Date(today.getFullYear(), today.getMonth() + i, 1), rows: [], count: 0 }))
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
  }
  const total = months.reduce((sum, m) => sum + m.count, 0)
  const next30 = rows.reduce((sum, row) => {
    const end = dateOnly(row.coverage_end)
    if (!end) return sum
    const days = Math.ceil((end - today) / 86400000)
    return sum + (days >= 0 && days <= 30 ? 1 : 0)
  }, 0)
  const peak = months.reduce((best, m) => m.count > best.count ? m : best, months[0])
  const max = Math.max(1, ...months.map(m => m.count))
  const current = months[selected]
  const sorted = [...current.rows].sort((a, b) => String(a.coverage_end).localeCompare(String(b.coverage_end)))
  const urgencyClass = i => i === 0 ? "urgent" : i <= 2 ? "soon" : "planned"
  const openPolicy = r => onOpenPolicy ? onOpenPolicy(r) : navigate(`/policies/${r.id}`)
  const chart = { width: 1100, height: 300, left: 52, right: 24, top: 28, bottom: 48 }
  const plotWidth = chart.width - chart.left - chart.right
  const plotHeight = chart.height - chart.top - chart.bottom
  const points = months.map((m, i) => ({
    x: chart.left + (plotWidth / (months.length - 1)) * i,
    y: chart.top + plotHeight - (m.count / max) * plotHeight,
  }))
  const linePath = smoothPath(points)
  const areaPath = `${linePath} L ${points.at(-1).x} ${chart.top + plotHeight} L ${points[0].x} ${chart.top + plotHeight} Z`
  const yTicks = [0, .25, .5, .75, 1]
  return <section className="renewal card" aria-label="วางแผนต่ออายุกรมธรรม์">
    <header className="renewal-header">
      <div><span className="renewal-eyebrow">วางแผนงานต่ออายุ</span><h2>มองงานล่วงหน้า จัดลำดับการติดต่อลูกค้า</h2><p>ตั้งแต่วันนี้ถึง {new Date(today.getFullYear(), today.getMonth() + 12, 0).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })} · เดือนแรกนับเฉพาะวันที่ยังไม่หมดอายุ</p></div>
      <span className="renewal-data-badge">ข้อมูลจากวันหมดอายุจริง</span>
    </header>
    <div className="renewal-summary">
      <div><span>ครบกำหนดใน 12 เดือน</span><strong>{count(total)} <small>ฉบับ</small></strong></div>
      <div><span>ต้องติดตามภายใน 30 วัน</span><strong>{count(next30)} <small>ฉบับ</small></strong></div>
      <div><span>เดือนที่มีงานมากที่สุด</span><strong>{total ? monthName(peak.date) : "—"} <small>{total ? `${count(peak.count)} ฉบับ` : "ไม่มีรายการ"}</small></strong></div>
    </div>
    {loading && <p role="status">กำลังปรับปรุงข้อมูล…</p>}
    <div className="renewal-chart-caption"><strong>แนวโน้มจำนวนกรมธรรม์ที่ครบกำหนดรายเดือน</strong><span>เลือกจุดบนกราฟเพื่อดูรายชื่อลูกค้า</span></div>
    <div className="renewal-legend" aria-label="คำอธิบายสีกราฟ">
      <span><i className="urgent" />เร่งด่วน เดือนนี้</span>
      <span><i className="soon" />เตรียมติดตาม 1–3 เดือน</span>
      <span><i className="planned" />วางแผนล่วงหน้า</span>
    </div>
    <div className="renewal-line-scroll">
      <svg className="renewal-line-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="group" aria-label="กราฟเส้นจำนวนกรมธรรม์ครบกำหนดรายเดือน">
        <defs>
          <linearGradient id="renewalArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".26" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {yTicks.map(tick => {
          const y = chart.top + plotHeight - tick * plotHeight
          return <g key={tick}><line className="renewal-grid-line" x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} /><text className="renewal-axis-value" x={chart.left - 10} y={y + 4}>{Math.round(max * tick)}</text></g>
        })}
        <path className="renewal-area" d={areaPath} />
        <path className="renewal-line" d={linePath} />
        <line className="renewal-selected-line" x1={points[selected].x} y1={chart.top} x2={points[selected].x} y2={chart.top + plotHeight} />
        {months.map((m, i) => <g key={i} className={`renewal-point ${urgencyClass(i)}${i === selected ? " selected" : ""}`} role="button" tabIndex="0" aria-label={`${monthName(m.date)} ${m.count} ฉบับ`} onClick={() => setSelected(i)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(i) } }}>
          <circle className="renewal-point-hit" cx={points[i].x} cy={points[i].y} r="19" />
          <circle className="renewal-point-dot" cx={points[i].x} cy={points[i].y} r={i === selected ? 7 : 5} />
          <text className="renewal-point-value" x={points[i].x} y={points[i].y - 14}>{count(m.count)}</text>
          <text className="renewal-axis-month" x={points[i].x} y={chart.height - 17}>{monthName(m.date)}</text>
        </g>)}
      </svg>
    </div>
    <div className="renewal-selection" aria-live="polite"><div><h3>{monthName(current.date)} <span>· {count(current.count)} ฉบับ</span></h3><p>รายชื่อลูกค้าที่ต้องติดตามในเดือนที่เลือก</p></div><span>เรียงวันหมดอายุใกล้ที่สุด</span></div>
    <div className="renewal-records">
      {sorted.length === 0 ? <p className="renewal-empty">ไม่มีกรมธรรม์ครบกำหนดในเดือนนี้</p> : sorted.map(r => {
        const end = dateOnly(r.coverage_end)
        const daysLeft = Math.max(0, Math.ceil((end - today) / 86400000))
        return <button key={r.id} type="button" className="renewal-record" onClick={() => openPolicy(r)}>
        <span className="renewal-record-date"><strong>{end.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</strong><small>เหลือ {count(daysLeft)} วัน</small></span>
        <span className="renewal-record-person"><strong>{r.insured_name || "ไม่ระบุผู้เอาประกัน"}</strong><small>{r.policy_number || "ไม่มีเลขกรมธรรม์"}{r.license_plate ? ` · ${r.license_plate}` : ""}</small></span>
        <span className="renewal-record-open" aria-hidden="true">เปิด ›</span>
      </button>})}
    </div>
    {unknownDates > 0 && <footer className="renewal-note">มี {count(unknownDates)} ฉบับที่ไม่มีวันหมดอายุถูกต้อง จึงไม่รวมในกราฟ</footer>}
  </section>
}
