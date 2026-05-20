import { useState, useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"

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
  return (
    <div className="info-field" style={full ? { gridColumn: "1 / -1" } : undefined}>
      <label className="info-label" style={{ marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", padding: "13px 17px",
            border: `1.5px solid ${highlight ? "var(--blue)" : "var(--brd)"}`,
            borderRadius: 10, fontSize: 17, fontFamily: "inherit",
            background: highlight ? "var(--blue-bg)" : "var(--sur)",
            color: "var(--t1)",
            textAlign: type === "number" ? "right" : "left"
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

export function InvoicePage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()

  const [form, setForm] = useState({
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
        invoice_no:       form.invoice_no,
        invoice_date:     form.invoice_date,
        seller:           form.seller,
        buyer:            form.buyer,
        items,
        extra_fees,
        vat_rate:         form.vat_rate,
        promptpay_target: form.promptpay_target || null,
        note:             form.note,
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
    </div>
  )
}
