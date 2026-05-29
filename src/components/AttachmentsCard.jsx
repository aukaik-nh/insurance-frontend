import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { createPortal } from "react-dom"
import { Ico } from "../icons"
import api from "../api"
import { openPdfTab, downloadPdf } from "../pdfUtils"

const DOC_TYPES = [
  {
    val: "main",
    label: "กรมธรรม์หลัก",
    desc: "ตัวกรมธรรม์ประกันภัยรถยนต์",
    ico: "doc",
    color: "var(--blue)",
    bg: "var(--blue-bg)",
    brd: "var(--blue-mid)",
  },
  {
    val: "prb",
    label: "พ.ร.บ. (ประกันภาคบังคับ)",
    desc: "พ.ร.บ. รถยนต์",
    ico: "shield",
    color: "var(--green)",
    bg: "var(--green-bg)",
    brd: "var(--green-brd)",
  },
  {
    val: "endorsement",
    label: "สลักหลัง (Endorsement)",
    desc: "เอกสารสลักหลังเปลี่ยนชื่อผู้ขับ/ผู้รับประโยชน์/แก้ไขเงื่อนไข",
    ico: "pen",
    color: "#D97706",
    bg: "var(--amber-bg)",
    brd: "var(--amber-brd)",
  },
]

const typeMeta = v => DOC_TYPES.find(t => t.val === v) || DOC_TYPES[0]

// auto-detect ประเภทจากชื่อไฟล์
function detectDocType(filename = "") {
  const f = filename.toLowerCase()
  if (/(พรบ|พ\.?ร\.?บ\.?|prb|compulsory)/i.test(filename)) return "prb"
  if (/(สลักหลัง|สลัก|endorsement)/i.test(filename)) return "endorsement"
  if (/(กธ|กรมธรรม)/i.test(filename))                  return "main"
  return null
}

const fmtKB = (size) => size ? `${(size / 1024).toFixed(0)} KB` : ""

