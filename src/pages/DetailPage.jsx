import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { getStatus, baht, fmtDate, policyTypeLabel } from "../helpers"
import { PdfLightbox } from "../components/PdfLightbox"
import { PolicyForm } from "../components/PolicyForm"
import { AttachmentsCard } from "../components/AttachmentsCard"
import { PremiumGrid } from "../components/PremiumGrid"
import { usePdfBlob, downloadPdf, openPdfTab, getPdfUrl } from "../pdfUtils"

// คำนวณอากร/VAT/รวม จากเบี้ยสุทธิ — สูตรเดียวกับ PolicyForm
// stamp = ceil(net*0.004),  vat = (net+stamp)*0.07,  total = net+stamp+vat
function calcPremium(net) {
  const n = parseFloat(String(net).replace(",", "")) || 0
  const stamp = Math.ceil(n * 0.004)
  const vat   = Math.round((n + stamp) * 0.07 * 100) / 100
  const total = Math.round((n + stamp + vat) * 100) / 100
  return { stamp_duty: stamp, vat, total_premium: total }
}

export function DetailPage() {
  const navigate      = useNavigate()
  const { state }     = useLocation()
  const { id }        = useParams()

  // ⚡ instant render: ถ้ามีข้อมูลจาก list (navigate state) ใช้ทันที — ไม่ต้องรอ API
  //    ยังคง fetch ข้อมูลล่าสุดในเบื้องหลังเพื่อ refresh
  const initialP = state?.policy && state.policy.id === id ? state.policy : null

  const [p, setP]           = useState(initialP)
  const [loading, setLoading] = useState(!initialP)
  const [fetchErr, setFetchErr] = useState(false)

  const [pdfFull, setPdfFull]       = useState(false)
  const [editName, setEditName]     = useState(false)
  const [name, setName]             = useState(initialP?.pdf_filename || "")
  const [savingName, setSavingName] = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [editVals, setEditVals]     = useState({})
  const [editPrb,  setEditPrb]      = useState(null)   // PRB attachment edits (null = no PRB to edit)
  const [saving, setSaving]         = useState(false)

  const [relatedPdfs, setRelatedPdfs] = useState([])  // PDFs ของลูกค้าเดียวกัน (renewals)
  const [activePdfId, setActivePdfId] = useState(initialP?.id || null) // id ของ record ที่กำลังดู PDF
  const [pdfListOpen, setPdfListOpen] = useState(true) // collapse/expand list
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [refreshKey, setRefreshKey]     = useState(0)
  const fileInputRef = useRef(null)
  const attachRef = useRef(null)   // ref ไป AttachmentsCard เพื่อ trigger เปิด modal จากปุ่มบน header

  const [deleteModal, setDeleteModal] = useState(false)  // confirm ลบ record
  const [deleting, setDeleting]       = useState(false)

  // 🔎 Quick-search modal — ค้นหาข้ามทั้งระบบจากหน้า detail (กัน user ต้องกลับไปหน้า list)
  const [searchOpen, setSearchOpen]       = useState(false)
  const [searchQuery, setSearchQuery]     = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchInputRef = useRef(null)

  // เอกสารแนบ (พ.ร.บ. / สลักหลัง) + tab ที่กำลังดู
  const [attachItems, setAttachItems] = useState([])
  const [activeDocId, setActiveDocId] = useState("main")

  // fetch ข้อมูลล่าสุดจาก API — refresh data ในเบื้องหลัง
  useEffect(() => {
    if (!id) return
    let cancelled = false
    // ถ้าไม่มี cache → แสดง spinner; ถ้ามี cache → fetch เงียบๆ ไม่บัง UI
    if (!initialP) setLoading(true)
    setFetchErr(false)
    api.get(`/policies/${id}`)
      .then(res => {
        if (cancelled) return
        setP(res.data)
        setName(res.data.pdf_filename || "")
        // ตั้ง activePdfId เป็น id ของ policy ที่เพิ่ง fetch — เว้นแต่ผู้ใช้กำลังดู PDF related ของ policy นี้อยู่
        setActivePdfId(prev => (prev && prev !== res.data.id ? prev : res.data.id))
      })
      .catch(() => { if (!cancelled && !initialP) setFetchErr(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, refreshKey])

  // เมื่อเปลี่ยน policy id (เช่น navigate จาก /policies/A → /policies/B) → reset activePdfId
  useEffect(() => {
    if (initialP?.id === id) setActivePdfId(id)
    else setActivePdfId(null)  // จะถูกตั้งใหม่หลัง fetch เสร็จ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // reset doc tab เมื่อสลับ related policy
  useEffect(() => { setActiveDocId("main") }, [activePdfId])

  // fetch กรมธรรม์ทั้งหมดของลูกค้าคนเดียวกัน — ใช้ "ชื่อ" เป็น key (สอดคล้องกับ list dedup)
  // ครอบคลุมทั้งปีเก่า / หลายคันรถ / ทุก policy ของคนคนนี้
  // ⚡ defer 250ms — ให้หน้าหลัก render เสร็จก่อน ค่อยโหลดข้อมูล related (ไม่ critical)
  useEffect(() => {
    const name = (p?.insured_name || "").trim()
    if (!name) { setRelatedPdfs([]); return }

    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      // limit 500 เผื่อลูกค้านิติบุคคลที่มีหลายสิบฉบับ
      api.get("/policies", { params: { search: name, limit: 500 } })
        .then(res => {
          if (cancelled) return
          const all = res.data.data || []
          const nameLower = name.toLowerCase()
          const sameCustomer = all.filter(r => {
            if (!(r.pdf_url || r.pdf_filename || r.pdf_size)) return false  // มี PDF เท่านั้น
            return (r.insured_name || "").trim().toLowerCase() === nameLower
          })
          setRelatedPdfs(sameCustomer)
        })
        .catch(() => { if (!cancelled) setRelatedPdfs([]) })
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [p?.id, p?.insured_name, p?.pdf_url, refreshKey])

  // ── Ctrl+K / Cmd+K → เปิด quick-search · Esc → ปิด ──
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [searchOpen])

  // เปิด modal → focus input
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50)
    else { setSearchQuery(""); setSearchResults([]) }  // เคลียร์ตอนปิด
  }, [searchOpen])

  // debounced search — ยิง API หลังหยุดพิมพ์ 150ms (snappy แต่ไม่ flood)
  // เริ่มกรองตั้งแต่ตัวแรก (length >= 1)
  useEffect(() => {
    if (!searchOpen) return
    const q = searchQuery.trim()
    if (q.length < 1) { setSearchResults([]); return }
    let cancelled = false
    setSearchLoading(true)
    const t = setTimeout(() => {
      api.get("/policies", { params: { search: q, limit: 30, sort: "coverage_end", order: "desc" } })
        .then(res => {
          if (cancelled) return
          setSearchResults(res.data?.data || [])
        })
        .catch(() => { if (!cancelled) setSearchResults([]) })
        .finally(() => { if (!cancelled) setSearchLoading(false) })
    }, 150)
    return () => { cancelled = true; clearTimeout(t) }
  }, [searchQuery, searchOpen])

  // ⚠️ usePdfBlob ต้องถูกเรียก *ก่อน* early return — Rules of Hooks
  // คำนวณ input แบบ null-safe (รองรับช่วง p ยังไม่โหลด)
  const _activePolicy   = relatedPdfs.find(r => r.id === activePdfId) || p
  const _hasPdfInDb     = !!_activePolicy?.pdf_filename || !!_activePolicy?.pdf_size
  const _isLegacyPdf    = !!(_activePolicy?.pdf_url && _activePolicy.pdf_url.includes("drive.google.com"))
  const _viewingRelated = !!p && activePdfId !== p.id
  // ⚡ getPdfUrl → ใช้ Supabase public URL ตรงถ้ามี (เร็วกว่าผ่าน Render free tier)
  const _blobApiUrl     = !p ? null
    : _viewingRelated && _activePolicy?.id
        ? getPdfUrl(_activePolicy, api.defaults.baseURL)
    : activeDocId === "main"
        ? getPdfUrl(p, api.defaults.baseURL)
    : activeDocId
        ? `${api.defaults.baseURL}/policies/${p.id}/attachments/${activeDocId}/pdf`
    : null
  const _hasActiveDoc = !p ? false
    : _viewingRelated ? _hasPdfInDb
    : (activeDocId !== "main" || _hasPdfInDb)

  const { blobUrl: pdfBlobUrl, loading: pdfBlobLoading } = usePdfBlob(
    _hasActiveDoc && !_isLegacyPdf ? _blobApiUrl : null
  )

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

  const st = getStatus(p.coverage_end, p.coverage_start)

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

  const startEdit = () => {
    setEditVals({ ...p })
    const prbAtt = attachItems.find(a => a.doc_type === "prb")
    setEditPrb(prbAtt ? {
      id: prbAtt.id,
      net_premium:   prbAtt.net_premium,
      stamp_duty:    prbAtt.stamp_duty,
      vat:           prbAtt.vat,
      total_premium: prbAtt.total_premium,
    } : null)
    setEditMode(true)
  }
  const cancelEdit = () => { setEditPrb(null); setEditMode(false) }

  const saveEdit = async () => {
    setSaving(true)
    try {
      // 1) save policy main fields
      await api.put(`/policies/${p.id}`, editVals)
      // 2) save PRB attachment (if exists + changed)
      if (editPrb?.id) {
        await api.put(`/policies/${p.id}/attachments/${editPrb.id}`, {
          net_premium:   editPrb.net_premium,
          stamp_duty:    editPrb.stamp_duty,
          vat:           editPrb.vat,
          total_premium: editPrb.total_premium,
        })
      }
      setP({ ...p, ...editVals })
      setRefreshKey(k => k + 1)   // refetch attachments so PRB updates show
      setEditMode(false)
      setEditPrb(null)
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

  // hasActiveDoc = มีเอกสารที่ต้องโหลด (อ้างอิงตัวที่คำนวณไว้ก่อน early return)
  const hasActiveDoc = _hasActiveDoc

  // pdfBlobUrl / pdfBlobLoading ถูกคำนวณไว้แล้วก่อน early return (Rules of Hooks)

  const F = ({ label, value, hi, mono }) => {
    const isEmpty = !value && value !== 0
    return (
      <div className={`info-field${isEmpty ? " info-field-empty" : ""}`}>
        <div className="info-label">{label}</div>
        <div className={`info-val${hi ? " hi" : ""}${mono ? " mono" : ""}`}>{value || "—"}</div>
      </div>
    )
  }

  return (
    <>
      {pdfFull && (
        <PdfLightbox src={pdfBlobUrl} filename={p.pdf_filename}
          sizeKB={p.pdf_size ? (p.pdf_size / 1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}

      {/* ── 🔎 Quick-search modal ──
          ค้นหากรมธรรม์ทั่วทั้งระบบโดยไม่ต้องกลับหน้า list
          คลิกแถว → เปลี่ยนหน้า · คลิกปุ่มฟ้า "เปิดใหม่" → เปิดอีกแท็บ (เปรียบเทียบหลายคนพร้อมกัน) */}
      {searchOpen && (
        <div className="ov" onClick={e => e.target === e.currentTarget && setSearchOpen(false)}>
          <div className="modal" style={{ maxWidth: 680, padding: 0, overflow: "hidden" }}>
            {/* search bar — ใหญ่ ชัด ดู intuitive */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "20px 22px", borderBottom: "1px solid var(--brd)",
              background: "var(--sur2)",
            }}>
              <Ico n="search" s={24} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาลูกค้า, ทะเบียน, เลขกรมธรรม์…"
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 19, fontFamily: "inherit",
                  background: "transparent", color: "var(--t1)",
                }}
              />
              {searchLoading && <div className="spin" style={{ width: 20, height: 20, borderWidth: 2 }} />}
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); searchInputRef.current?.focus() }}
                  title="ล้าง"
                  style={{
                    background: "var(--sur)", border: "1px solid var(--brd)",
                    cursor: "pointer", color: "var(--t2)",
                    width: 30, height: 30, borderRadius: 8,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ico n="x" s={16} />
                </button>
              )}
            </div>

            {/* results area */}
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {searchQuery.trim().length < 2 ? (
                /* friendly empty state */
                <div style={{ padding: "40px 28px", textAlign: "center" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 70, height: 70, borderRadius: "50%",
                    background: "var(--blue-bg)", color: "var(--blue)",
                    marginBottom: 16,
                  }}>
                    <Ico n="search" s={32} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--t1)", marginBottom: 6 }}>
                    เริ่มพิมพ์เพื่อค้นหา
                  </div>
                  <div style={{ fontSize: 14, color: "var(--t3)", marginBottom: 18 }}>
                    พิมพ์อย่างน้อย 2 ตัวอักษร · เปลี่ยนหน้าได้ทันที
                  </div>
                  {/* example chips — คลิกแล้วเริ่มค้นหา */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "var(--t3)" }}>ลองพิมพ์:</span>
                    {[
                      p.insured_name?.split(" ")[0],
                      p.license_plate,
                      p.policy_number?.split("/")[0],
                    ].filter(Boolean).slice(0, 3).map((eg, i) => (
                      <button key={i}
                        onClick={() => { setSearchQuery(eg); searchInputRef.current?.focus() }}
                        style={{
                          padding: "5px 12px", borderRadius: 999,
                          border: "1px solid var(--brd)", background: "var(--sur)",
                          color: "var(--t2)", fontSize: 13, cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {eg}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 && !searchLoading ? (
                <div style={{ padding: "40px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, color: "var(--t2)", marginBottom: 4 }}>
                    ไม่พบกรมธรรม์
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--t3)" }}>
                    ลองค้นหาด้วยคำอื่น หรือตรวจการสะกด
                  </div>
                </div>
              ) : (
                <div style={{ padding: "10px 10px 14px" }}>
                  <div style={{ fontSize: 12, color: "var(--t3)", padding: "4px 12px 8px" }}>
                    พบ {searchResults.length} รายการ · คลิกเพื่อเปลี่ยนหน้า · กดปุ่มฟ้าเพื่อเปิดในแท็บใหม่
                  </div>
                  {searchResults.map(r => {
                    const yearBE = r.coverage_end
                      ? parseInt(r.coverage_end.slice(0, 4)) + 543 : null
                    const isPRB = (r.policy_type || "").toUpperCase() === "P"
                    const typeChip = isPRB ? "พ.ร.บ." : "กธ."
                    const typeColor = isPRB ? "var(--green)" : "var(--blue)"
                    const typeBg    = isPRB ? "var(--green-bg)" : "var(--blue-bg)"
                    const isCurrent = r.id === p.id
                    return (
                      <div key={r.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 10,
                        background: isCurrent ? "var(--blue-bg)" : "transparent",
                        border: `1px solid ${isCurrent ? "var(--blue-mid)" : "transparent"}`,
                        cursor: "pointer",
                        marginBottom: 4,
                        transition: "background 0.12s",
                      }}
                        onClick={() => {
                          setSearchOpen(false)
                          navigate(`/policies/${r.id}`, { state: { policy: r } })
                        }}
                        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "var(--sur2)" }}
                        onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "transparent" }}
                      >
                        <span style={{
                          padding: "5px 11px", borderRadius: 999,
                          background: typeBg, color: typeColor,
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                          minWidth: 52, textAlign: "center",
                        }}>{typeChip}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 16, fontWeight: 600, color: "var(--t1)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            marginBottom: 3,
                          }}>
                            {r.insured_name || "—"}
                            {isCurrent && (
                              <span style={{
                                marginLeft: 10, fontSize: 11.5, color: "var(--blue)",
                                fontWeight: 700, padding: "1px 8px", borderRadius: 6,
                                background: "#fff", border: "1px solid var(--blue-mid)",
                              }}>
                                หน้านี้
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 13, color: "var(--t3)",
                            display: "flex", gap: 12, flexWrap: "wrap",
                          }}>
                            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", color: "var(--t2)" }}>
                              {r.policy_number || "—"}
                            </span>
                            {r.license_plate && <span>{r.license_plate}</span>}
                            {yearBE && <span>ปี {yearBE}</span>}
                          </div>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            window.open(`/policies/${r.id}`, "_blank", "noopener,noreferrer")
                          }}
                          title="เปิดในแท็บใหม่"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "8px 14px", borderRadius: 8,
                            background: "var(--blue)", border: "none",
                            color: "#fff", cursor: "pointer",
                            fontSize: 13, fontWeight: 600,
                            fontFamily: "inherit", flexShrink: 0,
                          }}
                        >
                          <Ico n="open" s={14} />
                          เปิดใหม่
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
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
                  <Ico n="x" s={18} /> <span className="btn-label">ยกเลิก</span>
                </button>
                <button className="btn btn-b" onClick={saveEdit} disabled={saving}>
                  <Ico n="check" s={18} /> <span className="btn-label">{saving ? "กำลังบันทึก…" : "บันทึก"}</span>
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-w"
                  onClick={() => setSearchOpen(true)}
                  title="ค้นหากรมธรรม์ (Ctrl+K)"
                  style={{ color: "var(--t1)", borderColor: "var(--brd)" }}>
                  <Ico n="search" s={18} /> <span className="btn-label">ค้นหา</span>
                </button>
                <button className="btn btn-w"
                  onClick={() => attachRef.current?.openAddDialog()}
                  style={{ color: "var(--blue)", borderColor: "var(--blue-mid)", background: "var(--blue-bg)" }}>
                  <Ico n="upload" s={18} /> <span className="btn-label">เพิ่มเอกสาร</span>
                </button>
                <button className="btn btn-w"
                  onClick={() => navigate(`/invoice?policy_id=${id}`)}
                  style={{ color: "var(--purple)", borderColor: "var(--purple-mid, #c4b5fd)", background: "var(--purple-bg, #f5f3ff)" }}>
                  <Ico n="banknote" s={18} /> <span className="btn-label">ใบแจ้งหนี้</span>
                </button>
                <button className="btn btn-w" onClick={deletePolicy}
                  style={{ color: "var(--red)", borderColor: "var(--red-brd)", background: "var(--red-bg)" }}>
                  <Ico n="trash" s={18} /> <span className="btn-label">ลบข้อมูล</span>
                </button>
                <button className="btn btn-b" onClick={startEdit}>
                  <Ico n="pen" s={18} /> <span className="btn-label">แก้ไข</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="page-body">
          <div className="detail-split">

            <div>
              {editMode ? (
                <>
                  <div className="info-card" style={{ padding: "18px 18px 8px" }}>
                    <PolicyForm
                      values={editVals}
                      onChange={setEditVals}
                      hideSections={["เบี้ยประกัน", "ค่าคอมมิชชั่น / หัก ณ ที่จ่าย / ปัดเศษ"]}
                    />
                  </div>
                  {/* ตารางเบี้ยประกัน — แก้ทั้งกรมธรรม์ + พ.ร.บ. (PRB จะ save ผ่าน attachments API)
                      เมื่อแก้ "เบี้ยสุทธิ" → คำนวณ stamp/VAT/รวม ให้อัตโนมัติ */}
                  <PremiumGrid
                    title="เบี้ยประกัน"
                    main={editVals}
                    onMainChange={(k, v) => setEditVals(prev =>
                      k === "net_premium"
                        ? { ...prev, net_premium: v, ...calcPremium(v) }
                        : { ...prev, [k]: v }
                    )}
                    prb={editPrb}
                    onPrbChange={editPrb ? ((k, v) => setEditPrb(prev =>
                      k === "net_premium"
                        ? { ...prev, net_premium: v, ...calcPremium(v) }
                        : { ...prev, [k]: v }
                    )) : undefined}
                  />
                </>
              ) : (
                <>
                  {/* 🔎 banner — บอกชัดว่ากำลังดูฉบับอื่นของลูกค้ารายเดียวกัน */}
                  {viewingRelated && (
                    <div className="info-card" style={{
                      marginBottom: 12, padding: "12px 16px",
                      background: "var(--blue-bg)", border: "1px solid var(--blue-mid)",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <Ico n="bell" s={20} />
                      <div style={{ flex: 1, fontSize: 14, color: "var(--blue)", lineHeight: 1.5 }}>
                        <b>กำลังดูข้อมูลของกรมธรรม์อีกฉบับ</b> ของลูกค้ารายนี้
                        {activePolicy.coverage_start && (
                          <span> · ปี {parseInt(activePolicy.coverage_start.slice(0, 4)) + 543}</span>
                        )}
                      </div>
                      <button
                        className="btn btn-b"
                        style={{ padding: "7px 13px", fontSize: 13, flexShrink: 0 }}
                        onClick={() => navigate(`/policies/${activePolicy.id}`, { state: { policy: activePolicy } })}
                      >
                        <Ico n="open" s={15} /> เปิดเพื่อแก้ไข
                      </button>
                    </div>
                  )}

                  {/* ข้อมูลกรมธรรม์ */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="doc" s={20} /><span className="info-card-title">ข้อมูลกรมธรรม์</span></div>
                    <div className="info-card-bd">
                      {/* เลขกรมธรรม์ — เน้นพิเศษ */}
                      <div className="info-field" style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
                        <div className="info-label">เลขกรมธรรม์</div>
                        <div className="info-val hi" style={{ fontSize: 26, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: 0.5 }}>
                          {activePolicy.policy_number || "—"}
                        </div>
                      </div>
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="รหัสบริษัท"     value={activePolicy.company_code} />
                        <F label="เลขใบคำขอ"      value={activePolicy.app_number} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="ประเภทกรมธรรม์" value={policyTypeLabel(activePolicy.policy_type)} />
                        <F label="ใหม่/ต่ออายุ"   value={activePolicy.new_renew === "N" ? "ใหม่" : activePolicy.new_renew === "R" ? "ต่ออายุ" : activePolicy.new_renew} />
                      </div>
                      <div className="info-row">
                        <F label="รหัสตัวแทน"           value={activePolicy.agent_code} />
                        <F label="ชื่อตัวแทน / นายหน้า" value={activePolicy.broker_name !== activePolicy.agent_code ? activePolicy.broker_name : null} />
                      </div>
                    </div>
                  </div>

                  {/* ผู้เอาประกัน */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="person" s={20} /><span className="info-card-title">ผู้เอาประกัน</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="ชื่อ-นามสกุล"  value={activePolicy.insured_name} />
                        <F label="เบอร์โทรศัพท์" value={activePolicy.phone} />
                      </div>
                      <div className="info-row fw">
                        <F label="ที่อยู่" value={activePolicy.insured_address} />
                      </div>
                    </div>
                  </div>

                  {/* รถยนต์ */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="car" s={20} /><span className="info-card-title">ข้อมูลรถยนต์</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="ยี่ห้อ / รุ่น" value={[activePolicy.car_make, activePolicy.car_model].filter(Boolean).join("  ")} />
                        <F label="ปีรถ"           value={activePolicy.car_year} />
                      </div>
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <div className="info-field">
                          <div className="info-label">ทะเบียนรถ</div>
                          <div className="info-val">
                            {activePolicy.license_plate ? <span className="plate">{activePolicy.license_plate}</span> : "—"}
                          </div>
                        </div>
                        <F label="จังหวัดทะเบียน" value={activePolicy.license_province} />
                      </div>
                      <div className="info-row">
                        <F label="เลขตัวถัง"        value={activePolicy.chassis_no} mono />
                        <F label="ทุนเอาประกัน (฿)" value={activePolicy.sum_insured ? `${baht(activePolicy.sum_insured)} ฿` : null} />
                      </div>
                    </div>
                  </div>

                  {/* ระยะเวลาคุ้มครอง */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="cal" s={20} /><span className="info-card-title">ระยะเวลาคุ้มครอง</span></div>
                    <div className="info-card-bd">
                      <div className="info-row" style={{ marginBottom: 18 }}>
                        <F label="วันเริ่มต้น" value={fmtDate(activePolicy.coverage_start)} />
                        <F label="วันสิ้นสุด"  value={fmtDate(activePolicy.coverage_end)} />
                      </div>
                      <div className="info-row">
                        <F label="วันแจ้งงาน"     value={fmtDate(activePolicy.date_notify)} />
                        <F label="วันรับกรมธรรม์" value={fmtDate(activePolicy.date_policy_receive)} />
                      </div>
                      {activePolicy.date_cancel && (
                        <div className="info-row" style={{ marginTop: 12 }}>
                          <F label="วันยกเลิก" value={fmtDate(activePolicy.date_cancel)} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* เบี้ยประกัน — จับคู่ กธ.มอเตอร์ + พ.ร.บ. ของปีเดียวกัน
                      ค้นจาก: (1) PRB attachment ของ p, (2) sibling policy ที่ type ตรงข้ามและปีเดียวกัน */}
                  {(() => {
                    const yearFromFn = (fn) => {
                      if (!fn) return null
                      const m = String(fn).match(/\.(\d{2})\.pdf$/i)
                      return m ? 2500 + parseInt(m[1], 10) : null
                    }
                    const yearOfRec = (rec) => yearFromFn(rec?.pdf_filename)
                      ?? (rec?.coverage_end   ? parseInt(rec.coverage_end.slice(0, 4))   + 543 : null)
                      ?? (rec?.coverage_start ? parseInt(rec.coverage_start.slice(0, 4)) + 543 : null)
                    const isPRB = (t) => (t || "").toUpperCase().trim() === "P"
                    const activeIsPRB = isPRB(activePolicy.policy_type)
                    const activeYear  = yearOfRec(activePolicy)
                    // หา sibling ปีเดียวกัน (ไม่ใช่ฉบับเดียวกัน)
                    const sibling = relatedPdfs.find(r =>
                      r.id !== activePolicy.id && yearOfRec(r) === activeYear
                    )
                    const siblingIsPRB = sibling && isPRB(sibling.policy_type)
                    // PRB attachment ของ p (เฉพาะเมื่อดูตัว p เอง ไม่ใช่ sibling)
                    const attachPrb = !viewingRelated
                      ? attachItems.find(a => a.doc_type === "prb")
                      : null
                    // เลือกข้อมูลเข้าคอลัมน์ main vs prb
                    let mainCol, prbCol
                    if (activeIsPRB) {
                      prbCol  = activePolicy
                      mainCol = sibling && !siblingIsPRB ? sibling : null
                    } else {
                      mainCol = activePolicy
                      prbCol  = attachPrb || (sibling && siblingIsPRB ? sibling : null)
                    }
                    const prbForGrid = prbCol ? {
                      net_premium:   prbCol.net_premium,
                      stamp_duty:    prbCol.stamp_duty,
                      vat:           prbCol.vat,
                      total_premium: prbCol.total_premium,
                    } : null
                    return (
                      <PremiumGrid
                        readOnly
                        title="เบี้ยประกัน"
                        main={mainCol || {}}
                        prb={prbForGrid}
                      />
                    )
                  })()}

                  {/* ความคุ้มครองเพิ่มเติม (ทุนเอาประกัน — เฉพาะกรมธรรม์รถยนต์) */}
                  {(activePolicy.third_party_per_person || activePolicy.third_party_per_accident || activePolicy.own_damage) && (
                    <div className="info-card">
                      <div className="info-card-hd">
                        <Ico n="shield" s={20} />
                        <span className="info-card-title">ความคุ้มครองเพิ่มเติม</span>
                      </div>
                      <div className="info-card-bd">
                        <div className="info-row">
                          <F label="บุคคลภายนอก/คน"   value={activePolicy.third_party_per_person  ? `${baht(activePolicy.third_party_per_person)} ฿`  : null} />
                          <F label="บุคคลภายนอก/ครั้ง" value={activePolicy.third_party_per_accident ? `${baht(activePolicy.third_party_per_accident)} ฿` : null} />
                          <F label="ความเสียหายต่อรถ"  value={activePolicy.own_damage               ? `${baht(activePolicy.own_damage)} ฿`               : null} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* หมายเหตุ */}
                  <div className="info-card">
                    <div className="info-card-hd"><Ico n="doc" s={20} /><span className="info-card-title">หมายเหตุ</span></div>
                    <div className="info-card-bd">
                      {activePolicy.notes
                        ? <div className="info-val" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{activePolicy.notes}</div>
                        : <div className="info-val" style={{ color: "var(--t3)", fontStyle: "italic" }}>ไม่มีหมายเหตุ</div>
                      }
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* right: PDF + Attachments */}
            <div className="detail-aside">
              {/* AttachmentsCard ทำงานในโหมด headless — แค่จัดการ modal เลือกประเภท + file upload
                  ไม่ render การ์ด UI (ย้ายเอกสารแนบไปรวมในรายการ "เอกสาร PDF ทั้งหมด") */}
              <AttachmentsCard
                ref={attachRef}
                policyId={p.id}
                hasMainPdf={hasPdfInDb}
                mainFilename={p.pdf_filename}
                onMainUpdated={() => setRefreshKey(k => k + 1)}
                onItemsChange={setAttachItems}
                headless
              />

              {/* ── เอกสาร PDF ทั้งหมด — รวม related policies + attachments ── */}
              {(() => {
                const totalDocs = relatedPdfs.length + attachItems.length
                if (totalDocs === 0 && !p.pdf_filename) return null
                return (
                <div className="info-card" style={{ marginBottom: 12 }}>
                  <div
                    className="info-card-hd"
                    onClick={() => setPdfListOpen(o => !o)}
                    style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Ico n="doc" s={17} />
                      <span className="info-card-title" style={{ fontSize: 15 }}>
                        เอกสาร PDF ทั้งหมด ({totalDocs} ฉบับ)
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        className="btn btn-b"
                        onClick={(e) => { e.stopPropagation(); attachRef.current?.openAddDialog() }}
                        style={{ padding: "6px 12px", fontSize: 13 }}
                      >
                        <Ico n="upload" s={14} /> เพิ่มเอกสาร
                      </button>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 24, height: 24, borderRadius: 6,
                        background: "var(--sur2)",
                        transition: "transform 0.2s",
                        transform: pdfListOpen ? "rotate(180deg)" : "rotate(0deg)"
                      }}>
                        <Ico n="chevD" s={15} />
                      </div>
                    </div>
                  </div>
                  {pdfListOpen && (() => {
                    // ── จัดกลุ่มเอกสารตามปี (BE) — จับคู่ กธ + พรบ + สลักหลัง ของปีเดียวกัน ──
                    // ⚠️ ลำดับ priority:
                    //   1) parse เลข YY จาก filename ("กธ.69.pdf" / "พรบ.69.pdf") → BE 2569
                    //      เพราะนี่คือสิ่งที่ user มองเห็น และเป็นมาตรฐานการเรียกปีกรมธรรม์ในไทย
                    //   2) fallback ไป coverage_end (ปีที่หมดอายุ) ถ้า filename ไม่มี pattern
                    //   3) fallback ไป coverage_start สุดท้าย
                    const yearFromFilename = (fn) => {
                      if (!fn) return null
                      // จับ ".XX." ก่อน .pdf (XX = 2 หลัก BE สั้น เช่น 69, 70)
                      const m = String(fn).match(/\.(\d{2})\.pdf$/i)
                      if (!m) return null
                      const yy = parseInt(m[1], 10)
                      return 2500 + yy  // 69 → 2569, 70 → 2570
                    }
                    const yearOf = (rec) => {
                      return yearFromFilename(rec.pdf_filename)
                        ?? (rec.coverage_end   ? parseInt(rec.coverage_end.slice(0, 4))   + 543 : null)
                        ?? (rec.coverage_start ? parseInt(rec.coverage_start.slice(0, 4)) + 543 : null)
                    }
                    const docs = [
                      ...relatedPdfs.map(r => ({
                        kind: "policy",
                        id: r.id,
                        record: r,
                        // policy_type "P" = พ.ร.บ., อื่นๆ = กธ
                        docType: (r.policy_type || "").toUpperCase().trim() === "P" ? "prb" : "main",
                        year: yearOf(r),
                        filename: r.pdf_filename || "PDF",
                      })),
                      ...attachItems.map(a => ({
                        kind: "attachment",
                        id: a.id,
                        record: a,
                        docType: a.doc_type || "other",
                        // attachment ใช้ปีของตัวเอง — fallback ปีของ parent ถ้าไม่มี
                        year: yearOf(a) || yearOf(p),
                        filename: a.label || a.pdf_filename || "PDF",
                      })),
                    ]
                    // group by year
                    const groups = new Map()
                    for (const d of docs) {
                      const key = d.year ?? "ไม่ทราบปี"
                      if (!groups.has(key)) groups.set(key, [])
                      groups.get(key).push(d)
                    }
                    // sort years desc — "ไม่ทราบปี" ไว้ท้าย
                    const years = [...groups.keys()].sort((a, b) => {
                      if (a === "ไม่ทราบปี") return 1
                      if (b === "ไม่ทราบปี") return -1
                      return b - a
                    })
                    // sort docs within year: main → prb → endorsement → other
                    const ORDER = { main: 0, prb: 1, endorsement: 2, other: 3 }
                    for (const list of groups.values()) {
                      list.sort((a, b) => (ORDER[a.docType] ?? 9) - (ORDER[b.docType] ?? 9))
                    }
                    const DOC_META = {
                      main:        { label: "กธ.",        color: "var(--blue)",  bg: "var(--blue-bg)",   ico: "doc" },
                      prb:         { label: "พ.ร.บ.",     color: "var(--green)", bg: "var(--green-bg)",  ico: "shield" },
                      endorsement: { label: "สลักหลัง",   color: "#D97706",      bg: "var(--amber-bg)",  ico: "pen" },
                      other:       { label: "อื่นๆ",       color: "var(--t3)",    bg: "var(--sur2)",      ico: "doc" },
                    }
                    return (
                      <div className="info-card-bd" style={{ padding: "8px 12px 12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {years.map(year => (
                            <div key={year}>
                              {/* year header */}
                              <div style={{
                                fontSize: 12, fontWeight: 700, color: "var(--t3)",
                                marginBottom: 6, paddingLeft: 4, letterSpacing: 0.3,
                                display: "flex", alignItems: "center", gap: 6,
                              }}>
                                <Ico n="cal" s={13} />
                                ปี {year}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {groups.get(year).map(d => {
                                  const isActive = d.kind === "policy"
                                    ? (d.id === activePdfId && activeDocId === "main")
                                    : (activeDocId === d.id)
                                  const meta = DOC_META[d.docType] || DOC_META.other
                                  const onClick = d.kind === "policy"
                                    ? () => { setActivePdfId(d.id); setActiveDocId("main") }
                                    : () => setActiveDocId(d.id)
                                  return (
                                    <button
                                      key={d.id}
                                      onClick={onClick}
                                      style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "7px 11px",
                                        border: `1px solid ${isActive ? meta.color : "var(--brd)"}`,
                                        borderRadius: 8,
                                        background: isActive ? meta.bg : "var(--sur)",
                                        cursor: "pointer", textAlign: "left",
                                        transition: "all 0.15s"
                                      }}
                                    >
                                      <Ico n={meta.ico} s={15} />
                                      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{
                                          fontSize: 11.5, fontWeight: 700,
                                          padding: "2px 7px", borderRadius: 999,
                                          background: meta.bg, color: meta.color,
                                          flexShrink: 0,
                                        }}>
                                          {meta.label}
                                        </span>
                                        <span style={{
                                          fontSize: 14, fontWeight: isActive ? 600 : 500, color: "var(--t1)",
                                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                          {d.filename}
                                        </span>
                                      </div>
                                      {isActive && (
                                        <span style={{ fontSize: 11.5, color: meta.color, fontWeight: 700, whiteSpace: "nowrap" }}>
                                          กำลังดู
                                        </span>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
                )
              })()}

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
