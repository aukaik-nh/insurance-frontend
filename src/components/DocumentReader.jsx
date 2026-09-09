import { useRef, useState } from "react"
import { Ico } from "../icons"
import { PdfCanvasViewer } from "./PdfCanvasViewer"
import "./DocumentReader.css"

export function DocumentReader({ file, loading, pdfUrl, imageUrl, text = "", pageCount, onFile, onClear, onManual, notify, evidence = {}, textScope, onFullscreen, onUseEvidence, onUseAllEvidence, fieldValues = {} }) {
  const input = useRef(null)
  const [view, setView] = useState("pdf")
  const [drag, setDrag] = useState(false)
  const pick = files => {
    if (loading) return
    if (files.length !== 1) { notify("กรุณาเลือกครั้งละ 1 ไฟล์", "info"); return }
    setView("pdf")
    onFile(files[0])
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); notify("คัดลอกข้อความแล้ว") }
    catch { notify("คัดลอกไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกด้วยตัวเอง", "error") }
  }
  const downloadText = () => {
    const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url; link.download = `${file.name.replace(/\.pdf$/i, "")}-หน้าแรก.txt`
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="reader" aria-label="อ่านเอกสาร">
    <input ref={input} type="file" accept=".pdf,application/pdf" aria-label="เลือกเอกสาร PDF" hidden disabled={loading}
      onChange={e => { if (e.target.files.length) pick(e.target.files); e.target.value = "" }} />
    {!file && <header className="reader-intro">
      <div><span className="reader-eyebrow"><Ico n="shield" s={16} />เอกสารกรมธรรม์</span><h2>เริ่มต้นด้วยไฟล์ของคุณ</h2><p>เลือกเอกสาร แล้วตรวจทานข้อมูลก่อนบันทึก</p></div>
      <span className="reader-format"><Ico n="doc" s={16} />PDF · ครั้งละ 1 ไฟล์</span>
    </header>}
    {file && <div className="reader-tabs" role="group" aria-label="มุมมองเอกสาร">
      <button type="button" className={view === "pdf" ? "selected" : ""} aria-pressed={view === "pdf"} onClick={() => setView("pdf")}><Ico n="doc" s={18} />PDF ต้นฉบับ</button>
      <button type="button" className={view === "text" ? "selected" : ""} aria-pressed={view === "text"} onClick={() => setView("text")}><Ico n="list" s={18} />ข้อความ</button>
      <span className="reader-caption">แสดง PDF ต้นฉบับทุกหน้า · ระบบอ่านภาพอยู่เบื้องหลัง</span>
    </div>}
    {!file ? <div className={`reader-empty${drag ? " dragging" : ""}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false) }}
      onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files) }}>
      <div className="reader-drop">
        <span className="reader-upload-logo" aria-hidden="true"><span className="reader-upload-cloud"><Ico n="upload" s={30} /></span></span>
        <h3>{drag ? "วางไฟล์เพื่อเริ่มต้น" : "ลากและวาง"}</h3>
        <p>ลากไฟล์กรมธรรม์มาวาง หรือเลือกจากเครื่องของคุณ</p>
        <button type="button" className="btn btn-b reader-pick" disabled={loading} onClick={() => input.current.click()}><Ico n="folder" s={20} />เลือกไฟล์ PDF<Ico n="arrowR" s={18} /></button>
        <span className="reader-limit">ขนาดไม่เกิน 12 MB · แสดง PDF ได้ทุกหน้า</span>
      </div>
      <aside className="reader-guide" aria-label="ขั้นตอนเพิ่มกรมธรรม์">
        <h3>จากเอกสาร สู่ข้อมูลพร้อมบันทึก</h3>
        <ol className="reader-steps">
          <li><span className="reader-step-icon"><Ico n="doc" s={19} /></span><div><strong>เลือกไฟล์กรมธรรม์</strong><p>ใช้เอกสารที่ตัวอักษรชัดเจน</p></div></li>
          <li><span className="reader-step-icon"><Ico n="search" s={19} /></span><div><strong>ตรวจทานข้อมูล</strong><p>เทียบชื่อ เลขกรมธรรม์ และยอดเงินกับต้นฉบับ</p></div></li>
          <li><span className="reader-step-icon"><Ico n="save" s={19} /></span><div><strong>บันทึกเมื่อพร้อม</strong><p>แก้ไขข้อมูลให้ถูกต้องก่อนบันทึก</p></div></li>
        </ol>
        <div className="reader-manual"><span>ไม่มีไฟล์เอกสาร?</span><button type="button" disabled={loading} onClick={onManual}><Ico n="pen" s={17} />กรอกข้อมูลเอง<Ico n="chevR" s={16} /></button></div>
      </aside>
    </div> : <>
      <div className="reader-toolbar">
        <div className="reader-filename"><Ico n="doc" s={18} /><strong title={file.name}>{file.name}</strong><small>หน้า 1{pageCount ? ` / ${pageCount}` : ""}</small></div>
        <div className="reader-actions">
          <button type="button" onClick={copy} disabled={!text || loading}><Ico n="copy" s={17} />คัดลอก</button>
          <button type="button" onClick={downloadText} disabled={!text || loading}><Ico n="download" s={17} />ข้อความ</button>
          {onFullscreen && <button type="button" onClick={onFullscreen}><Ico n="expand" s={17} />PDF ทุกหน้า</button>}
          <button type="button" onClick={() => input.current.click()} disabled={loading}><Ico n="refresh" s={17} />เปลี่ยนไฟล์</button>
          <button type="button" onClick={onClear} disabled={loading} title="ล้างไฟล์" aria-label="ล้างไฟล์"><Ico n="x" s={19} /></button>
        </div>
      </div>
      {loading && view === "pdf" && pdfUrl ? <>
          <div className="reader-live-status" role="status"><span className="spin" /><span><strong>แสดงต้นฉบับแล้ว</strong><small>Python กำลังอ่านช่องสำคัญอยู่เบื้องหลัง</small></span></div>
          <PdfCanvasViewer key={pdfUrl} src={pdfUrl} imageUrl={imageUrl} filename={file.name} initialPageCount={pageCount} />
        </>
        : loading ? <div className="reader-loading" role="status"><span className="spin" /><strong>กำลังอ่านเอกสาร…</strong><p>ระบบกำลังเตรียม PDF ต้นฉบับให้แสดง</p></div>
        : view === "pdf" ? pdfUrl
          ? <PdfCanvasViewer key={pdfUrl} src={pdfUrl} imageUrl={imageUrl} filename={file.name} initialPageCount={pageCount} />
          : <p className="reader-message">ไม่สามารถแสดง PDF ได้ กรุณาลองเลือกไฟล์อีกครั้ง</p>
        : <div className="reader-text">
          <div className="reader-text-heading">
            <label htmlFor="document-text">{textScope === "key_fields" ? "ข้อความแยกตามช่องสำคัญ · ช่องรอตรวจยังไม่ถูกกรอกในฟอร์ม" : "ข้อความที่อ่านได้เต็มหน้า · เรียงตามตำแหน่งบนเอกสาร"}</label>
            {onUseAllEvidence && Object.values(evidence).some(item => item?.text) && <button type="button" onClick={onUseAllEvidence}>
              <Ico n="arrowL" s={17} />ใส่ข้อมูลที่อ่านได้ลงช่องว่าง
            </button>}
          </div>
          {Object.values(evidence).some(item => item.source_image_url) && <details className="reader-evidence">
            <summary>ดูภาพต้นฉบับแยกช่อง เพื่อตรวจข้อมูล</summary>
            <div className="reader-evidence-grid">{Object.entries(evidence).map(([key, item]) => item.source_image_url && <div key={key} className="reader-evidence-item">
              <div><strong>{item.label || key}</strong><span>{item.status === "review" ? "รอตรวจ · ยังไม่กรอก" : "กรอกเบื้องต้น · โปรดตรวจ"}</span></div>
              <img src={item.source_image_url} alt={`ต้นฉบับช่อง ${item.label || key}`} loading="lazy" />
              <p>อ่านได้: {item.text || "อ่านไม่ได้"}</p>
              {onUseEvidence && item.text && <button type="button" className="reader-use-value"
                disabled={fieldValues?.[key] !== null && fieldValues?.[key] !== undefined && String(fieldValues[key]).trim() !== ""}
                onClick={() => onUseEvidence(key, item)}>
                <Ico n={fieldValues?.[key] ? "check" : "arrowL"} s={16} />
                {fieldValues?.[key] ? "อยู่ในช่องแล้ว" : "ใส่ลงช่องด้านซ้าย"}
              </button>}
            </div>)}</div>
          </details>}
          <textarea id="document-text" readOnly value={text} placeholder="ยังอ่านข้อความไม่ได้ กรุณาตรวจภาพหรือกรอกข้อมูลเอง" />
        </div>}
    </>}
  </section>
}
