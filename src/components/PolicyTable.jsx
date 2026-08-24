import { Ico } from "../icons"
import { getStatus, fmtDate } from "../helpers"

function SortHeader({ label, col, sortKey, sortDir, onSort, style }) {
  const isActive = sortKey === col
  return (
    <th
      onClick={() => onSort?.(col)}
      style={{
        cursor: onSort ? "pointer" : "default",
        userSelect: "none",
        ...style,
      }}
      title={onSort ? `เรียงตาม ${label}` : undefined}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {label}
        {onSort && (
          <span style={{
            display: "inline-flex", flexDirection: "column",
            lineHeight: 0.85, fontSize: 10,
          }}>
            <span style={{ opacity: isActive && sortDir === "asc"  ? 1 : 0.25, color: isActive && sortDir === "asc"  ? "var(--blue)" : "var(--t3)" }}>▲</span>
            <span style={{ opacity: isActive && sortDir === "desc" ? 1 : 0.25, color: isActive && sortDir === "desc" ? "var(--blue)" : "var(--t3)" }}>▼</span>
          </span>
        )}
      </span>
    </th>
  )
}

function PolicyMobileCards({ rows, pageOffset, onRow }) {
  return (
    <div className="policy-mobile-list" aria-label="รายการกรมธรรม์">
      {rows.map((r, idx) => {
        const status = getStatus(r.coverage_end, r.coverage_start)
        const hasPdf = !!(r.pdf_url || r.pdf_filename || r.pdf_size)
        const endDate = fmtDate(r.coverage_end) || "ไม่ระบุวันหมดอายุ"
        return (
          <button
            key={r.id}
            type="button"
            className="policy-mobile-card"
            onClick={() => onRow(r)}
            aria-label={`เปิดรายละเอียด ${r.insured_name || r.policy_number || "กรมธรรม์"}`}
          >
            <div className="policy-mobile-card-top">
              <span className="policy-mobile-seq">#{pageOffset + idx + 1}</span>
              <span className={`policy-mobile-pdf${hasPdf ? " has-file" : ""}`}>
                <Ico n="doc" s={15} /> {hasPdf ? "มี PDF" : "ไม่มี PDF"}
              </span>
              <span className={`badge ${status.cls}`}><span className="bdot" />{status.label}</span>
            </div>
            <div className="policy-mobile-name">{r.insured_name || "ไม่ระบุผู้เอาประกัน"}</div>
            <div className="policy-mobile-policy">{r.policy_number || "ไม่ระบุเลขกรมธรรม์"}</div>
            <div className="policy-mobile-meta">
              <span><Ico n="cal" s={15} /> หมดอายุ {endDate}</span>
              <span className="policy-mobile-open">ดูรายละเอียด <Ico n="chevR" s={16} /></span>
            </div>
            {r._historyCount > 0 && <span className="policy-mobile-history">ประวัติอีก {r._historyCount} ฉบับ</span>}
          </button>
        )
      })}
    </div>
  )
}

