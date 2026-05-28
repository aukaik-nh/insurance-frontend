import { useState, useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { QrCode } from "../components/QrCode"
import { generatePromptPayPayload } from "../promptpay"

const baht = n => (Number(n) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const genInvoiceNo = () => {
  const d = new Date()
  const ym = `${d.getFullYear() + 543}${String(d.getMonth() + 1).padStart(2, "0")}`
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `INV-${ym}/${rand}`
}

// ── สูตรประกันภัยไทย ─────────────────────────────────────────
const STAMP_DUTY_RATE = 0.004   // อากร 0.4%
const VAT_RATE        = 0.07    // VAT 7%

const calcStampDuty = net => Math.ceil((Number(net) || 0) * STAMP_DUTY_RATE)  // ปัดขึ้นบาทเต็ม

// ── Sub-components (ประกาศนอก InvoicePage กัน re-mount loose focus) ──
function Sec({ ico, title, children }) {
  return (
    <div className="info-card">
      <div className="info-card-hd"><Ico n={ico} s={20} /><span className="info-card-title">{title}</span></div>
      <div className="info-card-bd">{children}</div>
    </div>
  )
}

function Inp({ label, value, onChange, type = "text", placeholder, full, suffix, highlight }) {
  // number → text+inputMode (no spinner, mobile-friendly keyboard)
  const isNum = type === "number"
  const inputType = isNum ? "text" : type
  const inputMode = isNum ? "decimal" : undefined
  return (
    <div className="info-field" style={full ? { gridColumn: "1 / -1" } : undefined}>
      <label className="info-label" style={{ marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type={inputType}
          inputMode={inputMode}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", padding: "13px 17px",
            border: `1.5px solid ${highlight ? "var(--blue)" : "var(--brd)"}`,
            borderRadius: 10, fontSize: 17, fontFamily: "inherit",
            background: highlight ? "var(--blue-bg)" : "var(--sur)",
            color: "var(--t1)",
            textAlign: isNum ? "right" : "left"
          }}
        />
        {suffix && <span style={{ fontSize: 16, color: "var(--t2)", whiteSpace: "nowrap", fontWeight: 500 }}>{suffix}</span>}
      </div>
    </div>
  )
}

function Line({ label, value, muted }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 17 }}>
      <span style={{ color: muted ? "var(--t2)" : "var(--t1)" }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", color: muted ? "var(--t1)" : "var(--t1)" }}>
        {(Number(value) || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
      </span>
    </div>
  )
}

// ── Live invoice preview (สดตาม form ก่อนกด "สร้าง PDF") ───────────────
function InvoicePreview({ form, calc }) {
  const fmtDate = (s) => {
    if (!s) return "—"
    const [y, m, d] = s.split("-")
    return `${String(parseInt(d, 10)).padStart(2, "0")}/${String(parseInt(m, 10)).padStart(2, "0")}/${parseInt(y, 10) + 543}`
  }
  const dash = (v) => (v && String(v).trim()) || "—"
  const wht1 = (calc.net * 0.01).toFixed(2)

  // Tokio Marine DEBIT NOTE preview
  if (form.template === "tm1" || form.template === "tm2") {
    return (
      <div style={{
        background: "#fff", color: "#000",
        border: "1px solid #d0d7e0", borderRadius: 8,
        padding: "18px 22px", boxShadow: "0 2px 6px rgba(0,0,0,.08)",
        fontFamily: "'Sarabun','Noto Sans Thai',sans-serif",
        fontSize: 11, lineHeight: 1.4,
        position: "relative",
      }}>
        {/* ── HEADER: Logo + TM info (EN/TH) + seal ── */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr auto", gap: 10, alignItems: "flex-start", paddingBottom: 8, marginBottom: 10 }}>
          {/* "logo" — circle with TM */}
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "#fff", border: "2.5px solid #002d72",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#002d72", fontSize: 9, fontWeight: 800, lineHeight: 1, textAlign: "center",
          }}>TOKIO<br/>MARINE</div>
          {/* EN block */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#000" }}>Tokio Marine Safety Insurance (Thailand) PCL.</div>
            <div style={{ fontSize: 8.5, color: "#333", marginTop: 1 }}>S&amp;A Building, 2<sup>nd</sup> - 6<sup>th</sup> floors, No. 302, Silom Road,</div>
            <div style={{ fontSize: 8.5, color: "#333" }}>Khwaeng Suriyawong, Khet Bangrak, Bangkok 10500</div>
            <div style={{ fontSize: 8.5, color: "#333" }}>Tel. 0-2257-8000 Fax 0-2253-3701, 0-2253-4222</div>
            <div style={{ fontSize: 8.5, color: "#333" }}>Claims Service Tel. 0-2257-8080</div>
          </div>
          {/* TH block */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#000" }}>บมจ. คุ้มภัยโตเกียวมารีนประกันภัย (ประเทศไทย)</div>
            <div style={{ fontSize: 8.5, color: "#333", marginTop: 1 }}>สำนักงานใหญ่ ชั้น 2-6 เลขที่ 302 ถนนสีลม</div>
            <div style={{ fontSize: 8.5, color: "#333" }}>แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500</div>
            <div style={{ fontSize: 8.5, color: "#333", marginTop: 4 }}>เลขประจำตัวผู้เสียภาษี / ทะเบียนเลขที่: 0107563000011</div>
          </div>
          {/* ประกันคุ้มภัย logo (แทนตรา/seal) */}
          <img src="/logo_no_bg.png" alt="ประกันคุ้มภัย"
            style={{ width: 44, height: 44, objectFit: "contain" }} />
        </div>

        {/* ── Series row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, fontSize: 10, marginBottom: 6 }}>
          <div>
            <span style={{ fontWeight: 700 }}>{form.series || "UPPOR0"}</span>
            <span style={{ marginLeft: 14, color: "#333" }}>
              เริ่มวันที่ : <b>{form.coverage_start || "—"}</b>
              {"   "} สิ้นสุด : <b>{form.coverage_end || "—"}</b>
            </span>
          </div>
          <div style={{ textAlign: "right", lineHeight: 1.3 }}>
            <div style={{ fontSize: 9.5, color: "#444" }}>(เอกสารออกเป็นชุด)</div>
            <div style={{ fontSize: 9.5, color: "#444" }}>เอกสารสำหรับ</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>(ลูกค้า)</div>
            <div style={{ fontSize: 9, color: "#444" }}>(CUSTOMER)</div>
          </div>
        </div>

        {/* ── Title + invoice no/date ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", marginBottom: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>ใบแจ้งหนี้</div>
            <div style={{ fontSize: 11, color: "#444", marginTop: -2 }}>DEBIT NOTE</div>
          </div>
          <table style={{ borderCollapse: "collapse", fontSize: 10 }}>
            <tbody>
              <tr>
                <td style={{ padding: "2px 8px 2px 0", color: "#444" }}>เลขที่<br/><span style={{ fontSize: 8.5 }}>Receipt No.</span></td>
                <td style={{ padding: "2px 0", fontWeight: 700, fontSize: 11 }}>{dash(form.invoice_no)}</td>
              </tr>
              <tr>
                <td style={{ padding: "2px 8px 2px 0", color: "#444" }}>วันที่<br/><span style={{ fontSize: 8.5 }}>Date</span></td>
                <td style={{ padding: "2px 0", fontWeight: 700, fontSize: 11 }}>{fmtDate(form.invoice_date)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Main 2-column box ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #555", fontSize: 10.5 }}>
          <tbody>
            <tr>
              <td rowSpan={5} style={{ border: "1px solid #555", verticalAlign: "top", padding: "8px 10px", width: "60%" }}>
                <div style={{ color: "#555", fontSize: 9.5 }}>ได้รับเงินจาก / Received From</div>
                <div style={{ fontWeight: 700, marginTop: 3, minHeight: 14 }}>{dash(form.buyer.name)}</div>

                <div style={{ color: "#555", fontSize: 9.5, marginTop: 10 }}>ที่อยู่ / Address</div>
                <div style={{ marginTop: 3, minHeight: 50, whiteSpace: "pre-wrap" }}>{dash(form.buyer.address)}</div>

                <div style={{ borderTop: "1px solid #ccc", marginTop: 14, paddingTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ color: "#555", fontSize: 9.5 }}>กรมธรรม์เลขที่ Policy No.</div>
                    <div style={{ fontWeight: 700, marginTop: 2 }}>{dash(form.policy_no)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#555", fontSize: 9.5 }}>สลักหลังเลขที่ Endt. No.</div>
                    <div style={{ fontWeight: 700, marginTop: 2 }}>{dash(form.endorsement_no)}</div>
                  </div>
                </div>
              </td>
              <td style={{ border: "1px solid #555", padding: "5px 8px", color: "#555", fontSize: 9.5 }}>
                เลขประจำตัวผู้เสียภาษี<br/><span style={{ fontSize: 8.5 }}>TAX ID.</span>
              </td>
              <td style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>{dash(form.buyer.tax_id)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #555", padding: "5px 8px", color: "#555", fontSize: 9.5 }}>
                สาขา<br/><span style={{ fontSize: 8.5 }}>Branch</span>
              </td>
              <td style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "right" }}>{dash(form.branch)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #555", padding: "5px 8px", color: "#555", fontSize: 9.5 }}>
                เบี้ยประกันภัย<br/><span style={{ fontSize: 8.5 }}>Premium</span>
              </td>
              <td style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{baht(calc.net)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #555", padding: "5px 8px", color: "#555", fontSize: 9.5 }}>
                อากรแสตมป์<br/><span style={{ fontSize: 8.5 }}>Stamp Duty</span>
              </td>
              <td style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{baht(calc.stamp)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #555", padding: "5px 8px", color: "#555", fontSize: 9.5 }}>
                ภาษี<br/><span style={{ fontSize: 8.5 }}>Tax</span>
              </td>
              <td style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{baht(calc.vat)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #555", padding: "5px 8px", color: "#555", fontSize: 9.5, fontWeight: 700 }}>
                รวมเป็นเงิน<br/><span style={{ fontSize: 8.5, fontWeight: 400 }}>Total</span>
              </td>
              <td style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "right", fontWeight: 700, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{baht(calc.total)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Footer info ── */}
        <div style={{ marginTop: 10, fontSize: 10, lineHeight: 1.6 }}>
          <div>
            กรณีผู้เอาประกันภัยเป็นนิติบุคคล หักภาษี ณ ที่จ่าย 1 %
            <span style={{ marginLeft: 16, fontWeight: 700 }}>{wht1}</span>
          </div>
          {form.insurance_type && (
            <div>
              Type : {form.insurance_type}
              {form.original_policy_no && <span> (กรมธรรม์เดิมเลขที่: {form.original_policy_no})</span>}
            </div>
          )}
          <div style={{ marginTop: 6 }}>
            โปรดจ่ายเป็นเช็คขีดคร่อมในนาม <b>"บริษัท คุ้มภัยโตเกียวมารีนประกันภัย (ประเทศไทย) จำกัด (มหาชน)"</b>
          </div>
          <div style={{ fontSize: 9.5, color: "#444" }}>
            Please pay by crossed cheque to <b>"Tokio Marine Safety Insurance (Thailand) Public Company Limited"</b>
          </div>
        </div>

        {/* ── QR PromptPay (real, scannable) ── */}
        {form.promptpay_target && (() => {
          let payload = null, error = null
          try { payload = generatePromptPayPayload(form.promptpay_target, calc.total) }
          catch (e) { error = e.message }
          return (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #cbd5e0", display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center" }}>
              {payload ? (
                <div style={{
                  padding: 4, background: "#fff", border: "1px solid #ddd", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <QrCode value={payload} size={92} />
                </div>
              ) : (
                <div style={{
                  width: 100, height: 100, border: "1.5px dashed #ef4444", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#ef4444", fontSize: 10, padding: 4, textAlign: "center",
                }}>
                  เบอร์ผิด<br/>{error?.slice(0, 30)}
                </div>
              )}
              <div>
                <div style={{ fontSize: 10, color: "#666" }}>ชำระเงินผ่าน PromptPay</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginTop: 2 }}>พร้อมเพย์ {form.promptpay_target}</div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>ยอด <b>{baht(calc.total)}</b> บาท</div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>สแกน QR ผ่านแอปธนาคารเพื่อชำระเงิน</div>
              </div>
            </div>
          )
        })()}

        {/* ── refs ── */}
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 8.5, color: "#888" }}>
          <span>210919_REC1<br/>106-015-1-69</span>
          <span>{dash(form.invoice_no)}</span>
        </div>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 9.5, color: "#94a3b8", letterSpacing: 0.5 }}>
          — preview · ค่าจริงจะอยู่ใน PDF —
        </div>
      </div>
    )
  }

  // ── Default minimalist preview (เดิม) ──────────────────────────────
  const Row = ({ k, v, muted, bold }) => (
    <tr>
      <td style={{ padding: "4px 8px", color: muted ? "#666" : "#333", fontSize: 12.5, fontWeight: bold ? 700 : 500 }}>{k}</td>
      <td style={{ padding: "4px 8px", color: muted ? "#444" : "#000", fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: bold ? 700 : 500 }}>{v}</td>
    </tr>
  )

  return (
    <div style={{
      background: "#fff", color: "#111",
      border: "1px solid #d0d7e0", borderRadius: 10,
      padding: "26px 28px", boxShadow: "0 1px 3px rgba(0,0,0,.08)",
      fontFamily: "'Sarabun','Noto Sans Thai',sans-serif",
      fontSize: 13, lineHeight: 1.55,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #1e40af" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e40af", letterSpacing: 0.5 }}>ใบแจ้งหนี้ / INVOICE</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>เลขที่ <b style={{ color: "#000" }}>{dash(form.invoice_no)}</b></div>
        </div>
        <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
          <div>วันที่ <b style={{ color: "#000" }}>{fmtDate(form.invoice_date)}</b></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>ผู้ขาย</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>{dash(form.seller.name)}</div>
          {form.seller.address && <div style={{ fontSize: 12, color: "#444", marginTop: 3 }}>{form.seller.address}</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>ผู้ซื้อ</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>{dash(form.buyer.name)}</div>
          {form.buyer.address && <div style={{ fontSize: 12, color: "#444", marginTop: 3 }}>{form.buyer.address}</div>}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginLeft: "auto", maxWidth: 320, marginTop: 8 }}>
        <tbody>
          <Row k="เบี้ยสุทธิ" v={`${baht(calc.net)} บาท`} muted />
          {calc.stamp > 0 && <Row k="อากรแสตมป์" v={`${baht(calc.stamp)} บาท`} muted />}
          {calc.vat > 0 && <Row k={`VAT ${(form.vat_rate * 100).toFixed(0)}%`} v={`${baht(calc.vat)} บาท`} muted />}
          <tr><td colSpan={2} style={{ padding: 0 }}><div style={{ height: 1, background: "#1e40af", margin: "6px 0" }} /></td></tr>
          <tr>
            <td style={{ padding: "8px 8px", fontSize: 15, fontWeight: 800, color: "#000" }}>รวมทั้งสิ้น</td>
            <td style={{ padding: "8px 8px", fontSize: 17, fontWeight: 800, color: "#1e40af", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{baht(calc.total)} ฿</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function InvoicePage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()

  const [form, setForm] = useState({
    template:     "tm1",          // "default" | "tm1" | "tm2"
    invoice_no:   genInvoiceNo(),
    invoice_date: todayStr(),
    seller: { name: "", address: "", phone: "", tax_id: "" },
    buyer:  { name: "", address: "", phone: "", tax_id: "", license_plate: "" },
    description: "เบี้ยประกันภัยรถยนต์",
    net_premium: 0,
    stamp_duty_override: null,   // null = auto
    vat_rate: VAT_RATE,
    third_party_person:   0,
    third_party_accident: 0,
    own_damage: 0,
    promptpay_target: "",
    note: "",
    // ── tm1/tm2 extra fields ──
    coverage_start: "",          // dd/mm/yyyy
    coverage_end:   "",
    policy_no:      "",
    endorsement_no: "",
    branch:         "",
    insurance_type: "PERSONAL PROPERTY INSURANCE",
    original_policy_no: "",
    series:         "UPPOR0",
    // ── tm2 specific ──
    registration_no: "",
    sequence_no:     "0001",
    discount:        0,
    insured_occupation: "",
    effective_date:  "",
    expiry_date:     "",
    effective_time:  "16.30 น.",
    vehicle_code:    "",
    car_make:        "",
    car_model:       "",
    chassis_no:      "",
    seats:           "",
    insurance_subtype: "comp",  // prb | comp | 3rd | 3rd_only | other
    sum_insured:     0,
    accessories:     0,
    use_of_vehicle:  "ใช้ส่วนบุคคล ไม่ใช้รับจ้างหรือให้เช่า",
    broker_name:     "",
    broker_code:     "",
    agreement_date:  "",
    remark:          "",
  })
  const [generating, setGenerating] = useState(false)
  const [err, setErr] = useState("")

  // ── คำนวณ real-time ──
  const calc = useMemo(() => {
    const net   = Number(form.net_premium) || 0
    const extra = (Number(form.third_party_person)   || 0)
                + (Number(form.third_party_accident) || 0)
                + (Number(form.own_damage)           || 0)
    const stamp_auto = calcStampDuty(net)
    const stamp = form.stamp_duty_override !== null && form.stamp_duty_override !== ""
                  ? Number(form.stamp_duty_override) : stamp_auto
    const taxable = net + extra + stamp
    const vat = taxable * form.vat_rate
    const total = taxable + vat
    return { net, extra, stamp, stamp_auto, vat, total }
  }, [form])

  const updateParty = (which, field, val) =>
    setForm(f => ({ ...f, [which]: { ...f[which], [field]: val } }))

  const resetStamp = () => setForm(f => ({ ...f, stamp_duty_override: null }))

  const submit = async () => {
    setErr("")
    if (!form.invoice_no.trim()) { setErr("กรุณาใส่เลขที่ใบแจ้งหนี้"); return }
    if (!(calc.net > 0))        { setErr("กรุณาใส่เบี้ยประกันสุทธิ"); return }

    // ⚠️ เปิด tab ก่อน await — popup blocker อนุญาตเฉพาะ window.open ที่เกิดจาก user gesture
    const win = window.open("", "_blank")
    if (!win) {
      setErr("กรุณาอนุญาตให้เปิดแท็บใหม่ในเบราว์เซอร์ (popup ถูกบล็อก)")
      return
    }

    const items = [{
      description: form.description || "เบี้ยประกันภัย",
      quantity: 1,
      unit_price: calc.net,
    }]
    const extra_fees = {}
    if (Number(form.third_party_person)   > 0) extra_fees["บุคคลภายนอก/คน"]    = Number(form.third_party_person)
    if (Number(form.third_party_accident) > 0) extra_fees["บุคคลภายนอก/ครั้ง"] = Number(form.third_party_accident)
    if (Number(form.own_damage)           > 0) extra_fees["ความเสียหายต่อรถ"]  = Number(form.own_damage)
    if (calc.stamp                        > 0) extra_fees["อากรแสตมป์"]        = calc.stamp

    setGenerating(true)
    try {
      const res = await api.post("/invoice/generate", {
        template:         form.template,
        invoice_no:       form.invoice_no,
        invoice_date:     form.invoice_date,
        seller:           form.seller,
        buyer:            form.buyer,
        items,
        extra_fees,
        vat_rate:         form.vat_rate,
        promptpay_target: form.promptpay_target || null,
        note:             form.note,
        // tm1/tm2 extras
        coverage_start:    form.coverage_start || null,
        coverage_end:      form.coverage_end || null,
        policy_no:         form.policy_no || null,
        endorsement_no:    form.endorsement_no || null,
        branch:            form.branch || null,
        insurance_type:    form.insurance_type || null,
        original_policy_no: form.original_policy_no || null,
        series:            form.series || null,
        // tm2 only
        registration_no:   form.registration_no || null,
        sequence_no:       form.sequence_no || null,
        discount:          Number(form.discount) || 0,
        insured_occupation: form.insured_occupation || null,
        effective_date:    form.effective_date || null,
        expiry_date:       form.expiry_date || null,
        effective_time:    form.effective_time || null,
        vehicle_code:      form.vehicle_code || null,
        car_make:          form.car_make || null,
        car_model:         form.car_model || null,
        chassis_no:        form.chassis_no || null,
        seats:             form.seats || null,
        insurance_subtype: form.insurance_subtype || null,
        sum_insured:       Number(form.sum_insured) || 0,
        accessories:       Number(form.accessories) || 0,
        use_of_vehicle:    form.use_of_vehicle || null,
        broker_name:       form.broker_name || null,
        broker_code:       form.broker_code || null,
        agreement_date:    form.agreement_date || null,
        remark:            form.remark || null,
      }, { responseType: "blob" })

      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }))
      win.location.href = url
      // browser GC blob URL เมื่อแท็บปิด — แต่เผื่อ revoke หลังโหลดเสร็จ (delay ให้ tab โหลด PDF ก่อน)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      notify("สร้างใบแจ้งหนี้สำเร็จ")
    } catch (e) {
      win.close()
      const detail = e.response?.data
      let msg = e.message
      if (detail instanceof Blob) {
        try { msg = JSON.parse(await detail.text()).detail || msg } catch {}
      }
      setErr("สร้างใบแจ้งหนี้ไม่สำเร็จ: " + msg)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-hd">
        <button className="page-back" onClick={() => navigate(-1)}>
          <Ico n="chevL" s={19} /> กลับ
        </button>
        <div className="page-hd-div" />
        <div className="page-hd-info">
          <div className="page-title">สร้างใบแจ้งหนี้</div>
          <div className="page-sub">กรอกเบี้ยสุทธิ → ระบบคำนวณอากร + VAT อัตโนมัติ</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-b" onClick={submit} disabled={generating}>
            <Ico n="doc" s={18} />
            {generating ? "กำลังสร้าง..." : "สร้าง PDF"}
          </button>
        </div>
      </div>

      <div className="page-body">
        {err && (
          <div className="bnr er" style={{ marginBottom: 16 }}>
            <Ico n="warn" s={22} />
            <div className="bnr-body"><div className="bnr-t">{err}</div></div>
            <button onClick={() => setErr("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)" }}>
              <Ico n="x" s={18} />
            </button>
          </div>
        )}

        <div className="detail-split">
        <div>
        {/* ── Template selector ── */}
        <Sec ico="doc" title="รูปแบบใบแจ้งหนี้">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { v: "tm1",     l: "Tokio Marine — DEBIT NOTE",      d: "แบบสั้น · ลูกค้าจ่ายเบี้ย" },
              { v: "tm2",     l: "Tokio Marine — DEBIT NOTE COPY", d: "แบบละเอียด · เพิ่มข้อมูลรถ" },
              { v: "default", l: "Minimalist (เดิม)",                d: "ฟอร์มเรียบของระบบ" },
            ].map(opt => (
              <button
                key={opt.v}
                disabled={opt.dis}
                onClick={() => !opt.dis && setForm(f => ({ ...f, template: opt.v }))}
                style={{
                  flex: 1, minWidth: 220, textAlign: "left",
                  padding: "14px 16px", borderRadius: 11,
                  border: `2px solid ${form.template === opt.v ? "var(--blue)" : "var(--brd)"}`,
                  background: form.template === opt.v ? "var(--blue-bg)" : "var(--sur)",
                  cursor: opt.dis ? "not-allowed" : "pointer", opacity: opt.dis ? 0.45 : 1,
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 14.5, fontWeight: 700, color: form.template === opt.v ? "var(--blue)" : "var(--t1)" }}>
                  {opt.l}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 3 }}>{opt.d}</div>
              </button>
            ))}
          </div>
        </Sec>

        <Sec ico="doc" title="ข้อมูลใบแจ้งหนี้">
          <div className="info-row">
            <Inp label="เลขที่ใบแจ้งหนี้" value={form.invoice_no}
              onChange={v => setForm(f => ({ ...f, invoice_no: v }))} />
            <Inp label="วันที่" type="date" value={form.invoice_date}
              onChange={v => setForm(f => ({ ...f, invoice_date: v }))} />
          </div>
        </Sec>

        <Sec ico="person" title="ผู้ขาย (ของคุณ)">
          <div className="info-row" style={{ marginBottom: 20 }}>
            <Inp label="ชื่อบริษัท/ชื่อผู้ขาย" value={form.seller.name} onChange={v => updateParty("seller", "name", v)} />
            <Inp label="โทรศัพท์" value={form.seller.phone} onChange={v => updateParty("seller", "phone", v)} />
          </div>
          <div className="info-row fw" style={{ marginBottom: 20 }}>
            <Inp label="ที่อยู่" value={form.seller.address} onChange={v => updateParty("seller", "address", v)} full />
          </div>
          <div className="info-row">
            <Inp label="เลขผู้เสียภาษี" value={form.seller.tax_id} onChange={v => updateParty("seller", "tax_id", v)} />
          </div>
        </Sec>

        {/* ── ข้อมูลกรมธรรม์ (แสดงเฉพาะ tm1/tm2) ── */}
        {(form.template === "tm1" || form.template === "tm2") && (
          <Sec ico="doc" title="ข้อมูลกรมธรรม์">
            <div className="info-row" style={{ marginBottom: 16 }}>
              <Inp label="กรมธรรม์เลขที่ / Policy No." value={form.policy_no}
                onChange={v => setForm(f => ({ ...f, policy_no: v }))} placeholder="D0-36-69/000600" />
              <Inp label="สลักหลังเลขที่ / Endt. No." value={form.endorsement_no}
                onChange={v => setForm(f => ({ ...f, endorsement_no: v }))} />
            </div>
            <div className="info-row" style={{ marginBottom: 16 }}>
              <Inp label="เริ่มคุ้มครอง (dd/mm/yyyy)" value={form.coverage_start}
                onChange={v => setForm(f => ({ ...f, coverage_start: v }))} placeholder="15/05/2026" />
              <Inp label="สิ้นสุดคุ้มครอง (dd/mm/yyyy)" value={form.coverage_end}
                onChange={v => setForm(f => ({ ...f, coverage_end: v }))} placeholder="15/05/2027" />
            </div>
            <div className="info-row" style={{ marginBottom: 16 }}>
              <Inp label="สาขา / Branch" value={form.branch}
                onChange={v => setForm(f => ({ ...f, branch: v }))} placeholder="(ปล่อยว่างถ้าไม่มี)" />
              <Inp label="Series" value={form.series}
                onChange={v => setForm(f => ({ ...f, series: v }))} placeholder="UPPOR0" />
            </div>
            <div className="info-row">
              <Inp label="ประเภทประกัน / Type" value={form.insurance_type}
                onChange={v => setForm(f => ({ ...f, insurance_type: v }))} placeholder="PERSONAL PROPERTY INSURANCE" />
              <Inp label="กรมธรรม์เดิมเลขที่" value={form.original_policy_no}
                onChange={v => setForm(f => ({ ...f, original_policy_no: v }))} placeholder="(เลขเดิม ถ้ามี)" />
            </div>
          </Sec>
        )}

        {/* ── tm2 only: ข้อมูลรถ + ประเภทประกัน + นายหน้า ── */}
        {form.template === "tm2" && (
          <>
            <Sec ico="car" title="ข้อมูลรถยนต์">
              <div className="info-row" style={{ marginBottom: 16 }}>
                <Inp label="ยี่ห้อ / Make" value={form.car_make}
                  onChange={v => setForm(f => ({ ...f, car_make: v }))} placeholder="TOYOTA" />
                <Inp label="รุ่น / Model" value={form.car_model}
                  onChange={v => setForm(f => ({ ...f, car_model: v }))} placeholder="COROLLA" />
              </div>
              <div className="info-row" style={{ marginBottom: 16 }}>
                <Inp label="เลขตัวถัง / Chassis No." value={form.chassis_no}
                  onChange={v => setForm(f => ({ ...f, chassis_no: v }))} placeholder="MB2KLAAG900043133" />
                <Inp label="ที่นั่ง/ขนาด/น้ำหนัก" value={form.seats}
                  onChange={v => setForm(f => ({ ...f, seats: v }))} placeholder="7/1800/-" />
              </div>
              <div className="info-row">
                <Inp label="รหัสรถ / Code" value={form.vehicle_code}
                  onChange={v => setForm(f => ({ ...f, vehicle_code: v }))} placeholder="110" />
                <Inp label="อาชีพผู้เอาประกัน" value={form.insured_occupation}
                  onChange={v => setForm(f => ({ ...f, insured_occupation: v }))} placeholder="-" />
              </div>
            </Sec>

            <Sec ico="shield" title="ประเภทประกัน + ทุนประกัน">
              <div className="info-row" style={{ marginBottom: 16 }}>
                <div className="info-field">
                  <label className="info-label" style={{ marginBottom: 8 }}>ประเภทประกัน</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { v: "prb",       l: "พ.ร.บ.",     en: "Compulsory" },
                      { v: "comp",      l: "ประเภท 1",   en: "Comprehensive" },
                      { v: "3rd",       l: "ประเภท 2",   en: "TP, F&T" },
                      { v: "3rd_only",  l: "ประเภท 3",   en: "TP Only" },
                      { v: "other",     l: "อื่นๆ",       en: "Other" },
                    ].map(opt => (
                      <button key={opt.v}
                        onClick={() => setForm(f => ({ ...f, insurance_subtype: opt.v }))}
                        style={{
                          padding: "8px 14px", borderRadius: 8,
                          border: `1.5px solid ${form.insurance_subtype === opt.v ? "var(--blue)" : "var(--brd)"}`,
                          background: form.insurance_subtype === opt.v ? "var(--blue-bg)" : "var(--sur)",
                          color: form.insurance_subtype === opt.v ? "var(--blue)" : "var(--t2)",
                          fontWeight: form.insurance_subtype === opt.v ? 700 : 500,
                          cursor: "pointer", fontFamily: "inherit", fontSize: 13.5,
                        }}>
                        {opt.l} <span style={{ fontSize: 11, opacity: 0.7 }}>{opt.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="info-row">
                <Inp label="ทุนประกัน Sum Insured" type="number" value={form.sum_insured}
                  onChange={v => setForm(f => ({ ...f, sum_insured: v }))} suffix="บาท" />
                <Inp label="อุปกรณ์ตกแต่งเพิ่ม Accessories" type="number" value={form.accessories}
                  onChange={v => setForm(f => ({ ...f, accessories: v }))} suffix="บาท" />
              </div>
            </Sec>

            <Sec ico="cal" title="ระยะคุ้มครอง + นายหน้า + ส่วนลด">
              <div className="info-row" style={{ marginBottom: 16 }}>
                <Inp label="วันเริ่มประกัน (dd/mm/yyyy)" value={form.effective_date}
                  onChange={v => setForm(f => ({ ...f, effective_date: v }))} placeholder="30/04/2026" />
                <Inp label="วันหมดอายุ (dd/mm/yyyy)" value={form.expiry_date}
                  onChange={v => setForm(f => ({ ...f, expiry_date: v }))} placeholder="30/04/2027" />
              </div>
              <div className="info-row" style={{ marginBottom: 16 }}>
                <Inp label="เวลาเริ่มคุ้มครอง" value={form.effective_time}
                  onChange={v => setForm(f => ({ ...f, effective_time: v }))} placeholder="16.30 น." />
                <Inp label="วันที่สัญญา Agreement made on" value={form.agreement_date}
                  onChange={v => setForm(f => ({ ...f, agreement_date: v }))} placeholder="20/04/2026" />
              </div>
              <div className="info-row" style={{ marginBottom: 16 }}>
                <Inp label="ชื่อนายหน้า/ตัวแทน" value={form.broker_name}
                  onChange={v => setForm(f => ({ ...f, broker_name: v }))} placeholder="นาย พีรพงศ์ จันทร์ธนามา" />
                <Inp label="รหัสนายหน้า Broker Code" value={form.broker_code}
                  onChange={v => setForm(f => ({ ...f, broker_code: v }))} placeholder="B200291" />
              </div>
              <div className="info-row" style={{ marginBottom: 16 }}>
                <Inp label="ส่วนลด Discount" type="number" value={form.discount}
                  onChange={v => setForm(f => ({ ...f, discount: v }))} suffix="บาท" />
                <Inp label="Seq. ลำดับ" value={form.sequence_no}
                  onChange={v => setForm(f => ({ ...f, sequence_no: v }))} placeholder="0001" />
              </div>
              <div className="info-row fw">
                <Inp label="การใช้รถยนต์ Use of vehicle" value={form.use_of_vehicle}
                  onChange={v => setForm(f => ({ ...f, use_of_vehicle: v }))} full />
              </div>
            </Sec>
          </>
        )}

        <Sec ico="person" title="ผู้ซื้อ (ลูกค้า)">
          <div className="info-row" style={{ marginBottom: 20 }}>
            <Inp label="ชื่อ-นามสกุล / ชื่อบริษัท" value={form.buyer.name} onChange={v => updateParty("buyer", "name", v)} />
            <Inp label="โทรศัพท์" value={form.buyer.phone} onChange={v => updateParty("buyer", "phone", v)} />
          </div>
          <div className="info-row fw" style={{ marginBottom: 20 }}>
            <Inp label="ที่อยู่" value={form.buyer.address} onChange={v => updateParty("buyer", "address", v)} full />
          </div>
          <div className="info-row">
            <Inp label="ทะเบียนรถ" value={form.buyer.license_plate} onChange={v => updateParty("buyer", "license_plate", v)} />
            <Inp label="เลขผู้เสียภาษี (ถ้ามี)" value={form.buyer.tax_id} onChange={v => updateParty("buyer", "tax_id", v)} />
          </div>
        </Sec>

        {/* ── คำนวณเบี้ยประกัน (Auto) ── */}
        <Sec ico="banknote" title="คำนวณเบี้ยประกัน (อัตโนมัติ)">
          <div className="info-row fw" style={{ marginBottom: 20 }}>
            <Inp label="รายละเอียด" value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
              placeholder="เช่น เบี้ยประกันภัยรถยนต์ ทะเบียน กก-1234" full />
          </div>

          <div className="info-row" style={{ marginBottom: 20 }}>
            <Inp label="เบี้ยประกันสุทธิ" type="number" value={form.net_premium}
              onChange={v => setForm(f => ({ ...f, net_premium: v }))}
              suffix="บาท" highlight />

            <div className="info-field">
              <label className="info-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <span>อากร <span style={{ color: "var(--t3)", fontWeight: 400 }}>(0.4% ปัดขึ้น)</span></span>
                {form.stamp_duty_override !== null && form.stamp_duty_override !== "" && (
                  <button onClick={resetStamp}
                    style={{ background: "none", border: "1px solid var(--blue)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: "var(--blue)", fontSize: 12 }}>
                    คืนค่าอัตโนมัติ
                  </button>
                )}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={calc.stamp}
                  onChange={e => setForm(f => ({ ...f, stamp_duty_override: e.target.value }))}
                  style={{
                    width: "100%", padding: "13px 17px",
                    border: `1.5px solid ${form.stamp_duty_override !== null && form.stamp_duty_override !== "" ? "var(--amber, #f59e0b)" : "var(--brd)"}`,
                    borderRadius: 10, fontSize: 17, fontFamily: "inherit",
                    background: "var(--sur)", color: "var(--t1)", textAlign: "right"
                  }} />
                <span style={{ fontSize: 16, color: "var(--t2)", fontWeight: 500 }}>บาท</span>
              </div>
              {calc.net > 0 && (
                <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 6 }}>
                  สูตร: ⌈{baht(calc.net * STAMP_DUTY_RATE)}⌉ = <b>{calc.stamp_auto}</b> บาท
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 18, marginBottom: 12, fontSize: 16.5, color: "var(--t2)", fontWeight: 600 }}>
            ความคุ้มครองเพิ่มเติม (เลือกใส่ถ้ามี — จะบวกเข้ายอดและคิด VAT ด้วย):
          </div>
          <div className="info-row" style={{ marginBottom: 20 }}>
            <Inp label="บุคคลภายนอก/คน" type="number" value={form.third_party_person}
              onChange={v => setForm(f => ({ ...f, third_party_person: v }))} suffix="บาท" />
            <Inp label="บุคคลภายนอก/ครั้ง" type="number" value={form.third_party_accident}
              onChange={v => setForm(f => ({ ...f, third_party_accident: v }))} suffix="บาท" />
          </div>
          <div className="info-row" style={{ marginBottom: 20 }}>
            <Inp label="ความเสียหายต่อรถ" type="number" value={form.own_damage}
              onChange={v => setForm(f => ({ ...f, own_damage: v }))} suffix="บาท" />
            <Inp label="VAT (%)" type="number" value={(form.vat_rate * 100).toFixed(0)}
              onChange={v => setForm(f => ({ ...f, vat_rate: (Number(v) || 0) / 100 }))} suffix="%" />
          </div>

          {/* ── สรุปยอด ── */}
          <div style={{ borderTop: "1px solid var(--brd)", paddingTop: 20, marginTop: 16 }}>
            <Line label="เบี้ยสุทธิ" value={calc.net} />
            {calc.extra > 0 && <Line label="ความคุ้มครองเพิ่ม" value={calc.extra} muted />}
            <Line label="อากรแสตมป์" value={calc.stamp} muted />
            <Line label={`ภาษีมูลค่าเพิ่ม VAT ${(form.vat_rate * 100).toFixed(0)}%`} value={calc.vat} muted />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 6px", fontSize: 24, fontWeight: 700, borderTop: "1px solid var(--brd)", marginTop: 10 }}>
              <span>รวมทั้งสิ้น</span>
              <span style={{ color: "var(--blue)", fontVariantNumeric: "tabular-nums" }}>{baht(calc.total)} บาท</span>
            </div>
          </div>
        </Sec>

        <Sec ico="banknote" title="QR PromptPay">
          <div className="info-row">
            <Inp
              label="เบอร์โทร (10 หลัก) หรือเลขประจำตัวประชาชน (13 หลัก)"
              value={form.promptpay_target}
              onChange={v => setForm(f => ({ ...f, promptpay_target: v }))}
              placeholder="0812345678 หรือ 1234567890123"
            />
          </div>
          <div style={{ fontSize: 16.5, color: "var(--t2)", marginTop: 12 }}>
            ระบบจะ generate QR code อัตโนมัติตามยอด <b>{baht(calc.total)} บาท</b>
          </div>
        </Sec>

        <Sec ico="doc" title="หมายเหตุ">
          <textarea
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="หมายเหตุที่จะแสดงในใบแจ้งหนี้..."
            rows={3}
            style={{ width: "100%", padding: "14px 17px", border: "1.5px solid var(--brd)", borderRadius: 10, fontSize: 17, fontFamily: "inherit", background: "var(--sur)", color: "var(--t1)", resize: "vertical", lineHeight: 1.55 }}
          />
        </Sec>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn btn-b" onClick={submit} disabled={generating} style={{ minWidth: 280, justifyContent: "center" }}>
            <Ico n="doc" s={19} />
            {generating ? "กำลังสร้าง..." : "สร้างใบแจ้งหนี้ PDF"}
          </button>
        </div>
        </div>

        {/* ── Live preview ฝั่งขวา ── */}
        <div className="detail-aside">
          <div style={{ fontSize: 13, color: "var(--t3)", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Ico n="doc" s={15} />
            ตัวอย่างใบแจ้งหนี้ (อัปเดตสด)
          </div>
          <InvoicePreview form={form} calc={calc} />
        </div>
        </div>
      </div>
    </div>
  )
}
