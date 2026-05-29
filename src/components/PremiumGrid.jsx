import { useRef } from "react"
import { Ico } from "../icons"

/**
 * ตารางคำนวณเบี้ย 3 คอลัมน์ (กรมธรรม์ / พ.ร.บ. / รวม)
 * — เลียนแบบฟอร์มระบบ Baby78_Safety เดิม
 */
const fmt = v => {
  if (v === "" || v === null || v === undefined) return ""
  const n = Number(String(v).replace(/,/g, ""))
  if (isNaN(n)) return v
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const num = v => {
  const n = Number(String(v ?? "").replace(/,/g, ""))
  return isNaN(n) ? 0 : n
}

const sum = (a, b) => num(a) + num(b)

// ── Cell (top-level เพื่อไม่ให้ re-create ทุก render — กัน focus loss) ──
function Cell({ value, onChange, readOnly, color, bold, highlight, displayFormat, placeholder }) {
  // ในโหมด readOnly + displayFormat → แสดงค่าที่ format แล้ว (มี comma + 2 ตำแหน่งทศนิยม)
  // ในโหมดแก้ไข → แสดงค่าดิบ (ให้ user พิมพ์ตัวเลขได้ปกติ)
  const shown = displayFormat
    ? (value === "" || value === null || value === undefined
        ? ""
        : (() => {
            const n = Number(String(value).replace(/,/g, ""))
            return isNaN(n) ? value : n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          })())
    : (value ?? "")
  return (
    <input
      type="text"
      inputMode="decimal"
      value={shown}
      readOnly={readOnly}
      placeholder={placeholder || ""}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      style={{
        width: "100%", textAlign: "right",
        border: "1.5px solid var(--brd)", borderRadius: 8,
        padding: "9px 11px",
        fontSize: 15, fontFamily: "'SF Mono','Fira Code',Consolas,monospace",
        fontVariantNumeric: "tabular-nums",
        background: readOnly ? (highlight ? "var(--blue-bg)" : "var(--sur2)") : "var(--sur)",
        color: color || (bold ? "var(--t1)" : "var(--t2)"),
        fontWeight: bold ? 700 : 500,
        outline: "none",
        cursor: readOnly ? "default" : "text",
      }}
      onFocus={e => !readOnly && (e.target.style.borderColor = "var(--blue)")}
      onBlur={e => !readOnly && (e.target.style.borderColor = "var(--brd)")}
    />
  )
}

const ROWS = [
  { key: "net_premium",      label: "เบี้ยสุทธิ",      highlight: false, bold: true },
  { key: "stamp_duty",       label: "อากร",            highlight: false, bold: false },
  { key: "vat",              label: "ภาษี (VAT 7%)",   highlight: false, bold: false },
  { key: "total_premium",    label: "เบี้ยรวม",         highlight: true,  bold: true },
  { key: "prepaid_tax_1pct", label: "1%",              mainOnly: true,   bold: false },
  { key: "commission_pct",   label: "CM %",            mainOnly: true,   bold: false },
  { key: "commission_baht",  label: "CM (บาท)",        mainOnly: true,   bold: false },
  { key: "wht_10pct",        label: "ภาษี 10%",        mainOnly: true,   bold: false },
  { key: "rounding",         label: "ปัดเศษ",          mainOnly: true,   bold: false },
  { key: "collected",        label: "เรียกเก็บ",        highlight: true,  bold: true, computed: true },
]

const thStyle = (w) => ({
  padding: "12px 14px",
  textAlign: "right",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--t2)",
  borderBottom: "2px solid var(--brd)",
  whiteSpace: "nowrap",
  width: w,
})

const tdLabel = (bold, highlight) => ({
  padding: "8px 14px",
  fontSize: 15,
  fontWeight: bold ? 700 : 500,
  color: bold ? "var(--t1)" : "var(--t2)",
  background: highlight ? "var(--blue-bg)" : "transparent",
  borderBottom: "1px solid var(--sur2)",
})

const tdInput = (highlight, totalCol) => ({
  padding: "5px 6px",
  background: totalCol ? "var(--blue-bg)" : (highlight ? "rgba(30,111,229,.04)" : "transparent"),
  borderBottom: "1px solid var(--sur2)",
})