export function PolicyTable({ rows, loading, total, page, pages, setPage, onRow, activeId, pageOffset, sortKey, sortDir, onSort, onRowHover }) {
  // ⚡ แสดง spinner เฉพาะตอนยังไม่มีข้อมูลเลย — refetch ครั้งถัดไปให้แสดงข้อมูลเดิมไปก่อน
  if (loading && !rows.length) return (
    <div className="card">
      <div className="ldg">
        <div className="spin" />
        <div className="ldg-t">กำลังโหลดข้อมูล</div>
      </div>
    </div>
  )

  if (!rows.length) return (
    <div className="card">
      <div className="empty">
        <Ico n="inbox" s={48} />
        <div className="empty-t">ไม่พบข้อมูลกรมธรรม์</div>
        <div className="empty-s">ลองเปลี่ยนคำค้นหา หรืออัปโหลดข้อมูลใหม่</div>
      </div>
    </div>
  )

  return (
    <div className="card" style={{ position: "relative" }}>
      {/* refreshing indicator — โผล่บนตารางตอนกำลังโหลด (ไม่ปิด UI) */}
      {loading && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, var(--blue), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.2s linear infinite",
          zIndex: 5,
        }} />
      )}
      <div className="card-hd">
        <div>
          <div className="card-title">รายการกรมธรรม์</div>
          <div className="card-sub">{total.toLocaleString()} รายการ · คลิกแถวเพื่อดูรายละเอียด</div>
        </div>
      </div>
      <div className="policy-table-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ tableLayout: "fixed", width: "100%", minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ width: 50, textAlign: "center", color: "var(--t3)" }}>#</th>
              <th style={{ width: 54, textAlign: "center", color: "var(--t3)" }}>PDF</th>
              <SortHeader label="เลขกรมธรรม์"  col="policy_number"  sortKey={sortKey} sortDir={sortDir} onSort={onSort} style={{ width: "17%" }} />
              <SortHeader label="ผู้เอาประกัน" col="insured_name"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} style={{ width: "29%" }} />
              <SortHeader label="วันเริ่ม"      col="coverage_start" sortKey={sortKey} sortDir={sortDir} onSort={onSort} style={{ width: "15%" }} />
              <SortHeader label="วันหมดอายุ"   col="coverage_end"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} style={{ width: "16%" }} />
              <th style={{ width: "13%", whiteSpace: "nowrap" }}>สถานะ</th>
              <th style={{ width: 54, textAlign: "center", color: "var(--t3)" }}>เปิด</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const st     = getStatus(r.coverage_end, r.coverage_start)
              const hasPdf = !!(r.pdf_url || r.pdf_filename || r.pdf_size)
              const now = new Date()
              // ถ้า coverage_start ยังเป็นอนาคต → label แสดง "เริ่มอีก N วัน" แทน "เหลือ N วัน"
              const startD = r.coverage_start ? new Date(r.coverage_start) : null
              const isPending = !!(startD && !isNaN(startD) && startD > now)
              const daysToStart = isPending ? Math.ceil((startD - now) / 86400000) : null
              // เหลือกี่วันจนหมดอายุ
              const daysLeft = r.coverage_end
                ? Math.ceil((new Date(r.coverage_end) - now) / 86400000)
                : null
              const daysLabel = isPending
                ? { txt: `เริ่มอีก ${daysToStart} วัน`, color: "var(--blue)" }
                : daysLeft == null ? null
                : daysLeft < 0   ? { txt: `หมดแล้ว ${-daysLeft} วัน`, color: "var(--red)" }
                : daysLeft === 0 ? { txt: "หมดวันนี้",                color: "var(--red)" }
                : daysLeft <= 30 ? { txt: `เหลือ ${daysLeft} วัน`,    color: "var(--amber)" }
                :                   { txt: `เหลือ ${daysLeft} วัน`,    color: "var(--green)" }
              return (
                <tr key={r.id}
                  onClick={() => onRow(r)}
                  onMouseEnter={() => onRowHover?.(r)}
                  className={activeId === r.id ? "tr-active" : ""}>
                  <td style={{ textAlign: "center", color: "var(--t2)", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                    {pageOffset + idx + 1}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {hasPdf ? (
                      <span title="มีไฟล์ PDF" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
                        <Ico n="doc" s={20} />
                      </span>
                    ) : (
                      <span title="ไม่มีไฟล์ PDF" style={{ color: "var(--t3)", opacity: 0.4 }}>
                        <Ico n="doc" s={20} />
                      </span>
                    )}
                  </td>
                  <td className="tm">{r.policy_number || "—"}</td>
                  <td className="tw">
                    <span>{r.insured_name || "—"}</span>
                    {r._historyCount > 0 && (
                      <span
                        title={`มีกรมธรรม์อื่นของลูกค้ารายนี้อีก ${r._historyCount} ฉบับ — คลิกดูในหน้ารายละเอียด`}
                        style={{
                          marginLeft: 8,
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 999,
                          background: "var(--blue-bg)", color: "var(--blue)",
                          fontSize: 11.5, fontWeight: 700, lineHeight: 1.4,
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        +{r._historyCount} ฉบับ
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ color: "var(--t1)", fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>
                      {fmtDate(r.coverage_start) || "—"}
                    </div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ color: "var(--t1)", fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>
                      {fmtDate(r.coverage_end) || "—"}
                    </div>
                    {daysLabel && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: daysLabel.color, marginTop: 3 }}>
                        {daysLabel.txt}
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}><span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()  // อย่าให้ trigger onRow (จะเปิดหน้ารายละเอียด แทน new tab)
                        window.open(`/policies/${r.id}`, "_blank", "noopener,noreferrer")
                      }}
                      title="เปิดหน้ารายละเอียดในแท็บใหม่"
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 32, height: 32, borderRadius: 8,
                        border: "1px solid var(--brd)",
                        background: "var(--sur)", color: "var(--blue)",
                        cursor: "pointer", padding: 0,
                      }}
                    >
                      <Ico n="open" s={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <PolicyMobileCards rows={rows} pageOffset={pageOffset} onRow={onRow} />
      <div className="pg">
        <span className="pg-info">หน้า {page} / {pages || 1} · {total.toLocaleString()} รายการ</span>
        <div className="pg-btns">
          <button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1}>
            <Ico n="chevLL" s={17} />
          </button>
          <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <Ico n="chevL" s={17} />
          </button>
          <div className="pg-btn cur">{page}</div>
          <button className="pg-btn" onClick={() => setPage(p => p + 1)} disabled={page >= (pages || 1)}>
            <Ico n="chevR" s={17} />
          </button>
          <button className="pg-btn" onClick={() => setPage(pages || 1)} disabled={page >= (pages || 1)}>
            <Ico n="chevRR" s={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
