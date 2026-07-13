import { useState, useEffect, useRef } from "react"
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom"
import api from "../api"
import { fmtDate } from "../helpers"
import { Ico } from "../icons"

/* ── helpers ─────────────────────────────────────────────── */
const toN = v => Number(String(v ?? "").replace(/,/g, "")) || 0
const fmt2 = n =>
  (Number(n) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt0 = n =>
  (Number(n) || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const nowStr = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear() + 543
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

const genQuoteNo = () => {
  const d = new Date()
  const y = d.getFullYear() + 543
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const rand = Math.floor(Math.random() * 90000 + 10000)
  return `D0-${y}${m}${dd}-${rand}`
}

const DRAFT_KEY = "quotation-draft:v1"

const ACCESSORIES_DEFAULT =
  "แคมเปญนี้ไม่สามารถใช้กับรถที่ดัดแปลง ตกแต่ง เข้าข่ายติดตั้งเพื่อความเร็ว การแข่งขัน รถโหลดเตี้ย และยกสูง\n" +
  "ไม่คุ้มครองเกจวัด, บาร์, คาน, แคฟร่า, คาร์บอน, สติ๊กเกอร์, แรฟส์, เคลือบแก้ว\n" +
  "คุ้มครองอุปกรณ์เสริมฟรีรวมในทุนประกันภัย"

const SAMPLE = {
  quote_no: "", quote_date: "",            // เติมตอน mount/clear
  customer_name: "",
  vehicle_code: "", car_make: "", car_model: "", car_year: "", seats: "-",
  drivers_count: "0", driver_behavior: "",
  campaign_code: "", campaign_name: "",
  policy_type: "ประเภท 1", garage_type: "อู่ ประกัน",
  sum_insured: "",
  voluntary_net: "", prb_net: "600",
  liab_person_per: "500,000", liab_person_max: "20,000,000",
  liab_property: "2,500,000", liab_property_deduct: "-",
  own_damage: "", own_damage_deduct: "-", theft_fire: "",
  personal_accident: "100,000", pa_driver_count: "1", pa_passenger_count: "6",
  medical: "100,000", medical_count: "7", bail: "200,000",
  accessories_note: ACCESSORIES_DEFAULT, accessories_max: "20,000",
  agent_name_en: "Peerapong Chanthanama", agent_code: "B200291",
  agent_license: "6304000627", agent_name_th: "พีรพงศ์ จันทร์ธนามา",
  valid_days: "30",
}

const loadDraft = () => {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY))
    if (d && d.q) return d
  } catch { /* draft พัง → เริ่มใหม่ */ }
  return null
}

/* ── PinkInp — inline editable, auto-width ตามข้อความ ─────── */
function PinkInp({ value, onChange, minCh = 4, align = "center", ph = "", block = false }) {
  const len = String(value || ph || "").length
  const width = block ? "100%" : `${Math.min(60, Math.max(minCh, len + 2))}ch`
  return (
    <input
      className="q-pink"
      value={value ?? ""}
      placeholder={ph}
      onChange={e => onChange(e.target.value)}
      style={{ width, textAlign: align }}
    />
  )
}

/* ── NumInp — ตัวเลข: จัดขวา + format comma ตอน blur ───────
   dec: ทศนิยม (0|2) · zeroDash: ค่า 0/ว่าง แสดง "-" ตามเอกสาร */
function NumInp({ value, onChange, minCh = 9, dec = 0, zeroDash = false, block = false }) {
  const len = String(value ?? "").length
  const width = block ? "100%" : `${Math.min(40, Math.max(minCh, len + 2))}ch`
  const blur = () => {
    const raw = String(value ?? "").trim()
    if (raw === "" || raw === "-") { onChange(zeroDash ? "-" : raw); return }
    const n = toN(raw)
    if (n === 0 && zeroDash) { onChange("-"); return }
    onChange(dec === 2 ? fmt2(n) : fmt0(n))
  }
  return (
    <input
      className="q-pink q-num"
      inputMode="decimal"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      onBlur={blur}
      style={{ width, textAlign: "right" }}
    />
  )
}

/* ── AutoNum — ช่องคำนวณอัตโนมัติ override ได้ + ปุ่ม ↺ คืนค่า ── */
function AutoNum({ id, ov, setOv, auto, blank, minCh = 9 }) {
  const overridden = ov[id] !== undefined
  const display = overridden ? ov[id] : (blank ? "" : fmt2(auto))
  const len = String(display).length
  const reset = () => setOv(o => { const n = { ...o }; delete n[id]; return n })
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <input
        className={`q-pink q-num${overridden ? " q-manual" : ""}`}
        inputMode="decimal"
        value={display}
        onChange={e => setOv(o => ({ ...o, [id]: e.target.value }))}
        onBlur={() => { if (overridden) setOv(o => ({ ...o, [id]: fmt2(toN(o[id])) })) }}
        style={{ width: `${Math.max(minCh, len + 2)}ch`, textAlign: "right" }}
        title={overridden ? "แก้เองอยู่ — กด ↺ เพื่อกลับไปคำนวณอัตโนมัติ" : "คำนวณอัตโนมัติ (พิมพ์ทับเพื่อแก้เอง)"}
      />
      {overridden && (
        <button className="q-reset no-print" onClick={reset} title="คืนค่าคำนวณอัตโนมัติ">↺</button>
      )}
    </span>
  )
}