/**
 * props:
 *   main, prb, onMainChange, onPrbChange, onTogglePrb
 *   prbFile, onPrbFile      — สำหรับอัปโหลด PDF พ.ร.บ. inline (optional)
 *   readOnly                — โหมดแสดงผลอย่างเดียว (ใช้ในหน้า DetailPage)
 */
export function PremiumGrid({ main = {}, prb, onMainChange, onPrbChange, onTogglePrb, prbFile, onPrbFile, prbLoading = false, open = true, onToggle, readOnly = false, title }) {
  const hasPrb = prb !== null && prb !== undefined
  const prbFileRef = useRef(null)

  // คำนวณคอลัมน์รวม (main + prb)
  const total = {
    net_premium:      sum(main.net_premium,   prb?.net_premium),
    stamp_duty:       sum(main.stamp_duty,    prb?.stamp_duty),
    vat:              sum(main.vat,           prb?.vat),
    total_premium:    sum(main.total_premium, prb?.total_premium),
    prepaid_tax_1pct: num(main.prepaid_tax_1pct),
    commission_baht:  num(main.commission_baht),
    wht_10pct:        num(main.wht_10pct),
    rounding:         num(main.rounding),
    collected:        sum(main.collected_amount || main.total_premium, prb?.total_premium),
  }

  return (
    <div className="info-card">
      <div
        className="info-card-hd"
        onClick={onToggle}
        style={{ flexWrap: "wrap", gap: 10, cursor: onToggle ? "pointer" : "default", userSelect: "none" }}
      >
        <Ico n="banknote" s={20} />
        <span className="info-card-title">{title || "คำนวณเบี้ยประกัน"}</span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* ปุ่มอัปโหลด PDF พ.ร.บ. (เฉพาะเมื่อ hasPrb และมี onPrbFile callback) */}
          {!readOnly && hasPrb && onPrbFile && (
            <>
              <button
                className="btn btn-w"
                onClick={() => prbFileRef.current?.click()}
                style={{
                  padding: "8px 14px", fontSize: 13.5,
                  borderColor: prbFile ? "var(--green-brd)" : "var(--brd)",
                  background:  prbFile ? "var(--green-bg)" : "var(--sur)",
                  color:       prbFile ? "var(--green)"    : "var(--t2)",
                }}
                title={prbFile ? prbFile.name : "อัปโหลด PDF พ.ร.บ."}
              >
                <Ico n={prbFile ? "check" : "upload"} s={15} />
                {prbFile
                  ? `${prbFile.name.length > 18 ? prbFile.name.slice(0, 18) + "…" : prbFile.name}`
                  : "เลือกไฟล์ พ.ร.บ."}
              </button>
              <input
                ref={prbFileRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={e => onPrbFile(e.target.files?.[0])}
              />
            </>
          )}

          {/* ปุ่ม toggle PRB — ซ่อนในโหมด readOnly */}
          {!readOnly && onTogglePrb && (
            <button
              className={`btn ${hasPrb ? "btn-w" : "btn-b"} btn-prb`}
              onClick={e => { e.stopPropagation(); onTogglePrb() }}
              style={hasPrb
                ? { padding: "10px 18px", fontSize: 14.5, fontWeight: 600 }
                : {
                    padding: "12px 22px",
                    fontSize: 15.5,
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(30,111,229,.32)",
                    letterSpacing: ".2px",
                  }
              }
            >
              {hasPrb
                ? <><Ico n="x" s={16} /> เอา พ.ร.บ. ออก</>
                : <><Ico n="plus" s={18} /> เพิ่ม พ.ร.บ.</>}
            </button>
          )}
        </div>

        {/* chevron toggle */}
        {onToggle && (
          <div onClick={e => { e.stopPropagation(); onToggle() }} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 30, height: 30, borderRadius: 7, background: "var(--sur2)",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            cursor: "pointer", flexShrink: 0,
          }}>
            <Ico n="chevD" s={18} />
          </div>
        )}
      </div>

      {open && <div className="info-card-bd" style={{ padding: 12, position: "relative" }}>
        {/* แถบ banner บนสุดของ PremiumGrid — เห็นทันทีไม่ต้องมองข้าม */}
        {prbLoading && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", marginBottom: 10,
            background: "linear-gradient(90deg, var(--green-bg), var(--blue-bg))",
            border: "1.5px solid var(--green-brd)", borderRadius: 10,
            animation: "pulse 1.5s ease-in-out infinite",
          }}>
            <div className="spin" style={{ width: 18, height: 18, borderWidth: 2, borderColor: "var(--green)", borderTopColor: "transparent" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>
              AI กำลังอ่านเลขเบี้ย พ.ร.บ. — รอประมาณ 5-10 วินาที
            </span>
          </div>
        )}
        <div className="premium-grid-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="premium-grid-table" style={{
            width: "100%",
            borderCollapse: "separate", borderSpacing: 0,
          }}>
            <thead>
              <tr>
                <th style={thStyle(110)}>รายการ</th>
                <th style={{ ...thStyle(), color: "var(--blue)" }}>กรมธรรม์</th>
                {hasPrb && (
                  <th style={{ ...thStyle(), color: "var(--green)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      พ.ร.บ.
                      {prbLoading && <span className="spin" style={{ width: 12, height: 12, borderWidth: 1.5, borderColor: "var(--green)", borderTopColor: "transparent" }} />}
                    </span>
                  </th>
                )}
                <th style={{ ...thStyle(), color: "var(--t1)", background: "var(--blue-bg)" }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => {
                if (row.key === "collected") {
                  return (
                    <tr key={row.key}>
                      <td style={tdLabel(row.bold, row.highlight)}>{row.label}</td>
                      <td style={tdInput(row.highlight)}>
                        <Cell
                          value={main.collected_amount ?? main.total_premium ?? ""}
                          onChange={readOnly ? undefined : (v => onMainChange("collected_amount", v))}
                          readOnly={readOnly}
                          displayFormat={readOnly}
                          bold={row.bold}
                        />
                      </td>
                      {hasPrb && (
                        <td style={tdInput(row.highlight)}>
                          <Cell value={prb.total_premium ?? ""} readOnly displayFormat={readOnly} bold color="var(--green)" />
                        </td>
                      )}
                      <td style={tdInput(row.highlight, true)}>
                        <Cell value={fmt(total.collected)} readOnly bold color="var(--blue)" highlight />
                      </td>
                    </tr>
                  )
                }
                if (row.mainOnly) {
                  return (
                    <tr key={row.key}>
                      <td style={tdLabel(row.bold, row.highlight)}>{row.label}</td>
                      <td style={tdInput(row.highlight)}>
                        <Cell
                          value={main[row.key] ?? ""}
                          onChange={readOnly ? undefined : (v => onMainChange(row.key, v))}
                          readOnly={readOnly}
                          displayFormat={readOnly}
                          bold={row.bold}
                        />
                      </td>
                      {hasPrb && (
                        <td style={tdInput(row.highlight)}>
                          <Cell value="—" readOnly color="var(--t3)" />
                        </td>
                      )}
                      <td style={tdInput(row.highlight, true)}>
                        <Cell value={fmt(total[row.key])} readOnly bold color="var(--blue)" highlight />
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={row.key}>
                    <td style={tdLabel(row.bold, row.highlight)}>{row.label}</td>
                    <td style={tdInput(row.highlight)}>
                      <Cell
                        value={main[row.key] ?? ""}
                        onChange={readOnly ? undefined : (v => onMainChange(row.key, v))}
                        readOnly={readOnly}
                        displayFormat={readOnly}
                        bold={row.bold}
                      />
                    </td>
                    {hasPrb && (
                      <td style={tdInput(row.highlight)}>
                        <Cell
                          value={prb[row.key] ?? ""}
                          onChange={readOnly ? undefined : (v => onPrbChange(row.key, v))}
                          readOnly={readOnly}
                          displayFormat={readOnly}
                          bold={row.bold}
                          color="var(--green)"
                          placeholder={prbLoading ? "⏳ AI กำลังอ่าน..." : ""}
                        />
                      </td>
                    )}
                    <td style={tdInput(row.highlight, true)}>
                      <Cell value={fmt(total[row.key])} readOnly bold color="var(--blue)" highlight />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  )
}
