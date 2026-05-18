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
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        {label}
        {onSort && (
          <span style={{
            display: "inline-flex", flexDirection: "column",
            lineHeight: 0.85, fontSize: 8,
          }}>
            <span style={{ opacity: isActive && sortDir === "asc"  ? 1 : 0.25, color: isActive && sortDir === "asc"  ? "var(--blue)" : "var(--t3)" }}>▲</span>
            <span style={{ opacity: isActive && sortDir === "desc" ? 1 : 0.25, color: isActive && sortDir === "desc" ? "var(--blue)" : "var(--t3)" }}>▼</span>
          </span>
        )}
      </span>
    </th>
  )
}

export function PolicyTable({ rows, loading, total, page, pages, setPage, onRow, activeId, pageOffset, sortKey, sortDir, onSort }) {
  if (loading) return (
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
        <Ico n="inbox" s={40} />
        <div className="empty-t">ไม่พบข้อมูลกรมธรรม์</div>
        <div className="empty-s">ลองเปลี่ยนคำค้นหา หรืออัปโหลดข้อมูลใหม่</div>
      </div>
    </div>
  )

  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <div className="card-title">รายการกรมธรรม์</div>
          <div className="card-sub">{total.toLocaleString()} รายการ · คลิกแถวเพื่อดูรายละเอียด</div>
        </div>
      </div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: "center", color: "var(--t3)" }}>#</th>
              <th style={{ width: 40, textAlign: "center", color: "var(--t3)" }}>PDF</th>
              <SortHeader label="เลขกรมธรรม์"  col="policy_number" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="ผู้เอาประกัน" col="insured_name"  sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="ทะเบียน"      col="license_plate" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="วันหมดอายุ"   col="coverage_end"  sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const st     = getStatus(r.coverage_end)
              const hasPdf = !!(r.pdf_url || r.pdf_filename || r.pdf_size)
              return (
                <tr key={r.id} onClick={() => onRow(r)} className={activeId === r.id ? "tr-active" : ""}>
                  <td style={{ textAlign: "center", color: "var(--t3)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                    {pageOffset + idx + 1}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {hasPdf ? (
                      <span title="มีไฟล์ PDF" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
                        <Ico n="doc" s={15} />
                      </span>
                    ) : (
                      <span title="ไม่มีไฟล์ PDF" style={{ color: "var(--t3)", opacity: 0.4 }}>
                        <Ico n="doc" s={15} />
                      </span>
                    )}
                  </td>
                  <td className="tm">{r.policy_number || "—"}</td>
                  <td className="tw">{r.insured_name || "—"}</td>
                  <td><span className="plate">{r.license_plate || "—"}</span></td>
                  <td style={{ color: "var(--t3)", fontSize: 13, whiteSpace: "nowrap" }}>{fmtDate(r.coverage_end) || "—"}</td>
                  <td><span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="pg">
        <span className="pg-info">หน้า {page} / {pages || 1} · {total.toLocaleString()} รายการ</span>
        <div className="pg-btns">
          <button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1}>
            <Ico n="chevLL" s={13} />
          </button>
          <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <Ico n="chevL" s={13} />
          </button>
          <div className="pg-btn cur">{page}</div>
          <button className="pg-btn" onClick={() => setPage(p => p + 1)} disabled={page >= (pages || 1)}>
            <Ico n="chevR" s={13} />
          </button>
          <button className="pg-btn" onClick={() => setPage(pages || 1)} disabled={page >= (pages || 1)}>
            <Ico n="chevRR" s={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
