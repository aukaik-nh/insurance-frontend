import { Ico } from "../icons"
import { getStatus } from "../helpers"

export function PolicyTable({ rows, loading, total, page, pages, setPage, onRow, activeId, pageOffset }) {
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
              <th>เลขกรมธรรม์</th>
              <th>ผู้เอาประกัน</th>
              <th>ทะเบียน</th>
              <th>วันหมดอายุ</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const st = getStatus(r.coverage_end)
              return (
                <tr key={r.id} onClick={() => onRow(r)} className={activeId === r.id ? "tr-active" : ""}>
                  <td style={{ textAlign: "center", color: "var(--t3)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                    {pageOffset + idx + 1}
                  </td>
                  <td className="tm">{r.policy_number || "—"}</td>
                  <td className="tw">{r.insured_name || "—"}</td>
                  <td><span className="plate">{r.license_plate || "—"}</span></td>
                  <td style={{ color: "var(--t3)", fontSize: 13 }}>{r.coverage_end || "—"}</td>
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
