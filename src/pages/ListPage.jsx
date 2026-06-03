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
  const [allRows, setAllRows]         = useState([])  // ⚡ สำหรับ dashboard analytics (ทั้งหมด ไม่ใช่หน้านี้)
  const [todayAttachments, setTodayAttachments] = useState({}) // { policyId: [att, ...] } สำหรับนับ พ.ร.บ.
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
    { val: 1,   label: "1 วัน",      ico: "warn" },
    { val: 7,   label: "1 อาทิตย์",  ico: "bell" },
    { val: 30,  label: "1 เดือน",    ico: "clock" },
    { val: 60,  label: "2 เดือน",    ico: "cal" },
    { val: 90,  label: "3 เดือน",    ico: "cal" },
    { val: -1,  label: "หมดอายุแล้ว", ico: "xc" },
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

    // ── /expiring tab: ส่ง filter ไป backend (ไม่ใช่ filter client-side ของ page เดียว) ──
    if (tab === "expiring") {
      params.limit = 500    // ดึงมาเยอะหน่อยให้ครอบคลุม
      params.sort  = "coverage_end"
      params.order = "asc"
      if (expiryRange === -1) {
        params.status = "expired"
      } else {
        const today = new Date()
        const future = new Date(); future.setDate(future.getDate() + expiryRange)
        params.date_from = ymd(today)
        params.date_to   = ymd(future)
        params.status    = "active"  // ยังไม่หมด แต่ใกล้
      }
    }

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
  }, [page, debouncedSearch, sortKey, sortDir, status, dateFrom, dateTo, hasPdf, tab, expiryRange])
  useEffect(() => { setPreviewPolicy(null) }, [tab])
  useEffect(() => { setPage(1) }, [expiryRange])

  // ⚡ Analytics fetch ทั้งหมด (limit=20000) แล้ว cache 30 นาที
  // ใช้สำหรับ dashboard charts + expiring page stat strip
  useEffect(() => {
    if (tab !== "dashboard" && tab !== "expiring") return
    let cancelled = false
    const CACHE_KEY = "policies-stats-cache:v1"
    const TTL = 30 * 60 * 1000  // 30 นาที
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { data, ts } = JSON.parse(raw)
        if (data && Date.now() - (ts || 0) < TTL) {
          setAllRows(data)
        }
      }
    } catch {}
    api.get("/policies", { params: { limit: 20000, sort: "created_at", order: "desc" } })
      .then(res => {
        if (cancelled) return
        const data = res.data.data || []
        setAllRows(data)
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [tab])

  // expiring: tab=expiring ใช้ rows (backend filter), dashboard ใช้ allRows คำนวณเอง
  const _expiringSource = tab === "dashboard" && allRows.length ? allRows : rows
  const expiring = tab === "expiring" ? rows : _expiringSource.filter(r => {
    if (!r.coverage_end) return false
    const d = (new Date(r.coverage_end) - new Date()) / 86400000
    return d >= 0 && d < 30
  })
  // ⚡ Dashboard/Expiring ใช้ allRows (ทั้งหมดในระบบ) — tab อื่นใช้ rows (หน้านี้)
  const statsRows  = (tab === "dashboard" || tab === "expiring") && allRows.length ? allRows : rows
  const active     = statsRows.filter(r => r.coverage_end && new Date(r.coverage_end) > new Date()).length
  const expired    = statsRows.filter(r => r.coverage_end && new Date(r.coverage_end) <= new Date()).length
  const sumPremium = statsRows.reduce((s, r) => s + (Number(r.total_premium) || 0), 0)
  const pages      = Math.ceil(total / LIMIT)

  // ── Today's work breakdown (by policy_type) + last 7 days stacked bar
  const dailyReport = (() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayMs = 86400000
    const DAY_TH = ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."]
    const localKey = (d) =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
    // 3 categories: กรมธรรม์ (M/STY/รถยนต์), พ.ร.บ. (P/พรบ), อื่นๆ
    const catOf = (t) => {
      const x = String(t || "").trim().toUpperCase()
      if (!x || x === "OTHER" || x === "UNKNOWN") return "policy" // ค่าว่าง = ถือว่ากรมธรรม์ปกติ
      if (x === "P" || x === "PRB" || x.includes("พ.ร.บ") || x.includes("พรบ") || x.includes("PROR") || x.includes("COMPULSORY")) return "prb"
      if (x === "M" || x === "STY" || x === "MOTOR" || x.includes("รถ") || x.includes("CAR") || x.includes("AUTO") || x.includes("ประกัน")) return "policy"
      return "other"
    }
    const CATS = [
      { key: "policy", label: "กรมธรรม์",  c1: "#6366F1", c2: "#A855F7" },  // indigo→purple
      { key: "prb",    label: "พ.ร.บ.",    c1: "#10B981", c2: "#06B6D4" },  // green→cyan
      { key: "other",  label: "อื่นๆ",      c1: "#94A3B8", c2: "#CBD5E1" },  // gray
    ]
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getTime() - (6 - i) * dayMs)
      return { date: d, key: localKey(d), label: DAY_TH[d.getDay()], breakdown: { policy: 0, prb: 0, other: 0 }, count: 0 }
    })
    const todayKey = localKey(today)
    const todayBreakdown = { policy: 0, prb: 0, other: 0 }
    const todayItems = []
    statsRows.forEach(r => {
      if (!r.created_at) return
      const t = new Date(r.created_at)
      if (isNaN(t)) return
      const dKey = localKey(t)
      const cat = catOf(r.policy_type)
      const bucket = days.find(d => d.key === dKey)
      if (bucket) { bucket.breakdown[cat] += 1; bucket.count += 1 }
      if (dKey === todayKey) {
        todayBreakdown[cat] += 1
        todayItems.push(r)
      }
    })
    const todayCount = todayItems.length
    return {
      todayCount,
      todayItems: todayItems.slice(0, 6),
      todayBreakdown,
      days,
      maxCount: Math.max(1, ...days.map(d => d.count)),
      todayKey,
      cats: CATS,
    }
  })()

  // ── Expiry Forecast — focus on actionable (upcoming) buckets; expired = separate stat
  const expiryForecast = (() => {
    const now = new Date()
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const buckets = [
      { key: "30",   label: "ภายใน 30 วัน",  min: 0,   max: 30,        c1: "#F59E0B", c2: "#FBBF24", count: 0, urgent: true },
      { key: "60",   label: "31-60 วัน",     min: 31,  max: 60,        c1: "#FB923C", c2: "#F97316", count: 0 },
      { key: "90",   label: "61-90 วัน",     min: 61,  max: 90,        c1: "#06B6D4", c2: "#22D3EE", count: 0 },
      { key: "180",  label: "91-180 วัน",    min: 91,  max: 180,       c1: "#6366F1", c2: "#818CF8", count: 0 },
      { key: "year", label: "> 180 วัน",     min: 181, max: Infinity,  c1: "#10B981", c2: "#34D399", count: 0 },
    ]
    let expiredCount = 0
    let unknownCount = 0
    statsRows.forEach(r => {
      if (!r.coverage_end) { unknownCount += 1; return }
      const t = new Date(r.coverage_end)
      if (isNaN(t)) { unknownCount += 1; return }
      const daysLeft = Math.floor((t - today0) / 86400000)
      if (daysLeft < 0) { expiredCount += 1; return }
      const b = buckets.find(b => daysLeft >= b.min && daysLeft <= b.max)
      if (b) b.count += 1
    })
    const max = Math.max(1, ...buckets.map(b => b.count))
    const total = buckets.reduce((a, b) => a + b.count, 0)
    return { buckets, max, total, expiredCount, unknownCount }
  })()

  // ── Trend: 6 เดือนหลัง + 6 เดือนหน้า, 3 series ไขว้กัน
  const expiryCalendar = (() => {
    const MONTH_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    // 6 เดือนหลัง + 6 เดือนหน้า = 12 เดือนรอบเดือนปัจจุบัน
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 5 + i, 1)
      return {
        date: d,
        label: `${MONTH_TH[d.getMonth()]} ${(d.getFullYear() + 543).toString().slice(-2)}`,
        starts: 0,    // กรมธรรม์เริ่มใหม่
        ends: 0,      // กรมธรรม์หมดอายุ
        renews: 0,    // ต่ออายุ
        premium: 0,
        count: 0,
        isCurrent: i === 5,  // index 5 = เดือนปัจจุบัน
      }
    })
    const findIdx = (t) => months.findIndex(m =>
      m.date.getFullYear() === t.getFullYear() && m.date.getMonth() === t.getMonth())

    statsRows.forEach(r => {
      // coverage_start → starts (and renews if new_renew=R)
      if (r.coverage_start) {
        const t = new Date(r.coverage_start)
        if (!isNaN(t)) {
          const idx = findIdx(t)
          if (idx >= 0) {
            months[idx].starts += 1
            if (r.new_renew === "R" || r.new_renew === "r") months[idx].renews += 1
          }
        }
      }
      // coverage_end → ends + premium at risk
      if (r.coverage_end) {
        const t = new Date(r.coverage_end)
        if (!isNaN(t)) {
          const idx = findIdx(t)
          if (idx >= 0) {
            months[idx].ends += 1
            months[idx].premium += Number(r.total_premium) || 0
            months[idx].count += 1
          }
        }
      }
    })
    const maxV = Math.max(1, ...months.flatMap(m => [m.starts, m.ends, m.renews]))
    const totalCount = months.reduce((a, b) => a + b.ends, 0)
    const totalPremium = months.reduce((a, b) => a + b.premium, 0)
    return { months, maxV, totalCount, totalPremium }
  })()

  // ── Chart: timeline กรมธรรม์ เริ่ม/หมดอายุ/ต่ออายุ (smooth line, multi-series)
  const [chartRange, setChartRange] = useState("y1") // y1 (12mo) | y2 (24mo) | y5 (60mo)
  const seriesData = (() => {
    const MONTH_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
    const now = new Date()
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let buckets = []
    let labelFmt
    const num = v => { const n = Number(v); return isNaN(n) ? 0 : n }

    if (chartRange === "d7" || chartRange === "d30") {
      const DAYS = chartRange === "d7" ? 7 : 30
      buckets = Array.from({ length: DAYS }, (_, i) => {
        const d = new Date(today0.getTime() - (DAYS - 1 - i) * 86400000)
        return { date: d, premium: 0, count: 0, newCount: 0, renewCount: 0, ts: d.getTime() }
      })
      const skip = Math.max(1, Math.floor(DAYS / 7))
      labelFmt = (b, i) => (i % skip === 0 || i === buckets.length - 1)
        ? `${b.date.getDate()} ${MONTH_SHORT[b.date.getMonth()]}` : ""
      statsRows.forEach(r => {
        if (!r.created_at) return
        const t = new Date(r.created_at)
        if (isNaN(t)) return
        const td = new Date(t.getFullYear(), t.getMonth(), t.getDate())
        const idx = Math.floor((td.getTime() - buckets[0].ts) / 86400000)
        if (idx >= 0 && idx < buckets.length) {
          buckets[idx].premium += num(r.total_premium)
          buckets[idx].count += 1
          if (r.new_renew === "R" || r.new_renew === "r") buckets[idx].renewCount += 1
          else buckets[idx].newCount += 1
        }
      })
    } else if (chartRange === "w12") {
      const WEEKS = 12
      const dayOfWeek = today0.getDay()
      const offsetToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const thisMon = new Date(today0.getTime() + offsetToMon * 86400000)
      buckets = Array.from({ length: WEEKS }, (_, i) => {
        const d = new Date(thisMon.getTime() - (WEEKS - 1 - i) * 7 * 86400000)
        return { date: d, premium: 0, count: 0, newCount: 0, renewCount: 0, ts: d.getTime() }
      })
      labelFmt = (b) => `${b.date.getDate()} ${MONTH_SHORT[b.date.getMonth()]}`
      statsRows.forEach(r => {
        if (!r.created_at) return
        const t = new Date(r.created_at)
        if (isNaN(t)) return
        const td = new Date(t.getFullYear(), t.getMonth(), t.getDate())
        const days = Math.floor((td.getTime() - buckets[0].ts) / 86400000)
        const idx = Math.floor(days / 7)
        if (idx >= 0 && idx < buckets.length) {
          buckets[idx].premium += num(r.total_premium)
          buckets[idx].count += 1
          if (r.new_renew === "R" || r.new_renew === "r") buckets[idx].renewCount += 1
          else buckets[idx].newCount += 1
        }
      })
    } else {
      const MONTHS = 12
      buckets = Array.from({ length: MONTHS }, (_, i) => {
        const d = new Date(today0.getFullYear(), today0.getMonth() - (MONTHS - 1 - i), 1)
        return { date: d, premium: 0, count: 0, newCount: 0, renewCount: 0, ts: d.getTime() }
      })
      labelFmt = (b) => `${MONTH_SHORT[b.date.getMonth()]} ${(b.date.getFullYear() + 543).toString().slice(-2)}`
      statsRows.forEach(r => {
        if (!r.created_at) return
        const t = new Date(r.created_at)
        if (isNaN(t)) return
        const idx = buckets.findIndex(b => b.date.getFullYear() === t.getFullYear() && b.date.getMonth() === t.getMonth())
        if (idx >= 0) {
          buckets[idx].premium += num(r.total_premium)
          buckets[idx].count += 1
          if (r.new_renew === "R" || r.new_renew === "r") buckets[idx].renewCount += 1
          else buckets[idx].newCount += 1
        }
      })
    }

    const labels = buckets.map(labelFmt)
    const allSeries = [
      { name: "ไฟล์ที่อัปโหลด", color: "#319795", color2: "#4FD1C5", values: buckets.map(b => b.count) },
    ]
    const series = allSeries.filter(s => s.values.reduce((a, b) => a + b, 0) > 0)
    return { months: labels, series, totalAll: buckets.reduce((a, b) => a + b.count, 0) }
  })()

  const expiringSubText = expiryRange === -1
    ? `${expiring.length} รายการ · หมดอายุแล้ว`
    : `${expiring.length} รายการ · ภายใน ${rangeMeta.label}`
  const tabMeta = {
    dashboard: { title: "ภาพรวมระบบ",          sub: "สรุปสถานะกรมธรรม์ประกันภัยรถยนต์" },
    policies:  { title: "กรมธรรม์ทั้งหมด",     sub: `${total.toLocaleString()} รายการในระบบ` },
    expiring:  { title: "กรมธรรม์ใกล้หมดอายุ", sub: expiringSubText },
  }

  const baseRows     = tab === "expiring" ? expiring : rows
  // Client-side pagination สำหรับ expiring (500 รายการ → 10 ต่อหน้า)
  const displayRows  = tab === "expiring"
    ? baseRows.slice((page - 1) * LIMIT, page * LIMIT)
    : baseRows
  const displayTotal = tab === "expiring" ? expiring.length : total
  const displayPages = tab === "expiring" ? Math.max(1, Math.ceil(expiring.length / LIMIT)) : pages

  return (
    <>
      {/* subtitle bar — hidden on dashboard (hero covers it) */}
      {tab !== "dashboard" && (
        <div className="top">
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
          <div className="top-l">
            <div className="top-title">{tabMeta[tab]?.title}</div>
            <div className="top-sub">{tabMeta[tab]?.sub}</div>
          </div>
          {/* (search ที่อยู่บน top bar ถูกเอาออก — ซ้ำกับ big-srch ด้านล่าง) */}
        </div>
      )}

      <div className={`list-layout${previewPolicy ? " has-pvp" : ""}`}>
        <div className="body">

          {tab === "dashboard" && (
            <>
              {/* ── Compact page header — ไม่หนา ไม่มี gradient ── */}
              {(() => {
                const today = new Date()
                const MONTH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
                const DAY = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"]
                const dateLabel = `${DAY[today.getDay()]} · ${today.getDate()} ${MONTH[today.getMonth()]} ${today.getFullYear() + 543}`
                return (
                  <div className="dash-bar">
                    <div className="dash-bar-l">
                      <div className="dash-bar-ttl">ภาพรวมระบบ</div>
                      <div className="dash-bar-sub">สรุปสถานะกรมธรรม์ประกันภัยรถยนต์ทั้งหมดในระบบ</div>
                    </div>
                    <div className="dash-bar-r">
                      <div className="dash-chip">
                        <span className="dash-chip-dot" />
                        {dateLabel}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── 1. เมนูหลัก 4 ใบ — ขึ้นบนสุดตามที่ user ขอ ── */}
              <div className="sec-hd">
                <Ico n="grid" s={14} />
                <span>เมนูหลัก</span>
                <small>เข้าถึงได้รวดเร็ว</small>
              </div>
              <div className="svc-grid">
                {[
                  { path: "/policies", ico: "doc",      cls: "svc-green",  lbl: "กรมธรรม์ทั้งหมด", badge: total.toLocaleString(), bIco: "doc" },
                  { path: "/upload",   ico: "upload",   cls: "svc-blue",   lbl: "เพิ่มกรมธรรม์",   badge: "ใหม่",                bIco: "plus" },
                  { path: "/invoice",  ico: "banknote", cls: "svc-purple", lbl: "สร้างเอกสาร",     badge: "QR",                  bIco: "banknote" },
                  { path: "/expiring", ico: "bell",     cls: "svc-amber",  lbl: "ใกล้หมดอายุ",     badge: expiring.length.toLocaleString(), bIco: "bell", urgent: expiring.length > 0 },
                ].map((c, idx) => (
                  <button key={c.path} className={`svc-card ${c.cls}`} onClick={() => navigate(c.path)}>
                    <svg className="svc-wave" viewBox="0 0 240 240" preserveAspectRatio="none" aria-hidden="true">
                      {idx === 0 && (<>
                        <path d="M0,60 Q60,30 130,70 T240,40 L240,0 L0,0 Z" fill="rgba(255,255,255,.16)" />
                        <path d="M0,150 Q70,180 140,150 T240,170 L240,240 L0,240 Z" fill="rgba(255,255,255,.10)" />
                        <circle cx="210" cy="50" r="36" fill="rgba(255,255,255,.10)" />
                      </>)}
                      {idx === 1 && (<>
                        <path d="M0,90 Q70,40 140,80 T240,50 L240,0 L0,0 Z" fill="rgba(255,255,255,.14)" />
                        <path d="M240,140 Q170,160 100,130 T0,150 L0,240 L240,240 Z" fill="rgba(255,255,255,.10)" />
                        <circle cx="40" cy="60" r="28" fill="rgba(255,255,255,.12)" />
                      </>)}
                      {idx === 2 && (<>
                        <path d="M0,40 Q80,80 160,40 T240,60 L240,0 L0,0 Z" fill="rgba(255,255,255,.16)" />
                        <path d="M0,180 Q60,150 130,170 T240,140 L240,240 L0,240 Z" fill="rgba(255,255,255,.10)" />
                        <circle cx="200" cy="200" r="40" fill="rgba(255,255,255,.10)" />
                      </>)}
                      {idx === 3 && (<>
                        <path d="M0,70 Q90,30 150,80 T240,50 L240,0 L0,0 Z" fill="rgba(255,255,255,.15)" />
                        <path d="M0,160 Q80,200 160,160 T240,180 L240,240 L0,240 Z" fill="rgba(255,255,255,.10)" />
                        <circle cx="30" cy="190" r="32" fill="rgba(255,255,255,.10)" />
                      </>)}
                    </svg>
                    <div className="svc-icon">
                      <Ico n={c.ico} s={36} />
                    </div>
                    <div className="svc-foot">
                      <div className="svc-title">{c.lbl}</div>
                      <div className={`svc-badge ${c.urgent ? "svc-badge-pulse" : ""}`}>
                        <b>{c.badge}</b>
                        <Ico n={c.bIco} s={14} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* ── 2. Charts: Forecast (action) + Line chart (trend) ── */}
              <div className="sec-hd">
                <Ico n="bolt" s={14} />
                <span>งานที่ต้องทำ + สถิติ</span>
                <small>วางแผนติดต่อลูกค้า + แนวโน้มการอัปโหลด</small>
              </div>
              {(() => {
                const lineW = 720, lineH = 220, padL = 44, padR = 60, padT = 24, padB = 58
                const innerW = lineW - padL - padR, innerH = lineH - padT - padB
                const allVals = seriesData.series.flatMap(s => s.values)
                const maxCount = Math.max(1, ...allVals)
                const xAt = (i) => padL + (seriesData.months.length === 1 ? innerW / 2 : (i * innerW) / (seriesData.months.length - 1))
                const yAt = (v) => padT + innerH - (v / maxCount) * innerH
                const smoothPath = (pts) => {
                  if (pts.length < 2) return pts.length === 1 ? `M${pts[0].x},${pts[0].y}` : ""
                  const out = [`M${pts[0].x},${pts[0].y}`]
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
                    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
                    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
                    out.push(`C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`)
                  }
                  return out.join(" ")
                }
                const seriesPaths = seriesData.series.map((s, si) => {
                  const pts = s.values.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
                  return { ...s, pts, d: smoothPath(pts), gradId: `lg-${si}` }
                })
                const yTicks = [0, .25, .5, .75, 1].map(t => ({ y: padT + innerH * t, v: Math.round(maxCount * (1 - t)) }))

                return (
                  <div className="charts-grid">
                    {/* EXPIRY FORECAST — donut focuses on actionable upcoming buckets */}
                    {(() => {
                      const r = 70, c = 2 * Math.PI * r
                      const fcTotal = Math.max(1, expiryForecast.total)
                      let acc = 0
                      const arcs = expiryForecast.buckets.filter(b => b.count > 0).map(b => {
                        const dash = (b.count / fcTotal) * c
                        const offset = -acc
                        acc += dash
                        return { ...b, dash, offset }
                      })
                      return (
                        <div className="chart-card">
                          <div className="chart-hd">
                            <div>
                              <div className="chart-ttl">การหมดอายุล่วงหน้า</div>
                              <div className="chart-sub">เฉพาะที่ยังไม่หมดอายุ — วางแผนติดต่อต่ออายุ</div>
                            </div>
                            <button className="chart-tag" onClick={() => navigate("/expiring")}
                              style={{ cursor: "pointer", fontFamily: "inherit", border: "1px solid var(--blue-mid)" }}>
                              ดูทั้งหมด →
                            </button>
                          </div>

                          {(expiryForecast.expiredCount > 0 || expiryForecast.unknownCount > 0) && (
                            <div className="fc-meta">
                              {expiryForecast.expiredCount > 0 && (
                                <div className="fc-meta-pill fc-meta-expired" onClick={() => navigate("/expiring")}>
                                  <span className="lg-dot" style={{ background: "linear-gradient(135deg,#DC2626,#EF4444)" }} />
                                  <span>หมดอายุแล้ว</span>
                                  <b>{expiryForecast.expiredCount.toLocaleString()}</b>
                                </div>
                              )}
                              {expiryForecast.unknownCount > 0 && (
                                <div className="fc-meta-pill">
                                  <span className="lg-dot" style={{ background: "var(--brd2)" }} />
                                  <span>ไม่ระบุวันหมด</span>
                                  <b>{expiryForecast.unknownCount.toLocaleString()}</b>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="chart-bd donut-row">
                            <div className="donut-wrap fc-donut-wrap">
                              <svg viewBox="0 0 180 180" width="180" height="180" className="donut-svg">
                                <defs>
                                  {arcs.map((a, i) => (
                                    <linearGradient key={i} id={`fc-grad-${a.key}`} x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor={a.c1} />
                                      <stop offset="100%" stopColor={a.c2} />
                                    </linearGradient>
                                  ))}
                                </defs>
                                <circle cx="90" cy="90" r={r} fill="none" stroke="var(--brd)" strokeWidth="14" />
                                {arcs.map((a, i) => (
                                  <circle key={i} cx="90" cy="90" r={r} fill="none" stroke={`url(#fc-grad-${a.key})`} strokeWidth="14"
                                    strokeDasharray={`${a.dash} ${c}`}
                                    strokeDashoffset={a.offset}
                                    strokeLinecap="butt"
                                    style={{ transition: "stroke-dasharray .8s var(--ez-out), stroke-dashoffset .8s var(--ez-out)" }}
                                  />
                                ))}
                              </svg>
                              <div className="donut-center">
                                <div className="donut-num">{expiryForecast.total.toLocaleString()}</div>
                                <div className="donut-lbl">ยังคุ้มครองอยู่</div>
                              </div>
                            </div>
                            <div className="donut-legend fc-legend">
                              {expiryForecast.buckets.map(b => {
                                const pct = expiryForecast.total > 0 ? Math.round((b.count / expiryForecast.total) * 100) : 0
                                const clickable = (b.key === "30" || b.key === "60" || b.key === "90") && b.count > 0
                                return (
                                  <div key={b.key}
                                    className={`fc-lg-row ${b.urgent ? "fc-urgent" : ""} ${clickable ? "fc-clickable" : ""}`}
                                    onClick={() => clickable && navigate("/expiring")}>
                                    <span className="lg-dot" style={{ background: `linear-gradient(135deg, ${b.c1}, ${b.c2})` }} />
                                    <span className="lg-lbl">{b.label}</span>
                                    <span className="lg-val">{b.count.toLocaleString()}</span>
                                    <span className="lg-pct">{pct}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* สถิติการทำงาน — business KPIs */}
                    {(() => {
                      const totalCust = new Set(statsRows.map(r => r.insured_name).filter(Boolean)).size
                      const sumNet    = statsRows.reduce((s, r) => s + (Number(r.net_premium) || 0), 0)
                      const sumSI     = statsRows.reduce((s, r) => s + (Number(r.sum_insured) || 0), 0)
                      const cntNew    = statsRows.filter(r => (r.new_renew || "").toUpperCase() === "N").length
                      const cntRen    = statsRows.filter(r => (r.new_renew || "").toUpperCase() === "R").length
                      const cntKnown  = cntNew + cntRen
                      const avgPrem   = statsRows.length > 0 ? sumPremium / statsRows.length : 0
                      // Top 5 ยี่ห้อรถ
                      const makeMap = {}
                      statsRows.forEach(r => {
                        const k = (r.car_make || "").trim().toUpperCase()
                        if (!k) return
                        makeMap[k] = (makeMap[k] || 0) + 1
                      })
                      const topMakes = Object.entries(makeMap)
                        .sort((a, b) => b[1] - a[1]).slice(0, 5)
                      const maxMake = topMakes[0]?.[1] || 1
                      const fmtM = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(0) + "k" : Math.round(n).toLocaleString()
                      return (
                        <div className="chart-card">
                          <div className="chart-hd">
                            <div>
                              <div className="chart-ttl">สถิติการทำงาน</div>
                              <div className="chart-sub">ภาพรวมข้อมูลทั้งหมดในระบบ</div>
                            </div>
                          </div>
                          <div className="chart-bd stats-bd">
                            <div className="stats-grid">
                              <div className="stat-tile stat-teal">
                                <div className="stat-lbl">เบี้ยรวม</div>
                                <div className="stat-val">฿{fmtM(sumPremium)}</div>
                              </div>
                              <div className="stat-tile stat-blue">
                                <div className="stat-lbl">ลูกค้า (ไม่ซ้ำ)</div>
                                <div className="stat-val">{totalCust.toLocaleString()}</div>
                              </div>
                              <div className="stat-tile stat-purple">
                                <div className="stat-lbl">เบี้ยเฉลี่ย / กธ</div>
                                <div className="stat-val">฿{Math.round(avgPrem).toLocaleString()}</div>
                              </div>
                              <div className="stat-tile stat-amber">
                                <div className="stat-lbl">ทุนเอาประกันรวม</div>
                                <div className="stat-val">฿{fmtM(sumSI)}</div>
                              </div>
                            </div>
                            {cntKnown > 0 && (
                              <div className="stats-nr">
                                <div className="nr-bar">
                                  <div className="nr-seg nr-new" style={{ flex: cntNew }} title={`ใหม่ ${cntNew}`} />
                                  <div className="nr-seg nr-ren" style={{ flex: cntRen }} title={`ต่ออายุ ${cntRen}`} />
                                </div>
                                <div className="nr-legend">
                                  <span><span className="nr-dot nr-new" /> ใหม่ <b>{cntNew.toLocaleString()}</b> ({Math.round(cntNew / cntKnown * 100)}%)</span>
                                  <span><span className="nr-dot nr-ren" /> ต่ออายุ <b>{cntRen.toLocaleString()}</b> ({Math.round(cntRen / cntKnown * 100)}%)</span>
                                </div>
                              </div>
                            )}
                            {topMakes.length > 0 && (
                              <div className="stats-makes">
                                <div className="sm-hd">ยี่ห้อรถยอดนิยม</div>
                                <div className="sm-list">
                                  {topMakes.map(([name, count], i) => (
                                    <div key={name} className="sm-row">
                                      <span className="sm-rank">{i + 1}</span>
                                      <span className="sm-name">{name}</span>
                                      <div className="sm-bar-wrap">
                                        <div className="sm-bar" style={{ width: `${(count / maxMake) * 100}%` }} />
                                      </div>
                                      <span className="sm-cnt">{count.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )
              })()}
            </>
          )}

          {/* ── Search + Excel export ── */}
          <div className="filter-wrap" style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
            <div className="big-srch" style={{ flex: 1 }}>
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
              className="btn btn-w"
              style={{ flexShrink: 0, padding: "0 20px", fontSize: 14.5, fontWeight: 600 }}
              title="ดาวน์โหลด Excel (CSV รองรับภาษาไทย)"
              onClick={() => {
                const exportRows = (tab === "dashboard" || tab === "expiring") && allRows.length ? allRows : rows
                const targetRows = tab === "expiring" ? expiring : exportRows
                const HEADERS = [
                  "เลขกรมธรรม์","ผู้เอาประกัน","เบอร์","ทะเบียน","จังหวัด",
                  "ยี่ห้อ","รุ่น","ปีรถ","เลขตัวถัง",
                  "เริ่มคุ้มครอง","สิ้นสุดคุ้มครอง","วันที่บันทึก",
                  "ประเภท","ใหม่/ต่ออายุ","ตัวแทน",
                  "เบี้ยสุทธิ","อากร","VAT","เบี้ยรวม","ทุนเอาประกัน"
                ]
                const csvEscape = v => {
                  const s = v == null ? "" : String(v)
                  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s
                }
                const rowsCsv = targetRows.map(r => [
                  r.policy_number, r.insured_name, r.phone, r.license_plate, r.license_province,
                  r.car_make, r.car_model, r.car_year, r.chassis_no,
                  r.coverage_start, r.coverage_end, r.created_at ? String(r.created_at).slice(0, 10) : "",
                  r.policy_type, r.new_renew, r.broker_name,
                  r.net_premium, r.stamp_duty, r.vat, r.total_premium, r.sum_insured
                ].map(csvEscape).join(","))
                const csv = "﻿" + [HEADERS.join(","), ...rowsCsv].join("\r\n")  // BOM for Excel UTF-8
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                const dt = new Date()
                const stamp = `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,"0")}${String(dt.getDate()).padStart(2,"0")}-${String(dt.getHours()).padStart(2,"0")}${String(dt.getMinutes()).padStart(2,"0")}`
                a.href = url
                a.download = `กรมธรรม์-${stamp}.csv`
                document.body.appendChild(a); a.click(); document.body.removeChild(a)
                URL.revokeObjectURL(url)
                notify(`ดาวน์โหลด ${targetRows.length.toLocaleString()} รายการเป็น Excel/CSV เรียบร้อย`)
              }}
            >
              <Ico n="download" s={17} />
              Export Excel
            </button>
          </div>

          {/* ── Expiring page: stat strip + filter chips ── */}
          {tab === "expiring" && (() => {
            // เกาะข้อมูลจาก statsRows (allRows ทั้งหมด) — แตกย่อยตามช่วงเวลา
            const now = new Date()
            const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const counts = { d1: 0, w1: 0, m1: 0, m2: 0, m3: 0, expired: 0 }
            statsRows.forEach(r => {
              if (!r.coverage_end) return
              const t = new Date(r.coverage_end)
              if (isNaN(t)) return
              const dl = Math.floor((t - today0) / 86400000)
              if (dl < 0) counts.expired += 1
              else {
                if (dl <= 1)  counts.d1 += 1
                if (dl <= 7)  counts.w1 += 1
                if (dl <= 30) counts.m1 += 1
                if (dl <= 60) counts.m2 += 1
                if (dl <= 90) counts.m3 += 1
              }
            })
            const rangeCount = (val) => {
              if (val === -1) return counts.expired
              if (val === 1)  return counts.d1
              if (val === 7)  return counts.w1
              if (val === 30) return counts.m1
              if (val === 60) return counts.m2
              if (val === 90) return counts.m3
              return 0
            }
            return (
              <>
                <div className="exp-stats">
                  {EXPIRY_RANGES.map(opt => {
                    const active = expiryRange === opt.val
                    const cnt = rangeCount(opt.val)
                    return (
                      <button key={opt.val}
                        className={`exp-stat ${active ? "exp-stat-on" : ""} exp-stat-${opt.val === -1 ? "expired" : (opt.val <= 1 ? "urg1" : opt.val <= 7 ? "urg7" : opt.val <= 30 ? "urg30" : opt.val <= 60 ? "urg60" : "urg90")}`}
                        onClick={() => setExpiryRange(opt.val)}>
                        <div className="exp-stat-hd">
                          <span className="exp-stat-icn"><Ico n={opt.ico} s={16} /></span>
                          <span className="exp-stat-lbl">{opt.label}</span>
                        </div>
                        <div className="exp-stat-num">{cnt.toLocaleString()}</div>
                      </button>
                    )
                  })}
                </div>
              </>
            )
          })()}

          <PolicyTable
            rows={displayRows}
            loading={loading}
            total={displayTotal}
            page={page}
            pages={displayPages}
            setPage={setPage}
            onRow={r => setPreviewPolicy(prev => prev?.id === r.id ? null : r)}
            onRowHover={prefetchPolicy}
            activeId={previewPolicy?.id}
            pageOffset={(page - 1) * LIMIT}
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
