import { useState, useEffect, useRef } from "react"
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom"
import { policyTypeCategory, dedupLatestByCustomer } from "../helpers"
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
  const [searchParams, setSearchParams] = useSearchParams()
  const typeFilter = searchParams.get("type")  // motor | prb | fire | pa | null
  const { search, setSearch, page, setPage, notify, setExpiringCount } = useOutletContext()

  const [rows, setRows]               = useState([])
  const [allRows, setAllRows]         = useState([])  // ⚡ สำหรับ dashboard analytics (ทั้งหมด ไม่ใช่หน้านี้)
  const [todayAttachments, setTodayAttachments] = useState({}) // { policyId: [att, ...] } สำหรับนับ พ.ร.บ.
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [previewPolicy, setPreviewPolicy] = useState(null)
  // default: "เพิ่มล่าสุด" = coverage_start desc (กรมธรรม์ที่เริ่มล่าสุด)
  const [sortKey, setSortKey]         = useState("coverage_start")
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
    { val: 1,   label: "ภายใน 1 วัน",    shortLabel: "วันนี้",        ico: "warn", hint: "ควรติดต่อทันที" },
    { val: 7,   label: "ภายใน 7 วัน",    shortLabel: "7 วัน",         ico: "bell", hint: "ติดตามภายในสัปดาห์นี้" },
    { val: 30,  label: "ภายใน 1 เดือน",  shortLabel: "1 เดือน",       ico: "clock", hint: "กำลังติดตามในเดือนนี้" },
    { val: 60,  label: "ภายใน 2 เดือน",  shortLabel: "2 เดือน",       ico: "cal", hint: "เตรียมรายชื่อล่วงหน้า" },
    { val: 90,  label: "ภายใน 3 เดือน",  shortLabel: "3 เดือน",       ico: "cal", hint: "วางแผนติดตามต่อเนื่อง" },
    { val: -1,  label: "หมดอายุแล้ว",   shortLabel: "หมดอายุแล้ว",   ico: "xc", hint: "ติดต่อเพื่อต่ออายุ" },
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
  //
  // ⚡ ป้องกัน refetch สิ้นเปลือง: ถ้าเป็น tab ที่ paginate ฝั่ง client (policies/dashboard)
  //    page จะถูกล็อกเป็น 1 → useEffect ไม่ควร refire เมื่อ user แค่กด next page
  //    → ใช้ pageForFetch เป็น dep แทน page ดิบ
  const pageForFetch = (tab === "policies" || tab === "dashboard") ? 1 : page
  useEffect(() => {
    let cancelled = false
    const params = { page: pageForFetch, limit: LIMIT, sort: sortKey, order: sortDir }
    if (debouncedSearch) params.search = debouncedSearch
    if (status)   params.status    = status
    if (dateFrom) params.date_from = dateFrom
    if (dateTo)   params.date_to   = dateTo
    if (hasPdf)   params.has_pdf   = hasPdf

    // ── /policies + /dashboard: ดึงมาทั้งหมดเพื่อจัดกลุ่มลูกค้า แล้ว paginate client-side ──
    // ⚠️ ล็อก page=1 — ถ้าปล่อยให้ส่ง page>1 พร้อม limit=20000 server จะ return [] (เกิน range)
    if (tab === "policies" || tab === "dashboard") {
      params.limit = 20000
      params.page  = 1
    }
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
  }, [pageForFetch, debouncedSearch, sortKey, sortDir, status, dateFrom, dateTo, hasPdf, tab, expiryRange])
  useEffect(() => { setPreviewPolicy(null); setPage(1) }, [tab])  // reset preview + page เมื่อสลับ tab
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

  // expiring: ใช้ allRows เป็นแหล่งข้อมูลเดียว — กัน chip count กับ table mismatch
  // (เดิมใช้ rows จาก backend filter ทำให้ตัวเลขในชิปกับตารางไม่ตรงกัน)
  const _expiringSource = (tab === "dashboard" || tab === "expiring") && allRows.length ? allRows : rows
  const expiring = tab === "expiring"
    ? (() => {
        // filter ตาม expiryRange เดียวกับชิปด้านบน
        const today0 = new Date(new Date().setHours(0, 0, 0, 0))
        return _expiringSource
          .filter(r => {
            if (!r.coverage_end) return false
            const t = new Date(r.coverage_end)
            if (isNaN(t)) return false
            const dl = Math.floor((t - today0) / 86400000)
            if (expiryRange === -1) return dl < 0
            return dl >= 0 && dl <= expiryRange
          })
          .sort((a, b) => new Date(a.coverage_end) - new Date(b.coverage_end))
      })()
    : _expiringSource.filter(r => {
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

  // ── 4 ประเภทประกัน (Baby78 logic): Motor / PRB / Fire / PA ──
  const typeCounts = (() => {
    const c = { motor: 0, prb: 0, fire: 0, pa: 0 }
    statsRows.forEach(r => {
      const pt = (r.policy_type || "").toUpperCase().trim()
      if (pt === "M") c.motor += 1
      else if (pt === "P") c.prb += 1
      else if (["FIRE","ASSET","IAR","BURGLAR"].includes(pt)) c.fire += 1
      else if (["PA","TA","3RD","PUBLIC","MISC","GOLF","MARINE"].includes(pt)) c.pa += 1
      else c.pa += 1  // unknown → bucket อื่นๆ
    })
    return c
  })()

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
    policies:  { title: "กรมธรรม์ทั้งหมด",     sub: `${total.toLocaleString()} ฉบับในระบบ · 1 รายชื่อ = 1 แถว (ฉบับล่าสุด)` },
    expiring:  { title: "กรมธรรม์ใกล้หมดอายุ", sub: expiringSubText },
  }

  // ── /policies + /dashboard: dedup ตามลูกค้า + sort + paginate client-side ──
  // ⚠️ ต้องทำตามลำดับ: type filter (ตัดประเภทบนข้อมูลดิบ) → dedup → sort → paginate
  //    ถ้า dedup ก่อนแล้วค่อย type filter คนที่ ฉบับล่าสุด ไม่ตรงประเภท จะหายไปทั้งที่มีกรมธรรม์ประเภทนั้น
  const isPoliciesTab = tab === "policies" || tab === "dashboard"
  const policiesDeduped = isPoliciesTab ? (() => {
    // 1) type filter บน raw rows ก่อน
    const typeFiltered = typeFilter
      ? rows.filter(r => policyTypeCategory(r.policy_type) === typeFilter)
      : rows
    // 2) dedup ตามชื่อ (เก็บฉบับล่าสุดในขอบเขตประเภทที่กรอง)
    const grouped = dedupLatestByCustomer(typeFiltered)
    // 3) sort client-side
    const dir = sortDir === "asc" ? 1 : -1
    return [...grouped].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return -1 * dir
      if (av > bv) return  1 * dir
      return 0
    })
  })() : null

  const baseRows = tab === "expiring" ? expiring
                  : isPoliciesTab ? policiesDeduped
                  : rows
  // ── type filter (?type=motor|prb|fire|pa) — เฉพาะ tab ที่ยังไม่ filter ภายใน ──
  const typeFilteredRows = (typeFilter && !isPoliciesTab)
    ? baseRows.filter(r => policyTypeCategory(r.policy_type) === typeFilter)
    : baseRows
  // Client-side pagination
  const needsClientPage = tab === "expiring" || isPoliciesTab || typeFilter
  const displayRows  = needsClientPage
    ? typeFilteredRows.slice((page - 1) * LIMIT, page * LIMIT)
    : typeFilteredRows
  const displayTotal = tab === "expiring" ? expiring.length
                       : isPoliciesTab ? typeFilteredRows.length
                       : typeFilter ? typeFilteredRows.length
                       : total
  const displayPages = needsClientPage
    ? Math.max(1, Math.ceil(displayTotal / LIMIT))
    : pages

  return (
    <>
      {/* subtitle bar — hidden on dashboard (hero covers it) */}
      {tab !== "dashboard" && (
        <div className="top">
          <button className="list-back" onClick={() => navigate("/")}>
            <Ico n="chevL" s={21} />
            <span>กลับหน้าหลัก</span>
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

              {/* ── แยก "ข้อมูลสรุป" ออกจาก "งานที่ต้องทำ" เพื่อให้สแกนง่าย ── */}
              <div className="sec-hd">
                <Ico n="grid" s={14} />
                <span>สรุปข้อมูลสำคัญ</span>
                <small>กดเพื่อดูรายละเอียด</small>
              </div>
              <div className="overview-stat-grid">
                {[
                  { path: "/policies", kind: "policies", lbl: "กรมธรรม์ทั้งหมด", value: total.toLocaleString(), detail: "รายการที่บันทึกในระบบ", ico: "list" },
                  { path: "/expiring", kind: "expiring", lbl: "กรมธรรม์ใกล้หมดอายุ", value: expiring.length.toLocaleString(), detail: "ภายใน 30 วัน", ico: "bell", urgent: expiring.length > 0 },
                ].map(m => (
                  <button key={m.path} className={`overview-stat overview-stat-${m.kind}`}
                    onClick={() => navigate(m.path)} aria-label={`ดู${m.lbl}`}>
                    <span className="overview-stat-icon"><Ico n={m.ico} s={22} /></span>
                    <span className="overview-stat-copy">
                      <span className="overview-stat-label">{m.lbl}</span>
                      <strong>{m.value}</strong>
                      <span className="overview-stat-detail">{m.detail}</span>
                    </span>
                    <span className="overview-stat-end">
                      {m.urgent && (
                        <span className="quick-action-alert">ต้องติดตาม</span>
                      )}
                      <Ico n="chevR" s={18} />
                    </span>
                  </button>
                ))}
              </div>

              <div className="sec-hd dashboard-actions-hd">
                <Ico n="upload" s={14} />
                <span>งานด่วน</span>
                <small>เลือกงานที่ต้องการทำ</small>
              </div>
              <div className="dashboard-action-row">
                {[
                  { path: "/upload", label: "เพิ่มกรมธรรม์", desc: "อัปโหลด PDF ให้ AI ช่วยกรอก", ico: "upload", primary: true },
                  { path: "/batch", label: "อัปโหลดหลายไฟล์", desc: "จัดการเอกสารเป็นชุด", ico: "inbox" },
                  { path: "/invoice", label: "สร้างใบแจ้งหนี้", desc: "สร้าง QR PromptPay และพิมพ์", ico: "banknote" },
                ].map(action => (
                  <button key={action.path} className={`dashboard-action${action.primary ? " dashboard-action-primary" : ""}`}
                    onClick={() => navigate(action.path)}>
                    <span className="dashboard-action-icon"><Ico n={action.ico} s={21} /></span>
                    <span><strong>{action.label}</strong><small>{action.desc}</small></span>
                    <Ico n="chevR" s={18} />
                  </button>
                ))}
              </div>

              <div className="dashboard-search-heading">
                <div>
                  <div className="dashboard-search-title">ค้นหากรมธรรม์</div>
                  <div className="dashboard-search-sub">ค้นหาจากชื่อลูกค้า ทะเบียนรถ หรือเลขกรมธรรม์</div>
                </div>
              </div>

            </>
          )}

          {/* ── Active type filter chip ── */}
          {typeFilter && (() => {
            const LABEL = { motor: "ประกันรถยนต์", prb: "ประกัน พ.ร.บ.", fire: "อัคคีภัย", pa: "PA / TA / อื่นๆ" }
            const STYLE = { motor: { bg: "#E5EEF0", fg: "#245863" }, prb: { bg: "#E6EDE9", fg: "#2E5044" }, fire: { bg: "#F0EAE4", fg: "#6A3A24" }, pa: { bg: "#E7E9EF", fg: "#3A3E62" } }
            const s = STYLE[typeFilter] || { bg: "var(--sur2)", fg: "var(--t1)" }
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 15, color: "var(--t3)" }}>กรองตามประเภท:</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", borderRadius: 999,
                  background: s.bg, color: s.fg, fontSize: 15, fontWeight: 600,
                }}>
                  {LABEL[typeFilter] || typeFilter}
                  <button
                    onClick={() => { setSearchParams({}); setPage(1) }}
                    style={{ background: "transparent", border: "none", color: s.fg, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center" }}
                    title="ล้างกรอง">
                    <Ico n="x" s={16} />
                  </button>
                </span>
              </div>
            )
          })()}

          {/* ── Search + Excel export ── */}
          <div className="filter-wrap" style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
            <div className="big-srch" style={{ flex: 1 }}>
              <Ico n="search" s={20} />
              <input
                placeholder="พิมพ์ค้นหา — ทะเบียนรถ, ชื่อ-นามสกุล, เลขกรมธรรม์, ที่อยู่"
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
            // ── 12-month forecast: นับจำนวนกรมธรรม์ที่จะหมดอายุแต่ละเดือน ──
            const MONTH_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
            const futureMonths = Array.from({ length: 12 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
              return {
                date: d,
                key: `${d.getFullYear()}-${d.getMonth()}`,
                label: `${MONTH_TH[d.getMonth()]} ${(d.getFullYear() + 543).toString().slice(-2)}`,
                count: 0,
                premium: 0,
                isCurrent: i === 0,
              }
            })
            const futureMap = new Map(futureMonths.map((m, i) => [m.key, i]))
            statsRows.forEach(r => {
              if (!r.coverage_end) return
              const t = new Date(r.coverage_end)
              if (isNaN(t) || t < today0) return
              const idx = futureMap.get(`${t.getFullYear()}-${t.getMonth()}`)
              if (idx != null) {
                futureMonths[idx].count += 1
                futureMonths[idx].premium += Number(r.total_premium) || 0
              }
            })
            const lineMax    = Math.max(1, ...futureMonths.map(m => m.count))
            const lineTotal  = futureMonths.reduce((a, b) => a + b.count, 0)
            const linePremium = futureMonths.reduce((a, b) => a + b.premium, 0)
            const lW = 1100, lH = 280, lPL = 50, lPR = 20, lPT = 28, lPB = 52
            const iW = lW - lPL - lPR, iH = lH - lPT - lPB
            const xAt = (i) => lPL + (i * iW) / (futureMonths.length - 1)
            const yAt = (v) => lPT + iH - (v / lineMax) * iH
            const pts = futureMonths.map((m, i) => ({ x: xAt(i), y: yAt(m.count), ...m }))
            const smooth = (pts) => {
              if (pts.length < 2) return ""
              const out = [`M${pts[0].x},${pts[0].y}`]
              for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
                const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
                const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
                out.push(`C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`)
              }
              return out.join(" ")
            }
            const linePath = smooth(pts)
            const areaPath = `${linePath} L${pts[pts.length-1].x},${lH-lPB} L${pts[0].x},${lH-lPB} Z`
            const yTicks   = [0, 0.25, 0.5, 0.75, 1].map(t => ({ y: lPT + iH * t, v: Math.round(lineMax * (1 - t)) }))
            const baht = (n) => "฿" + Math.round(n).toLocaleString()
            return (
              <>
                <div className="expiring-range-heading">
                  <div>
                    <div className="expiring-range-title">เลือกช่วงเวลาที่ต้องติดตาม</div>
                    <div className="expiring-range-sub">แตะช่วงเวลาเพื่อดูรายชื่อลูกค้าและวันหมดอายุ</div>
                  </div>
                </div>
                <div className="exp-stats">
                  {EXPIRY_RANGES.map(opt => {
                    const active = expiryRange === opt.val
                    const cnt = rangeCount(opt.val)
                    return (
                      <button key={opt.val}
                        className={`exp-stat ${active ? "exp-stat-on" : ""} exp-stat-${opt.val === -1 ? "expired" : (opt.val <= 1 ? "urg1" : opt.val <= 7 ? "urg7" : opt.val <= 30 ? "urg30" : opt.val <= 60 ? "urg60" : "urg90")}`}
                        onClick={() => setExpiryRange(opt.val)}
                        aria-pressed={active}>
                        <div className="exp-stat-hd">
                          <span className="exp-stat-icn"><Ico n={opt.ico} s={16} /></span>
                          <span className="exp-stat-lbl">{opt.label}</span>
                        </div>
                        <div className="exp-stat-num">{cnt.toLocaleString()} <span>รายการ</span></div>
                        <div className="exp-stat-hint">{active ? "กำลังแสดงรายการนี้" : opt.hint}</div>
                      </button>
                    )
                  })}
                </div>
                <div className="expiring-selected-summary" aria-live="polite">
                  <span className="expiring-selected-dot" />
                  <strong>กำลังแสดง {rangeCount(expiryRange).toLocaleString()} กรมธรรม์</strong>
                  <span>เรียงจากวันหมดอายุใกล้ที่สุด</span>
                </div>

                {/* ── 12-month forecast chart ── */}
                <div className="card" style={{ marginBottom: 16, padding: "18px 20px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)" }}>
                        <Ico n="bell" s={16} /> การหมดอายุล่วงหน้า 12 เดือน
                      </div>
                      <div style={{ fontSize: 13.5, color: "var(--t3)", marginTop: 4 }}>
                        รวม <b style={{ color: "var(--t1)" }}>{lineTotal.toLocaleString()}</b> กรมธรรม์
                        {linePremium > 0 && <> · เบี้ยรวม <b style={{ color: "var(--t1)" }}>{baht(linePremium)}</b></>}
                      </div>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <svg viewBox={`0 0 ${lW} ${lH}`} width="100%" height={lH} preserveAspectRatio="xMidYMid meet" style={{ display: "block", minWidth: 600 }}>
                      <defs>
                        <linearGradient id="exp-line-area-2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="var(--blue)" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="var(--blue)" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {yTicks.map((t, i) => (
                        <g key={i}>
                          <line x1={lPL} x2={lW - lPR} y1={t.y} y2={t.y}
                                stroke="var(--brd)" strokeWidth="1"
                                strokeDasharray={i === yTicks.length - 1 ? "0" : "3 4"}
                                opacity={i === yTicks.length - 1 ? 0.9 : 0.5} />
                          <text x={lPL - 8} y={t.y + 4} textAnchor="end"
                                fontSize="12" fill="var(--t3)" fontFamily="inherit">{t.v}</text>
                        </g>
                      ))}
                      <path d={areaPath} fill="url(#exp-line-area-2)" />
                      <path d={linePath} fill="none" stroke="var(--blue)"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r={p.isCurrent ? 6 : 4}
                                  fill="#fff" stroke="var(--blue)" strokeWidth="2.5" />
                          {p.count > 0 && (
                            <text x={p.x} y={p.y - 12} textAnchor="middle"
                                  fontSize="12" fontWeight="700" fill="var(--t1)" fontFamily="inherit">
                              {p.count}
                            </text>
                          )}
                          <text x={p.x} y={lH - lPB + 22} textAnchor="middle"
                                fontSize="12" fill={p.isCurrent ? "var(--blue)" : "var(--t3)"}
                                fontWeight={p.isCurrent ? 700 : 500} fontFamily="inherit">
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
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
            onRow={r => navigate(`/policies/${r.id}`, { state: { policy: r } })}
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
