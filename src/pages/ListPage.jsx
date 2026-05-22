import { useState, useEffect, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { getStatus } from "../helpers"
import { PolicyTable } from "../components/PolicyTable"
import { PreviewPanel } from "../components/PreviewPanel"
import { prefetchPdf, getPdfUrl } from "../pdfUtils"

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

  // ── Date quick-presets: filter coverage_end ภายใน N วันจากวันนี้ ──
  const ymd = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0")
    return `${y}-${m}-${dd}`
  }
  const today = ymd(new Date())
  const datePresets = [
    { val: 1,  label: "วัน"     },
    { val: 7,  label: "อาทิตย์" },
    { val: 30, label: "เดือน"   },
  ]
  const activePreset = datePresets.find(p => {
    const d = new Date(); d.setDate(d.getDate() + p.val)
    return dateFrom === today && dateTo === ymd(d)
  })?.val
  const applyPreset = (n) => {
    if (activePreset === n) { setDateFrom(""); setDateTo("") }
    else {
      const d = new Date(); d.setDate(d.getDate() + n)
      setDateFrom(today); setDateTo(ymd(d))
    }
    setPage(1)
  }

  const onSort = (col) => {
    if (sortKey === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(col); setSortDir("asc") }
    setPage(1)
  }

  // ⚡ prefetch: hover แถวในตาราง → ดึง detail + attachments + PDF blob ล่วงหน้า
  const prefetchedIds = useRef(new Set())
  const prefetchPolicy = (r) => {
    if (!r?.id || prefetchedIds.current.has(r.id)) return
    prefetchedIds.current.add(r.id)
    // expire หลัง 30 วินาที — กัน cache เก่าค้าง
    setTimeout(() => prefetchedIds.current.delete(r.id), 30_000)
    api.get(`/policies/${r.id}`).catch(() => {})
    api.get(`/policies/${r.id}/attachments`).catch(() => {})
    // ถ้ามี PDF → prefetch blob ด้วย (เก็บใน module-level cache ของ pdfUtils)
    const u = getPdfUrl(r, api.defaults.baseURL)
    if (u) prefetchPdf(u)
  }

  // ⚡ debounce search — รอ 300ms หลังพิมพ์เสร็จ จึงค่อยยิง API (กัน request ฟุ่มเฟือยตอนพิมพ์เร็วๆ)
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    if (search === debouncedSearch) return
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // race-safe fetch — ป้องกัน race condition จาก filter ที่กดเร็วๆ
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = { page, limit: LIMIT, sort: sortKey, order: sortDir }
    if (debouncedSearch) params.search = debouncedSearch
    if (status)   params.status    = status
    if (dateFrom) params.date_from = dateFrom
    if (dateTo)   params.date_to   = dateTo
    if (hasPdf)   params.has_pdf   = hasPdf

    api.get("/policies", { params })
      .then(res => {
        if (cancelled) return
        const data = res.data.data || []
        setRows(data)
        setTotal(res.data.total || 0)
        const expCnt = data.filter(r => {
          if (!r.coverage_end) return false
          const d = (new Date(r.coverage_end) - new Date()) / 86400000
          return d >= 0 && d < 30
        }).length
        setExpiringCount(expCnt)
      })
      .catch(e => {
        if (cancelled) return
        notify("โหลดข้อมูลไม่สำเร็จ: " + (e.response?.data?.detail || e.message), "error")
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [page, debouncedSearch, sortKey, sortDir, status, dateFrom, dateTo, hasPdf])
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
                  { ico: "doc",      cls: "bl", lbl: "กรมธรรม์",  val: total.toLocaleString(),  sub: "ทั้งหมดในระบบ" },
                  { ico: "shield",   cls: "gr", lbl: "คุ้มครองอยู่", val: active,                  sub: "ยังไม่หมดอายุ" },
                  { ico: "bell",     cls: "am", lbl: "ใกล้หมดอายุ", val: expiring.length,         sub: "ภายใน 30 วัน" },
                  { ico: "banknote", cls: "pu", lbl: "เบี้ยรวม",   val: sumPremium.toLocaleString("th-TH", { maximumFractionDigits: 0 }), sub: "บาท (หน้านี้)" },
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

              {/* ── Quick nav cards (horizontal scroll) ── */}
              <div className="navcards">
                {[
                  { path: "/upload",   ico: "upload",   cls: "fcard-blue",   lbl: "อัปโหลด PDF",      desc: "เพิ่มกรมธรรม์ใหม่" },
                  { path: "/invoice",  ico: "banknote", cls: "fcard-purple", lbl: "ใบแจ้งหนี้",        desc: "สร้าง invoice + QR" },
                  { path: "/expiring", ico: "bell",     cls: "fcard-amber",  lbl: "ใกล้หมดอายุ",      desc: "ภายใน 30 วัน",     badge: expiring.length },
                ].map(it => (
                  <button key={it.path} className={`navcard ${it.cls}`} onClick={() => navigate(it.path)}>
                    <span className="fcard-ico"><Ico n={it.ico} s={20} /></span>
                    <div className="navcard-body">
                      <div className="navcard-ttl">
                        {it.lbl}
                        {it.badge > 0 && <span className="navcard-badge">{it.badge}</span>}
                      </div>
                      <div className="navcard-desc">{it.desc}</div>
                    </div>
                    <Ico n="arrowR" s={16} />
                  </button>
                ))}
              </div>
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

            {/* Collapsible filter panel — horizontal scrolling cards */}
            {showFilter && (
              <>
              <div className="filter-bar">

                {/* สถานะ */}
                <div className="fcard fcard-blue">
                  <div className="fcard-hd">
                    <span className="fcard-ico"><Ico n="shield" s={16} /></span>
                    <span className="fcard-ttl">สถานะ</span>
                  </div>
                  <div className="fcard-bd">
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

                {/* วันหมดอายุ */}
                <div className="fcard fcard-amber">
                  <div className="fcard-hd">
                    <span className="fcard-ico"><Ico n="cal" s={16} /></span>
                    <span className="fcard-ttl">วันหมดอายุ</span>
                  </div>
                  <div className="fcard-bd">
                    {datePresets.map(p => (
                      <button
                        key={p.val}
                        className={`fopt${activePreset === p.val ? " active" : ""}`}
                        onClick={() => applyPreset(p.val)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="fcard-sub">
                    <span className="fcard-sub-lbl">หรือกำหนดเอง</span>
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
                </div>

                {/* PDF */}
                <div className="fcard fcard-purple">
                  <div className="fcard-hd">
                    <span className="fcard-ico"><Ico n="doc" s={16} /></span>
                    <span className="fcard-ttl">ไฟล์ PDF</span>
                  </div>
                  <div className="fcard-bd">
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

              </div>

              {/* Clear (footer outside scroll) */}
              {activeFilters > 0 && (
                <button className="fbar-clear fbar-clear-block" onClick={clearFilters}>
                  <Ico n="x" s={16} /> ล้างทั้งหมด ({activeFilters})
                </button>
              )}
              </>
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
            onRowHover={prefetchPolicy}
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
