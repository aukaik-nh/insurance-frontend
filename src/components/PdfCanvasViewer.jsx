import { useEffect, useRef, useState } from "react"
import { GlobalWorkerOptions, TextLayer, getDocument } from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { Ico } from "../icons"
import "./PdfCanvasViewer.css"

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function PdfPage({ pdf, pageNumber, availableWidth, availableHeight, fitMode, zoom }) {
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  const [error, setError] = useState("")
  const [pageSize, setPageSize] = useState(null)

  useEffect(() => {
    if (!pdf || !availableWidth) return undefined
    let cancelled = false
    let renderTask
    let textLayer

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber)
        if (cancelled) return
        const natural = page.getViewport({ scale: 1 })
        const fitScale = fitMode === "page" && availableHeight
          ? 0.96 * Math.min(availableWidth / natural.width, availableHeight / natural.height)
          : availableWidth / natural.width
        const cssScale = Math.max(0.01, fitScale * (zoom / 100))
        const cssWidth = Math.round(natural.width * cssScale)
        const cssHeight = Math.round(natural.height * cssScale)
        setPageSize({ width: cssWidth, height: cssHeight })
        // Render more pixels without enlarging the page on screen. Limit the
        // canvas area so zoomed pages and multi-page files remain usable.
        const targetRatio = window.matchMedia("(max-width: 700px)").matches
          ? 4
          : Math.min(window.devicePixelRatio || 1, 2)
        const pixelRatio = Math.min(targetRatio, Math.sqrt(4_000_000 / (cssWidth * cssHeight)))
        const viewport = page.getViewport({ scale: cssScale * pixelRatio })
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.width = Math.round(viewport.width)
        canvas.height = Math.round(viewport.height)
        canvas.style.width = `${cssWidth}px`
        canvas.style.height = `${cssHeight}px`
        renderTask = page.render({ canvasContext: canvas.getContext("2d"), viewport })
        await renderTask.promise
        const layerElement = textLayerRef.current
        if (!cancelled && layerElement) {
          layerElement.replaceChildren()
          try {
            const textContent = await page.getTextContent()
            if (!cancelled && textContent.items.length) {
              layerElement.style.setProperty("--total-scale-factor", String(cssScale))
              textLayer = new TextLayer({
                textContentSource: textContent,
                container: layerElement,
                viewport: page.getViewport({ scale: cssScale }),
              })
              await textLayer.render()
            }
          } catch (textError) {
            if (!cancelled && textError?.name !== "AbortException") layerElement.replaceChildren()
          }
        }
        if (!cancelled) setError("")
      } catch (err) {
        if (!cancelled && err?.name !== "RenderingCancelledException") {
          setError("แสดงหน้านี้ไม่สำเร็จ")
        }
      }
    }

    render()
    return () => {
      cancelled = true
      renderTask?.cancel()
      textLayer?.cancel()
    }
  }, [pdf, pageNumber, availableWidth, availableHeight, fitMode, zoom])

  return <section className="pdf-canvas-page" aria-label={`หน้า ${pageNumber}`}>
    <span className="pdf-canvas-page-number">หน้า {pageNumber}</span>
    {error ? <div className="pdf-canvas-page-error">{error}</div> : <div className="pdf-canvas-sheet" style={pageSize ? { width: pageSize.width, height: pageSize.height } : undefined}>
      <canvas ref={canvasRef} />
      <div className="pdf-canvas-text-layer" ref={textLayerRef} />
    </div>}
  </section>
}

function PdfImagePage({ imageUrl, availableWidth, zoom, pageCount }) {
  const width = availableWidth ? Math.max(260, Math.round(availableWidth * zoom / 100)) : undefined
  return <section className="pdf-canvas-page pdf-image-page" aria-label="หน้า 1">
    <span className="pdf-canvas-page-number">หน้า 1{pageCount > 1 ? ` / ${pageCount}` : ""}</span>
    <img className="pdf-canvas-image" src={imageUrl} alt="ภาพตัวอย่างหน้าแรกของเอกสาร PDF"
      style={width ? { width: `${width}px` } : undefined} />
  </section>
}

