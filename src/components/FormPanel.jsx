import { Ico } from "../icons"
import { PolicyForm } from "./PolicyForm"

export function FormPanel({ open, onToggle, loading, parsed, setParsed, hideSections }) {
  return (
    <div className="form-panel">
      <div className="form-panel-bar" onClick={onToggle}>
        <div className="form-panel-heading">
          <div className="form-panel-icon">
            <Ico n="doc" s={19} sw={1.8} />
          </div>
          <div>
            <div className="form-panel-title">ข้อมูลกรมธรรม์</div>
            <div className="form-panel-subtitle">
              {loading ? "กำลังดึงข้อมูลจาก PDF…" : open ? "กรอกตามเอกสาร · กด Tab เพื่อไปช่องถัดไป" : "คลิกเพื่อขยาย"}
            </div>
          </div>
        </div>
        <div className="drop-bar-right" onClick={e => e.stopPropagation()}>
          {loading && <div className="spin" style={{ width: 22, height: 22, borderWidth: 2 }} />}
          <button type="button" className="drop-toggle" title={open ? "ย่อ" : "ขยาย"} aria-label={open ? "ย่อข้อมูลกรมธรรม์" : "ขยายข้อมูลกรมธรรม์"} aria-expanded={open}
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
              <div style={{ fontWeight: 600, color: "var(--t1)", fontSize: 17 }}>กำลังอ่านเอกสาร…</div>
              <div style={{ fontSize: 15, color: "var(--t3)", marginTop: 6 }}>รอสักครู่</div>
            </div>
          ) : (
            <>
              {parsed.pdf_size != null && (
                <div className="form-file-meta">
                  <Ico n="doc" s={14} />ขนาดไฟล์ {(parsed.pdf_size / 1024).toFixed(0)} KB
                </div>
              )}
              <PolicyForm values={parsed} onChange={setParsed} hideSections={hideSections} embedded />
            </>
          )}
        </div>
      )}
    </div>
  )
}
