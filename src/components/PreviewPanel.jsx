import { Ico } from "../icons"
import { getStatus, fmtDate } from "../helpers"
import api from "../api"

export function PreviewPanel({ p, onClose, onOpen }) {
  const st      = getStatus(p.coverage_end)
  const hasPdf  = !!p.pdf_filename || !!p.pdf_size
  const pdfUrl  = `${api.defaults.baseURL}/policies/${p.id}/pdf`

  const Row = ({ label, value }) => value ? (
    <div className="pvp-row">
      <span className="pvp-lbl">{label}</span>
      <span className="pvp-val">{value}</span>
    </div>
  ) : null

  return (
    <div className="pvp">
      {/* header */}
      <div className="pvp-hd">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pvp-title">{p.insured_name || "ไม่ระบุชื่อ"}</div>
          <div style={{ marginTop: 4 }}>
            <span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span>
          </div>
        </div>
        <button className="pvp-close" onClick={onClose}><Ico n="x" s={16} /></button>
      </div>

      {hasPdf ? (
        <iframe
          src={pdfUrl}
          title="PDF"
          style={{ width: "100%", flex: 1, minHeight: 0, border: "none", display: "block", background: "#f5f5f5" }}
        />
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--sur2)", color: "var(--t3)" }}>
          <Ico n="doc" s={28} sw={1} />
          <span style={{ fontSize: 12 }}>ไม่มีไฟล์ PDF</span>
        </div>
      )}

      {/* footer */}
      <div className="pvp-foot">
        <button className="btn btn-b" style={{ width: "100%", justifyContent: "center" }} onClick={onOpen}>
          <Ico n="expand" s={14} /> ดูข้อมูลทั้งหมด
        </button>
      </div>
    </div>
  )
}