export function PdfCanvasViewer({ src, imageUrl, filename, initialPageCount, fullscreen = false, fitPage = false, onOpenFallback }) {
  const stageRef = useRef(null)
  const [pdf, setPdf] = useState(null)
  const [pageCount, setPageCount] = useState(initialPageCount || 0)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [availableHeight, setAvailableHeight] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [fitMode, setFitMode] = useState(fullscreen || fitPage ? "page" : "width")
  const [status, setStatus] = useState(src ? "loading" : "empty")

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    const measure = () => {
      const style = window.getComputedStyle(stage)
      const horizontalPadding = Number.parseFloat(style.paddingLeft || "0")
        + Number.parseFloat(style.paddingRight || "0")
      const verticalPadding = Number.parseFloat(style.paddingTop || "0")
        + Number.parseFloat(style.paddingBottom || "0")
      setAvailableWidth(Math.max(260, stage.clientWidth - horizontalPadding))
      setAvailableHeight(Math.max(180, stage.clientHeight - verticalPadding))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [fullscreen])

  useEffect(() => {
    if (!src) return undefined

    let cancelled = false
    let loadingTask

    const loadPdf = async () => {
      try {
        setStatus("loading")
        // Safari/iOS มักส่ง blob: URL เข้า PDF worker ไม่สำเร็จ
        // โหลดใน main thread ก่อน แล้วส่ง bytes ให้ worker โดยตรงแทน
        const response = await fetch(src)
        if (!response.ok) throw new Error(`PDF HTTP ${response.status}`)
        const data = new Uint8Array(await response.arrayBuffer())
        if (cancelled) return

        loadingTask = getDocument({ data })
        const document = await loadingTask.promise
        if (cancelled) {
          document.destroy()
          return
        }
        setPdf(document)
        setPageCount(document.numPages)
        setStatus("ready")
      } catch (error) {
        if (!cancelled && error?.name !== "AbortException") setStatus("error")
      }
    }

    loadPdf()

    return () => {
      cancelled = true
      loadingTask?.destroy()
    }
  }, [src, initialPageCount])

  const zoomOut = () => setZoom(value => Math.max(25, value - 25))
  const zoomIn = () => setZoom(value => Math.min(300, value + 25))
  const setPageFit = mode => { setFitMode(mode); setZoom(100); stageRef.current?.scrollTo({ top: 0, left: 0 }) }

  return <div className={`pdf-canvas-viewer${fullscreen ? " is-fullscreen" : ""}${fitPage && !fullscreen ? " is-inline-document" : ""}`}>
    <div className="pdf-canvas-toolbar">
      <div className="pdf-canvas-title">
        <span className="pdf-canvas-icon"><Ico n="doc" s={17} /></span>
        <span><strong>เอกสารต้นฉบับ</strong><small title={filename}>{pageCount ? `${pageCount} หน้า` : "กำลังเตรียมเอกสาร"}</small></span>
      </div>
      <div className="pdf-canvas-controls" aria-label="ปรับขนาดเอกสาร">
        <button type="button" onClick={zoomOut} disabled={zoom <= 25} title="ย่อเอกสาร" aria-label="ย่อเอกสาร"><Ico n="zoomOut" s={18} /></button>
        <button type="button" className="pdf-canvas-zoom" onClick={() => setZoom(100)} title="กลับขนาดเริ่มต้น">{zoom}%</button>
        <button type="button" onClick={zoomIn} disabled={zoom >= 300} title="ขยายเอกสาร" aria-label="ขยายเอกสาร"><Ico n="zoomIn" s={18} /></button>
        <button type="button" className="pdf-canvas-fit" onClick={() => setPageFit(fitMode === "page" ? "width" : "page")}>
          {fitMode === "page" ? "พอดีกว้าง" : "พอดีแผ่น"}
        </button>
      </div>
    </div>
    <div className="pdf-canvas-stage" ref={stageRef}>
      {imageUrl && status !== "ready" && <div className="pdf-canvas-pages pdf-image-pages">
        <PdfImagePage imageUrl={imageUrl} availableWidth={availableWidth} zoom={zoom} pageCount={pageCount} />
      </div>}
      {!imageUrl && status === "loading" && <div className="pdf-canvas-state"><span className="spin" /><strong>กำลังเปิดเอกสาร…</strong><small>ระบบกำลังจัดหน้า PDF ให้พร้อมตรวจสอบ</small></div>}
      {!imageUrl && status === "error" && <div className="pdf-canvas-state error">
        <Ico n="warn" s={28} />
        <strong>เปิด PDF ไม่สำเร็จ</strong>
        <small>ลองเปิดไฟล์ด้วยตัวอ่าน PDF ของโทรศัพท์</small>
        {onOpenFallback && <button type="button" className="pdf-canvas-fallback" onClick={onOpenFallback}><Ico n="open" s={17} />เปิด PDF โดยตรง</button>}
      </div>}
      {!imageUrl && status === "empty" && <div className="pdf-canvas-state"><Ico n="doc" s={30} /><strong>ยังไม่มีเอกสาร</strong></div>}
      {!imageUrl && status === "ready" && <div className="pdf-canvas-pages">
        {Array.from({ length: pageCount }, (_, index) => <PdfPage key={index + 1} pdf={pdf} pageNumber={index + 1} availableWidth={availableWidth} availableHeight={fitMode === "page" ? availableHeight : 0} fitMode={fitMode} zoom={zoom} />)}
      </div>}
    </div>
  </div>
}
