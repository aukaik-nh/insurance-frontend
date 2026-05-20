import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { getStatus, baht, fmtDate, policyTypeLabel } from "../helpers"
import { PdfLightbox } from "../components/PdfLightbox"
import { PolicyForm } from "../components/PolicyForm"
import { AttachmentsCard } from "../components/AttachmentsCard"
import { usePdfBlob, downloadPdf, openPdfTab } from "../pdfUtils"

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
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [refreshKey, setRefreshKey]     = useState(0)
  const fileInputRef = useRef(null)

  const [deleteModal, setDeleteModal] = useState(false)  // confirm ลบ record
  const [deleting, setDeleting]       = useState(false)

  // เอกสารแนบ (พ.ร.บ. / สลักหลัง) + tab ที่กำลังดู
  const [attachItems, setAttachItems] = useState([])
  const [activeDocId, setActiveDocId] = useState("main")

  // fetch ข้อมูลล่าสุดจาก API เสมอ — re-trigger ได้ด้วย refreshKey
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
  }, [id, refreshKey])

  // reset doc tab เมื่อสลับ related policy
  useEffect(() => { setActiveDocId("main") }, [activePdfId])

  // fetch ลูกค้าเดียวกัน (search ทะเบียน) — กรองเฉพาะที่มี PDF
  // re-fetch เมื่อ refreshKey เปลี่ยน (หลัง upload/delete)
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
  }, [p?.id, p?.license_plate, p?.pdf_url, refreshKey])

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
        <Ico n="doc" s={48} sw={1} />
        <div style={{ fontSize: 19, fontWeight: 600, color: "var(--t2)" }}>
          {fetchErr ? "โหลดข้อมูลไม่สำเร็จ" : "ไม่พบข้อมูลกรมธรรม์"}
        </div>
        <button className="btn btn-w" onClick={() => navigate("/")}>
          <Ico n="chevL" s={18} /> กลับหน้าหลัก
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

  // ── ลบข้อมูลกรมธรรม์ทั้ง record ──
  const deletePolicy = () => setDeleteModal(true)
  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/policies/${p.id}`)
      navigate("/")
    } catch (e) {
      alert("ลบไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
      setDeleting(false)
      setDeleteModal(false)
    }
  }

  // ── ลบ PDF (clear pdf_url + Storage) ──
  const deletePdf = async () => {
    if (!confirm(`ลบไฟล์ "${activePolicy.pdf_filename || 'PDF'}" ?\n\n(เก็บข้อมูลกรมธรรม์ไว้ แค่ลบไฟล์ PDF ออก)`)) return
    try {
      await api.delete(`/policies/${activePolicy.id}/pdf`)
      // Force refresh ทั้ง flow
      setRefreshKey(k => k + 1)
    } catch (e) {
      alert("ลบไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    }
  }

  // ── อัปโหลด PDF ใส่ record ปัจจุบัน ──
  const uploadPdf = async (file) => {
    if (!file) return
    if (!(file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf"))) {
      alert("กรุณาเลือกไฟล์ PDF เท่านั้น")
      return
    }
    if (p?.pdf_filename && !confirm(`แทนที่ไฟล์ "${p.pdf_filename}" ด้วย "${file.name}" ?`)) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    setUploadingPdf(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const uploadRes = await api.post("/upload-pdf-only", form)
      const { pdf_url, pdf_filename, pdf_size } = uploadRes.data

      await api.put(`/policies/${p.id}`, { pdf_url, pdf_filename, pdf_size })

      // Force ทุก useEffect re-run → fetch ใหม่หมด, activePdfId reset เป็น current
      setRefreshKey(k => k + 1)
    } catch (e) {
      alert("อัปโหลดไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally {
      setUploadingPdf(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── PDF ที่กำลังแสดง (อาจเป็น p เองหรือ related) ──
  const activePolicy   = relatedPdfs.find(r => r.id === activePdfId) || p
  const pdfBase        = `${api.defaults.baseURL}/policies/${activePolicy.id}/pdf`
  const pdfViewUrl     = pdfBase
  const pdfDownloadUrl = `${pdfBase}?download=1`
  const hasPdfInDb     = !!activePolicy.pdf_filename || !!activePolicy.pdf_size
  const isLegacyPdf    = activePolicy.pdf_url && activePolicy.pdf_url.includes("drive.google.com")

  // ── doc-tab helpers ──
  const DOC_TAB_META = {
    main:        { color: "var(--blue)",  bg: "var(--blue-bg)",  brd: "var(--blue-mid)", ico: "doc",    label: "กรมธรรม์" },
    prb:         { color: "var(--green)", bg: "var(--green-bg)", brd: "var(--green-brd)",ico: "shield",  label: "พ.ร.บ." },
    endorsement: { color: "#D97706",      bg: "var(--amber-bg)", brd: "var(--amber-brd)",ico: "pen",    label: "สลักหลัง" },
  }
  const viewingRelated = activePdfId !== p?.id
  const docTabs = [
    ...(hasPdfInDb && !viewingRelated ? [{ id: "main", label: "กรมธรรม์", type: "main" }] : []),
    ...(!viewingRelated ? attachItems.map(att => ({
      id: att.id,
      label: att.label || DOC_TAB_META[att.doc_type]?.label || "เอกสาร",
      type: att.doc_type,
    })) : []),
  ]
  const getDocUrl = (docId) => {
    if (!docId || docId === "main") return pdfBase
    return `${api.defaults.baseURL}/policies/${p.id}/attachments/${docId}/pdf`
  }
  const currentDocUrl      = viewingRelated ? pdfViewUrl : getDocUrl(activeDocId)
  const currentDocDlUrl    = `${currentDocUrl}?download=1`
  const showDocTabs        = !viewingRelated && docTabs.length > 1

  // hasActiveDoc = มีเอกสารที่ต้องโหลด
  //   • ดู tab กรมธรรม์หลัก → ต้องมี PDF หลักอยู่
  //   • ดู tab เอกสารแนบ (prb/endorsement) → โหลดเสมอ
  //   • ดู related policy → ใช้ hasPdfInDb ของ activePolicy
  const hasActiveDoc = viewingRelated ? hasPdfInDb : (activeDocId !== "main" || hasPdfInDb)

  // Blob URL สำหรับ iframe (iframe ส่ง auth header ไม่ได้)
  const { blobUrl: pdfBlobUrl, loading: pdfBlobLoading } = usePdfBlob(
    hasActiveDoc && !isLegacyPdf ? currentDocUrl : null
  )

  const F = ({ label, value, hi, mono }) => (
    <div className="info-field">
      <div className="info-label">{label}</div>
      <div className={`info-val${hi ? " hi" : ""}${mono ? " mono" : ""}`}>{value || "—"}</div>
    </div>
  )

  return (
    <>
      {pdfFull && (
        <PdfLightbox src={pdfBlobUrl} filename={p.pdf_filename}
          sizeKB={p.pdf_size ? (p.pdf_size / 1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}

      {/* ── Modal ยืนยันลบกรมธรรม์ ── */}
      {deleteModal && (
        <div className="ov" onClick={e => !deleting && e.target === e.currentTarget && setDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            {/* icon วงกลมแดง */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--red-bg)", border: "2px solid var(--red-brd)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Ico n="trash" s={28} />
              </div>
            </div>
            <div className="modal-hd" style={{ flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6, paddingBottom: 0 }}>
              <div className="modal-title" style={{ fontSize: 20 }}>ลบกรมธรรม์นี้?</div>
              <div className="modal-sub" style={{ fontSize: 15, lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: "var(--t1)" }}>
                  {p.policy_number || "—"}
                </span>
                {p.insured_name && (
                  <> · {p.insured_name}</>
                )}
              </div>
            </div>
            <div className="modal-bd" style={{ paddingTop: 12 }}>
              <div style={{
                padding: "12px 16px", borderRadius: 10,
                background: "var(--red-bg)", border: "1px solid var(--red-brd)",
                fontSize: 14, color: "var(--red)", lineHeight: 1.6, marginBottom: 20,
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <Ico n="warn" s={18} />
                <span>ข้อมูลและไฟล์ PDF ทั้งหมดจะถูกลบถาวร<br />ไม่สามารถกู้คืนได้</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-w"
                  onClick={() => setDeleteModal(false)}
                  disabled={deleting}
                  style={{ flex: 1, justifyContent: "center", fontSize: 16, padding: "12px" }}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn"
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, justifyContent: "center", fontSize: 16, padding: "12px",
                    background: "var(--red)", borderColor: "var(--red)", color: "#fff",
                  }}
                >
                  {deleting
                    ? <><div className="spin" style={{ width: 17, height: 17, borderWidth: 2, borderColor: "#fff3", borderTopColor: "#fff" }} /> กำลังลบ…</>
                    : <><Ico n="trash" s={17} /> ลบถาวร</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-wrap">
        <div className="page-hd">
          <button className="page-back" onClick={() => navigate(-1)}>
            <Ico n="chevL" s={19} /> กลับ
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
                  <Ico n="x" s={18} /> ยกเลิก
                </button>
                <button className="btn btn-b" onClick={saveEdit} disabled={saving}>
                  <Ico n="check" s={18} /> {saving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-w" onClick={deletePolicy}
                  style={{ color: "var(--red)", borderColor: "var(--red-brd)", background: "var(--red-bg)" }}>
                  <Ico n="trash" s={18} /> ลบข้อมูล
                </button>
                <button className="btn btn-b" onClick={startEdit}>
                  <Ico n="pen" s={18} /> แก้ไข
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
                    <div className="info-card-hd"><Ico n="doc" s={20} /><span className="info-card-title">ข้อมูลกรมธรรม์</span></div>
                    <div className="info-card-bd">
                      {/* เลขกรมธรรม์ — เน้นพิเศษ */}
                      <div className="info-field" style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
                        <div className="info-label">เลขกรมธรรม์</div>
                        <div className="info-val hi" style={{ fontSize: 26, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: 0.5 }}>
                          {p.policy_number || "—"}
                        </div>
                      </div>
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="รหัสบริษัท"     value={p.company_code} />
                        <F label="เลขใบคำขอ"      value={p.app_number} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 18 }}>
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
                    <div className="info-card-hd"><Ico n="person" s={20} /><span className="info-card-title">ผู้เอาประกัน</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 18 }}>
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
                    <div className="info-card-hd"><Ico n="car" s={20} /><span className="info-card-title">ข้อมูลรถยนต์</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="ยี่ห้อ / รุ่น" value={[p.car_make, p.car_model].filter(Boolean).join("  ")} />
                        <F label="ปีรถ"           value={p.car_year} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 18 }}>
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
                    <div className="info-card-hd"><Ico n="cal" s={20} /><span className="info-card-title">ระยะเวลาคุ้มครอง</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 18 }}>
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
                    <div className="info-card-hd"><Ico n="banknote" s={20} /><span className="info-card-title">เบี้ยประกัน</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="เบี้ยสุทธิ" value={p.net_premium ? `${baht(p.net_premium)} ฿` : null} />
                        <F label="อากรแสตมป์" value={p.stamp_duty  ? `${baht(p.stamp_duty)} ฿`  : null} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="ภาษีมูลค่าเพิ่ม (VAT)" value={p.vat ? `${baht(p.vat)} ฿` : null} />
                        <div className="info-field" style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 10, padding: "14px 16px" }}>
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
                      {(p.prepaid_tax_1pct != null || p.commission_pct != null || p.commission_baht != null
                        || p.wht_10pct != null || p.rounding != null || p.collected_amount != null) && (
                        <div className="info-row" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--brd)" }}>
                          <F label="1% (ภาษีล่วงหน้า)"        value={p.prepaid_tax_1pct  != null ? `${baht(p.prepaid_tax_1pct)} ฿` : null} />
                          <F label="ค่าคอม %"                value={p.commission_pct    != null ? `${p.commission_pct}%`         : null} />
                          <F label="ค่าคอม (บาท)"            value={p.commission_baht   != null ? `${baht(p.commission_baht)} ฿` : null} />
                          <F label="ภาษี 10% (หัก ณ ที่จ่าย)" value={p.wht_10pct         != null ? `${baht(p.wht_10pct)} ฿`       : null} />
                          <F label="ปัดเศษ"                   value={p.rounding          != null ? `${baht(p.rounding)} ฿`        : null} />
                          <F label="เรียกเก็บ"  hi            value={p.collected_amount  != null ? `${baht(p.collected_amount)} ฿`: null} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* หมายเหตุ */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="doc" s={20} /><span className="info-card-title">หมายเหตุ</span></div>
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

            {/* right: PDF + Attachments */}
            <div className="detail-aside">
              {/* เอกสารแนบ — บนสุดของฝั่งขวา (ฝั่งเดียวกับ PDF) */}
              <div style={{ marginBottom: 18 }}>
                <AttachmentsCard
                  policyId={p.id}
                  hasMainPdf={hasPdfInDb}
                  mainFilename={p.pdf_filename}
                  onMainUpdated={() => setRefreshKey(k => k + 1)}
                  onItemsChange={setAttachItems}
                />
              </div>

              {/* ── PDF tabs (เอกสารหลายปีของลูกค้าคนเดียวกัน) — collapsible ── */}
              {relatedPdfs.length > 1 && (
                <div className="info-card" style={{ marginBottom: 18 }}>
                  <div
                    className="info-card-hd"
                    onClick={() => setPdfListOpen(o => !o)}
                    style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Ico n="doc" s={20} />
                      <span className="info-card-title">
                        เอกสาร PDF ทั้งหมด ({relatedPdfs.length} ฉบับ)
                      </span>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 7,
                      background: "var(--sur2)",
                      transition: "transform 0.2s",
                      transform: pdfListOpen ? "rotate(180deg)" : "rotate(0deg)"
                    }}>
                      <Ico n="chevD" s={18} />
                    </div>
                  </div>
                  {pdfListOpen && (
                    <div className="info-card-bd" style={{ paddingTop: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {relatedPdfs.map(r => {
                          const isActive = r.id === activePdfId
                          const yearTH = r.coverage_start ? (parseInt(r.coverage_start.slice(0, 4)) + 543) : "?"
                          return (
                            <button
                              key={r.id}
                              onClick={() => setActivePdfId(r.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "12px 14px",
                                border: `1.5px solid ${isActive ? "var(--blue)" : "var(--brd)"}`,
                                borderRadius: 10,
                                background: isActive ? "var(--blue-bg)" : "var(--sur)",
                                cursor: "pointer", textAlign: "left",
                                transition: "all 0.15s"
                              }}
                            >
                              <Ico n="doc" s={18} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 16, fontWeight: isActive ? 600 : 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {r.pdf_filename || "PDF"}
                                </div>
                                <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 4 }}>
                                  {r.policy_number || "—"} · ปี {yearTH}
                                </div>
                              </div>
                              {isActive && (
                                <span style={{ fontSize: 13, color: "var(--blue)", fontWeight: 700 }}>กำลังดู</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── doc-type tab bar (กรมธรรม์ / พ.ร.บ. / สลักหลัง) ── */}
              {showDocTabs && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {docTabs.map(tab => {
                    const isActive = tab.id === activeDocId
                    const c = DOC_TAB_META[tab.type] || DOC_TAB_META.main
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveDocId(tab.id)}
                        style={{
                          padding: "9px 16px",
                          border: `1.5px solid ${isActive ? c.color : "var(--brd)"}`,
                          borderRadius: 99,
                          background: isActive ? c.bg : "var(--sur)",
                          color: isActive ? c.color : "var(--t2)",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 7,
                          transition: "all .15s",
                          boxShadow: isActive ? `0 0 0 3px ${c.bg}` : "none",
                        }}
                      >
                        <Ico n={c.ico} s={15} />
                        {tab.label}
                        {isActive && (
                          <span style={{
                            display: "inline-flex", width: 8, height: 8,
                            borderRadius: "50%", background: c.color,
                            marginLeft: 2,
                          }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* isLegacyPdf ใช้กับ tab หลัก / related เท่านั้น — ถ้าเป็น attachment ให้ข้ามไป */}
              {(isLegacyPdf && activeDocId === "main") ? (
                <div className="info-card" style={{ marginBottom: 0 }}>
                  <div className="info-card-bd">
                    <div className="pdf-placeholder" style={{ height: 360, padding: 24 }}>
                      <Ico n="warn" s={48} sw={1} />
                      <div className="ph-title" style={{ marginTop: 14, fontSize: 17 }}>ไฟล์ PDF ไม่พร้อมใช้งาน</div>
                      <div className="ph-hint" style={{ marginTop: 8, lineHeight: 1.6, maxWidth: 380, fontSize: 15 }}>
                        ไฟล์ถูกเก็บใน Google Drive ที่ไม่สามารถเข้าถึงได้แล้ว<br />
                        กรุณาอัปโหลดไฟล์ใหม่ผ่านเมนู "อัปโหลด PDF"
                      </div>
                      {p.pdf_filename && (
                        <div style={{ marginTop: 14, fontSize: 14, color: "var(--t3)" }}>
                          ชื่อไฟล์เดิม: <span style={{ fontWeight: 600 }}>{p.pdf_filename}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : hasActiveDoc ? (
                <div
                  className="pdf-preview-wrap"
                  onDragOver={e => { e.preventDefault() }}
                  onDrop={e => { e.preventDefault(); uploadPdf(e.dataTransfer.files[0]) }}
                >
                  <div className="pdf-preview-bar">
                    <Ico n="doc" s={17} />
                    {editName ? (
                      <>
                        <input value={name} onChange={e => setName(e.target.value)} autoFocus
                          placeholder="policy.pdf"
                          style={{ flex: 1, border: "1.5px solid var(--blue)", borderRadius: 9, padding: "7px 12px", fontSize: 15, fontFamily: "inherit", color: "var(--t1)", background: "var(--blue-bg)", outline: "none" }}
                        />
                        <button className="btn btn-b" onClick={saveName} disabled={savingName}
                          style={{ padding: "7px 13px", fontSize: 14 }}>
                          <Ico n="check" s={16} /> {savingName ? "..." : "บันทึก"}
                        </button>
                        <button className="btn btn-w"
                          onClick={() => { setEditName(false); setName(p.pdf_filename || "") }}
                          style={{ padding: "7px 10px", fontSize: 14 }}>
                          <Ico n="x" s={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="pdf-fname">{activePolicy.pdf_filename || "PDF"}</span>
                        {activePolicy.pdf_size && (
                          <span className="pdf-size">{(activePolicy.pdf_size / 1024).toFixed(0)} KB</span>
                        )}
                        {/* ── action buttons ── */}
                        <button className="pdf-zoom-btn" onClick={() => setEditName(true)} title="แก้ไขชื่อ">
                          <Ico n="pen" s={17} />
                        </button>
                        <button className="pdf-zoom-btn" onClick={() => setPdfFull(true)} title="เต็มจอ"
                          disabled={!pdfBlobUrl}>
                          <Ico n="expand" s={17} />
                        </button>
                        <button className="pdf-zoom-btn" onClick={() => openPdfTab(currentDocUrl)} title="เปิดแท็บใหม่">
                          <Ico n="open" s={17} />
                        </button>
                        <button className="pdf-zoom-btn" onClick={() => downloadPdf(currentDocDlUrl, activePolicy.pdf_filename || "policy.pdf")} title="ดาวน์โหลด">
                          <Ico n="download" s={17} />
                        </button>
                        <button className="pdf-zoom-btn" onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPdf} title="เปลี่ยนไฟล์ PDF">
                          {uploadingPdf
                            ? <div className="spin" style={{ width: 15, height: 15, borderWidth: 2 }} />
                            : <Ico n="upload" s={17} />}
                        </button>
                        <button className="pdf-zoom-btn" onClick={deletePdf} title="ลบไฟล์ PDF"
                          style={{ color: "var(--red)", borderColor: "var(--red-brd)", background: "var(--red-bg)" }}>
                          <Ico n="trash" s={17} />
                        </button>
                      </>
                    )}
                  </div>
                  {pdfBlobLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, height: "calc(100vh - 180px)", minHeight: 700, background: "var(--sur2)" }}>
                      <div className="spin" style={{ width: 32, height: 32, borderWidth: 3 }} />
                      <div style={{ fontSize: 15, color: "var(--t3)" }}>กำลังโหลด PDF…</div>
                    </div>
                  ) : pdfBlobUrl ? (
                    <iframe
                      key={`${activePolicy.id}-${activeDocId}-${activePolicy.pdf_filename || ""}`}
                      className="pdf-iframe"
                      src={pdfBlobUrl}
                      title="PDF Preview"
                      style={{ height: "calc(100vh - 180px)", minHeight: 700 }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, height: "calc(100vh - 180px)", minHeight: 700, background: "var(--sur2)", color: "var(--t3)" }}>
                      <Ico n="warn" s={40} sw={1} />
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--t2)" }}>โหลด PDF ไม่สำเร็จ</div>
                      <button className="btn btn-w" style={{ fontSize: 14, padding: "9px 18px" }}
                        onClick={() => openPdfTab(currentDocUrl)}>
                        <Ico n="open" s={16} /> เปิดในแท็บใหม่แทน
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault() }}
                  onDrop={e => { e.preventDefault(); uploadPdf(e.dataTransfer.files[0]) }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                    padding: "44px 24px",
                    border: "2px dashed var(--brd2)",
                    borderRadius: 14,
                    background: "var(--sur2)",
                    textAlign: "center",
                  }}
                >
                  {uploadingPdf ? (
                    <>
                      <div className="spin" style={{ width: 36, height: 36 }} />
                      <div style={{ fontSize: 17, fontWeight: 600, color: "var(--t1)" }}>กำลังอัปโหลด…</div>
                      <div style={{ fontSize: 14, color: "var(--t3)" }}>กรุณารอสักครู่</div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 72, height: 72, borderRadius: 18, background: "var(--blue-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ico n="upload" s={34} sw={1.5} />
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>ยังไม่มีไฟล์ PDF</div>
                        <div style={{ fontSize: 15, color: "var(--t3)" }}>ลากไฟล์ PDF มาวางที่นี่ หรือคลิกปุ่มเพื่อเลือกไฟล์</div>
                      </div>
                      <button
                        className="btn btn-b"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize: 16, padding: "12px 24px", flexShrink: 0 }}
                      >
                        <Ico n="upload" s={18} /> เลือกไฟล์ PDF
                      </button>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={e => uploadPdf(e.target.files?.[0])}
              />
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
