import { useState, useEffect, useRef } from "react"
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

export function AttachmentsCard({ policyId, hasMainPdf, mainFilename, onMainUpdated, onItemsChange }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUpload]  = useState(false)
  const [typePicker, setTypePicker] = useState(false)        // modal เลือกประเภท
  const [picker, setPicker]     = useState(null)             // { docType, file, label, note }
  const fileRef = useRef(null)
  const pendingType = useRef(null)

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
    // auto-detect ถ้าผู้ใช้ยังไม่ระบุประเภท (ไม่ใช้ในตอนนี้ แต่เก็บไว้)
    const finalType = docType || detectDocType(f.name) || "prb"

    if (finalType === "main") {
      // อัปโหลดกรมธรรม์หลัก: ไม่ต้องถาม label/note — ทำเลย
      uploadMain(f)
    } else {
      setPicker({
        docType: finalType, file: f,
        label: "", note: "",
        net_premium: "", stamp_duty: "", vat: "", total_premium: "",
      })
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

  // อัปโหลดเอกสารแนบ (พ.ร.บ. / สลักหลัง)
  const submitAttachment = async () => {
    if (!picker?.file) return
    setUpload(true)
    try {
      const form = new FormData()
      form.append("file", picker.file)
      form.append("doc_type", picker.docType)
      if (picker.label) form.append("label", picker.label)
      if (picker.note)  form.append("note",  picker.note)
      // เบี้ย (ใส่เฉพาะที่กรอก)
      if (picker.net_premium   !== "") form.append("net_premium",   String(picker.net_premium))
      if (picker.stamp_duty    !== "") form.append("stamp_duty",    String(picker.stamp_duty))
      if (picker.vat           !== "") form.append("vat",           String(picker.vat))
      if (picker.total_premium !== "") form.append("total_premium", String(picker.total_premium))
      await api.post(`/policies/${policyId}/attachments`, form)
      setPicker(null)
      await load()
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
      <div className="info-card-hd">
        <Ico n="doc" s={20} />
        <span className="info-card-title">เอกสารแนบ</span>
        <button
          className="btn btn-b"
          onClick={() => setTypePicker(true)}
          disabled={uploading}
          style={{ marginLeft: "auto", padding: "8px 16px", fontSize: 14 }}
        >
          {uploading
            ? <><div className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> กำลังอัปโหลด…</>
            : <><Ico n="upload" s={16} /> เพิ่มเอกสาร</>}
        </button>
      </div>

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

      {/* hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={e => onFilePicked(e.target.files?.[0])}
      />

      {/* Modal A: เลือกประเภทเอกสาร */}
      {typePicker && (
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
        </div>
      )}

      {/* Modal B: ใส่ label/note ก่อนอัปโหลด (เฉพาะ prb/endorsement) */}
      {picker?.file && (
        <div className="ov" onClick={e => e.target === e.currentTarget && setPicker(null)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-hd">
              <div>
                <div className="modal-title">{typeMeta(picker.docType).label}</div>
                <div className="modal-sub">{picker.file.name} · {fmtKB(picker.file.size)}</div>
              </div>
              <button className="xbtn" onClick={() => setPicker(null)} disabled={uploading}>
                <Ico n="x" s={18} />
              </button>
            </div>
            <div className="modal-bd" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="fi">
                <label>ป้ายกำกับ (ไม่บังคับ)</label>
                <input
                  value={picker.label}
                  onChange={e => setPicker(p => ({ ...p, label: e.target.value }))}
                  placeholder={
                    picker.docType === "prb"         ? "เช่น พ.ร.บ. ปี 2569"
                    : picker.docType === "endorsement" ? "เช่น เปลี่ยนชื่อผู้ขับ"
                    : "ระบุชื่อเอกสาร"
                  }
                  autoFocus
                />
              </div>
              <div className="fi">
                <label>หมายเหตุ (ไม่บังคับ)</label>
                <input
                  value={picker.note}
                  onChange={e => setPicker(p => ({ ...p, note: e.target.value }))}
                  placeholder="รายละเอียดเพิ่มเติม"
                />
              </div>

              {/* เบี้ย — แสดงเฉพาะ พ.ร.บ. */}
              {picker.docType === "prb" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: -4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", letterSpacing: ".2px" }}>
                      เบี้ย พ.ร.บ.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const calc = calcPrbPremium(picker.net_premium)
                        setPicker(p => ({ ...p, ...calc }))
                      }}
                      style={{
                        background: "var(--blue-bg)", border: "1.5px solid var(--blue-mid)",
                        color: "var(--blue)", borderRadius: 8, padding: "5px 12px",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      title="คำนวณ อากร/VAT/รวม จากเบี้ยสุทธิ"
                    >
                      <Ico n="bolt" s={13} /> คำนวณอัตโนมัติ
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { k: "net_premium",   l: "เบี้ยสุทธิ" },
                      { k: "stamp_duty",    l: "อากร" },
                      { k: "vat",           l: "ภาษี (VAT 7%)" },
                      { k: "total_premium", l: "รวม", hi: true },
                    ].map(f => (
                      <div key={f.k} className="fi">
                        <label>{f.l}</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={picker[f.k] ?? ""}
                          onChange={e => {
                            const v = e.target.value
                            setPicker(p => {
                              // auto-calc total = net + stamp + vat ทุกครั้งที่แก้ field ใดๆ
                              if (f.k === "net_premium") {
                                // เปลี่ยนเบี้ยสุทธิ → คำนวณ stamp/vat/total อัตโนมัติ
                                const calc = calcPrbPremium(v)
                                return { ...p, net_premium: v, ...calc }
                              }
                              const next = { ...p, [f.k]: v }
                              if (f.k !== "total_premium") {
                                next.total_premium = calcTotal(next.net_premium, next.stamp_duty, next.vat)
                              }
                              return next
                            })
                          }}
                          placeholder="0.00"
                          style={{
                            textAlign: "right",
                            fontFamily: "'SF Mono','Fira Code',Consolas,monospace",
                            ...(f.hi ? { background: "var(--blue-bg)", color: "var(--blue)", fontWeight: 700 } : {}),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="btn btn-w" onClick={() => setPicker(null)} disabled={uploading}>
                  ยกเลิก
                </button>
                <button className="btn btn-b" onClick={submitAttachment} disabled={uploading}>
                  {uploading
                    ? <><div className="spin" style={{ width: 16, height: 16, borderWidth: 2 }} /> กำลังบันทึก…</>
                    : <><Ico n="check" s={17} /> บันทึก</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
