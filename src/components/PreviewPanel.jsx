import { useEffect, useState } from "react"
import { Ico } from "../icons"
import { getStatus, fmtDate, baht, policyTypeLabel } from "../helpers"
import api from "../api"

function PvpField({ label, value, multiline, mono, hi }) {
  if (!value || value === "") return null
  return (
    <div style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid var(--brd)", fontSize: 12 }}>
      <span style={{ color: "var(--t3)", flexShrink: 0, minWidth: 78 }}>{label}</span>
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

    api.get("/policies", { params: { search: plate, limit: 50 } })
      .then(res => {
        const all = res.data.data || []
        const sameCustomer = all.filter(r =>
          r.license_plate?.trim() === plate &&
          (r.pdf_url || r.pdf_filename || r.pdf_size)
        )
        setRelatedPdfs(sameCustomer)
      })
      .catch(() => setRelatedPdfs([]))
  }, [p?.id, p?.license_plate])

  const activePolicy = relatedPdfs.find(r => r.id === activePdfId) || p
  const activePdfUrl = `${api.defaults.baseURL}/policies/${activePolicy.id}/pdf`
  const activeHasPdf = !!activePolicy.pdf_filename || !!activePolicy.pdf_size
  const activeLegacy = activePolicy.pdf_url && activePolicy.pdf_url.includes("drive.google.com")

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
          <button className="pvp-close" onClick={onClose}><Ico n="x" s={16} /></button>
        </div>

        {/* related PDFs (collapsible list — click ปุ่ม → iframe ล่างเปลี่ยน) */}
        {relatedPdfs.length > 1 && (
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--brd)", flexShrink: 0, background: "var(--sur2)" }}>
            <div
              onClick={() => setPdfListOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>
                <Ico n="doc" s={13} />
                <span>เอกสาร PDF ({relatedPdfs.length} ฉบับ)</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 20, height: 20, borderRadius: 5,
                background: "var(--sur)",
                transition: "transform 0.2s",
                transform: pdfListOpen ? "rotate(180deg)" : "rotate(0deg)"
              }}>
                <Ico n="chevD" s={12} />
              </div>
            </div>
            {pdfListOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, maxHeight: 180, overflowY: "auto" }}>
                {relatedPdfs.map(r => {
                  const isActive = r.id === activePdfId
                  const yearTH = r.coverage_start ? (parseInt(r.coverage_start.slice(0, 4)) + 543) : "?"
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActivePdfId(r.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 8px",
                        border: `1.5px solid ${isActive ? "var(--blue)" : "var(--brd)"}`,
                        borderRadius: 6,
                        background: isActive ? "var(--blue-bg)" : "var(--sur)",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s"
                      }}
                    >
                      <Ico n="doc" s={12} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: isActive ? 600 : 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.pdf_filename || "PDF"}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>
                          {r.policy_number || "—"} · ปี {yearTH}
                        </div>
                      </div>
                      {isActive && <span style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600 }}>กำลังดู</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PDF main preview (iframe ล่าง) */}
        {activeLegacy ? (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "var(--sur2)", color: "var(--t3)", padding: 20, textAlign: "center" }}>
            <Ico n="warn" s={32} sw={1} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)" }}>ไฟล์ PDF ไม่พร้อมใช้งาน</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, maxWidth: 280 }}>
              ไฟล์ถูกเก็บใน Google Drive ที่ไม่สามารถเข้าถึงได้แล้ว<br />
              กรุณาอัปโหลดไฟล์ใหม่ผ่านเมนู "อัปโหลด PDF"
            </div>
          </div>
        ) : activeHasPdf ? (
          <iframe
            key={activePolicy.id}
            src={activePdfUrl}
            title="PDF"
            style={{ width: "100%", flex: 1, minHeight: 0, border: "none", display: "block", background: "#f5f5f5" }}
          />
        ) : (
          /* ไม่มี PDF → แสดงข้อมูลกรมธรรม์แทน */
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "var(--sur)", padding: "14px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "var(--t3)", fontSize: 11.5 }}>
              <Ico n="doc" s={13} sw={1} />
              <span>ไม่มีไฟล์ PDF · แสดงข้อมูลแทน</span>
            </div>

            {/* เลขกรมธรรม์ (เน้น) */}
            <div style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, color: "var(--t3)" }}>เลขกรมธรรม์</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: 0.3, marginTop: 1 }}>
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
        <div style={{ padding: "6px 12px", borderTop: "1px solid var(--brd)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--t1)" }}>
            <span style={{ color: "var(--t3)", flexShrink: 0 }}>เลขที่</span>
            <span style={{ fontWeight: 600 }}>{activePolicy.policy_number || "-"}</span>
            <span style={{ color: "var(--t3)", flexShrink: 0, marginLeft: "auto" }}>ทะเบียน</span>
            <span style={{ fontWeight: 600 }}>{p.license_plate || "-"}</span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--t1)" }}>
            <span style={{ color: "var(--t3)", flexShrink: 0 }}>คุ้มครอง</span>
            <span>{fmtDate(activePolicy.coverage_start) || "-"} – {fmtDate(activePolicy.coverage_end) || "-"}</span>
          </div>
        </div>

        {/* footer */}
        <div className="pvp-foot">
          <button className="btn btn-b" style={{ width: "100%", justifyContent: "center" }} onClick={onOpen}>
            <Ico n="expand" s={14} /> ดูข้อมูลทั้งหมด
          </button>
        </div>
      </div>
    </>
  )
}
