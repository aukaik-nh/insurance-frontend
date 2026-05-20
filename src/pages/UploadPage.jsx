import { useState, useEffect, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { PdfLightbox } from "../components/PdfLightbox"
import { PdfPreview } from "../components/PdfPreview"
import { FormPanel } from "../components/FormPanel"
import { PremiumGrid } from "../components/PremiumGrid"

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
  const [formOpen, setFormOpen]       = useState(true)
  const [premiumOpen, setPremiumOpen] = useState(false)

  // PRB state — null = ไม่เพิ่ม, object = เพิ่มแล้ว
  const [prb, setPrb]             = useState(null)
  const [prbFile, setPrbFile]     = useState(null)
  const [prbFileUrl, setPrbFileUrl] = useState(null)
  const [activePreview, setActivePreview] = useState("main") // "main" | "prb"

  const ref = useRef()

  useEffect(() => {
    if (!file) { setFileUrl(null); return }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!prbFile) { setPrbFileUrl(null); return }
    const url = URL.createObjectURL(prbFile)
    setPrbFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [prbFile])

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

  const pickPrb = f => {
    if (!f) return
    if (!(f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"))) {
      setErr("พ.ร.บ.: กรุณาเลือกไฟล์ PDF เท่านั้น"); return
    }
    setPrbFile(f)
    setPrb(p => ({ ...(p || {}), pdf_filename: f.name }))
  }

  // toggle PRB column
  const togglePrb = () => {
    if (prb) { setPrb(null); setPrbFile(null); setActivePreview("main") }
    else     { setPrb({ net_premium: "", stamp_duty: "", vat: "", total_premium: "" }); setPremiumOpen(true) }
  }

  const onMainChange = (k, v) => setParsed(p => ({ ...p, [k]: v }))

  // ปุ่มบันทึก active เมื่อมีข้อมูลใดๆ
  const hasAnyInput = hasData || prb !== null
    || Object.values(parsed).some(v => v !== "" && v !== null && v !== undefined)
  const onPrbChange  = (k, v) => setPrb(p => ({ ...(p || {}), [k]: v }))

  const doSave = async () => {
    setSaving(true); setErr("")
    try {
      // 1) บันทึก policy หลัก
      const res = await api.post("/save-policy", { ...parsed, pdf_filename: filename || parsed.pdf_filename })
      const newId = res.data?.id
      if (!newId) throw new Error("ไม่ได้ id ของ policy ใหม่")

      // 2) ถ้ามี PRB → อัปโหลดเป็น attachment
      if (prb && prbFile) {
        const form = new FormData()
        form.append("file", prbFile)
        form.append("doc_type", "prb")
        form.append("label", prb.label || `พ.ร.บ. ${prbFile.name}`)
        if (prb.net_premium   !== "") form.append("net_premium",   String(prb.net_premium))
        if (prb.stamp_duty    !== "") form.append("stamp_duty",    String(prb.stamp_duty))
        if (prb.vat           !== "") form.append("vat",           String(prb.vat))
        if (prb.total_premium !== "") form.append("total_premium", String(prb.total_premium))
        try {
          await api.post(`/policies/${newId}/attachments`, form)
        } catch (e) {
          notify("บันทึกกรมธรรม์สำเร็จ แต่อัปโหลด พ.ร.บ. ล้มเหลว: " + (e.response?.data?.detail || e.message), "error")
          navigate(`/policies/${newId}`)
          return
        }
      } else if (prb && !prbFile) {
        // มีข้อมูล PRB แต่ไม่มีไฟล์ — บันทึกได้ เตือนเล็กน้อย
        notify("บันทึกสำเร็จ — ยังไม่ได้แนบไฟล์ พ.ร.บ.", "info")
        navigate(`/policies/${newId}`)
        return
      }

      notify("บันทึกกรมธรรม์เรียบร้อยแล้ว")
      // ถ้าไม่มีไฟล์หลัก → ไปหน้า detail เพื่อเพิ่ม PDF ทีหลัง
      navigate(file ? "/" : `/policies/${newId}`)
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
      setSaving(false)
    }
  }

  return (
    <>
      {pdfFull && (
        <PdfLightbox
          src={activePreview === "prb" && prbFileUrl ? prbFileUrl : fileUrl}
          filename={activePreview === "prb" && prbFile ? prbFile.name : file?.name}
          sizeKB={activePreview === "prb" && prbFile ? (prbFile.size / 1024).toFixed(0) : file ? (file.size / 1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}

      <div className="page-wrap">
        <div className="page-hd">
          <button className="page-back" onClick={() => navigate(-1)}>
            <Ico n="chevL" s={19} /> กลับ
          </button>
          <div className="page-hd-div" />
          <div className="page-hd-info">
            <div className="page-title">เพิ่มกรมธรรม์</div>
            <div className="page-sub">
              {loading ? "กำลังวิเคราะห์ด้วย AI…"
                : hasData ? "ตรวจสอบและแก้ไขข้อมูลก่อนบันทึก"
                : "วาง PDF ให้ AI ดึงข้อมูล หรือกรอกเองด้วยตนเอง"}
            </div>
          </div>
          <div className="page-hd-right">
            <button className="btn btn-b" onClick={doSave} disabled={!hasAnyInput || saving}>
              <Ico n="save" s={18} />
              {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
            </button>
          </div>
        </div>

        <div className="page-body">
          {err && (
            <div className="bnr er" style={{ marginBottom: 16 }}>
              <Ico n="warn" s={22} />
              <div className="bnr-body"><div className="bnr-t">{err}</div></div>
              <button onClick={() => setErr("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", display: "flex" }}>
                <Ico n="x" s={18} />
              </button>
            </div>
          )}

          <div className="upload-split">
            {/* left: drop zone + form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {file && (
                <div className="fname-row">
                  <Ico n="pen" s={17} />
                  <label>ชื่อไฟล์ <span style={{ color: "var(--blue)", fontWeight: 400, fontSize: 13 }}>(แก้ไขได้)</span></label>
                  <input value={filename} onChange={e => setFilename(e.target.value)} placeholder={file.name} />
                  {filename !== file.name && (
                    <button onClick={() => setFilename(file.name)}>รีเซ็ต</button>
                  )}
                </div>
              )}

              {/* drop zone: กรมธรรม์หลัก */}
              <div className={`drop-wrap${file ? " has-file" : ""}`}>
                {file ? (
                  <div className="drop-bar" onClick={() => ref.current.click()} style={{ cursor: "pointer" }}>
                    <div className="drop-bar-left">
                      <div className="drop-h-ic" style={{ width: 44, height: 44, borderRadius: 11 }}>
                        <Ico n="doc" s={22} />
                      </div>
                      <div>
                        <div className="drop-h-name" style={{ fontSize: 18 }}>{filename || file.name}</div>
                        <div className="drop-h-hint" style={{ fontSize: 15 }}>
                          {loading ? "กำลังวิเคราะห์…" : `${(file.size / 1024).toFixed(0)} KB · คลิกเพื่อเปลี่ยนไฟล์`}
                        </div>
                      </div>
                    </div>
                    <div className="drop-bar-right">
                      {loading
                        ? <div className="spin" style={{ width: 22, height: 22, borderWidth: 2 }} />
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
                      <div className="drop-h-ic" style={{ width: 80, height: 80, borderRadius: 20 }}>
                        <Ico n="upload" s={36} />
                      </div>
                      <span className="drop-h-name" style={{ fontSize: 21 }}>ลากไฟล์ PDF กรมธรรม์มาวางที่นี่</span>
                      <span className="drop-h-hint" style={{ fontSize: 17 }}>หรือคลิกเพื่อเลือกไฟล์ · รองรับ PDF เท่านั้น</span>
                    </div>
                  </div>
                )}
                <input ref={ref} type="file" accept=".pdf" style={{ display: "none" }}
                  onChange={e => pick(e.target.files[0])} />
              </div>

              {aiWarn && (
                <div className="bnr am" style={{ marginBottom: 0 }}>
                  <Ico n="bell" s={22} />
                  <div className="bnr-body">
                    <div className="bnr-t">AI ไม่พร้อมใช้งาน — กรุณากรอกข้อมูลด้วยตนเอง</div>
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
                hideSections={["เบี้ยประกัน", "ค่าคอมมิชชั่น / หัก ณ ที่จ่าย / ปัดเศษ"]}
              />

              {/* ── ตารางคำนวณเบี้ย 3 คอลัมน์ (หลัง FormPanel — หลังหมวดระยะเวลาคุ้มครอง) ── */}
              <PremiumGrid
                  main={parsed}
                  prb={prb}
                  onMainChange={onMainChange}
                  onPrbChange={onPrbChange}
                  onTogglePrb={togglePrb}
                  prbFile={prbFile}
                  onPrbFile={pickPrb}
                  open={premiumOpen}
                  onToggle={() => setPremiumOpen(o => !o)}
                />
            </div>

            {/* right: PDF preview + doc tabs */}
            <div className="upload-aside">
              {/* tab bar — แสดงเมื่อมีไฟล์ พ.ร.บ. */}
              {prbFile && file && (
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <button
                    onClick={() => setActivePreview("main")}
                    style={{
                      padding: "9px 16px", borderRadius: 99, cursor: "pointer",
                      fontFamily: "inherit", fontSize: 14, display: "flex", alignItems: "center", gap: 7,
                      border: `1.5px solid ${activePreview === "main" ? "var(--blue)" : "var(--brd)"}`,
                      background: activePreview === "main" ? "var(--blue-bg)" : "var(--sur)",
                      color: activePreview === "main" ? "var(--blue)" : "var(--t2)",
                      fontWeight: activePreview === "main" ? 700 : 500,
                      transition: "all .15s",
                    }}
                  >
                    <Ico n="doc" s={15} />
                    กรมธรรม์
                    {activePreview === "main" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blue)", marginLeft: 1 }} />}
                  </button>
                  <button
                    onClick={() => setActivePreview("prb")}
                    style={{
                      padding: "9px 16px", borderRadius: 99, cursor: "pointer",
                      fontFamily: "inherit", fontSize: 14, display: "flex", alignItems: "center", gap: 7,
                      border: `1.5px solid ${activePreview === "prb" ? "var(--green)" : "var(--brd)"}`,
                      background: activePreview === "prb" ? "var(--green-bg)" : "var(--sur)",
                      color: activePreview === "prb" ? "var(--green)" : "var(--t2)",
                      fontWeight: activePreview === "prb" ? 700 : 500,
                      transition: "all .15s",
                    }}
                  >
                    <Ico n="shield" s={15} />
                    พ.ร.บ.
                    {activePreview === "prb" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", marginLeft: 1 }} />}
                  </button>
                </div>
              )}
              <PdfPreview
                fileUrl={activePreview === "prb" && prbFileUrl ? prbFileUrl : fileUrl}
                file={activePreview === "prb" && prbFile ? prbFile : file}
                filename={activePreview === "prb" && prbFile ? prbFile.name : filename}
                onFullscreen={() => setPdfFull(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
