import { Ico } from "../icons"
import { PolicyForm } from "./PolicyForm"

export function FormPanel({ open, onToggle, loading, parsed, setParsed }) {
  return (
    <div className="form-panel">
      <div className="form-panel-bar" onClick={onToggle}>
        <div className="drop-bar-left">
          <div className="drop-h-ic" style={{ width: 36, height: 36, borderRadius: 9, background: "var(--blue-bg)" }}>
            <Ico n="doc" s={17} sw={1.8} style={{ stroke: "var(--blue)" }} />
          </div>
          <div>
            <div className="drop-h-name" style={{ fontSize: 14 }}>ข้อมูลกรมธรรม์</div>
            <div className="drop-h-hint" style={{ fontSize: 12.5 }}>
              {loading ? "กำลังดึงข้อมูลจาก PDF…" : open ? "คลิกเพื่อย่อ" : "คลิกเพื่อขยาย"}
            </div>
          </div>
        </div>
        <div className="drop-bar-right" onClick={e => e.stopPropagation()}>
          {loading && <div className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} />}
          <button className="drop-toggle" title={open ? "ย่อ" : "ขยาย"}
            onClick={e => { e.stopPropagation(); onToggle() }}>
            <Ico n={open ? "chevU" : "chevD"} s={16} />
          </button>
        </div>
      </div>

      {open && (
        <div className="form-panel-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 20px" }}>
              <div className="spin" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontWeight: 600, color: "var(--t1)" }}>AI กำลังอ่าน PDF…</div>
              <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 4 }}>อาจใช้เวลา 5–10 วินาที</div>
            </div>
          ) : (
            <>
              {parsed.pdf_size != null && (
                <div className="fi fw" style={{ background: "var(--blue-bg)", borderColor: "var(--blue-mid)", marginBottom: 14 }}>
                  <label>ขนาดไฟล์</label>
                  <span className="fi-v">{(parsed.pdf_size / 1024).toFixed(0)} KB</span>
                </div>
              )}
              <PolicyForm values={parsed} onChange={setParsed} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