// คำนวณ stamp/vat/total อัตโนมัติจากเบี้ยสุทธิ (เหมือนหน้า /upload)
const num = v => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""))
  return isNaN(n) ? 0 : n
}
const calcPrbPremium = (net) => {
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

export const AttachmentsCard = forwardRef(function AttachmentsCard({ policyId, hasMainPdf, mainFilename, onMainUpdated, onItemsChange, hideHeaderButton = false }, ref) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUpload]  = useState(false)
  const [typePicker, setTypePicker] = useState(false)        // modal เลือกประเภท
  const [open, setOpen]         = useState(true)              // collapse ทั้งการ์ด
  const fileRef = useRef(null)
  const pendingType = useRef(null)

  // expose open/close ให้ parent (ใช้เมื่อย้ายปุ่ม "เพิ่มเอกสาร" ไปอยู่ที่ header ของ DetailPage)
  useImperativeHandle(ref, () => ({
    openAddDialog: () => setTypePicker(true),
    closeAddDialog: () => setTypePicker(false),
    isUploading: () => uploading,
  }), [uploading])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/policies/${policyId}/attachments`)
      const data = res.data.data || []
      setItems(data)
      onItemsChange?.(data)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  // race-safe: ถ้า policyId เปลี่ยนระหว่าง fetch → ignore ผลเก่า
  useEffect(() => {
    if (!policyId) return
    let cancelled = false
    setLoading(true)
    api.get(`/policies/${policyId}/attachments`)
      .then(res => {
        if (cancelled) return
        const data = res.data.data || []
        setItems(data)
        onItemsChange?.(data)
      })
      .catch(e => { if (!cancelled) console.error(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [policyId])

  // เลือกประเภท → เปิด file picker
  const pickType = (docType) => {
    if (docType === "main" && hasMainPdf) {
      if (!confirm(`มีกรมธรรม์หลัก "${mainFilename || ''}" อยู่แล้ว ต้องการแทนที่หรือไม่?`)) return
    }
    pendingType.current = docType
    setTypePicker(false)
    setTimeout(() => fileRef.current?.click(), 50)
  }

  const onFilePicked = (f) => {
    const docType = pendingType.current
    pendingType.current = null
    if (!f) return
    if (!(f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"))) {
      alert("กรุณาเลือกไฟล์ PDF เท่านั้น")
      return
    }
    const finalType = docType || detectDocType(f.name) || "prb"

    if (finalType === "main") {
      uploadMain(f)
    } else {
      // one-click upload — backend จะ extract เลขเบี้ยให้เอง (เฉพาะ พ.ร.บ.)
      uploadAttachmentAuto(f, finalType)
    }
  }

  // อัปโหลดเอกสารแนบทันที — ไม่มี modal — backend auto-extract เลขเบี้ย
  const uploadAttachmentAuto = async (f, docType) => {
    setUpload(true)
    try {
      const form = new FormData()
      form.append("file", f)
      form.append("doc_type", docType)
      // ไม่ส่ง label/note/premium → backend จะ auto-fill จาก AI (กรณี พ.ร.บ.)
      await api.post(`/policies/${policyId}/attachments`, form)
      await load()
    } catch (e) {
      alert("อัปโหลดไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally {
      setUpload(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  // อัปโหลดกรมธรรม์หลัก (เขียนทับ pdf_url บน insurance_policies)
  const uploadMain = async (f) => {
    setUpload(true)
    try {
      const form = new FormData()
      form.append("file", f)
      const up = await api.post("/upload-pdf-only", form)
      const { pdf_url, pdf_filename, pdf_size } = up.data
      await api.put(`/policies/${policyId}`, { pdf_url, pdf_filename, pdf_size })
      onMainUpdated?.()
    } catch (e) {
      alert("อัปโหลดไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally {
      setUpload(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const del = async (att) => {
    if (!confirm(`ลบเอกสาร "${att.label || att.pdf_filename || 'ไฟล์นี้'}" ?`)) return
    try {
      await api.delete(`/policies/${policyId}/attachments/${att.id}`)
      await load()
    } catch (e) {
      alert("ลบไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    }
  }

  const baseUrl = api.defaults.baseURL
  const groups  = DOC_TYPES.filter(t => t.val !== "main").map(t => ({
    ...t,
    items: items.filter(i => i.doc_type === t.val)
  }))

  return (
    <div className="info-card">
      <div
        className="info-card-hd"
        onClick={() => setOpen(o => !o)}
        style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
      >
        <Ico n="doc" s={20} />
        <span className="info-card-title">เอกสารแนบ</span>
        {items.length > 0 && (
          <span style={{
            marginLeft: 8, padding: "2px 10px", borderRadius: 99,
            background: "var(--sur2)", fontSize: 12, fontWeight: 700, color: "var(--t2)",
          }}>{items.length}</span>
        )}
        {!hideHeaderButton && (
          <button
            className="btn btn-b"
            onClick={(e) => { e.stopPropagation(); setTypePicker(true) }}
            disabled={uploading}
            style={{ marginLeft: "auto", padding: "8px 16px", fontSize: 14 }}
          >
            {uploading
              ? <><div className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> กำลังอัปโหลด…</>
              : <><Ico n="upload" s={16} /> เพิ่มเอกสาร</>}
          </button>
        )}
        {hideHeaderButton && uploading && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--t3)" }}>
            <div className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> กำลังอัปโหลด…
          </span>
        )}
        <div style={{
          marginLeft: hideHeaderButton && !uploading ? "auto" : 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, height: 30, borderRadius: 7,
          background: "var(--sur2)",
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}>
          <Ico n="chevD" s={18} />
        </div>
      </div>

      {open && (
      <div className="info-card-bd" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: "var(--t3)" }}>
            <div className="spin" style={{ margin: "0 auto 8px" }} />
            กำลังโหลด…
          </div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "26px 16px",
            border: "1.5px dashed var(--brd)", borderRadius: 12,
            background: "var(--sur2)", color: "var(--t3)",
          }}>
            <Ico n="doc" s={32} sw={1} />
            <div style={{ fontSize: 15, marginTop: 8, fontWeight: 600, color: "var(--t2)" }}>
              ยังไม่มีเอกสารแนบ
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              กดปุ่ม "เพิ่มเอกสาร" เพื่อเพิ่ม พ.ร.บ., สลักหลัง หรือเปลี่ยนกรมธรรม์หลัก
            </div>
          </div>
        ) : (
          groups.filter(g => g.items.length > 0).map(g => (
            <div key={g.val}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 10, paddingBottom: 8,
                borderBottom: `1.5px solid ${g.brd}`,
              }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "5px 12px", borderRadius: 8,
                  background: g.bg, color: g.color,
                  fontSize: 14, fontWeight: 700,
                }}>
                  <Ico n={g.ico} s={16} /> {g.label}
                </span>
                <span style={{ fontSize: 13, color: "var(--t3)" }}>
                  {g.items.length} ฉบับ
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.items.map(att => {
                  const viewUrl = `${baseUrl}/policies/${policyId}/attachments/${att.id}/pdf`
                  const dlUrl   = `${viewUrl}?download=1`
                  const hasPremium = att.total_premium || att.net_premium
                  return (
                    <div key={att.id} style={{
                      display: "flex", flexDirection: "column", gap: 8,
                      padding: "10px 14px",
                      border: "1.5px solid var(--brd)", borderRadius: 11,
                      background: "var(--sur)",
                    }}>
                      {/* ── header row — เลียนแบบ pdf-preview-bar ── */}
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ color: g.color, flexShrink: 0, display: "flex" }}>
                          <Ico n="doc" s={17} />
                        </span>
                        <span style={{
                          flex: 1, minWidth: 0,
                          fontSize: 15, fontWeight: 600, color: "var(--t1)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {att.label || att.pdf_filename || "ไฟล์ PDF"}
                        </span>
                        {att.pdf_filename && att.label && att.label !== att.pdf_filename && (
                          <span style={{ fontSize: 13, color: "var(--t3)", flexShrink: 0 }}>
                            {att.pdf_filename}
                          </span>
                        )}
                        {att.pdf_size && (
                          <span style={{ fontSize: 13, color: "var(--t3)", flexShrink: 0 }}>
                            {fmtKB(att.pdf_size)}
                          </span>
                        )}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button className="pdf-zoom-btn" onClick={() => openPdfTab(viewUrl)} title="เปิดในแท็บใหม่">
                            <Ico n="open" s={17} />
                          </button>
                          <button className="pdf-zoom-btn" onClick={() => downloadPdf(dlUrl, att.pdf_filename || "attachment.pdf")} title="ดาวน์โหลด">
                            <Ico n="download" s={17} />
                          </button>
                          <button className="pdf-zoom-btn" onClick={() => del(att)} title="ลบ"
                            style={{ color: "var(--red)", borderColor: "var(--red-brd)", background: "var(--red-bg)" }}>
                            <Ico n="trash" s={17} />
                          </button>
                        </div>
                      </div>
                      {att.note && (
                        <div style={{ fontSize: 13, color: "var(--t3)", paddingLeft: 26 }}>{att.note}</div>
                      )}
                      {hasPremium && (
                        <div style={{
                          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
                          padding: "10px 12px",
                          background: g.bg, border: `1px solid ${g.brd}`,
                          borderRadius: 9,
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {[
                            ["เบี้ยสุทธิ",  att.net_premium],
                            ["อากร",       att.stamp_duty],
                            ["VAT 7%",     att.vat],
                            ["รวม",        att.total_premium],
                          ].map(([lbl, val]) => (
                            <div key={lbl}>
                              <div style={{ fontSize: 11, color: g.color, fontWeight: 600 }}>{lbl}</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>
                                {val != null ? Number(val).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={e => onFilePicked(e.target.files?.[0])}
      />

      {/* Modal A: เลือกประเภทเอกสาร — portal ไป body เพื่อให้แสดงแม้ parent ถูกซ่อน */}
      {typePicker && createPortal(
        <div className="ov" onClick={e => e.target === e.currentTarget && setTypePicker(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-hd">
              <div>
                <div className="modal-title">เลือกประเภทเอกสาร</div>
                <div className="modal-sub">เลือกประเภทก่อนเลือกไฟล์ PDF</div>
              </div>
              <button className="xbtn" onClick={() => setTypePicker(false)}>
                <Ico n="x" s={18} />
              </button>
            </div>
            <div className="modal-bd" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DOC_TYPES.map(t => (
                <button
                  key={t.val}
                  onClick={() => pickType(t.val)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "14px 16px",
                    border: `1.5px solid ${t.brd}`,
                    borderRadius: 12,
                    background: t.bg,
                    cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    background: "var(--sur)", color: t.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    border: `1.5px solid ${t.brd}`,
                  }}>
                    <Ico n={t.ico} s={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.color, marginBottom: 3 }}>
                      {t.label}
                      {t.val === "main" && hasMainPdf && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, fontWeight: 600,
                          background: "var(--sur)", color: "var(--t3)",
                          padding: "2px 8px", borderRadius: 99,
                          border: "1px solid var(--brd)",
                        }}>มีอยู่แล้ว · จะแทนที่</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--t2)", lineHeight: 1.4 }}>
                      {t.desc}
                    </div>
                  </div>
                  <Ico n="chevR" s={18} />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
})
