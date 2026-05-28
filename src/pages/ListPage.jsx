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
  // ── Expiring filter — เลือกช่วงเวลาหมดอายุ ──
  // val: number = วันข้างหน้า, -1 = หมดอายุแล้ว
  const [expiryRange, setExpiryRange] = useState(30)
  const EXPIRY_RANGES = [
    { val: 1,   label: "1 วัน",      icon: "⚠️" },
    { val: 7,   label: "1 อาทิตย์",  icon: "🔴" },
    { val: 30,  label: "1 เดือน",    icon: "🟠" },
    { val: 60,  label: "2 เดือน",    icon: "🟡" },
    { val: 90,  label: "3 เดือน",    icon: "🟢" },
    { val: -1,  label: "หมดอายุแล้ว", icon: "❌" },
  ]
  const rangeMeta = EXPIRY_RANGES.find(r => r.val === expiryRange) || EXPIRY_RANGES[2]

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

  // race-safe fetch + stale-while-revalidate cache
  // โชว์ผลลัพธ์ล่าสุดจาก localStorage ทันที (กัน user รอ cold start backend) แล้วค่อย swap ของใหม่เมื่อ API ตอบ
  useEffect(() => {
    let cancelled = false
    const params = { page, limit: LIMIT, sort: sortKey, order: sortDir }
    if (debouncedSearch) params.search = debouncedSearch
    if (status)   params.status    = status
    if (dateFrom) params.date_from = dateFrom
    if (dateTo)   params.date_to   = dateTo
    if (hasPdf)   params.has_pdf   = hasPdf

    const cacheKey = `policies-cache:${JSON.stringify(params)}`
    let hadCache = false
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        const { rows: cRows, total: cTotal, ts } = JSON.parse(raw)
        // ใช้ cache ถ้าอายุไม่เกิน 7 วัน
        if (cRows && Date.now() - (ts || 0) < 7 * 24 * 60 * 60 * 1000) {
          setRows(cRows)
          setTotal(cTotal || 0)
          const expCnt = cRows.filter(r => {
            if (!r.coverage_end) return false
            const d = (new Date(r.coverage_end) - new Date()) / 86400000
            return d >= 0 && d < 30
          }).length
          setExpiringCount(expCnt)
          hadCache = true
        }
      }
    } catch {}
    setLoading(!hadCache)

    api.get("/policies", { params })
      .then(res => {
        if (cancelled) return
        const data = res.data.data || []
        const totalCount = res.data.total || 0
        setRows(data)
        setTotal(totalCount)
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ rows: data, total: totalCount, ts: Date.now() }))
        } catch {}
        const expCnt = data.filter(r => {
          if (!r.coverage_end) return false
          const d = (new Date(r.coverage_end) - new Date()) / 86400000
          return d >= 0 && d < 30
        }).length
        setExpiringCount(expCnt)
      })
      .catch(e => {
        if (cancelled) return
        // ถ้ามี cache อยู่แล้ว ไม่ต้อง notify error รบกวน — user ยังเห็นข้อมูลได้
        if (!hadCache) notify("โหลดข้อมูลไม่สำเร็จ: " + (e.response?.data?.detail || e.message), "error")
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [page, debouncedSearch, sortKey, sortDir, status, dateFrom, dateTo, hasPdf])
  useEffect(() => { setPreviewPolicy(null) }, [tab])

  const expiring = rows.filter(r => {
    if (!r.coverage_end) return false
    const d = (new Date(r.coverage_end) - new Date()) / 86400000
    if (expiryRange === -1) return d < 0          // หมดอายุแล้ว
    return d >= 0 && d < expiryRange              // ภายใน N วันข้างหน้า
  })
  const active     = rows.filter(r => r.coverage_end && new Date(r.coverage_end) > new Date()).length
  const sumPremium = rows.reduce((s, r) => s + (Number(r.total_premium) || 0), 0)
  const pages      = Math.ceil(total / LIMIT)

  const expiringSubText = expiryRange === -1
    ? `${expiring.length} รายการ · หมดอายุแล้ว`
    : `${expiring.length} รายการ · ภายใน ${rangeMeta.label}`
  const tabMeta = {
    dashboard: { title: "ภาพรวมระบบ",         sub: "สรุปสถานะกรมธรรม์ประกันภัยรถยนต์" },
    policies:  { title: "กรมธรรม์ทั้งหมด",     sub: `${total.toLocaleString()} รายการในระบบ` },
    expiring:  { title: "กรมธรรม์ใกล้หมดอายุ", sub: expiringSubText },
  }

  const baseRows    = tab === "expiring" ? expiring : rows
  const displayRows = baseRows
  const displayTotal = tab === "expiring" ? expiring.length : total

  return (
    <>
      {/* subtitle bar */}
      <div className="top">
        {tab !== "dashboard" && (
          <button onClick={() => navigate("/")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 9,
              border: "1.5px solid var(--brd)", background: "var(--sur)",
              color: "var(--t2)", cursor: "pointer", fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", marginRight: 12, flexShrink: 0,
            }}>
            <Ico n="chevL" s={16} /> กลับ
          </button>
        )}
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
            </>
          )}

          {/* ── Search (filter UI removed) ── */}
          <div className="filter-wrap">
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
          </div>

          {/* ── Quick nav cards (horizontal scroll) — เฉพาะหน้า dashboard ── */}
          {tab === "dashboard" && (
            <div className="navcards-wrap">
              <div className="navcards-hd">
                <Ico n="grid" s={16} />
                <span className="navcards-ttl">ทางลัด</span>
                <span className="navcards-sub">กดเพื่อเข้าเมนู</span>
              </div>
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
                    <Ico n="arrowR" s={18} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Filter chips ช่วงเวลาหมดอายุ (เฉพาะหน้า expiring) ── */}
          {tab === "expiring" && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8,
              marginBottom: 16, padding: "12px 14px",
              background: "var(--sur)", border: "1px solid var(--brd)",
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)", alignSelf: "center", marginRight: 4 }}>
                แสดงรายการ:
              </div>
              {EXPIRY_RANGES.map(opt => {
                const active = expiryRange === opt.val
                return (
                  <button key={opt.val}
                    onClick={() => setExpiryRange(opt.val)}
                    style={{
                      padding: "8px 14px", borderRadius: 999,
                      border: `1.5px solid ${active ? "var(--blue)" : "var(--brd)"}`,
                      background: active ? "var(--blue)" : "var(--sur)",
                      color: active ? "#fff" : "var(--t2)",
                      fontWeight: active ? 700 : 500,
                      fontSize: 13.5, cursor: "pointer",
                      fontFamily: "inherit",
                      display: "inline-flex", alignItems: "center", gap: 5,
                      transition: "all .15s",
                    }}>
                    <span style={{ fontSize: 12 }}>{opt.icon}</span>
                    {opt.label}
                    {active && (
                      <span style={{
                        marginLeft: 4, padding: "1px 8px", borderRadius: 99,
                        background: "rgba(255,255,255,.25)", fontSize: 12, fontWeight: 700,
                      }}>{expiring.length}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

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
