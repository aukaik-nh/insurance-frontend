import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { getStatus, baht } from "../helpers"
import { PdfLightbox } from "../components/PdfLightbox"

export function DetailPage() {
  const navigate  = useNavigate()
  const { state } = useLocation()
  const p0        = state?.policy

  const [p, setP]               = useState(p0)
  const [pdfFull, setPdfFull]   = useState(false)
  const [editName, setEditName] = useState(false)
  const [name, setName]         = useState(p0?.pdf_filename || "")
  const [savingName, setSavingName] = useState(false)

  if (!p) {
    return (
      <div className="page-wrap">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 16, padding: 40 }}>
          <Ico n="doc" s={40} sw={1} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--t2)" }}>ไม่พบข้อมูลกรมธรรม์</div>
          <button className="btn btn-w" onClick={() => navigate("/")}>
            <Ico n="chevL" s={14} /> กลับหน้าหลัก
          </button>
        </div>
      </div>
    )
  }

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

  const pdfBase        = `${api.defaults.baseURL}/policies/${p.id}/pdf`
  const pdfViewUrl     = pdfBase
  const pdfDownloadUrl = `${pdfBase}?download=1`
  const hasPdfInDb     = !!p.pdf_filename || !!p.pdf_size

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
          {hasPdfInDb && (
            <div className="page-hd-right">
              <button className="btn btn-w" onClick={() => setPdfFull(true)}>
                <Ico n="expand" s={14} /> ดู PDF
              </button>
              <a className="btn btn-b" href={pdfDownloadUrl}>
                <Ico n="download" s={14} /> ดาวน์โหลด
              </a>
            </div>
          )}
        </div>

        <div className="page-body">
          <div className="detail-split">

            {/* left: info cards */}
            <div>
              {/* ผู้เอาประกัน */}
              <div className="info-card">
                <div className="info-card-hd"><Ico n="person" s={16} /><span className="info-card-title">ผู้เอาประกัน</span></div>
                <div className="info-card-bd">
                  <div className="info-row" style={{ marginBottom: 12 }}>
                    <F label="ชื่อ-นามสกุล"          value={p.insured_name} />
                    <F label="ชื่อตัวแทน / นายหน้า"  value={p.broker_name} />
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
                    <F label="ปีรถ" value={p.car_year} />
                  </div>
                  <div className="info-row">
                    <div className="info-field">
                      <div className="info-label">ทะเบียนรถ</div>
                      <div className="info-val">
                        {p.license_plate ? <span className="plate">{p.license_plate}</span> : "—"}
                      </div>
                    </div>
                    <F label="เลขตัวถัง" value={p.chassis_no} mono />
                  </div>
                </div>
              </div>

              {/* ระยะเวลาคุ้มครอง */}
              <div className="info-card">
                <div className="info-card-hd"><Ico n="cal" s={16} /><span className="info-card-title">ระยะเวลาคุ้มครอง</span></div>
                <div className="info-card-bd">
                  <div className="info-row">
                    <F label="วันเริ่มต้น" value={p.coverage_start} />
                    <F label="วันสิ้นสุด"  value={p.coverage_end} />
                  </div>
                </div>
              </div>

              {/* เบี้ยประกัน */}
              <div className="info-card">
                <div className="info-card-hd"><Ico n="banknote" s={16} /><span className="info-card-title">เบี้ยประกัน</span></div>
                <div className="info-card-bd">
                  <div className="info-row" style={{ marginBottom: 12 }}>
                    <F label="เบี้ยสุทธิ"  value={`${baht(p.net_premium)} ฿`} />
                    <F label="อากรแสตมป์"  value={`${baht(p.stamp_duty)} ฿`} />
                  </div>
                  <div className="info-row">
                    <F label="ภาษีมูลค่าเพิ่ม (VAT)" value={`${baht(p.vat)} ฿`} />
                    <div className="info-field" style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-mid)", borderRadius: 9, padding: "10px 13px" }}>
                      <div className="info-label">รวมเบี้ยประกัน</div>
                      <div className="info-val hi">{baht(p.total_premium)} ฿</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* หมายเหตุ */}
              {p.notes && (
                <div className="info-card">
                  <div className="info-card-hd"><Ico n="doc" s={16} /><span className="info-card-title">หมายเหตุ</span></div>
                  <div className="info-card-bd">
                    <div className="info-val" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{p.notes}</div>
                  </div>
                </div>
              )}
            </div>

            {/* right: PDF ทั้งหมด (sticky) */}
            <div className="detail-aside">
              {hasPdfInDb ? (
                <div className="pdf-preview-wrap">
                  {/* header: ชื่อไฟล์ + ปุ่ม */}
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
                    style={{ height: 560 }} />
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
