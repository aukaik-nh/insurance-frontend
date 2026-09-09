import { useState, useEffect, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { computeDisplayFilename } from "../helpers"
import { PdfLightbox } from "../components/PdfLightbox"
import { FormPanel } from "../components/FormPanel"
import { PremiumGrid } from "../components/PremiumGrid"
import { DocumentReader } from "../components/DocumentReader"

export function UploadPage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()
  const mainFileInput = useRef(null)

  const [file, setFile]         = useState(null)
  const [fileUrl, setFileUrl]   = useState(null)
  const [filename, setFilename] = useState("")
  // true = ใช้ชื่ออัตโนมัติจาก form (sync เมื่อ field เปลี่ยน), false = user แก้ชื่อเอง (ค้างไว้)
  const [filenameAuto, setFilenameAuto] = useState(true)
  const [preview, setPreview] = useState({})
  const [loading, setLoading]   = useState(false)
  const [parsed, setParsed]     = useState({})
  const [hasData, setHasData]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState("")
  const [ocrWarn, setOcrWarn]   = useState(null)
  const [pdfFull, setPdfFull]   = useState(false)
  const [formOpen, setFormOpen]       = useState(true)
  const [premiumOpen, setPremiumOpen] = useState(true)
  const [manualMode, setManualMode]   = useState(false)

  // PRB state — null = ไม่เพิ่ม, object = เพิ่มแล้ว
  const [prb, setPrb]             = useState(null)
  const [prbFile, setPrbFile]     = useState(null)
  const [prbFileUrl, setPrbFileUrl] = useState(null)
  const [prbLoading, setPrbLoading] = useState(false)  // AI กำลังอ่าน PRB
  const [prbPreview, setPrbPreview] = useState({})
  const [prbRead, setPrbRead] = useState({})
  const [activePreview, setActivePreview] = useState("main") // "main" | "prb"
  const showingPrb = Boolean(prbFile && (activePreview === "prb" || !file))
  const readerFile = showingPrb ? prbFile : file
  const readerPreview = showingPrb ? prbPreview : preview
  const readerData = showingPrb ? prbRead : parsed

  const clearFile = () => {
    setFile(null); setParsed({}); setPreview({}); setHasData(false)
    setFilename(""); setOcrWarn(null); setErr(""); setManualMode(false)
    setPrb(null); setPrbFile(null); setActivePreview("main")
    setPrbPreview({}); setPrbRead({}); setPdfFull(false)
  }

  const clearPrbFile = () => {
    setPrbFile(null); setPrbPreview({}); setPrbRead({}); setActivePreview("main")
    setPrb(p => p ? { ...p, pdf_filename: "" } : p)
  }

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

  // ⚡ auto-fill ชื่อไฟล์ตามฟอร์ม — sync กับ logic ฝั่ง backend (_make_display_filename)
  //   user แก้ชื่อเอง → filenameAuto = false → effect นี้หยุด sync (เคารพชื่อ user)
  //   ยังไม่มีข้อมูลพอ (compute ได้ "ไม่ทราบ ...") → เก็บชื่อ fallback ของไฟล์เดิมไว้ก่อน
  useEffect(() => {
    if (!file || !filenameAuto) return
    const computed = computeDisplayFilename({
      plate:           parsed.license_plate,
      policy_type:     parsed.policy_type,
      insured_address: parsed.insured_address,
      insured_name:    parsed.insured_name,
      coverage_start:  parsed.coverage_start,
      coverage_end:    parsed.coverage_end,
      doc_type:        "main",
    })
    if (computed && !computed.startsWith("ไม่ทราบ")) {
      setFilename(computed)
    }
  }, [file, filenameAuto, parsed.license_plate, parsed.policy_type,
      parsed.insured_address, parsed.insured_name, parsed.coverage_start, parsed.coverage_end])

  const pick = async f => {
    if (!f || loading || prbLoading || saving) return
    if (!(f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"))) {
      setErr("กรุณาเลือกไฟล์ PDF เท่านั้น"); return
    }
    if (f.size > 12 * 1024 * 1024) { setErr("กรุณาเลือก PDF ขนาดไม่เกิน 12 MB"); return }
    setParsed({}); setPreview({}); setOcrWarn(null)
    setActivePreview("main")
    // เก็บไฟล์ไว้ใน browser — ยังไม่อัปขึ้น R2 (จะอัปตอนกด "บันทึก")
    setFile(f); setErr(""); setHasData(false); setManualMode(true)
    setFilename(f.name)       // fallback name — useEffect จะ replace ทันทีที่ AI ดึงข้อมูลได้
    setFilenameAuto(true)     // เลือกไฟล์ใหม่ → เปิดโหมด auto-fill
    setLoading(true)
    const form = new FormData()
    form.append("file", f)
    try {
      // Python OCR: PDF -> image -> Tesseract; ไม่เรียก AI และยังไม่ upload storage
      const res = await api.post("/preview-pdf-local", form)
      const parsedData = res.data?.parsed || {}
      setPreview(res.data?.preview || {})
      if (res.data?.success === false) throw new Error(parsedData.parse_error || "อ่านเอกสารไม่สำเร็จ กรุณาลองอีกครั้งหรือกรอกข้อมูลเอง")
      const hasAny = ["policy_number", "insured_name", "license_plate", "coverage_start", "total_premium"]
        .some(key => parsedData[key] !== null && parsedData[key] !== "" && parsedData[key] !== undefined)
      setParsed({ ...parsedData, pdf_filename: f.name })
      setHasData(hasAny)
      setOcrWarn(res.data?.requires_review ? (parsedData.parse_warnings?.join(" · ") || "กรุณาตรวจข้อมูลที่อ่านได้กับเอกสารก่อนบันทึก") : null)
    } catch (e) {
      setErr("อ่าน PDF ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally { setLoading(false) }
  }

  const pickPrb = async f => {
    if (!f || loading || prbLoading || saving) return
    if (!(f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"))) {
      setErr("พ.ร.บ.: กรุณาเลือกไฟล์ PDF เท่านั้น"); return
    }
    if (f.size > 12 * 1024 * 1024) { setErr("พ.ร.บ.: กรุณาเลือก PDF ขนาดไม่เกิน 12 MB"); return }
    setPrbPreview({}); setPrbRead({}); setActivePreview("prb"); setErr("")
    setPrbFile(f)
    setPrb({ pdf_filename: f.name, net_premium: "", stamp_duty: "", vat: "", total_premium: "" })
    setPrbLoading(true)
    const form = new FormData()
    form.append("file", f)
    try {
      const res = await api.post("/preview-pdf-local", form)
      const p = res.data?.parsed || {}
      setPrbPreview(res.data?.preview || {})
      if (res.data?.success === false) throw new Error(p.parse_error || "อ่านเอกสารไม่สำเร็จ")
      setPrbRead(p)
      setPrb(prev => ({
        ...(prev || {}),
        pdf_filename: f.name,
        net_premium:   p.net_premium   ?? prev?.net_premium   ?? "",
        stamp_duty:    p.stamp_duty    ?? prev?.stamp_duty    ?? "",
        vat:           p.vat           ?? prev?.vat           ?? "",
        total_premium: p.total_premium ?? prev?.total_premium ?? "",
      }))
    } catch (e) {
      setErr("อ่าน พ.ร.บ. ไม่สำเร็จ กรุณากรอกข้อมูลเอง: " + (e.response?.data?.detail || e.message))
    } finally {
      setPrbLoading(false)
    }
  }

  // toggle PRB column
  const togglePrb = () => {
    if (prbLoading || saving) return
    if (prb) { setPrb(null); setPrbFile(null); setPrbPreview({}); setPrbRead({}); setActivePreview("main") }
    else     { setPrb({ net_premium: "", stamp_duty: "", vat: "", total_premium: "" }); setPremiumOpen(true) }
  }

  // คำนวณเบี้ย: stamp = ⌈net × 0.4%⌉, VAT = (net+stamp) × 7%, total = net+stamp+VAT
  const num = v => { const n = parseFloat(String(v ?? "").replace(/,/g, "")); return isNaN(n) ? 0 : n }
  const calcPrb = (net) => {
    const n = num(net)
    if (n <= 0) return { stamp_duty: "", vat: "", total_premium: "" }
    const stamp = Math.ceil(n * 0.004)
    const vat   = Math.round((n + stamp) * 0.07 * 100) / 100
    const total = Math.round((n + stamp + vat) * 100) / 100
    return { stamp_duty: stamp, vat, total_premium: total }
  }
  const calcTotal = (net, stamp, vat) => {
    const t = num(net) + num(stamp) + num(vat)
    return t > 0 ? Math.round(t * 100) / 100 : ""
  }

  const onMainChange = (k, v) => setParsed(p => {
    // เปลี่ยน net → recalc stamp/vat/total ทั้งหมด
    if (k === "net_premium") return { ...p, net_premium: v, ...calcPrb(v) }
    // เปลี่ยน stamp/vat → update total
    if (k === "stamp_duty" || k === "vat") {
      const next = { ...p, [k]: v }
      next.total_premium = calcTotal(next.net_premium, next.stamp_duty, next.vat)
      return next
    }
    return { ...p, [k]: v }
  })

  const useReadValue = (field, item) => {
    const value = item?.value ?? item?.manual_value ?? item?.text?.trim()
    if (!field || !value) return
    setParsed(current => {
      const existing = current[field]
      if (existing !== null && existing !== undefined && String(existing).trim() !== "") {
        notify(existing === value ? "ข้อมูลนี้อยู่ในช่องแล้ว" : "ช่องนี้มีข้อมูลอยู่แล้ว จึงไม่ได้เขียนทับ", "info")
        return current
      }
      return { ...current, [field]: value }
    })
    setHasData(true)
  }

  const useAllReadValues = () => {
    const items = Object.entries(parsed.field_evidence || {})
    setParsed(current => {
      const next = { ...current }
      for (const [field, item] of items) {
        const value = item?.value ?? item?.manual_value ?? item?.text?.trim()
        if (value && (next[field] === null || next[field] === undefined || String(next[field]).trim() === "")) {
          next[field] = value
        }
      }
      return next
    })
    setHasData(true)
    notify("ใส่ข้อมูลที่อ่านได้ลงช่องว่างแล้ว กรุณาตรวจเทียบภาพก่อนบันทึก")
  }

  // ปุ่มบันทึก active เมื่อมีข้อมูลใดๆ
  const hasAnyInput = hasData || prb !== null
    || Object.values(parsed).some(v => v !== "" && v !== null && v !== undefined)

  const onPrbChange  = (k, v) => setPrb(p => {
    const cur = p || {}
    if (k === "net_premium") return { ...cur, net_premium: v, ...calcPrb(v) }
    if (k === "stamp_duty" || k === "vat") {
      const next = { ...cur, [k]: v }
      next.total_premium = calcTotal(next.net_premium, next.stamp_duty, next.vat)
      return next
    }
    return { ...cur, [k]: v }
  })

  const doSave = async () => {
    if (loading || prbLoading || saving) return
    setSaving(true); setErr("")
    try {
      // 1a) ถ้ามีไฟล์ PDF หลัก — upload ไป R2 ก่อน (ไม่ทำตอนเลือกไฟล์)
      let pdfMeta = {}
      if (file) {
        const upForm = new FormData()
        upForm.append("file", file)
        try {
          const up = await api.post("/upload-pdf-only", upForm)
          pdfMeta = {
            pdf_url:      up.data?.pdf_url,
            pdf_filename: filename || up.data?.pdf_filename,
            pdf_size:     up.data?.pdf_size,
          }
        } catch (e) {
          throw new Error("อัปโหลด PDF หลักล้มเหลว: " + (e.response?.data?.detail || e.message))
        }
      }

      // 1b) บันทึก policy หลัก (พร้อม pdf_url ถ้ามี)
      const res = await api.post("/save-policy", {
        ...parsed,
        ...pdfMeta,
        pdf_filename: pdfMeta.pdf_filename || filename || parsed.pdf_filename,
      })
      const newId = res.data?.id
      if (!newId) throw new Error("ไม่ได้ id ของ policy ใหม่")

      // 2) ถ้ามี PRB → อัปโหลดเป็น attachment
      if (prb && prbFile) {
        const form = new FormData()
        form.append("file", prbFile)
        form.append("doc_type", "prb")
        // Do not fall back to a paid parser when saving locally-read files.
        form.append("auto_extract", "false")
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
          src={showingPrb ? prbFileUrl : fileUrl}
          imageUrl={readerPreview.image_data_url}
          filename={readerFile?.name}
          sizeKB={readerFile ? (readerFile.size / 1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}

      <div className="page-wrap">
        <div className="page-hd upload-page-hd">
          <button
            className="page-back upload-back-to-home"
            onClick={() => navigate("/")}
            title="กลับไปหน้าภาพรวมระบบ"
            aria-label="กลับไปหน้าภาพรวมระบบ"
          >
            <span className="upload-back-icon"><Ico n="chevL" s={19} /></span>
            <span className="upload-back-label">กลับ<span className="upload-back-destination">หน้าหลัก</span></span>
          </button>
          <div className="page-hd-div" />
          <div className="page-hd-info">
            <div className="page-title">เพิ่มกรมธรรม์</div>
            <div className="page-sub">
              {loading ? "กำลังอ่านเอกสาร…"
                : hasData ? "ตรวจสอบและแก้ไขข้อมูลก่อนบันทึก"
                : "เลือกไฟล์เพื่อเริ่มต้น หรือกรอกข้อมูลเอง"}
            </div>
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

          {!file && !prbFile && <div className="upload-reader-workspace">
            <DocumentReader file={file} loading={loading || prbLoading || saving}
              imageUrl={preview.image_data_url} pdfUrl={fileUrl} text={parsed.raw_text || ""}
              evidence={parsed.field_evidence} textScope={parsed.text_scope}
              pageCount={preview.page_count} onFile={pick} onClear={clearFile}
              onManual={() => setManualMode(true)} notify={notify} />
          </div>}
          <div className="upload-split">
            {/* left: drop zone + form */}
            <div className="upload-form-column" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {file && (
                <div className="fname-row">
                  <Ico n="pen" s={17} />
                  <label>
                    ชื่อไฟล์{" "}
                    <span style={{ color: "var(--blue)", fontWeight: 400, fontSize: 13 }}>
                      {filenameAuto ? "(ตั้งอัตโนมัติจากข้อมูล — แก้ไขได้)" : "(แก้ไขเอง)"}
                    </span>
                  </label>
                  <input
                    value={filename}
                    onChange={e => { setFilenameAuto(false); setFilename(e.target.value) }}
                    placeholder={file.name}
                  />
                  {!filenameAuto && (
                    <button onClick={() => setFilenameAuto(true)} title="กลับไปใช้ชื่ออัตโนมัติ">
                      ใช้ชื่ออัตโนมัติ
                    </button>
                  )}
                </div>
              )}

              {ocrWarn && (
                <div className="bnr am" style={{ marginBottom: 0 }}>
                  <Ico n="bell" s={22} />
                  <div className="bnr-body">
                    <div className="bnr-t">ตรวจสอบข้อมูลก่อนบันทึก</div>
                    <div className="bnr-s">{ocrWarn}</div>
                  </div>
                </div>
              )}

              {(file || manualMode) && <>
                {file && (
                  <div className={`upload-ai-status${loading ? " reading" : hasData ? " ready" : ""}`}>
                    <span className="upload-ai-icon">{loading ? <span className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Ico n={hasData ? "check" : "doc"} s={19} />}</span>
                    <div><strong>{loading ? "กำลังอ่านเอกสาร" : hasData ? "เติมข้อมูลเบื้องต้นแล้ว" : "พร้อมให้กรอกข้อมูล"}</strong><small>{loading ? "รอสักครู่ ระบบกำลังอ่านข้อความหน้าแรก" : "ตรวจข้อมูลสำคัญก่อนกดบันทึกทุกครั้ง"}</small></div>
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
                  prbLoading={prbLoading}
                  open={premiumOpen}
                  onToggle={() => setPremiumOpen(o => !o)}
                />
              </>}
            </div>

            {/* right: one image/text reader for the selected document */}
            {(file || prbFile) && (
            <aside className="upload-aside upload-document-aside" aria-label="เอกสารสำหรับเทียบข้อมูล">
              {prbFile && !file && <div style={{ marginBottom: 12 }}>
                <input ref={mainFileInput} type="file" accept=".pdf,application/pdf" hidden
                  aria-label="แนบไฟล์กรมธรรม์" disabled={loading || prbLoading || saving}
                  onChange={e => { pick(e.target.files?.[0]); e.target.value = "" }} />
                <button type="button" className="btn btn-w" disabled={loading || prbLoading || saving}
                  onClick={() => mainFileInput.current?.click()}><Ico n="upload" s={17} />แนบไฟล์กรมธรรม์</button>
              </div>}
              {/* tab bar — แสดงเมื่อมีไฟล์ พ.ร.บ. */}
              {prbFile && file && (
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <button
                    type="button" disabled={loading || prbLoading || saving} aria-pressed={!showingPrb}
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
                    type="button" disabled={loading || prbLoading || saving} aria-pressed={showingPrb}
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
              <DocumentReader key={showingPrb ? "prb" : "main"}
                file={readerFile} loading={loading || prbLoading || saving}
                imageUrl={readerPreview.image_data_url} pdfUrl={showingPrb ? prbFileUrl : fileUrl} text={readerData.raw_text || ""}
                evidence={readerData.field_evidence} textScope={readerData.text_scope}
                pageCount={readerPreview.page_count}
                onFile={showingPrb ? pickPrb : pick} onClear={showingPrb ? clearPrbFile : clearFile}
                onManual={() => setManualMode(true)} notify={notify}
                fieldValues={showingPrb ? prb : parsed}
                onUseEvidence={showingPrb ? undefined : useReadValue}
                onUseAllEvidence={showingPrb ? undefined : useAllReadValues}
                onFullscreen={() => setPdfFull(true)} />
            </aside>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
