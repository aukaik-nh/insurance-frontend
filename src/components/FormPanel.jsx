import { Ico } from "../icons"
import { PolicyForm } from "./PolicyForm"

export function FormPanel({ open, onToggle, loading, parsed, setParsed, hideSections }) {
  return (
    <div className="form-panel">
      <div className="form-panel-bar" onClick={onToggle}>
        <div className="drop-bar-left">
          <div className="drop-h-ic" style={{ width: 44, height: 44, borderRadius: 11, background: "var(--blue-bg)" }}>
            <Ico n="doc" s={22} sw={1.8} style={{ stroke: "var(--blue)" }} />
          </div>
          <div>
            <div className="drop-h-name" style={{ fontSize: 18 }}>ข้อมูลกรมธรรม์</div>
            <div className="drop-h-hint" style={{ fontSize: 15 }}>
              {loading ? "กำลังดึงข้อมูลจาก PDF…" : open ? "คลิกเพื่อย่อ" : "คลิกเพื่อขยาย"}
            </div>
          </div>
        </div>
        <div className="drop-bar-right" onClick={e => e.stopPropagation()}>
          {loading && <div className="spin" style={{ width: 22, height: 22, borderWidth: 2 }} />}
          <button className="drop-toggle" title={open ? "ย่อ" : "ขยาย"}
            onClick={e => { e.stopPropagation(); onToggle() }}>
            <Ico n={open ? "chevU" : "chevD"} s={20} />
          </button>
        </div>
      </div>

      {open && (
        <div className="form-panel-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 24px" }}>
              <div className="spin" style={{ margin: "0 auto 14px" }} />
              <div style={{ fontWeight: 600, color: "var(--t1)", fontSize: 17 }}>AI กำลังอ่าน PDF…</div>
              <div style={{ fontSize: 15, color: "var(--t3)", marginTop: 6 }}>รอสักครู่</div>
            </div>
          ) : (
            <>
              {parsed.pdf_size != null && (
                <div className="fi fw" style={{ background: "var(--blue-bg)", borderColor: "var(--blue-mid)", marginBottom: 14 }}>
                  <label>ขนาดไฟล์</label>
                  <span className="fi-v">{(parsed.pdf_size / 1024).toFixed(0)} KB</span>
                </div>
              )}
              <PolicyForm values={parsed} onChange={setParsed} hideSections={hideSections} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
