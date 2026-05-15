import { Ico } from "../icons"
import { F_SECS, F_LBL } from "../helpers"

export function PolicyForm({ values, onChange }) {
  return (
    <>
      {F_SECS.map(sec => (
        <div key={sec.label} style={{ marginBottom: 18 }}>
          <div className="shd">
            <Ico n={sec.ico} s={13} />
            <span className="shd-lbl">{sec.label}</span>
          </div>
          <div className="fg">
            {sec.keys.map(k => {
              const DATE_KEYS = ["coverage_start", "coverage_end", "date_notify", "date_cancel", "date_policy_receive"]
              const isDate = DATE_KEYS.includes(k)
              const isWide = k === "insured_address"
              return (
                <div key={k} className={`fi${isWide ? " fw" : ""}`}>
                  <label>{F_LBL[k]}</label>
                  <input
                    type={isDate ? "date" : "text"}
                    placeholder={
                      k === "policy_number"  ? "เช่น 10-72-69/006797"
                      : k === "license_plate"  ? "เช่น 1กก 1234"
                      : k === "phone"          ? "เช่น 081-234-5678"
                      : ""
                    }
                    value={values[k] ?? ""}
                    onChange={e => onChange({ ...values, [k]: e.target.value })}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="notes-card">
        <div className="notes-card-hd">
          <Ico n="doc" s={13} />
          <span>หมายเหตุ</span>
        </div>
        <textarea
          className="notes-ta"
          rows={4}
          placeholder="บันทึกข้อความเพิ่มเติม เช่น รายละเอียดพิเศษ, ข้อตกลง, หรือข้อมูลอื่น…"
          value={values.notes ?? ""}
          onChange={e => onChange({ ...values, notes: e.target.value })}
        />
      </div>
    </>
  )
}
