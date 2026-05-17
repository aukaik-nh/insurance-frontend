import { useState, useEffect } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { getStatus, baht, fmtDate, policyTypeLabel } from "../helpers"
import { PdfLightbox } from "../components/PdfLightbox"
import { PolicyForm } from "../components/PolicyForm"

export function DetailPage() {
  const navigate      = useNavigate()
  const { state }     = useLocation()
  const { id }        = useParams()

  const [p, setP]           = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchErr, setFetchErr] = useState(false)

  const [pdfFull, setPdfFull]       = useState(false)
  const [editName, setEditName]     = useState(false)
  const [name, setName]             = useState(state?.policy?.pdf_filename || "")
  const [savingName, setSavingName] = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [editVals, setEditVals]     = useState({})
  const [saving, setSaving]         = useState(false)

  const [relatedPdfs, setRelatedPdfs] = useState([])  // PDFs ของลูกค้าเดียวกัน (renewals)
  const [activePdfId, setActivePdfId] = useState(null) // id ของ record ที่กำลังดู PDF
  const [pdfListOpen, setPdfListOpen] = useState(true) // collapse/expand list

  // fetch ข้อมูลล่าสุดจาก API เสมอ
  useEffect(() => {
    if (!id) return
    setLoading(true)
    setFetchErr(false)
    api.get(`/policies/${id}`)
      .then(res => {
        setP(res.data)
        setName(res.data.pdf_filename || "")
        setActivePdfId(res.data.id)
      })
      .catch(() => setFetchErr(true))
      .finally(() => setLoading(false))
  }, [id])

  // fetch ลูกค้าเดียวกัน (search ทะเบียน) — กรองเฉพาะที่มี PDF
  useEffect(() => {
    if (!p?.license_plate) { setRelatedPdfs([]); return }
    const plate = p.license_plate.trim()
    if (!plate || plate === "OTHER" || plate === "—") { setRelatedPdfs([]); return }

    api.get("/policies", { params: { search: plate, limit: 50 } })
      .then(res => {
        const all = res.data.data || []
        const sameCustomer = all.filter(r =>
          r.license_plate?.trim() === plate &&
          (r.pdf_url || r.pdf_filename || r.pdf_size)  // มี PDF เท่านั้น
        )
        setRelatedPdfs(sameCustomer)
      })
      .catch(() => setRelatedPdfs([]))
  }, [p?.id, p?.license_plate])

  if (loading) return (
    <div className="page-wrap">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 12, padding: 40 }}>
        <div className="spin" />
        <div style={{ color: "var(--t2)" }}>กำลังโหลดข้อมูล…</div>
      </div>
    </div>
  )

  if (fetchErr || (!loading && !p)) return (
    <div className="page-wrap">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 16, padding: 40 }}>
        <Ico n="doc" s={40} sw={1} />
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--t2)" }}>
          {fetchErr ? "โหลดข้อมูลไม่สำเร็จ" : "ไม่พบข้อมูลกรมธรรม์"}
        </div>
        <button className="btn btn-w" onClick={() => navigate("/")}>
          <Ico n="chevL" s={14} /> กลับหน้าหลัก
        </button>
      </div>
    </div>
  )

  const st = getStatus(p.coverage_end)

  const saveName = async () => {
    setSavingName(true)
    try {
      await api.put(`/policies/${p.id}`, { pdf_filename: name.trim() || null })
      setP({ ...p, pdf_filename: name.trim() })
      setEditName(false)
    } catch (e) {
      alert("เปลี่ยนชื่อไฟล์ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally { setSavingName(false) }
  }

  const startEdit = () => { setEditVals({ ...p }); setEditMode(true) }
  const cancelEdit = () => setEditMode(false)

  const saveEdit = async () => {
    setSaving(true)
    try {
      await api.put(`/policies/${p.id}`, editVals)
      setP({ ...p, ...editVals })
      setEditMode(false)
    } catch (e) {
      alert("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  // ── PDF ที่กำลังแสดง (อาจเป็น p เองหรือ related) ──
  const activePolicy   = relatedPdfs.find(r => r.id === activePdfId) || p
  const pdfBase        = `${api.defaults.baseURL}/policies/${activePolicy.id}/pdf`
  const pdfViewUrl     = pdfBase
  const pdfDownloadUrl = `${pdfBase}?download=1`
  const hasPdfInDb     = !!activePolicy.pdf_filename || !!activePolicy.pdf_size
  const isLegacyPdf    = activePolicy.pdf_url && activePolicy.pdf_url.includes("drive.google.com")

  const F = ({ label, value, hi, mono }) => (
    <div className="info-field">
      <div className="info-label">{label}</div>
      <div className={`info-val${hi ? " hi" : ""}${mono ? " mono" : ""}`}>{value || "—"}</div>
    </div>
  )

  return (
    <>
      {pdfFull && (
        <PdfLightbox src={pdfViewUrl} filename={p.pdf_filename}
          sizeKB={p.pdf_size ? (p.pdf_size / 1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}

      <div className="page-wrap">
        <div className="page-hd">
          <button className="page-back" onClick={() => navigate(-1)}>
            <Ico n="chevL" s={15} /> กลับ
          </button>
          <div className="page-hd-div" />
          <div className="page-hd-info">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="page-title">{p.policy_number || "—"}</div>
              <span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span>
            </div>
            <div className="page-sub">
              {p.insured_name || ""}{p.insured_name && p.license_plate ? "  ·  " : ""}{p.license_plate || ""}
            </div>
          </div>
          <div className="page-hd-right">
            {editMode ? (
              <>
                <button className="btn btn-w" onClick={cancelEdit} disabled={saving}>
                  <Ico n="x" s={14} /> ยกเลิก
                </button>
                <button className="btn btn-b" onClick={saveEdit} disabled={saving}>
                  <Ico n="check" s={14} /> {saving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </>
            ) : (
              <>
                {hasPdfInDb && !isLegacyPdf && (
                  <>
                    <a className="btn btn-w" href={pdfViewUrl} target="_blank" rel="noreferrer">
                      <Ico n="open" s={14} /> ดู PDF
                    </a>
                    <a className="btn btn-b" href={pdfDownloadUrl}>
                      <Ico n="download" s={14} /> ดาวน์โหลด
                    </a>
                  </>
                )}
                <button className="btn btn-w" onClick={startEdit}>
                  <Ico n="pen" s={14} /> แก้ไข
                </button>
              </>
            )}
          </div>
        </div>

        <div className="page-body">
          <div className="detail-split">

            <div>
              {editMode ? (
                <div className="info-card" style={{ padding: "18px 18px 8px" }}>
                  <PolicyForm values={editVals} onChange={setEditVals} />
                </div>
              ) : (
                <>
                  {/* ข้อมูลกรมธรรม์ */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="doc" s={16} /><span className="info-card-title">ข้อมูลกรมธรรม์</span></div>
                    <div className="info-card-bd">
                      {/* เลขกรมธรรม์ — เน้นพิเศษ */}
                      <div className="info-field" style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 9, padding: "10px 14px", marginBottom: 14 }}>
                        <div className="info-label">เลขกรมธรรม์</div>
                        <div className="info-val hi" style={{ fontSize: 18, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: 0.5 }}>
                          {p.policy_number || "—"}
                        </div>
                      </div>
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <F label="รหัสบริษัท"     value={p.company_code} />
                        <F label="เลขใบคำขอ"      value={p.app_number} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <F label="ประเภทกรมธรรม์" value={policyTypeLabel(p.policy_type)} />
                        <F label="ใหม่/ต่ออายุ"   value={p.new_renew === "N" ? "ใหม่" : p.new_renew === "R" ? "ต่ออายุ" : p.new_renew} />
                      </div>
                      <div className="info-row">
                        <F label="รหัสตัวแทน"           value={p.agent_code} />
                        <F label="ชื่อตัวแทน / นายหน้า" value={p.broker_name !== p.agent_code ? p.broker_name : null} />
                      </div>
                    </div>
                  </div>

                  {/* ผู้เอาประกัน */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="person" s={16} /><span className="info-card-title">ผู้เอาประกัน</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <F label="ชื่อ-นามสกุล"  value={p.insured_name} />
                        <F label="เบอร์โทรศัพท์" value={p.phone} />
                      </div>
                      <div className="info-row fw">
                        <F label="ที่อยู่" value={p.insured_address} />
                      </div>
                    </div>
                  </div>

                  {/* รถยนต์ */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="car" s={16} /><span className="info-card-title">ข้อมูลรถยนต์</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <F label="ยี่ห้อ / รุ่น" value={[p.car_make, p.car_model].filter(Boolean).join("  ")} />
                        <F label="ปีรถ"           value={p.car_year} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <div className="info-field">
                          <div className="info-label">ทะเบียนรถ</div>
                          <div className="info-val">
                            {p.license_plate ? <span className="plate">{p.license_plate}</span> : "—"}
                          </div>
                        </div>
                        <F label="จังหวัดทะเบียน" value={p.license_province} />
                      </div>
                      <div className="info-row">
                        <F label="เลขตัวถัง"        value={p.chassis_no} mono />
                        <F label="ทุนเอาประกัน (฿)" value={p.sum_insured ? `${baht(p.sum_insured)} ฿` : null} />
                      </div>
                    </div>
                  </div>

                  {/* ระยะเวลาคุ้มครอง */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="cal" s={16} /><span className="info-card-title">ระยะเวลาคุ้มครอง</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <F label="วันเริ่มต้น" value={fmtDate(p.coverage_start)} />
                        <F label="วันสิ้นสุด"  value={fmtDate(p.coverage_end)} />
                      </div>
                      <div className="info-row">
                        <F label="วันแจ้งงาน"     value={fmtDate(p.date_notify)} />
                        <F label="วันรับกรมธรรม์" value={fmtDate(p.date_policy_receive)} />
                      </div>
                      {p.date_cancel && (
                        <div className="info-row" style={{ marginTop: 12 }}>
                          <F label="วันยกเลิก" value={fmtDate(p.date_cancel)} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* เบี้ยประกัน */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="banknote" s={16} /><span className="info-card-title">เบี้ยประกัน</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <F label="เบี้ยสุทธิ" value={p.net_premium ? `${baht(p.net_premium)} ฿` : null} />
                        <F label="อากรแสตมป์" value={p.stamp_duty  ? `${baht(p.stamp_duty)} ฿`  : null} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 12 }}>
                        <F label="ภาษีมูลค่าเพิ่ม (VAT)" value={p.vat ? `${baht(p.vat)} ฿` : null} />
                        <div className="info-field" style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 9, padding: "10px 13px" }}>
                          <div className="info-label">รวมเบี้ยประกัน</div>
                          <div className="info-val hi">{p.total_premium ? `${baht(p.total_premium)} ฿` : "—"}</div>
                        </div>
                      </div>
                      {(p.third_party_per_person || p.third_party_per_accident || p.own_damage) && (
                        <div className="info-row">
                          <F label="บุคคลภายนอก/คน"   value={p.third_party_per_person  ? `${baht(p.third_party_per_person)} ฿`  : null} />
                          <F label="บุคคลภายนอก/ครั้ง" value={p.third_party_per_accident ? `${baht(p.third_party_per_accident)} ฿` : null} />
                          <F label="ความเสียหายต่อรถ"  value={p.own_damage               ? `${baht(p.own_damage)} ฿`               : null} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* หมายเหตุ */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="doc" s={16} /><span className="info-card-title">หมายเหตุ</span></div>
                    <div className="info-card-bd">
                      {p.notes
                        ? <div className="info-val" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{p.notes}</div>
                        : <div className="info-val" style={{ color: "var(--t3)", fontStyle: "italic" }}>ไม่มีหมายเหตุ</div>
                      }
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* right: PDF */}
            <div className="detail-aside">
              {/* ── PDF tabs (เอกสารหลายปีของลูกค้าคนเดียวกัน) — collapsible ── */}
              {relatedPdfs.length > 1 && (
                <div className="info-card" style={{ marginBottom: 12 }}>
                  <div
                    className="info-card-hd"
                    onClick={() => setPdfListOpen(o => !o)}
                    style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Ico n="doc" s={16} />
                      <span className="info-card-title">
                        เอกสาร PDF ทั้งหมด ({relatedPdfs.length} ฉบับ)
                      </span>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 22, height: 22, borderRadius: 5,
                      background: "var(--sur2)",
                      transition: "transform 0.2s",
                      transform: pdfListOpen ? "rotate(180deg)" : "rotate(0deg)"
                    }}>
                      <Ico n="chevD" s={14} />
                    </div>
                  </div>
                  {pdfListOpen && (
                    <div className="info-card-bd" style={{ paddingTop: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {relatedPdfs.map(r => {
                          const isExpanded = r.id === activePdfId
                          const yearTH = r.coverage_start ? (parseInt(r.coverage_start.slice(0, 4)) + 543) : "?"
                          const itemPdfUrl = `${api.defaults.baseURL}/policies/${r.id}/pdf`
                          return (
                            <div
                              key={r.id}
                              style={{
                                border: `1.5px solid ${isExpanded ? "var(--blue)" : "var(--brd)"}`,
                                borderRadius: 8,
                                background: isExpanded ? "var(--blue-bg)" : "var(--sur)",
                                overflow: "hidden",
                                transition: "all 0.15s"
                              }}
                            >
                              {/* Header — click to toggle */}
                              <div
                                onClick={() => setActivePdfId(isExpanded ? null : r.id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  padding: "8px 10px",
                                  cursor: "pointer", userSelect: "none"
                                }}
                              >
                                <Ico n="doc" s={14} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: isExpanded ? 600 : 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {r.pdf_filename || "PDF"}
                                  </div>
                                  <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                                    {r.policy_number || "—"} · ปี {yearTH}
                                  </div>
                                </div>
                                <div style={{
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  width: 22, height: 22, borderRadius: 5,
                                  background: isExpanded ? "var(--sur)" : "var(--sur2)",
                                  transition: "transform 0.2s",
                                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                                }}>
                                  <Ico n="chevD" s={14} />
                                </div>
                              </div>

                              {/* Inline PDF preview */}
                              {isExpanded && (
                                <div style={{ background: "var(--sur)", borderTop: "1px solid var(--brd)" }}>
                                  <iframe
                                    src={itemPdfUrl}
                                    title={r.pdf_filename || "PDF"}
                                    style={{ width: "100%", height: 480, border: "none", display: "block", background: "#f5f5f5" }}
                                  />
                                  <div style={{ display: "flex", gap: 6, padding: 8, background: "var(--sur2)" }}>
                                    <a className="btn btn-w" href={itemPdfUrl} target="_blank" rel="noreferrer"
                                      style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "5px 8px" }}>
                                      <Ico n="open" s={12} /> แท็บใหม่
                                    </a>
                                    <a className="btn btn-b" href={`${itemPdfUrl}?download=1`}
                                      style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "5px 8px" }}>
                                      <Ico n="download" s={12} /> ดาวน์โหลด
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLegacyPdf ? (
                <div className="info-card" style={{ marginBottom: 0 }}>
                  <div className="info-card-bd">
                    <div className="pdf-placeholder" style={{ height: 320, padding: 20 }}>
                      <Ico n="warn" s={40} sw={1} />
                      <div className="ph-title" style={{ marginTop: 12 }}>ไฟล์ PDF ไม่พร้อมใช้งาน</div>
                      <div className="ph-hint" style={{ marginTop: 6, lineHeight: 1.6, maxWidth: 320 }}>
                        ไฟล์ถูกเก็บใน Google Drive ที่ไม่สามารถเข้าถึงได้แล้ว<br />
                        กรุณาอัปโหลดไฟล์ใหม่ผ่านเมนู "อัปโหลด PDF"
                      </div>
                      {p.pdf_filename && (
                        <div style={{ marginTop: 12, fontSize: 12, color: "var(--t3)" }}>
                          ชื่อไฟล์เดิม: <span style={{ fontWeight: 600 }}>{p.pdf_filename}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : hasPdfInDb ? (
                <div className="pdf-preview-wrap">
                  <div className="pdf-preview-bar" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Ico n="doc" s={13} />
                      {editName ? (
                        <>
                          <input value={name} onChange={e => setName(e.target.value)} autoFocus
                            placeholder="policy.pdf"
                            style={{ flex: 1, border: "1.5px solid var(--blue)", borderRadius: 7, padding: "5px 9px", fontSize: 13, fontFamily: "inherit", color: "var(--t1)", background: "var(--blue-bg)", outline: "none" }}
                          />
                          <button className="btn btn-b" onClick={saveName} disabled={savingName}
                            style={{ padding: "5px 10px", fontSize: 12 }}>
                            <Ico n="check" s={12} /> {savingName ? "..." : "บันทึก"}
                          </button>
                          <button className="btn btn-w"
                            onClick={() => { setEditName(false); setName(p.pdf_filename || "") }}
                            style={{ padding: "5px 8px", fontSize: 12 }}>
                            <Ico n="x" s={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="pdf-fname">{p.pdf_filename || "PDF"}</span>
                          {p.pdf_size && <span className="pdf-size">{(p.pdf_size / 1024).toFixed(0)} KB</span>}
                          <button className="pdf-zoom-btn" onClick={() => setEditName(true)} title="แก้ไขชื่อ">
                            <Ico n="pen" s={13} />
                          </button>
                          <button className="pdf-zoom-btn" onClick={() => setPdfFull(true)} title="เต็มจอ">
                            <Ico n="expand" s={14} />
                          </button>
                        </>
                      )}
                    </div>
                    {!editName && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <a className="btn btn-w" href={pdfViewUrl} target="_blank" rel="noreferrer"
                          style={{ flex: 1, justifyContent: "center", fontSize: 13, padding: "6px 10px" }}>
                          <Ico n="open" s={13} /> แท็บใหม่
                        </a>
                        <a className="btn btn-b" href={pdfDownloadUrl}
                          style={{ flex: 1, justifyContent: "center", fontSize: 13, padding: "6px 10px" }}>
                          <Ico n="download" s={13} /> ดาวน์โหลด
                        </a>
                      </div>
                    )}
                  </div>
                  <iframe className="pdf-iframe" src={pdfViewUrl} title="PDF Preview"
                    style={{ height: "calc(100vh - 180px)", minHeight: 700 }} />
                </div>
              ) : (
                <div className="info-card" style={{ marginBottom: 0 }}>
                  <div className="info-card-bd">
                    <div className="pdf-placeholder" style={{ height: 220 }}>
                      <Ico n="doc" s={36} sw={1} />
                      <div className="ph-title">ไม่มีไฟล์ PDF</div>
                      <div className="ph-hint">ยังไม่ได้เก็บ PDF ในฐานข้อมูล</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
