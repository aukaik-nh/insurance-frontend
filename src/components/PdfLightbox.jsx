import { useEffect } from "react"
import { Ico } from "../icons"
import { PdfCanvasViewer } from "./PdfCanvasViewer"

export function PdfLightbox({ src, imageUrl, filename, sizeKB, onClose }) {
  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  return (
    <div className="pdf-lb-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pdf-lb-bar">
        <Ico n="doc" s={20} />
        <div className="pdf-lb-name">
          {filename || "PDF Preview"}
          {sizeKB && <span className="pdf-lb-size">  ·  {sizeKB} KB</span>}
        </div>
        <button className="pdf-lb-btn close" onClick={onClose} title="ปิด (Esc)">
          <Ico n="x" s={18} /> ปิด
        </button>
      </div>
      <div className="pdf-lb-body">
        <PdfCanvasViewer key={src || imageUrl || "empty"} src={src} imageUrl={imageUrl} filename={filename} fullscreen />
      </div>
    </div>
  )
}