/* ── PAGE ─────────────────────────────────────────────────── */
export function QuotationPage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()
  const [searchParams] = useSearchParams()

  const [q, setQ] = useState(() => {
    const d = loadDraft()
    if (d) return d.q
    return { ...SAMPLE, quote_no: genQuoteNo(), quote_date: nowStr() }
  })
  // override ของช่องคำนวณอัตโนมัติ: v_stamp v_vat v_total p_stamp p_vat p_total
  const [ov, setOv] = useState(() => loadDraft()?.ov || {})

  const set = (k, v) => setQ(f => ({ ...f, [k]: v }))

  // ── autosave draft (debounce 400ms) ──
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ q, ov })) } catch { /* quota เต็ม — ข้าม */ }
    }, 400)
    return () => clearTimeout(t)
  }, [q, ov])

  // ── สูตรตามเอกสารจริง: อากร = 0.4% ปัดขึ้นบาทเต็ม · VAT = (สุทธิ+อากร)×7% ──
  const calcRow = (netRaw, pfx) => {
    const blank = String(netRaw ?? "").trim() === ""
    const net = toN(netRaw)
    const stampAuto = Math.ceil(net * 0.004)
    const stamp = ov[`${pfx}_stamp`] !== undefined ? toN(ov[`${pfx}_stamp`]) : stampAuto
    const vatAuto = Math.round((net + stamp) * 0.07 * 100) / 100
    const vat = ov[`${pfx}_vat`] !== undefined ? toN(ov[`${pfx}_vat`]) : vatAuto
    const totalAuto = Math.round((net + stamp + vat) * 100) / 100
    const total = ov[`${pfx}_total`] !== undefined ? toN(ov[`${pfx}_total`]) : totalAuto
    return { blank, net, stamp, stampAuto, vat, vatAuto, total, totalAuto }
  }
  const V = calcRow(q.voluntary_net, "v")
  const P = calcRow(q.prb_net, "p")

  // ── textarea auto-grow ──
  const areaRef = useRef(null)
  useEffect(() => {
    const el = areaRef.current
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" }
  }, [q.accessories_note])

  // ── ดึงข้อมูลจากกรมธรรม์ในระบบ (modal ค้นหา + ?policy_id= จากหน้าอื่น) ──
  const [pickOpen, setPickOpen] = useState(false)
  const [pickQ, setPickQ]       = useState("")
  const [pickRes, setPickRes]   = useState([])
  const [pickBusy, setPickBusy] = useState(false)

  useEffect(() => {
    if (!pickOpen) return
    const t = setTimeout(() => {
      const qs = pickQ.trim()
      if (!qs) { setPickRes([]); return }
      setPickBusy(true)
      api.get("/policies", { params: { search: qs, limit: 15, sort: "coverage_end", order: "desc" } })
        .then(r => setPickRes(r.data?.data || []))
        .catch(() => setPickRes([]))
        .finally(() => setPickBusy(false))
    }, 250)
    return () => clearTimeout(t)
  }, [pickQ, pickOpen])

  const applyPolicy = (p) => {
    const isPrb = (p.policy_type || "").toUpperCase() === "P"
    const cover = p.own_damage || p.sum_insured
    setQ(f => ({
      ...f,
      customer_name: p.insured_name || f.customer_name,
      car_make:  p.car_make  || "",
      car_model: p.car_model || "",
      car_year:  p.car_year ? String(p.car_year) : "",
      sum_insured: p.sum_insured ? fmt0(p.sum_insured) : f.sum_insured,
      // ประเภท P → เบี้ยลง พ.ร.บ. / อื่นๆ → ลงภาคสมัครใจ
      voluntary_net: !isPrb && p.net_premium ? fmt2(p.net_premium) : f.voluntary_net,
      prb_net:        isPrb && p.net_premium ? fmt2(p.net_premium) : f.prb_net,
      liab_person_per: p.third_party_per_person   ? fmt0(p.third_party_per_person)   : f.liab_person_per,
      liab_person_max: p.third_party_per_accident ? fmt0(p.third_party_per_accident) : f.liab_person_max,
      own_damage: cover ? fmt0(cover) : f.own_damage,
      theft_fire: cover ? fmt0(cover) : f.theft_fire,
    }))
    setOv({})   // เบี้ยใหม่ → กลับไปคำนวณอัตโนมัติ
    setPickOpen(false)
    setPickQ("")
    notify?.(`ดึงข้อมูลจากกรมธรรม์ ${p.policy_number || p.insured_name || ""} แล้ว — ตรวจสอบ/แก้ไขก่อนพิมพ์`)
  }

  // เปิดจากหน้าอื่นด้วย /quotation?policy_id=xxx (เช่น ลิงก์จากหน้า detail)
  useEffect(() => {
    const pid = searchParams.get("policy_id")
    if (!pid) return
    api.get(`/policies/${pid}`)
      .then(r => { const p = r.data?.policy || r.data; if (p?.id) applyPolicy(p) })
      .catch(() => notify?.("โหลดข้อมูลกรมธรรม์ไม่สำเร็จ — กรอกเองได้เลย", "error"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearForm = () => {
    if (!window.confirm("เริ่มใบเสนอราคาใหม่? (ข้อมูลลูกค้า/รถ/เบี้ยจะถูกล้าง — ข้อมูลตัวแทนคงไว้)")) return
    setQ(f => ({
      ...SAMPLE,
      quote_no: genQuoteNo(),
      quote_date: nowStr(),
      // คงข้อมูลตัวแทนเดิม — ไม่ต้องกรอกใหม่ทุกใบ
      agent_name_en: f.agent_name_en, agent_code: f.agent_code,
      agent_license: f.agent_license, agent_name_th: f.agent_name_th,
    }))
    setOv({})
    notify?.("เริ่มใบเสนอราคาใหม่แล้ว")
  }

  const handlePrint = () => window.print()

  return (
    <div className="page-wrap">
      <style>{QUOTATION_CSS}</style>

      <div className="page-hd no-print">
        <button className="page-back" onClick={() => navigate(-1)}>
          <Ico n="chevL" s={19} /> กลับ
        </button>
        <div className="page-hd-div" />
        <div className="page-hd-info">
          <div className="page-title">ใบเสนอราคาประกันภัยรถยนต์</div>
          <div className="page-sub">คลิกแก้ที่ตัวอักษรสีชมพู · กรอกเบี้ยสุทธิแล้ว อากร/VAT/รวม คำนวณให้เอง · บันทึกร่างอัตโนมัติ</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-w" onClick={() => setPickOpen(true)} title="ค้นหากรมธรรม์ในระบบ แล้วดึงข้อมูลมาใส่ใบเสนอราคา">
            <Ico n="search" s={17} />
            <span className="btn-label">ดึงจากกรมธรรม์</span>
          </button>
          <button className="btn btn-w" onClick={clearForm} title="ล้างข้อมูลลูกค้า/รถ/เบี้ย เริ่มใบใหม่ (คงข้อมูลตัวแทน)">
            <Ico n="refresh" s={17} />
            <span className="btn-label">เริ่มใบใหม่</span>
          </button>
          <button className="btn btn-b" onClick={handlePrint} title="พิมพ์ หรือเลือก 'Save as PDF' ในหน้าต่างพิมพ์">
            <Ico n="download" s={18} />
            <span className="btn-label">พิมพ์ / บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* ── Modal ค้นหากรมธรรม์ → ดึงข้อมูล ── */}
      {pickOpen && (
        <>
          <div className="q-pick-backdrop no-print" onClick={() => setPickOpen(false)} />
          <div className="q-pick no-print">
            <div className="q-pick-hd">
              <Ico n="search" s={18} />
              <input
                autoFocus
                value={pickQ}
                onChange={e => setPickQ(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") setPickOpen(false) }}
                placeholder="ค้นหา: ชื่อลูกค้า / ทะเบียนรถ / เลขกรมธรรม์..."
              />
              <button onClick={() => setPickOpen(false)} title="ปิด"><Ico n="x" s={17} /></button>
            </div>
            <div className="q-pick-bd">
              {!pickQ.trim() && <div className="q-pick-hint">พิมพ์เพื่อค้นหากรมธรรม์ในระบบ — เลือกแล้วข้อมูลลูกค้า/รถ/เบี้ย/ความคุ้มครองจะถูกเติมให้ (แก้ต่อได้ทุกช่อง)</div>}
              {pickBusy && <div className="q-pick-hint">กำลังค้นหา...</div>}
              {!pickBusy && pickQ.trim() && pickRes.length === 0 && (
                <div className="q-pick-hint">ไม่พบกรมธรรม์ — ตรวจคำค้น หรือกด "เริ่มใบใหม่" เพื่อกรอกเอง</div>
              )}
              {pickRes.map(p => (
                <div key={p.id} className="q-pick-row" onClick={() => applyPolicy(p)}>
                  <div className="q-pick-name">{p.insured_name || "(ไม่มีชื่อ)"}</div>
                  <div className="q-pick-sub">
                    {[p.license_plate, [p.car_make, p.car_model].filter(Boolean).join(" "),
                      p.coverage_end ? `สิ้นสุด ${fmtDate(p.coverage_end)}` : null,
                      p.policy_number].filter(Boolean).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="page-body">
        <div id="quotation-print-root" className="q-sheet">

          {/* ── HEADER ── */}
          <div className="q-header">
            <div style={{ textAlign: "center" }}>
              <div className="q-tm-logo">TOKIO<br/>MARINE</div>
              <div className="q-tm-caption">TOKIO MARINE<br/>INSURANCE GROUP</div>
            </div>
            <div>
              <div className="q-comp-en">Tokio Marine Safety Insurance (Thailand) PCL.</div>
              <div className="q-addr">S&amp;A Building, 2<sup>nd</sup> - 6<sup>th</sup> floors, No. 302, Silom Road,</div>
              <div className="q-addr">Khwaeng Suriyawong, Khet Bangrak, Bangkok 10500</div>
              <div className="q-addr">Tel. 0-2257-8000  Fax. 0-2253-3701, 0-2253-4222</div>
              <div className="q-addr">Claims Services Tel. 0-2257-8080  Fax. 0-2655-0143</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="q-comp-th">บมจ. คุ้มภัยโตเกียวมารีนประกันภัย (ประเทศไทย)</div>
              <div className="q-addr">อาคารเอสแอนด์เอ ชั้น 2-6 เลขที่ 302 ถนนสีลม</div>
              <div className="q-addr">แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500</div>
              <div className="q-addr" style={{ marginTop: 4 }}>เลขประจำตัวผู้เสียภาษี / ทะเบียนเลขที่: 0107563000011</div>
            </div>
            <img src="/logo_no_bg.png" alt="" className="q-brand-logo" />
          </div>

          {/* ── SUBJECT / QUOTE INFO ── */}
          <div className="q-subj">
            <div><b>เรื่อง</b> เสนอราคาประกันภัยรถยนต์</div>
            <div style={{ textAlign: "right" }}>
              วันที่ออกใบเสนอราคา : <PinkInp value={q.quote_date} onChange={v => set("quote_date", v)} minCh={16} align="left" />
            </div>
            <div>
              <b>เรียน</b> <PinkInp value={q.customer_name} onChange={v => set("customer_name", v)} minCh={20} align="left" ph="ท่านเจ้าของรถ / ชื่อลูกค้า" />
            </div>
            <div style={{ textAlign: "right" }}>
              เลขที่ใบเสนอราคา : <PinkInp value={q.quote_no} onChange={v => set("quote_no", v)} minCh={17} align="left" />
            </div>
          </div>

          <p className="q-intro">
            บมจ. คุ้มภัยโตเกียวมารีนประกันภัย (ประเทศไทย) มีความยินดีเป็นอย่างยิ่งที่ได้มีโอกาสเป็นผู้เสนอราคาประกันภัยรถยนต์ของท่าน
            โดยบริษัทฯ ได้เสนอรายละเอียดการประกันภัยรถยนต์เพื่อให้ท่านพิจารณาดังนี้
          </p>

          {/* ── VEHICLE ── */}
          <div className="q-sec-title">รายละเอียดรถยนต์ที่ขอเอาประกันภัย</div>
          <table className="q-tbl">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>รหัส</th>
                <th style={{ width: "17%" }}>ชื่อรถยนต์</th>
                <th>รุ่น</th>
                <th style={{ width: "9%" }}>ปี</th>
                <th style={{ width: "24%" }}>จำนวนที่นั่ง/ขนาด/น้ำหนัก</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><PinkInp value={q.vehicle_code} onChange={v => set("vehicle_code", v)} block ph="110" /></td>
                <td><PinkInp value={q.car_make} onChange={v => set("car_make", v)} block ph="TOYOTA" /></td>
                <td><PinkInp value={q.car_model} onChange={v => set("car_model", v)} block ph="รุ่นรถ" /></td>
                <td><PinkInp value={q.car_year} onChange={v => set("car_year", v)} block ph="2024" /></td>
                <td><PinkInp value={q.seats} onChange={v => set("seats", v)} block /></td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 8 }}>
            ระบุผู้ขับขี่ <PinkInp value={q.drivers_count} onChange={v => set("drivers_count", v)} minCh={3} /> ท่าน
            {"   "}ระดับพฤติกรรมผู้ขับขี่ <PinkInp value={q.driver_behavior} onChange={v => set("driver_behavior", v)} minCh={6} align="left" />
          </div>

          {/* ── CAMPAIGN HIGHLIGHT ── */}
          <div className="q-hi">
            <div className="q-hi-1">
              <PinkInp value={q.campaign_code} onChange={v => set("campaign_code", v)} minCh={9} ph="C69/00097" />
              {" : "}
              <PinkInp value={q.campaign_name} onChange={v => set("campaign_name", v)} minCh={9} ph="ชื่อแคมเปญ" />
            </div>
            <div className="q-hi-2">
              <PinkInp value={q.policy_type} onChange={v => set("policy_type", v)} minCh={7} />
              {" : "}
              <PinkInp value={q.garage_type} onChange={v => set("garage_type", v)} minCh={8} />
            </div>
            <div className="q-hi-2">
              ทุนประกัน <NumInp value={q.sum_insured} onChange={v => set("sum_insured", v)} minCh={9} /> บาท
            </div>
          </div>

          {/* ── PREMIUM TABLE — กรอกเบี้ยสุทธิ ที่เหลือคำนวณอัตโนมัติ ── */}
          <table className="q-tbl" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th style={{ width: "18%" }}>เบี้ยประกัน</th>
                <th>เบี้ยสุทธิ</th>
                <th>อากร</th>
                <th>ภาษีมูลค่าเพิ่ม</th>
                <th>เบี้ยรวม</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="l">เบี้ยภาคสมัครใจ</td>
                <td className="r"><NumInp value={q.voluntary_net} onChange={v => set("voluntary_net", v)} dec={2} /> บาท</td>
                <td className="r"><AutoNum id="v_stamp" ov={ov} setOv={setOv} auto={V.stampAuto} blank={V.blank} minCh={6} /> บาท</td>
                <td className="r"><AutoNum id="v_vat" ov={ov} setOv={setOv} auto={V.vatAuto} blank={V.blank} /> บาท</td>
                <td className="r"><AutoNum id="v_total" ov={ov} setOv={setOv} auto={V.totalAuto} blank={V.blank} /> บาท</td>
              </tr>
              <tr>
                <td className="l">เบี้ย พ.ร.บ.</td>
                <td className="r"><NumInp value={q.prb_net} onChange={v => set("prb_net", v)} dec={2} /> บาท</td>
                <td className="r"><AutoNum id="p_stamp" ov={ov} setOv={setOv} auto={P.stampAuto} blank={P.blank} minCh={6} /> บาท</td>
                <td className="r"><AutoNum id="p_vat" ov={ov} setOv={setOv} auto={P.vatAuto} blank={P.blank} /> บาท</td>
                <td className="r"><AutoNum id="p_total" ov={ov} setOv={setOv} auto={P.totalAuto} blank={P.blank} /> บาท</td>
              </tr>
              <tr style={{ fontWeight: 700, background: "#fafafa" }}>
                <td className="l">เบี้ยรวม พ.ร.บ.</td>
                <td className="r">{fmt2(V.net + P.net)} บาท</td>
                <td className="r">{fmt2(V.stamp + P.stamp)} บาท</td>
                <td className="r">{fmt2(V.vat + P.vat)} บาท</td>
                <td className="r">{fmt2(V.total + P.total)} บาท</td>
              </tr>
            </tbody>
          </table>
          <div className="q-formula-hint no-print">
            สูตรอัตโนมัติ: อากร = เบี้ยสุทธิ × 0.4% ปัดขึ้นบาทเต็ม · VAT = (สุทธิ+อากร) × 7% · พิมพ์ทับได้ทุกช่อง (มี ↺ ให้คืนค่า)
          </div>

          {/* ── COVERAGE ── */}
          <div className="q-sec-title" style={{ marginTop: 10 }}>ความคุ้มครอง</div>
          <table className="q-cov">
            <tbody>
              <CovHead>1. ความรับผิดต่อบุคคลภายนอก</CovHead>
              <CovRow label="1.1 ความเสียหายต่อชีวิต ร่างกาย หรืออนามัย" unit="บาท/คน"
                value={q.liab_person_per} onChange={v => set("liab_person_per", v)} />
              <CovRow label="เฉพาะส่วนเกินวงเงินสูงสุดตาม พ.ร.บ." unit="บาท/ครั้ง" indent
                value={q.liab_person_max} onChange={v => set("liab_person_max", v)} />
              <CovRow label="1.2 ความเสียหายต่อทรัพย์สิน" unit="บาท/ครั้ง"
                value={q.liab_property} onChange={v => set("liab_property", v)} />
              <CovRow label="1.2.1 ความเสียหายส่วนแรก" unit="บาท/ครั้ง" indent
                value={q.liab_property_deduct} onChange={v => set("liab_property_deduct", v)} />

              <CovHead>2. รถยนต์เสียหาย สูญหาย ไฟไหม้</CovHead>
              <CovRow label="2.1 ความเสียหายต่อรถยนต์" unit="บาท/ครั้ง"
                value={q.own_damage} onChange={v => set("own_damage", v)} />
              <CovRow label="2.1.1 ความเสียหายส่วนแรก" unit="บาท/ครั้ง" indent
                value={q.own_damage_deduct} onChange={v => set("own_damage_deduct", v)} />
              <CovRow label="2.2 รถยนต์สูญหาย / ไฟไหม้" unit="บาท"
                value={q.theft_fire} onChange={v => set("theft_fire", v)} />

              <CovHead>3. ความคุ้มครองตามเอกสารแนบท้าย</CovHead>
              <CovRow label="3.1 อุบัติเหตุส่วนบุคคล" unit="บาท/คน"
                value={q.personal_accident} onChange={v => set("personal_accident", v)}
                extra={<>(ผู้ขับขี่ <PinkInp value={q.pa_driver_count} onChange={v => set("pa_driver_count", v)} minCh={2} /> คน ผู้โดยสาร <PinkInp value={q.pa_passenger_count} onChange={v => set("pa_passenger_count", v)} minCh={2} /> คน)</>} />
              <CovRow label="3.2 ค่ารักษาพยาบาล" unit="บาท/คน"
                value={q.medical} onChange={v => set("medical", v)}
                extra={<>(จำนวน <PinkInp value={q.medical_count} onChange={v => set("medical_count", v)} minCh={2} /> คน)</>} />
              <CovRow label="3.3 การประกันตัวผู้ขับขี่" unit="บาท/ครั้ง"
                value={q.bail} onChange={v => set("bail", v)} />
            </tbody>
          </table>

          {/* ── ACCESSORIES ── */}
          <table className="q-acc">
            <tbody>
              <tr>
                <td className="lbl">อุปกรณ์เสริม</td>
                <td>
                  <textarea
                    ref={areaRef}
                    className="q-pink q-area"
                    rows={3}
                    value={q.accessories_note}
                    onChange={e => set("accessories_note", e.target.value)}
                  />
                  <div style={{ marginTop: 2 }}>
                    - อุปกรณ์เสริมอื่นๆไม่เกิน <NumInp value={q.accessories_max} onChange={v => set("accessories_max", v)} minCh={6} /> บาท
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── NOTES ── */}
          <ol className="q-notes">
            <li>เอกสารฉบับนี้คือใบเสนอราคาเท่านั้น บริษัทฯ สงวนไว้ซึ่งสิทธิในการปรับปรุง เปลี่ยนแปลง ทุนประกัน ค่าเบี้ยประกัน รวมถึงการให้ความคุ้มครองใดๆ ต่อเมื่อบริษัทฯ ได้ตรวจสอบสภาพรถยนต์ตามประเภทของประกันภัยแล้ว</li>
            <li>ข้อเสนอนี้สำหรับประกันภัยรถยนต์รายใหม่กับบริษัทฯ เท่านั้น</li>
            <li>เอกสารแจ้งทำประกันภัย: สำเนาทะเบียนรถ / สำเนาบัตรประชาชน / สำเนาใบอนุญาตขับขี่ (กรณีระบุผู้ขับขี่) กรณีนิติบุคคล: สำเนาทะเบียนการค้า / สำเนาบัตรประชาชนของกรรมการผู้มีอำนาจลงนาม</li>
            <li>ข้อเสนอนี้มีกำหนดระยะเวลา <PinkInp value={q.valid_days} onChange={v => set("valid_days", v)} minCh={3} /> วัน นับจากวันที่เสนอ</li>
          </ol>

          <p className="q-outro">
            บริษัทฯ หวังเป็นอย่างยิ่งในการเป็นผู้รับประกันความเสี่ยงภัยให้กับรถยนต์ของท่าน หากท่านมีข้อสอบถามเพิ่มเติม บริษัทฯ พร้อมที่จะให้คำปรึกษาท่านตลอดเวลา
          </p>

          {/* ── SIGNATURES ── */}
          <div className="q-sign">
            <div>
              <div>ขอแสดงความนับถือ</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>บมจ. คุ้มภัยโตเกียวมารีนประกันภัย (ประเทศไทย)</div>
              <div style={{ marginTop: 22 }}>ตัวแทน/นายหน้าประกันภัย</div>
              <div>
                <PinkInp value={q.agent_name_en} onChange={v => set("agent_name_en", v)} minCh={18} align="left" />
                {" "}
                <PinkInp value={q.agent_code} onChange={v => set("agent_code", v)} minCh={7} align="left" />
              </div>
              <div>
                เลขที่ใบอนุญาตประกันวินาศภัย {" "}
                <PinkInp value={q.agent_license} onChange={v => set("agent_license", v)} minCh={10} align="left" />
              </div>
              <div>
                โดย <PinkInp value={q.agent_name_th} onChange={v => set("agent_name_th", v)} minCh={18} align="left" />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div>ขอยืนยันการขอเอาประกันภัย</div>
              {/* เว้นว่างให้ลูกค้าเซ็นจริง — ตามต้นฉบับ */}
              <div style={{ marginTop: 30 }}>
                (<span className="q-sig-space" />)
              </div>
              <div style={{ fontSize: 10, marginTop: 2 }}>ลายมือชื่อผู้ขอเอาประกันภัย</div>
              <div style={{ marginTop: 10 }}>
                <span className="q-line" />&nbsp;/&nbsp;<span className="q-line" />&nbsp;/&nbsp;<span className="q-line" style={{ minWidth: 48 }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Coverage row helpers ─────────────────────────────────── */
function CovHead({ children }) {
  return (
    <tr>
      <td colSpan={3} style={{ padding: "6px 8px 3px", fontWeight: 700 }}>{children}</td>
    </tr>
  )
}
function CovRow({ label, unit, value, onChange, extra, indent }) {
  return (
    <tr>
      <td style={{ padding: `3px 0 3px ${indent ? 34 : 22}px` }}>{label}</td>
      <td style={{ padding: "3px 8px", color: "#555", whiteSpace: "nowrap", width: 82 }}>{unit}</td>
      <td style={{ padding: "3px 10px 3px 0", textAlign: "right", whiteSpace: "nowrap" }}>
        <NumInp value={value} onChange={onChange} minCh={8} zeroDash />
        {extra && <div style={{ fontWeight: 400, fontSize: 10, color: "#555" }}>{extra}</div>}
      </td>
    </tr>
  )
}

/* ── styles ───────────────────────────────────────────────── */
const QUOTATION_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');

/* Sheet — A4 proportions, centered */
.q-sheet {
  max-width: 820px; margin: 0 auto;
  background: #fff; color: #000;
  border: 1px solid #d0d7e0; border-radius: 8px;
  padding: 26px 34px; box-shadow: 0 2px 8px rgba(0,0,0,.08);
  font-family: 'Sarabun','Noto Sans Thai',sans-serif;
  font-size: 12px; line-height: 1.5;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
body.dark .q-sheet { color: #000; }

/* Pink editable — เนียนเหมือนตัวหนังสือในเอกสาร, เส้นบอกใบ้จางๆ */
.q-pink {
  color: #d63384; font-weight: 600;
  border: none; background: transparent;
  border-bottom: 1px dashed rgba(214,51,132,.35);
  font-family: inherit; font-size: inherit;
  padding: 0 2px; outline: none; box-sizing: border-box;
  border-radius: 2px;
  transition: background .12s, border-color .12s;
}
.q-pink::placeholder { color: rgba(214,51,132,.4); font-weight: 400; }
.q-pink:hover { background: rgba(214,51,132,.07); border-bottom-color: rgba(214,51,132,.7); }
.q-pink:focus { background: rgba(214,51,132,.12); border-bottom: 1px solid #d63384; }
.q-num { font-variant-numeric: tabular-nums; }
.q-manual { border-bottom-style: solid; border-bottom-color: #b45309; }
.q-reset {
  border: none; background: transparent; color: #b45309;
  cursor: pointer; font-size: 12px; padding: 0 2px; margin-left: 1px;
  vertical-align: baseline; line-height: 1;
}
.q-reset:hover { color: #d63384; }
.q-area {
  width: 100%; resize: none; overflow: hidden;
  border: 1px dashed rgba(214,51,132,.35);
  padding: 4px 6px; border-radius: 4px; line-height: 1.55;
}
.q-area:focus { border-color: #d63384; }
.q-formula-hint { margin-top: 4px; font-size: 10.5px; color: #94a3b8; }

/* Header */
.q-header {
  display: grid; grid-template-columns: auto 1fr 1fr auto;
  gap: 12px; align-items: flex-start;
  padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; margin-bottom: 10px;
}
.q-tm-logo {
  width: 48px; height: 48px; border-radius: 50%;
  border: 2.5px solid #002d72; color: #002d72;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 800; line-height: 1; text-align: center;
  margin: 0 auto;
}
.q-tm-caption { font-size: 5.5px; font-weight: 700; color: #002d72; letter-spacing: .4px; margin-top: 2px; line-height: 1.3; }
.q-brand-logo { width: 50px; height: 50px; object-fit: contain; }
.q-comp-en, .q-comp-th { font-size: 11.5px; font-weight: 700; }
.q-addr { font-size: 9.5px; color: #333; }

/* Subject / intro */
.q-subj {
  display: grid; grid-template-columns: 1fr auto;
  row-gap: 4px; column-gap: 20px;
  margin-top: 6px; font-size: 11.5px; align-items: baseline;
}
.q-intro { margin: 10px 0 6px; font-size: 11.5px; text-indent: 26px; line-height: 1.6; }
.q-sec-title { margin-top: 6px; font-weight: 700; font-size: 12px; }

/* Tables */
.q-tbl { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11px; table-layout: fixed; }
.q-tbl th {
  border: 1px solid #555; background: #f3f4f6;
  padding: 5px 6px; font-size: 10.5px; font-weight: 700; text-align: center;
}
.q-tbl td { border: 1px solid #555; padding: 4px 6px; text-align: center; overflow: hidden; }
.q-tbl td.l { text-align: left; }
.q-tbl td.r { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Campaign highlight */
.q-hi { text-align: center; margin: 12px 0 6px; line-height: 1.55; }
.q-hi-1 { font-size: 14.5px; font-weight: 800; }
.q-hi-2 { font-size: 12.5px; font-weight: 700; margin-top: 2px; }

/* Coverage */
.q-cov { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11px; border: 1px solid #555; }
.q-cov td { padding: 3px 8px; }

/* Accessory */
.q-acc { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10.5px; }
.q-acc td { border: 1px solid #555; padding: 6px 8px; vertical-align: top; }
.q-acc td.lbl { width: 100px; font-weight: 700; }

/* Notes / signature */
.q-notes { margin-top: 10px; padding-left: 22px; font-size: 10.5px; line-height: 1.55; }
.q-outro { margin-top: 8px; font-size: 10.5px; line-height: 1.55; }
.q-sign {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 30px; margin-top: 16px; font-size: 11px;
}
.q-line { border-bottom: 1px solid #000; display: inline-block; min-width: 34px; }
.q-sig-space { display: inline-block; min-width: 170px; border-bottom: 1px dotted #999; margin: 0 4px; }

/* ── Modal ค้นหากรมธรรม์ ── */
.q-pick-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 1000;
}
.q-pick {
  position: fixed; z-index: 1001;
  top: 90px; left: 50%; transform: translateX(-50%);
  width: min(560px, calc(100vw - 24px));
  background: var(--sur); border: 1px solid var(--brd); border-radius: 14px;
  box-shadow: 0 18px 50px rgba(0,0,0,.25);
  overflow: hidden;
}
.q-pick-hd {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-bottom: 1px solid var(--brd);
  color: var(--t3);
}
.q-pick-hd input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 16px; font-family: inherit; color: var(--t1);
}
.q-pick-hd button {
  border: none; background: transparent; cursor: pointer; color: var(--t3);
  display: flex; padding: 4px;
}
.q-pick-bd { max-height: 50vh; overflow-y: auto; padding: 6px; }
.q-pick-hint { padding: 18px 14px; font-size: 14px; color: var(--t3); line-height: 1.5; }
.q-pick-row {
  padding: 10px 12px; border-radius: 9px; cursor: pointer;
}
.q-pick-row:hover { background: var(--blue-bg); }
.q-pick-name { font-size: 15px; font-weight: 700; color: var(--t1); }
.q-pick-sub { font-size: 12.5px; color: var(--t3); margin-top: 2px; }

/* ── Print — ใช้ได้ทั้งปุ่มพิมพ์และ Ctrl+P (style นี้ mount เฉพาะหน้านี้) ── */
@media print {
  @page { size: A4; margin: 9mm 11mm; }
  body * { visibility: hidden !important; }
  #quotation-print-root, #quotation-print-root * { visibility: visible !important; }
  #quotation-print-root {
    position: absolute !important;
    left: 0 !important; top: 0 !important;
    width: 100% !important; max-width: 100% !important;
    box-shadow: none !important; border: none !important;
    border-radius: 0 !important;
    padding: 0 !important; margin: 0 !important;
  }
  /* ฟิลด์กลายเป็นตัวหนังสือชมพูเรียบๆ เหมือนเอกสารจริง */
  #quotation-print-root .q-pink,
  #quotation-print-root .q-area {
    border: none !important; background: transparent !important;
    padding: 0 !important;
  }
  #quotation-print-root .q-reset,
  .no-print { display: none !important; }
}

/* Mobile */
@media (max-width: 900px) {
  .q-sheet { padding: 16px 12px; font-size: 11px; }
  .q-header { grid-template-columns: 1fr; gap: 6px; }
  .q-header > div:nth-child(3) { text-align: left; }
  .q-brand-logo { display: none; }
  .q-subj { grid-template-columns: 1fr; }
  .q-subj > div { text-align: left !important; }
  .q-sheet .q-tbl { table-layout: auto; }
  .q-sheet .q-tbl, .q-sheet .q-cov, .q-sheet .q-acc {
    display: block; overflow-x: auto; white-space: nowrap;
  }
  .q-sign { grid-template-columns: 1fr; gap: 20px; }
}
`
