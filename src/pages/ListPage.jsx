import { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { getStatus } from "../helpers"
import { PolicyTable } from "../components/PolicyTable"
import { PreviewPanel } from "../components/PreviewPanel"

const LIMIT = 10

const STATUS_OPTS = [
  { val: "",         label: "ทั้งหมด" },
  { val: "active",   label: "คุ้มครองอยู่",    cls: "b-on" },
  { val: "expiring", label: "ใกล้หมดอายุ",     cls: "b-soon" },
  { val: "expired",  label: "หมดอายุแล้ว",    cls: "b-off" },
]

export function ListPage({ tab }) {
  const navigate = useNavigate()
  const { search, setSearch, page, setPage, notify, setExpiringCount } = useOutletContext()

  const [rows, setRows]               = useState([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [previewPolicy, setPreviewPolicy] = useState(null)
  const [sortKey, setSortKey]         = useState("created_at")
  const [sortDir, setSortDir]         = useState("desc")

  // filter state
  const [status, setStatus]     = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const [hasPdf, setHasPdf]     = useState("")   // "" | "true" | "false"
  const [showFilter, setShowFilter] = useState(false)

  const activeFilters = [status, dateFrom, dateTo, hasPdf].filter(Boolean).length

  const clearFilters = () => {
    setStatus(""); setDateFrom(""); setDateTo(""); setHasPdf("")
    setPage(1)
  }

  const onSort = (col) => {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(col); setSortDir("asc") }
    setPage(1)
  }

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, sort: sortKey, order: sortDir }
      if (search)   params.search    = search
      if (status)   params.status    = status
      if (dateFrom) params.date_from = dateFrom
      if (dateTo)   params.date_to   = dateTo
      if (hasPdf)   params.has_pdf   = hasPdf

      const res = await api.get("/policies", { params })
      const data = res.data.data || []
      setRows(data)
      setTotal(res.data.total || 0)

      const expCnt = data.filter(r => {
        if (!r.coverage_end) return false
        const d = (new Date(r.coverage_end) - new Date()) / 86400000
        return d >= 0 && d < 30
      }).length
      setExpiringCount(expCnt)
    } catch (e) {
      notify("โหลดข้อมูลไม่สำเร็จ: " + (e.response?.data?.detail || e.message), "error")
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, search, sortKey, sortDir, status, dateFrom, dateTo, hasPdf])
  useEffect(() => { setPreviewPolicy(null) }, [tab])

  const expiring = rows.filter(r => {
    if (!r.coverage_end) return false
    const d = (new Date(r.coverage_end) - new Date()) / 86400000
    return d >= 0 && d < 30
  })
  const active     = rows.filter(r => r.coverage_end && new Date(r.coverage_end) > new Date()).length
  const sumPremium = rows.reduce((s, r) => s + (Number(r.total_premium) || 0), 0)
  const pages      = Math.ceil(total / LIMIT)

  const tabMeta = {
    dashboard: { title: "ภาพรวมระบบ",         sub: "สรุปสถานะกรมธรรม์ประกันภัยรถยนต์" },
    policies:  { title: "กรมธรรม์ทั้งหมด",     sub: `${total.toLocaleString()} รายการในระบบ` },
    expiring:  { title: "กรมธรรม์ใกล้หมดอายุ", sub: `${expiring.length} รายการ · ต้องต่ออายุภายใน 30 วัน` },
  }

  const baseRows    = tab === "expiring" ? expiring : rows
  const displayRows = baseRows
  const displayTotal = tab === "expiring" ? expiring.length : total

  return (
    <>
      {/* subtitle bar */}
      <div className="top">
        <div className="top-l">
          <div className="top-title">{tabMeta[tab]?.title}</div>
          <div className="top-sub">{tabMeta[tab]?.sub}</div>
        </div>
        {tab !== "dashboard" && (
          <div className="top-srch">
            <Ico n="search" s={18} />
            <input
              placeholder="ค้นหา เลขกรมธรรม์, ชื่อ, ทะเบียน..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button className="top-srch-clr" onClick={() => { setSearch(""); setPage(1) }}>
                <Ico n="x" s={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`list-layout${previewPolicy ? " has-pvp" : ""}`}>
        <div className="body">

          {tab === "dashboard" && (
            <>
              <div className="stats">
                {[
                  { ico: "doc",      cls: "bl", lbl: "กรมธรรม์ทั้งหมด",   val: total.toLocaleString(),  sub: "รายการในระบบ" },
                  { ico: "shield",   cls: "gr", lbl: "คุ้มครองอยู่",       val: active,                  sub: "ยังไม่หมดอายุ" },
                  { ico: "bell",     cls: "am", lbl: "ใกล้หมดอายุ",        val: expiring.length,         sub: "ภายใน 30 วัน" },
                  { ico: "banknote", cls: "pu", lbl: "เบี้ยรวม (หน้านี้)", val: sumPremium.toLocaleString("th-TH", { maximumFractionDigits: 0 }), sub: "บาท" },
                ].map(c => (
                  <div key={c.lbl} className="sc">
                    <div className="sc-bd">
                      <div className="sc-lbl">{c.lbl}</div>
                      <div className="sc-val">{c.val}</div>
                      <div className="sc-sub">{c.sub}</div>
                    </div>
                    <div className={`sc-ico ${c.cls}`}><Ico n={c.ico} s={28} /></div>
                  </div>
                ))}
              </div>

              {expiring.length > 0 && (
                <div className="bnr am">
                  <Ico n="bell" s={22} />
                  <div className="bnr-body">
                    <div className="bnr-t">มี {expiring.length} กรมธรรม์ใกล้หมดอายุภายใน 30 วัน</div>
                    <div className="bnr-s">กรุณาติดต่อลูกค้าเพื่อต่ออายุกรมธรรม์</div>
                  </div>
                  <button className="btn btn-w"
                    style={{ fontSize: 15, padding: "10px 16px", flexShrink: 0 }}
                    onClick={() => navigate("/expiring")}>
                    ดูรายการ <Ico n="arrowR" s={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Search + Filter ── */}
          <div className="filter-wrap">

            {/* Search row + filter toggle */}
            <div className="srch-row">
              <div className="big-srch">
                <Ico n="search" s={20} />
                <input
                  placeholder="ค้นหา เลขกรมธรรม์, ชื่อผู้เอาประกัน, ทะเบียนรถ..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
                {search && (
                  <button className="big-srch-clr" onClick={() => { setSearch(""); setPage(1) }}>
                    <Ico n="x" s={18} />
                  </button>
                )}
              </div>
              <button
                className={`ftoggle${showFilter ? " open" : ""}${activeFilters > 0 && !showFilter ? " has-active" : ""}`}
                onClick={() => setShowFilter(f => !f)}
              >
                <Ico n="filter" s={18} />
                <span>ฟิลเตอร์</span>
                {activeFilters > 0 && !showFilter && (
                  <span className="ftoggle-badge">{activeFilters}</span>
                )}
                <Ico n={showFilter ? "chevU" : "chevD"} s={16} />
              </button>
            </div>

            {/* Collapsible filter panel */}
            {showFilter && (
              <div className="filter-bar">

                {/* สถานะ */}
                <div className="fbar-group">
                  <span className="fbar-lbl">สถานะ</span>
                  <div className="fbar-opts">
                    {STATUS_OPTS.map(o => (
                      <button
                        key={o.val}
                        className={`fopt${status === o.val ? " active" : ""}${o.val === "active" ? " fopt-green" : o.val === "expiring" ? " fopt-amber" : o.val === "expired" ? " fopt-red" : ""}`}
                        onClick={() => { setStatus(o.val); setPage(1) }}
                      >
                        {o.val && <span className="fopt-dot" style={{
                          background: o.val === "active" ? "var(--green)" : o.val === "expiring" ? "#F59E0B" : "var(--red)"
                        }} />}
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fbar-div" />

                {/* วันหมดอายุ */}
                <div className="fbar-group">
                  <span className="fbar-lbl">วันหมดอายุ</span>
                  <div className="fbar-dates">
                    <div className="fbar-date">
                      <Ico n="cal" s={17} />
                      <input
                        type="date"
                        value={dateFrom}
                        title="ตั้งแต่"
                        onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                      />
                    </div>
                    <span className="fbar-dash">—</span>
                    <div className="fbar-date">
                      <Ico n="cal" s={17} />
                      <input
                        type="date"
                        value={dateTo}
                        title="ถึง"
                        onChange={e => { setDateTo(e.target.value); setPage(1) }}
                      />
                    </div>
                  </div>
                </div>

                <div className="fbar-div" />

                {/* PDF */}
                <div className="fbar-group">
                  <span className="fbar-lbl">ไฟล์ PDF</span>
                  <div className="fbar-opts">
                    {[
                      { val: "",      label: "ทั้งหมด" },
                      { val: "true",  label: "มี PDF",    ico: "doc" },
                      { val: "false", label: "ไม่มี PDF" },
                    ].map(o => (
                      <button
                        key={o.val}
                        className={`fopt${hasPdf === o.val ? " active" : ""}`}
                        onClick={() => { setHasPdf(o.val); setPage(1) }}
                      >
                        {o.ico && <Ico n={o.ico} s={17} />}
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear */}
                {activeFilters > 0 && (
                  <>
                    <div className="fbar-div" />
                    <button className="fbar-clear" onClick={clearFilters}>
                      <Ico n="x" s={16} /> ล้างทั้งหมด
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Active chips — แสดงเมื่อมี filter ที่ active */}
            {activeFilters > 0 && (
              <div className="filter-chips">
                {status && (
                  <span className={`fchip ${STATUS_OPTS.find(o => o.val === status)?.cls || ""}`}>
                    {STATUS_OPTS.find(o => o.val === status)?.label}
                    <button onClick={() => { setStatus(""); setPage(1) }}><Ico n="x" s={14} /></button>
                  </span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="fchip">
                    <Ico n="cal" s={15} />
                    {dateFrom ? dateFrom.split("-").reverse().join("/") : "ทุกวัน"} – {dateTo ? dateTo.split("-").reverse().join("/") : "ทุกวัน"}
                    <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1) }}><Ico n="x" s={14} /></button>
                  </span>
                )}
                {hasPdf && (
                  <span className="fchip">
                    {hasPdf === "true" ? <><Ico n="doc" s={15} /> มี PDF</> : "ไม่มี PDF"}
                    <button onClick={() => { setHasPdf(""); setPage(1) }}><Ico n="x" s={14} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          <PolicyTable
            rows={displayRows}
            loading={loading}
            total={displayTotal}
            page={tab === "expiring" ? 1 : page}
            pages={tab === "expiring" ? 1 : pages}
            setPage={tab === "expiring" ? () => {} : setPage}
            onRow={r => setPreviewPolicy(prev => prev?.id === r.id ? null : r)}
            activeId={previewPolicy?.id}
            pageOffset={tab === "expiring" ? 0 : (page - 1) * LIMIT}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
          />
        </div>

        {previewPolicy && (
          <PreviewPanel
            p={previewPolicy}
            onClose={() => setPreviewPolicy(null)}
            onOpen={() => navigate(`/policies/${previewPolicy.id}`, { state: { policy: previewPolicy } })}
          />
        )}
      </div>
    </>
  )
}
