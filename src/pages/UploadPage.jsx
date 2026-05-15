import { useState, useEffect, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { PdfLightbox } from "../components/PdfLightbox"
import { PdfPreview } from "../components/PdfPreview"
import { FormPanel } from "../components/FormPanel"

export function UploadPage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()

  const [file, setFile]         = useState(null)
  const [fileUrl, setFileUrl]   = useState(null)
  const [filename, setFilename] = useState("")
  const [drag, setDrag]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [parsed, setParsed]     = useState({})
  const [hasData, setHasData]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState("")
  const [aiWarn, setAiWarn]     = useState(null)
  const [pdfFull, setPdfFull]   = useState(false)
  const [formOpen, setFormOpen] = useState(true)
  const ref = useRef()

  useEffect(() => {
    if (!file) { setFileUrl(null); return }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = async f => {
    if (!f) return
    if (!(f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"))) {
      setErr("กรุณาเลือกไฟล์ PDF เท่านั้น"); return
    }
    setFile(f); setErr(""); setHasData(false)
    setFilename(f.name)
    setLoading(true)
    const form = new FormData()
    form.append("file", f)
    try {
      const res = await api.post("/upload-pdf", form)
      if (!res.data?.parsed) throw new Error("ไม่พบข้อมูลใน PDF")
      setParsed({ ...res.data.parsed, pdf_filename: f.name })
      setHasData(true)
      setAiWarn(res.data.used_ai === false ? (res.data.ai_error || null) : null)
    } catch (e) {
      setErr("อ่าน PDF ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally { setLoading(false) }
  }

  const doSave = async () => {
    setSaving(true); setErr("")
    try {
      await api.post("/save-policy", { ...parsed, pdf_filename: filename || parsed.pdf_filename })
      notify("บันทึกกรมธรรม์เรียบร้อยแล้ว")
      navigate("/")
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
      setSaving(false)
    }
  }

  return (
    <>
      {pdfFull && (
        <PdfLightbox src={fileUrl} filename={file?.name}
          sizeKB={file ? (file.size / 1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}

      <div className="page-wrap">
        <div className="page-hd">
          <button className="page-back" onClick={() => navigate(-1)}>
            <Ico n="chevL" s={15} /> กลับ
          </button>
          <div className="page-hd-div" />
          <div className="page-hd-info">
            <div className="page-title">อัปโหลด PDF กรมธรรม์</div>
            <div className="page-sub">
              {loading ? "กำลังวิเคราะห์ด้วย AI…"
                : hasData ? "ตรวจสอบและแก้ไขข้อมูลก่อนบันทึก"
                : "วาง PDF แล้วระบบจะดึงข้อมูลอัตโนมัติ"}
            </div>
          </div>
          <div className="page-hd-right">
            <button className="btn btn-b" onClick={doSave} disabled={!hasData || saving}>
              <Ico n="save" s={14} />
              {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
            </button>
          </div>
        </div>

        <div className="page-body">
          {err && (
            <div className="bnr er" style={{ marginBottom: 16 }}>
              <Ico n="warn" s={18} />
              <div className="bnr-body"><div className="bnr-t">{err}</div></div>
              <button onClick={() => setErr("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", display: "flex" }}>
                <Ico n="x" s={14} />
              </button>
            </div>
          )}

          <div className="upload-split">
            {/* left: drop zone + form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {file && (
                <div className="fname-row">
                  <Ico n="pen" s={13} />
                  <label>ชื่อไฟล์ <span style={{ color: "var(--blue)", fontWeight: 400, fontSize: 11 }}>(แก้ไขได้)</span></label>
                  <input value={filename} onChange={e => setFilename(e.target.value)} placeholder={file.name} />
                  {filename !== file.name && (
                    <button onClick={() => setFilename(file.name)}>รีเซ็ต</button>
                  )}
                </div>
              )}

              {/* drop zone */}
              <div className={`drop-wrap${file ? " has-file" : ""}`}>
                {file ? (
                  <div className="drop-bar" onClick={() => ref.current.click()} style={{ cursor: "pointer" }}>
                    <div className="drop-bar-left">
                      <div className="drop-h-ic" style={{ width: 36, height: 36, borderRadius: 9 }}>
                        <Ico n="doc" s={17} />
                      </div>
                      <div>
                        <div className="drop-h-name" style={{ fontSize: 14 }}>{filename || file.name}</div>
                        <div className="drop-h-hint" style={{ fontSize: 12.5 }}>
                          {loading ? "กำลังวิเคราะห์…" : `${(file.size / 1024).toFixed(0)} KB · คลิกเพื่อเปลี่ยนไฟล์`}
                        </div>
                      </div>
                    </div>
                    <div className="drop-bar-right">
                      {loading
                        ? <div className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} />
                        : <span className="drop-h-badge ok">✓</span>}
                    </div>
                  </div>
                ) : (
                  <div className="drop-body"
                    onDragOver={e => { e.preventDefault(); setDrag(true) }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
                    onClick={() => !loading && ref.current.click()}
                  >
                    <div className={`drop-body-inner${drag ? " drag" : ""}`}>
                      <div className="drop-h-ic" style={{ width: 64, height: 64, borderRadius: 16 }}>
                        <Ico n="upload" s={28} />
                      </div>
                      <span className="drop-h-name" style={{ fontSize: 16 }}>ลากไฟล์ PDF มาวางที่นี่</span>
                      <span className="drop-h-hint" style={{ fontSize: 13.5 }}>หรือคลิกเพื่อเลือกไฟล์ · รองรับ PDF เท่านั้น</span>
                    </div>
                  </div>
                )}
                <input ref={ref} type="file" accept=".pdf" style={{ display: "none" }}
                  onChange={e => pick(e.target.files[0])} />
              </div>

              {aiWarn && (
                <div className="bnr am" style={{ marginBottom: 0 }}>
                  <Ico n="bell" s={18} />
                  <div className="bnr-body">
                    <div className="bnr-t">
                      {aiWarn === "ocr_fallback"
                        ? "AI ไม่พร้อมใช้งาน — อ่านด้วย OCR แทน (อาจไม่แม่น)"
                        : "AI ไม่พร้อมใช้งาน — กรุณากรอกข้อมูลด้วยตนเอง"}
                    </div>
                    <div className="bnr-s">กรุณาตรวจสอบและแก้ไขข้อมูลก่อนบันทึก</div>
                  </div>
                </div>
              )}

              <FormPanel
                open={formOpen}
                onToggle={() => setFormOpen(o => !o)}
                loading={loading}
                parsed={parsed}
                setParsed={setParsed}
              />
            </div>

            {/* right: PDF preview */}
            <div className="upload-aside">
              <PdfPreview fileUrl={fileUrl} file={file} filename={filename} onFullscreen={() => setPdfFull(true)} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
