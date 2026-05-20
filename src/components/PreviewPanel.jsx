import { useEffect, useState } from "react"
import { Ico } from "../icons"
import { getStatus, fmtDate, baht, policyTypeLabel } from "../helpers"
import api from "../api"
import { usePdfBlob, prefetchPdf } from "../pdfUtils"

function PvpField({ label, value, multiline, mono, hi }) {
  if (!value || value === "") return null
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--brd)", fontSize: 15 }}>
      <span style={{ color: "var(--t3)", flexShrink: 0, minWidth: 100 }}>{label}</span>
      <span style={{
        color: hi ? "var(--blue)" : "var(--t1)",
        fontWeight: hi ? 700 : 500,
        fontFamily: mono ? "ui-monospace, Menlo, monospace" : "inherit",
        whiteSpace: multiline ? "normal" : "nowrap",
        overflow: multiline ? "visible" : "hidden",
        textOverflow: "ellipsis",
        wordBreak: "break-word",
        textAlign: "right",
        flex: 1,
      }}>
        {value}
      </span>
    </div>
  )
}

export function PreviewPanel({ p, onClose, onOpen }) {
  const st           = getStatus(p.coverage_end)

  const [relatedPdfs, setRelatedPdfs] = useState([])
  const [activePdfId, setActivePdfId] = useState(p.id)
  const [pdfListOpen, setPdfListOpen] = useState(true)  // เปิดอยู่ default

  useEffect(() => {
    setActivePdfId(p.id)
    setPdfListOpen(true)
  }, [p.id])

  useEffect(() => {
    if (!p?.license_plate) { setRelatedPdfs([]); return }
    const plate = p.license_plate.trim()
    if (!plate || plate === "OTHER" || plate === "—") { setRelatedPdfs([]); return }

    let cancelled = false
    api.get("/policies", { params: { search: plate, limit: 50 } })
      .then(res => {
        if (cancelled) return
        const all = res.data.data || []
        const sameCustomer = all.filter(r =>
          r.license_plate?.trim() === plate &&
          (r.pdf_url || r.pdf_filename || r.pdf_size)
        )
        setRelatedPdfs(sameCustomer)
        // ⚡ prefetch PDF ของทุก renewals ที่ user น่าจะคลิกดู
        sameCustomer.forEach(r => {
          if (r.pdf_filename || r.pdf_size) {
            prefetchPdf(`${api.defaults.baseURL}/policies/${r.id}/pdf`)
          }
        })
      })
      .catch(() => { if (!cancelled) setRelatedPdfs([]) })
    return () => { cancelled = true }
  }, [p?.id, p?.license_plate])

  const activePolicy = relatedPdfs.find(r => r.id === activePdfId) || p
  const activePdfApiUrl = `${api.defaults.baseURL}/policies/${activePolicy.id}/pdf`
  const activeHasPdf = !!activePolicy.pdf_filename || !!activePolicy.pdf_size
  const activeLegacy = activePolicy.pdf_url && activePolicy.pdf_url.includes("drive.google.com")

  // Blob URL — iframe ส่ง auth header ไม่ได้ ต้อง fetch เองแล้วใช้ blob
  const { blobUrl: pdfBlobUrl, loading: pdfLoading } = usePdfBlob(
    activeHasPdf && !activeLegacy ? activePdfApiUrl : null
  )

  return (
    <>
      <div className="pvp-backdrop" onClick={onClose} />
      <div className="pvp">
        {/* header */}
        <div className="pvp-hd">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pvp-title">{p.insured_name || "ไม่ระบุชื่อ"}</div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span>
            </div>
          </div>
          <button className="pvp-close" onClick={onClose}><Ico n="x" s={20} /></button>
        </div>

        {/* related PDFs (collapsible list — click ปุ่ม → iframe ล่างเปลี่ยน) */}
        {relatedPdfs.length > 1 && (
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--brd)", flexShrink: 0, background: "var(--sur2)" }}>
            <div
              onClick={() => setPdfListOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15.5, fontWeight: 600, color: "var(--t1)" }}>
                <Ico n="doc" s={17} />
                <span>เอกสาร PDF ({relatedPdfs.length} ฉบับ)</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 26, height: 26, borderRadius: 7,
                background: "var(--sur)",
                transition: "transform 0.2s",
                transform: pdfListOpen ? "rotate(180deg)" : "rotate(0deg)"
              }}>
                <Ico n="chevD" s={15} />
              </div>
            </div>
            {pdfListOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, maxHeight: 220, overflowY: "auto" }}>
                {relatedPdfs.map(r => {
                  const isActive = r.id === activePdfId
                  const yearTH = r.coverage_start ? (parseInt(r.coverage_start.slice(0, 4)) + 543) : "?"
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActivePdfId(r.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 11,
                        padding: "11px 13px",
                        border: `1.5px solid ${isActive ? "var(--blue)" : "var(--brd)"}`,
                        borderRadius: 9,
                        background: isActive ? "var(--blue-bg)" : "var(--sur)",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s"
                      }}
                    >
                      <Ico n="doc" s={17} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: isActive ? 600 : 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.pdf_filename || "PDF"}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 3 }}>
                          {r.policy_number || "—"} · ปี {yearTH}
                        </div>
                      </div>
                      {isActive && <span style={{ fontSize: 13, color: "var(--blue)", fontWeight: 700 }}>กำลังดู</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PDF main preview (iframe ล่าง) */}
        {activeLegacy ? (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "var(--sur2)", color: "var(--t3)", padding: 28, textAlign: "center" }}>
            <Ico n="warn" s={42} sw={1} />
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--t2)" }}>ไฟล์ PDF ไม่พร้อมใช้งาน</div>
            <div style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 340 }}>
              ไฟล์ถูกเก็บใน Google Drive ที่ไม่สามารถเข้าถึงได้แล้ว<br />
              กรุณาอัปโหลดไฟล์ใหม่ผ่านเมนู "อัปโหลด PDF"
            </div>
          </div>
        ) : activeHasPdf ? (
          pdfLoading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, background: "var(--sur2)", color: "var(--t3)" }}>
              <div className="spin" style={{ width: 28, height: 28, borderWidth: 2.5 }} />
              <div style={{ fontSize: 14 }}>กำลังโหลด PDF…</div>
            </div>
          ) : pdfBlobUrl ? (
            <iframe
              key={activePolicy.id}
              src={pdfBlobUrl}
              title="PDF"
              style={{ width: "100%", flex: 1, minHeight: 0, border: "none", display: "block", background: "#f5f5f5" }}
            />
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, background: "var(--sur2)", color: "var(--t3)", padding: 24, textAlign: "center" }}>
              <Ico n="warn" s={36} sw={1} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--t2)" }}>โหลด PDF ไม่สำเร็จ</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>กดปุ่ม "ดูข้อมูลทั้งหมด" เพื่อเปิดหน้าเต็ม</div>
            </div>
          )
        ) : (
          /* ไม่มี PDF → แสดงข้อมูลกรมธรรม์แทน */
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "var(--sur)", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: "var(--t3)", fontSize: 14 }}>
              <Ico n="doc" s={16} sw={1} />
              <span>ไม่มีไฟล์ PDF · แสดงข้อมูลแทน</span>
            </div>

            {/* เลขกรมธรรม์ (เน้น) */}
            <div style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "var(--t3)" }}>เลขกรมธรรม์</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: 0.3, marginTop: 3 }}>
                {p.policy_number || "—"}
              </div>
            </div>

            {/* Field row helper */}
            <PvpField label="ประเภท" value={policyTypeLabel(p.policy_type)} />
            <PvpField label="ผู้เอาประกัน" value={p.insured_name} />
            <PvpField label="โทรศัพท์" value={p.phone} />
            <PvpField label="ที่อยู่" value={p.insured_address} multiline />
            <PvpField label="ทะเบียนรถ" value={p.license_plate} />
            <PvpField label="จังหวัด" value={p.license_province} />
            <PvpField label="ยี่ห้อ/รุ่น" value={[p.car_make, p.car_model].filter(Boolean).join(" ")} />
            <PvpField label="ปีรถ" value={p.car_year} />
            <PvpField label="เลขตัวถัง" value={p.chassis_no} mono />
            <PvpField label="ทุนเอาประกัน" value={p.sum_insured ? `${baht(p.sum_insured)} ฿` : null} />
            <PvpField label="เบี้ยรวม" value={p.total_premium ? `${baht(p.total_premium)} ฿` : null} hi />
            <PvpField label="ตัวแทน" value={p.broker_name} />
          </div>
        )}

        {/* ข้อมูลย่อ 2 บรรทัด */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--brd)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", gap: 14, fontSize: 15, color: "var(--t1)" }}>
            <span style={{ color: "var(--t3)", flexShrink: 0 }}>เลขที่</span>
            <span style={{ fontWeight: 600 }}>{activePolicy.policy_number || "-"}</span>
            <span style={{ color: "var(--t3)", flexShrink: 0, marginLeft: "auto" }}>ทะเบียน</span>
            <span style={{ fontWeight: 600 }}>{activePolicy.license_plate || "-"}</span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 15, color: "var(--t1)" }}>
            <span style={{ color: "var(--t3)", flexShrink: 0 }}>คุ้มครอง</span>
            <span>{fmtDate(activePolicy.coverage_start) || "-"} – {fmtDate(activePolicy.coverage_end) || "-"}</span>
          </div>
        </div>

        {/* footer */}
        <div className="pvp-foot">
          <button className="btn btn-b" style={{ width: "100%", justifyContent: "center" }} onClick={onOpen}>
            <Ico n="expand" s={17} /> ดูข้อมูลทั้งหมด
          </button>
        </div>
      </div>
    </>
  )
}
