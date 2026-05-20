import { Ico } from "../icons"
import { F_SECS, F_LBL } from "../helpers"

const DATE_KEYS = ["coverage_start", "coverage_end", "date_notify", "date_cancel", "date_policy_receive"]
const CALC_KEYS = ["stamp_duty", "vat", "total_premium"]

// normalize: รับได้ทั้ง ISO ("2016-12-03"), DD/MM/YYYY (พ.ศ.), DD/MM/YYYY (ค.ศ.)
// คืน ISO เสมอ — ถ้า parse ไม่ได้ คืน input เดิม
function normalizeDate(raw) {
  if (!raw) return ""
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!m) return s
  let [, d, mo, y] = m
  y = parseInt(y, 10); mo = parseInt(mo, 10); d = parseInt(d, 10)
  if (y > 2400) y -= 543               // พ.ศ. → ค.ศ.
  else if (y < 100) y += 2000           // 2-digit
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return s
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function calcPremium(net) {
  const n = parseFloat(String(net).replace(",", "")) || 0
  const stamp = Math.ceil(n * 0.004)
  const vat   = Math.round((n + stamp) * 0.07 * 100) / 100
  const total = Math.round((n + stamp + vat) * 100) / 100
  return { stamp_duty: stamp, vat, total_premium: total }
}

export function PolicyForm({ values, onChange, hideSections = [] }) {
  function handleChange(k, val) {
    if (k === "net_premium") {
      const calc = calcPremium(val)
      onChange({ ...values, net_premium: val, ...calc })
    } else {
      onChange({ ...values, [k]: val })
    }
  }

  const sections = F_SECS.filter(s => !hideSections.includes(s.label))

  return (
    <>
      {sections.map(sec => (
        <div key={sec.label} style={{ marginBottom: 30 }}>
          <div className="shd">
            <Ico n={sec.ico} s={17} />
            <span className="shd-lbl">{sec.label}</span>
          </div>
          <div className="fg">
            {sec.keys.map(k => {
              const isDate  = DATE_KEYS.includes(k)
              const isCalc  = CALC_KEYS.includes(k)
              const isWide  = k === "insured_address"
              const rawVal  = values[k] ?? ""

              // value สำหรับ <input type=date> ต้องเป็น YYYY-MM-DD (ค.ศ.) เสมอ
              const dateVal = isDate ? normalizeDate(rawVal) : ""
              return (
                <div key={k} className={`fi${isWide ? " fw" : ""}`}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {F_LBL[k]}
                    {isCalc && (
                      <span style={{ fontSize: 12, color: "var(--blue)", background: "var(--blue-bg)", borderRadius: 6, padding: "3px 8px" }}>
                        คำนวณอัตโนมัติ
                      </span>
                    )}
                  </label>
                  <input
                    type={isDate ? "date" : "text"}
                    readOnly={isCalc}
                    placeholder={
                      isDate                   ? "YYYY-MM-DD"
                      : k === "policy_number"  ? "เช่น 10-72-69/006797"
                      : k === "license_plate"  ? "เช่น 1กก 1234"
                      : k === "phone"          ? "เช่น 081-234-5678"
                      : k === "net_premium"    ? "เช่น 600"
                      : ""
                    }
                    style={isCalc ? { background: "var(--blue-bg)", color: "var(--blue)", cursor: "default", fontWeight: 600 } : {}}
                    value={isDate ? (/^\d{4}-\d{2}-\d{2}$/.test(dateVal) ? dateVal : "") : rawVal}
                    onChange={e => {
                      if (isCalc) return
                      // date input คืน YYYY-MM-DD เสมอ — เก็บ ISO ตรงๆ ไม่ต้องแปลง
                      handleChange(k, e.target.value)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="notes-card">
        <div className="notes-card-hd">
          <Ico n="doc" s={17} />
          <span>หมายเหตุ</span>
        </div>
        <textarea
          className="notes-ta"
          rows={5}
          placeholder="บันทึกข้อความเพิ่มเติม เช่น รายละเอียดพิเศษ, ข้อตกลง, หรือข้อมูลอื่น…"
          value={values.notes ?? ""}
          onChange={e => onChange({ ...values, notes: e.target.value })}
        />
      </div>
    </>
  )
}
