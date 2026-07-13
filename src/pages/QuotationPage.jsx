import { useState, useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { Ico } from "../icons"

/* ── helpers ─────────────────────────────────────────────── */
const toN = v => Number(String(v ?? "").replace(/,/g, "")) || 0
const baht = n =>
  toN(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = n =>
  toN(n).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const nowStr = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear() + 543
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  const ss = String(d.getSeconds()).padStart(2, "0")
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`
}

const genQuoteNo = () => {
  const d = new Date()
  const y = d.getFullYear() + 543
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const rand = Math.floor(Math.random() * 90000 + 10000)
  return `D0-${y}${m}${dd}-${rand}`
}

/* ── PinkInp — inline editable field (looks like pink text in PDF) ── */
function PinkInp({ value, onChange, w = "auto", align = "center", ph = "" }) {
  return (
    <input
      className="q-pink"
      value={value ?? ""}
      placeholder={ph}
      onChange={e => onChange(e.target.value)}
      style={{ width: w, textAlign: align }}
    />
  )
}

/* ── NumInp — like PinkInp but text-align right, comma-friendly ── */
function NumInp({ value, onChange, w = 110 }) {
  return (
    <input
      className="q-pink q-num"
      inputMode="decimal"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      style={{ width: w, textAlign: "right" }}
    />
  )
}

/* ── PAGE ─────────────────────────────────────────────────── */
export function QuotationPage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()

  const [q, setQ] = useState({
    quote_no:      genQuoteNo(),
    quote_date:    nowStr(),
    customer_name: "ท่านเจ้าของรถ",

    vehicle_code:  "110",
    car_make:      "TOYOTA",
    car_model:     "FORTUNER Legender 2.8",
    car_year:      "2024",
    seats:         "-",
    drivers_count: "0",
    driver_behavior: "",

    campaign_code: "C69/00097",
    campaign_name: "SUV SABAI",
    policy_type:   "ประเภท 1",
    garage_type:   "อู่ ประกัน",
    sum_insured:   "1,100,000",

    voluntary_net:   "15,358.56",
    voluntary_stamp: "62.00",
    voluntary_vat:   "1,079.44",
    voluntary_total: "16,500.00",

    prb_net:   "600.00",
    prb_stamp: "3.00",
    prb_vat:   "42.21",
    prb_total: "645.21",

    liab_person_per:     "500,000",
    liab_person_max:     "20,000,000",
    liab_property:       "2,500,000",
    liab_property_deduct: "-",
    own_damage:          "1,100,000",
    own_damage_deduct:   "-",
    theft_fire:          "1,100,000",
    personal_accident:   "100,000",
    pa_driver_count:     "1",
    pa_passenger_count:  "6",
    medical:             "100,000",
    medical_count:       "7",
    bail:                "200,000",

    accessories_note: "แคมเปญนี้ไม่สามารถใช้กับรถที่ดัดแปลง ตกแต่ง เข้าข่ายติดตั้งเพื่อความเร็ว การแข่งขัน รถโหลดเตี้ย และยกสูง\nไม่คุ้มครองเกจวัด, บาร์, คาน, แคฟร่า, คาร์บอน, สติ๊กเกอร์, แรฟส์, เคลือบแก้ว\nคุ้มครองอุปกรณ์เสริมฟรีรวมในทุนประกันภัย",
    accessories_max:  "20,000",

    agent_name_en: "Peerapong Chanthanama",
    agent_code:    "B200291",
    agent_license: "6304000627",
    agent_name_th: "พีรพงศ์ จันทร์ธนามา",

    valid_days: "30",
  })

  const set = (k, v) => setQ(f => ({ ...f, [k]: v }))

  const totals = useMemo(() => {
    const vNet = toN(q.voluntary_net) + toN(q.prb_net)
    const vStamp = toN(q.voluntary_stamp) + toN(q.prb_stamp)
    const vVat = toN(q.voluntary_vat) + toN(q.prb_vat)
    const vTotal = toN(q.voluntary_total) + toN(q.prb_total)
    return { vNet, vStamp, vVat, vTotal }
  }, [q])

  const applyAutoTotal = () => setQ(f => ({
    ...f,
    voluntary_total: (toN(f.voluntary_net) + toN(f.voluntary_stamp) + toN(f.voluntary_vat))
      .toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    prb_total: (toN(f.prb_net) + toN(f.prb_stamp) + toN(f.prb_vat))
      .toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }))

  const handlePrint = () => {
    document.body.classList.add("printing-quotation")
    window.print()
    setTimeout(() => document.body.classList.remove("printing-quotation"), 500)
    notify?.("เปิดหน้าต่างพิมพ์ — เลือก 'บันทึกเป็น PDF' ในเบราว์เซอร์")
  }

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
          <div className="page-sub">คลิกที่ตัวหนังสือสีชมพูเพื่อแก้ไข · กดพิมพ์เพื่อบันทึกเป็น PDF</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-w" onClick={applyAutoTotal} title="รวมเบี้ยสุทธิ+อากร+VAT ใส่ในช่อง 'เบี้ยรวม'">
            <Ico n="refresh" s={17} />
            <span className="btn-label">คำนวณเบี้ยรวม</span>
          </button>
          <button className="btn btn-b" onClick={handlePrint}>
            <Ico n="download" s={18} />
            <span className="btn-label">พิมพ์ / บันทึก PDF</span>
          </button>
        </div>
      </div>

      <div className="page-body">
        <div id="quotation-print-root" className="q-sheet">

          {/* ── HEADER ── */}
          <div className="q-header">
            <div className="q-tm-logo">TOKIO<br/>MARINE</div>
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
              วันที่ออกใบเสนอราคา : <PinkInp value={q.quote_date} onChange={v => set("quote_date", v)} w={175} align="left" />
            </div>
            <div>
              <b>เรียน</b> <PinkInp value={q.customer_name} onChange={v => set("customer_name", v)} w={280} align="left" />
            </div>
            <div style={{ textAlign: "right" }}>
              เลขที่ใบเสนอราคา : <PinkInp value={q.quote_no} onChange={v => set("quote_no", v)} w={180} align="left" />
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
                <th style={{ width: 60 }}>รหัส</th>
                <th style={{ width: 130 }}>ชื่อรถยนต์</th>
                <th>รุ่น</th>
                <th style={{ width: 70 }}>ปี</th>
                <th style={{ width: 200 }}>จำนวนที่นั่ง/ขนาด/น้ำหนัก</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><PinkInp value={q.vehicle_code} onChange={v => set("vehicle_code", v)} w="100%" /></td>
                <td><PinkInp value={q.car_make} onChange={v => set("car_make", v)} w="100%" /></td>
                <td><PinkInp value={q.car_model} onChange={v => set("car_model", v)} w="100%" /></td>
                <td><PinkInp value={q.car_year} onChange={v => set("car_year", v)} w="100%" /></td>
                <td><PinkInp value={q.seats} onChange={v => set("seats", v)} w="100%" /></td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 8 }}>
            ระบุผู้ขับขี่ <PinkInp value={q.drivers_count} onChange={v => set("drivers_count", v)} w={40} /> ท่าน
            {"   "}ระดับพฤติกรรมผู้ขับขี่ <PinkInp value={q.driver_behavior} onChange={v => set("driver_behavior", v)} w={80} align="left" />
          </div>

          {/* ── CAMPAIGN HIGHLIGHT ── */}
          <div className="q-hi">
            <div className="q-hi-1">
              <PinkInp value={q.campaign_code} onChange={v => set("campaign_code", v)} w={130} />
              {" : "}
              <PinkInp value={q.campaign_name} onChange={v => set("campaign_name", v)} w={180} />
            </div>
            <div className="q-hi-2">
              <PinkInp value={q.policy_type} onChange={v => set("policy_type", v)} w={100} />
              {" : "}
              <PinkInp value={q.garage_type} onChange={v => set("garage_type", v)} w={130} />
            </div>
            <div className="q-hi-2">
              ทุนประกัน <NumInp value={q.sum_insured} onChange={v => set("sum_insured", v)} w={120} /> บาท
            </div>
          </div>

          {/* ── PREMIUM TABLE ── */}
          <table className="q-tbl" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th>เบี้ยประกัน</th>
                <th>เบี้ยสุทธิ</th>
                <th>อากร</th>
                <th>ภาษีมูลค่าเพิ่ม</th>
                <th>เบี้ยรวม</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="l">เบี้ยภาคสมัครใจ</td>
                <td className="r"><NumInp value={q.voluntary_net}   onChange={v => set("voluntary_net",   v)} /> บาท</td>
                <td className="r"><NumInp value={q.voluntary_stamp} onChange={v => set("voluntary_stamp", v)} w={70} /> บาท</td>
                <td className="r"><NumInp value={q.voluntary_vat}   onChange={v => set("voluntary_vat",   v)} /> บาท</td>
                <td className="r"><NumInp value={q.voluntary_total} onChange={v => set("voluntary_total", v)} /> บาท</td>
              </tr>
              <tr>
                <td className="l">เบี้ย พ.ร.บ.</td>
                <td className="r"><NumInp value={q.prb_net}   onChange={v => set("prb_net",   v)} /> บาท</td>
                <td className="r"><NumInp value={q.prb_stamp} onChange={v => set("prb_stamp", v)} w={70} /> บาท</td>
                <td className="r"><NumInp value={q.prb_vat}   onChange={v => set("prb_vat",   v)} /> บาท</td>
                <td className="r"><NumInp value={q.prb_total} onChange={v => set("prb_total", v)} /> บาท</td>
              </tr>
              <tr style={{ fontWeight: 700, background: "#fafafa" }}>
                <td className="l">เบี้ยรวม พ.ร.บ.</td>
                <td className="r">{baht(totals.vNet)} บาท</td>
                <td className="r">{baht(totals.vStamp)} บาท</td>
                <td className="r">{baht(totals.vVat)} บาท</td>
                <td className="r">{baht(totals.vTotal)} บาท</td>
              </tr>
            </tbody>
          </table>

          {/* ── COVERAGE ── */}
          <div className="q-sec-title" style={{ marginTop: 12 }}>ความคุ้มครอง</div>
          <table className="q-cov">
            <tbody>
              <CovHead>1. ความรับผิดต่อบุคคลภายนอก</CovHead>
              <CovRow label="1.1 ความเสียหายต่อชีวิต ร่างกาย หรืออนามัย" unit="บาท/คน"
                value={q.liab_person_per} onChange={v => set("liab_person_per", v)} />
              <CovRow label="เฉพาะส่วนเกินวงเงินสูงสุดตาม พ.ร.บ." unit="บาท/ครั้ง"
                value={q.liab_person_max} onChange={v => set("liab_person_max", v)} />
              <CovRow label="1.2 ความเสียหายต่อทรัพย์สิน" unit="บาท/ครั้ง"
                value={q.liab_property} onChange={v => set("liab_property", v)} />
              <CovRow label="1.2.1 ความเสียหายส่วนแรก" unit="บาท/ครั้ง"
                value={q.liab_property_deduct} onChange={v => set("liab_property_deduct", v)} />

              <CovHead>2. รถยนต์เสียหาย สูญหาย ไฟไหม้</CovHead>
              <CovRow label="2.1 ความเสียหายต่อรถยนต์" unit="บาท/ครั้ง"
                value={q.own_damage} onChange={v => set("own_damage", v)} />
              <CovRow label="2.1.1 ความเสียหายส่วนแรก" unit="บาท/ครั้ง"
                value={q.own_damage_deduct} onChange={v => set("own_damage_deduct", v)} />
              <CovRow label="2.2 รถยนต์สูญหาย / ไฟไหม้" unit="บาท"
                value={q.theft_fire} onChange={v => set("theft_fire", v)} />

              <CovHead>3. ความคุ้มครองตามเอกสารแนบท้าย</CovHead>
              <CovRow label="3.1 อุบัติเหตุส่วนบุคคล" unit="บาท/คน"
                value={q.personal_accident} onChange={v => set("personal_accident", v)}
                extra={<>(ผู้ขับขี่ <PinkInp value={q.pa_driver_count} onChange={v => set("pa_driver_count", v)} w={30} /> คน ผู้โดยสาร <PinkInp value={q.pa_passenger_count} onChange={v => set("pa_passenger_count", v)} w={30} /> คน)</>} />
              <CovRow label="3.2 ค่ารักษาพยาบาล" unit="บาท/คน"
                value={q.medical} onChange={v => set("medical", v)}
                extra={<>(จำนวน <PinkInp value={q.medical_count} onChange={v => set("medical_count", v)} w={30} /> คน)</>} />
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
                    className="q-pink q-area"
                    rows={3}
                    value={q.accessories_note}
                    onChange={e => set("accessories_note", e.target.value)}
                  />
                  <div style={{ marginTop: 2 }}>
                    - อุปกรณ์เสริมอื่นๆไม่เกิน <NumInp value={q.accessories_max} onChange={v => set("accessories_max", v)} w={80} /> บาท
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
            <li>ข้อเสนอนี้มีกำหนดระยะเวลา <PinkInp value={q.valid_days} onChange={v => set("valid_days", v)} w={35} /> วัน นับจากวันที่เสนอ</li>
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
                <PinkInp value={q.agent_name_en} onChange={v => set("agent_name_en", v)} w={200} align="left" />
                {" "}
                <PinkInp value={q.agent_code} onChange={v => set("agent_code", v)} w={90} align="left" />
              </div>
              <div>
                เลขที่ใบอนุญาตประกันวินาศภัย {" "}
                <PinkInp value={q.agent_license} onChange={v => set("agent_license", v)} w={110} align="left" />
              </div>
              <div>
                โดย <PinkInp value={q.agent_name_th} onChange={v => set("agent_name_th", v)} w={200} align="left" />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div>ขอยืนยันการขอเอาประกันภัย</div>
              <div style={{ marginTop: 26, borderTop: "1px solid #000", paddingTop: 4 }}>
                (&nbsp;&nbsp;{q.customer_name || " "}&nbsp;&nbsp;)
              </div>
              <div style={{ fontSize: 10 }}>ลายมือชื่อผู้ขอเอาประกันภัย</div>
              <div style={{ marginTop: 10 }}>
                <span className="q-line" />&nbsp;/&nbsp;<span className="q-line" />&nbsp;/&nbsp;<span className="q-line" style={{ minWidth: 45 }} />
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
      <td colSpan={3} style={{ padding: "6px 0 3px", fontWeight: 700 }}>{children}</td>
    </tr>
  )
}
function CovRow({ label, unit, value, onChange, extra }) {
  return (
    <tr>
      <td style={{ padding: "3px 0 3px 14px" }}>{label}</td>
      <td style={{ padding: "3px 8px", color: "#555", whiteSpace: "nowrap", width: 78 }}>{unit}</td>
      <td style={{ padding: "3px 0", textAlign: "right", whiteSpace: "nowrap" }}>
        <NumInp value={value} onChange={onChange} w={100} />
        {extra && <div style={{ fontWeight: 400, fontSize: 10, color: "#555" }}>{extra}</div>}
      </td>
    </tr>
  )
}

/* ── styles ───────────────────────────────────────────────── */
const QUOTATION_CSS = `
/* Sheet — A4-ish, centered */
.q-sheet {
  max-width: 820px; margin: 0 auto;
  background: #fff; color: #000;
  border: 1px solid #d0d7e0; border-radius: 8px;
  padding: 26px 34px; box-shadow: 0 2px 8px rgba(0,0,0,.08);
  font-family: 'Sarabun','Noto Sans Thai',sans-serif;
  font-size: 12px; line-height: 1.5;
}
body.dark .q-sheet { color: #000; }

/* Pink editable input */
.q-pink {
  color: #d63384;
  font-weight: 600;
  border: none;
  background: transparent;
  border-bottom: 1px dashed #d63384;
  font-family: inherit;
  font-size: inherit;
  padding: 0 3px;
  outline: none;
  box-sizing: border-box;
  min-width: 30px;
  border-radius: 2px;
}
.q-pink:hover { background: rgba(214,51,132,0.06); }
.q-pink:focus { background: rgba(214,51,132,0.12); border-bottom-style: solid; }
.q-num { font-variant-numeric: tabular-nums; }
.q-area {
  width: 100%;
  resize: vertical;
  border: 1px dashed #d63384;
  padding: 4px 6px;
  border-radius: 4px;
  line-height: 1.5;
}

/* Header */
.q-header {
  display: grid;
  grid-template-columns: auto 1fr 1fr auto;
  gap: 12px; align-items: flex-start;
  padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; margin-bottom: 10px;
}
.q-tm-logo {
  width: 50px; height: 50px; border-radius: 50%;
  border: 2.5px solid #002d72; color: #002d72;
  display: flex; align-items: center; justify-content: center;
  font-size: 9.5px; font-weight: 800; line-height: 1; text-align: center;
}
.q-brand-logo { width: 50px; height: 50px; object-fit: contain; }
.q-comp-en, .q-comp-th { font-size: 11.5px; font-weight: 700; }
.q-addr { font-size: 9.5px; color: #333; }

/* Subject / intro */
.q-subj {
  display: grid; grid-template-columns: 1fr auto;
  row-gap: 4px; column-gap: 20px;
  margin-top: 6px; font-size: 11.5px;
}
.q-intro { margin: 10px 0 6px; font-size: 11.5px; text-indent: 26px; line-height: 1.6; }
.q-sec-title { margin-top: 6px; font-weight: 700; font-size: 12px; }

/* Tables */
.q-tbl { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11px; }
.q-tbl th {
  border: 1px solid #555; background: #f3f4f6;
  padding: 5px 6px; font-size: 10.5px; font-weight: 700; text-align: center;
}
.q-tbl td { border: 1px solid #555; padding: 4px 6px; text-align: center; }
.q-tbl td.l { text-align: left; }
.q-tbl td.r { text-align: right; font-variant-numeric: tabular-nums; }
.q-tbl td .q-pink { padding: 0 2px; }

/* Campaign highlight */
.q-hi { text-align: center; margin: 12px 0 6px; line-height: 1.5; }
.q-hi-1 { font-size: 14.5px; font-weight: 800; }
.q-hi-2 { font-size: 12.5px; font-weight: 700; margin-top: 2px; }
.q-hi-2 .q-pink { font-size: inherit; }

/* Coverage */
.q-cov { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11px; border: 1px solid #555; }
.q-cov td { padding: 3px 8px; }

/* Accessory */
.q-acc { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10.5px; }
.q-acc td { border: 1px solid #555; padding: 6px 8px; vertical-align: top; }
.q-acc td.lbl { width: 100px; font-weight: 700; }

/* Notes */
.q-notes { margin-top: 10px; padding-left: 22px; font-size: 10.5px; line-height: 1.55; }
.q-outro { margin-top: 8px; font-size: 10.5px; line-height: 1.55; }
.q-sign {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 30px; margin-top: 16px; font-size: 11px;
}
.q-line { border-bottom: 1px solid #000; display: inline-block; min-width: 32px; }

/* Print — strip pink borders so it looks like a real PDF */
@media print {
  @page { size: A4; margin: 8mm 10mm; }
  body.printing-quotation * { visibility: hidden !important; }
  body.printing-quotation #quotation-print-root,
  body.printing-quotation #quotation-print-root * { visibility: visible !important; }
  body.printing-quotation #quotation-print-root {
    position: absolute !important;
    left: 0 !important; top: 0 !important;
    width: 100% !important; max-width: 100% !important;
    box-shadow: none !important; border: none !important;
    padding: 0 !important; margin: 0 !important;
  }
  body.printing-quotation .q-pink,
  body.printing-quotation .q-area {
    border: none !important; background: transparent !important;
    padding: 0 !important;
  }
  body.printing-quotation .no-print { display: none !important; }
}

/* Mobile — sheet fills viewport, keeps min-width so tables don't collapse */
@media (max-width: 900px) {
  .q-sheet { padding: 16px 14px; font-size: 11px; }
  .q-header { grid-template-columns: 1fr; gap: 6px; text-align: left; }
  .q-header > div:nth-child(3) { text-align: left; }
  .q-tm-logo, .q-brand-logo { width: 42px; height: 42px; }
  .q-subj { grid-template-columns: 1fr; }
  .q-subj > div:nth-child(even) { text-align: left; }
  .q-sheet .q-tbl, .q-sheet .q-cov, .q-sheet .q-acc {
    display: block; overflow-x: auto; white-space: nowrap;
  }
  .q-sign { grid-template-columns: 1fr; gap: 20px; }
}
`
