import { Ico } from "../icons"

// PDF iframe สูง — ใช้พื้นที่เต็มที่ของหน้าจอ (เหลือพื้นที่สำหรับ nav + bar เท่านั้น)
const PDF_H = "calc(100vh - 160px)"

export function PdfPreview({ fileUrl, file, filename, onFullscreen }) {
  return (
    <div className="pdf-preview-wrap">
      <div className="pdf-preview-bar">
        <Ico n="doc" s={17} />
        <span className="pdf-fname">{file ? (filename || file.name) : "ยังไม่เลือกไฟล์"}</span>
        {file && <span className="pdf-size">{(file.size / 1024).toFixed(0)} KB</span>}
        <button className="pdf-zoom-btn" onClick={onFullscreen} disabled={!fileUrl} title="เต็มจอ">
          <Ico n="expand" s={18} />
        </button>
      </div>
      {fileUrl ? (
        <iframe className="pdf-iframe" src={fileUrl} title="PDF Preview"
          loading="lazy" style={{ height: PDF_H, minHeight: 600 }} />
      ) : (
        <div className="pdf-placeholder" style={{ height: PDF_H, minHeight: 360 }}>
          <Ico n="doc" s={52} sw={1} />
          <div className="ph-title">ยังไม่มีไฟล์</div>
          <div className="ph-hint">วาง PDF เพื่อดูตัวอย่าง</div>
        </div>
      )}
    </div>
  )
}
