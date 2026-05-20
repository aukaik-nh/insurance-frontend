import { useState, useEffect } from "react"
import { Ico } from "../icons"

export function PdfLightbox({ src, filename, sizeKB, onClose }) {
  const [zoom, setZoom] = useState(100)
  const ZOOMS = [50, 75, 100, 125, 150, 175, 200, 250, 300]

  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape") onClose()
      else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(300, z + 25))
      else if (e.key === "-" || e.key === "_") setZoom(z => Math.max(50, z - 25))
      else if (e.key === "0") setZoom(100)
    }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  const stepZoom = dir => {
    const idx = ZOOMS.findIndex(z => z >= zoom)
    if (dir > 0) setZoom(ZOOMS[Math.min(ZOOMS.length - 1, idx + 1)] ?? 300)
    else         setZoom(ZOOMS[Math.max(0, idx - 1)] ?? 50)
  }

  return (
    <div className="pdf-lb-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pdf-lb-bar">
        <Ico n="doc" s={20} />
        <div className="pdf-lb-name">
          {filename || "PDF Preview"}
          {sizeKB && <span className="pdf-lb-size">  ·  {sizeKB} KB</span>}
        </div>
        <button className="pdf-lb-btn" onClick={() => stepZoom(-1)} title="ย่อ (−)">
          <Ico n="zoomOut" s={18} />
        </button>
        <span className="pdf-lb-zoom">{zoom}%</span>
        <button className="pdf-lb-btn" onClick={() => stepZoom(+1)} title="ขยาย (+)">
          <Ico n="zoomIn" s={18} />
        </button>
        <button className="pdf-lb-btn" onClick={() => setZoom(100)} title="รีเซ็ต (0)">100%</button>
        <button className="pdf-lb-btn" onClick={() => src && window.open(src, "_blank")} title="เปิดในแท็บใหม่" disabled={!src}>
          <Ico n="open" s={18} /> แท็บใหม่
        </button>
        <button className="pdf-lb-btn close" onClick={onClose} title="ปิด (Esc)">
          <Ico n="x" s={18} /> ปิด
        </button>
      </div>
      <div className="pdf-lb-body">
        <div className="pdf-lb-frame-wrap"
          style={{ width: `${zoom * 8}px`, height: "calc(100vh - 88px)" }}>
          {src ? (
            <iframe className="pdf-lb-frame" src={src} title="PDF Fullscreen" />
          ) : (
            <div className="pdf-placeholder" style={{ height: "100%" }}>
              <Ico n="doc" s={48} sw={1} />
              <div className="ph-title">ยังไม่มีไฟล์</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
