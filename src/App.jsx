import { useState, useEffect, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom"
import CSS from "./styles"
import { Ico } from "./icons"
import { Toast } from "./components/Toast"
import { ListPage } from "./pages/ListPage"        // หน้าแรก → eager
// ── lazy load หน้าอื่น เพื่อให้ initial bundle เล็ก โหลดหน้าแรกเร็ว ──
const UploadPage  = lazy(() => import("./pages/UploadPage").then(m  => ({ default: m.UploadPage })))
const BatchUploadPage = lazy(() => import("./pages/BatchUploadPage").then(m => ({ default: m.BatchUploadPage })))
const ManualPage  = lazy(() => import("./pages/ManualPage").then(m  => ({ default: m.ManualPage })))
const DetailPage  = lazy(() => import("./pages/DetailPage").then(m  => ({ default: m.DetailPage })))
const InvoicePage = lazy(() => import("./pages/InvoicePage").then(m => ({ default: m.InvoicePage })))
const QuotationPage = lazy(() => import("./pages/QuotationPage").then(m => ({ default: m.QuotationPage })))

const _Loading = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <div className="spin" style={{ width: 32, height: 32, borderWidth: 3 }} />
  </div>
)
/* ── Layout shell (nav + outlet) ── */
function Layout({ onLogout }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [darkMode,      setDarkMode]      = useState(() => localStorage.getItem("theme") === "dark")
  const [largeText,     setLargeText]     = useState(() => localStorage.getItem("large_text") === "true")
  const [mobileMenu,    setMobileMenu]    = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "true")
  const [search,        setSearch]        = useState("")
  const [page,          setPage]          = useState(1)
  const [toast,         setToast]         = useState(null)
  const [expiringCount, setExpiringCount] = useState(0)
  const [serverStatus,  setServerStatus]  = useState("checking") // checking | ready | error

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode)
    localStorage.setItem("theme", darkMode ? "dark" : "light")
  }, [darkMode])

  // Reading comfort is especially useful for policy numbers and dates.  Keep
  // the preference on this device so it does not need to be set every visit.
  useEffect(() => {
    document.body.classList.toggle("text-large", largeText)
    localStorage.setItem("large_text", String(largeText))
  }, [largeText])

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Probe backend /health — Render free tier cold start อาจรอ ~50s
  // ระหว่าง probe → จุดเหลือง, ตอบแล้ว → เขียว, ครบ window แล้วยังไม่ตอบ → แดง
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api"
    const healthUrl = apiBase.replace(/\/api\/?$/, "") + "/health"
    let cancelled = false
    let timer

    const pingOnce = async () => {
      try {
        const ctl = new AbortController()
        const to = setTimeout(() => ctl.abort(), 8000)
        const res = await fetch(healthUrl, { method: "GET", cache: "no-store", signal: ctl.signal })
        clearTimeout(to)
        return res.ok
      } catch {
        return false
      }
    }

    const probe = async () => {
      setServerStatus(s => (s === "ready" ? "checking" : s))
      // ลอง 12 ครั้ง × 8s timeout + 2s delay ≈ window ~120s ครอบคลุม cold start
      for (let i = 0; i < 12; i++) {
        if (cancelled) return
        if (await pingOnce()) {
          if (!cancelled) setServerStatus("ready")
          return
        }
        await new Promise(r => { timer = setTimeout(r, 2000) })
      }
      if (!cancelled) setServerStatus("error")
    }

    probe()
    const onVisible = () => {
      if (document.visibilityState === "visible") probe()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  const statusMeta = {
    checking: { color: "#CA8A04", shadow: "rgba(202,138,4,.35)", label: "กำลังปลุกเซิร์ฟเวอร์..." },
    ready:    { color: "#22C55E", shadow: "rgba(34,197,94,.3)",  label: "ระบบพร้อมใช้งาน" },
    error:    { color: "#991B1B", shadow: "rgba(153,27,27,.28)", label: "เซิร์ฟเวอร์ไม่ตอบสนอง" },
  }[serverStatus]

  // reset page when search changes
  const handleSearch = v => { setSearch(v); setPage(1) }

  const submitHeaderSearch = e => {
    e.preventDefault()
    if (!search.trim()) return
    navigate("/policies")
    setPage(1)
  }

  const notify = (msg, type = "success") => setToast({ msg, type })

  const path = location.pathname

  // เมนูหลักเหลือเฉพาะงานที่เปิดใช้งานจริง เพื่อลดตัวเลือกที่ไม่จำเป็น
  const NAV_VIEW = [
    { path: "/", ico: "grid", label: "ภาพรวม", desc: "ค้นหาและดูรายการกรมธรรม์", badge: 0 },
  ]
  const NAV_ACTION = [
    { path: "/upload", ico: "upload", label: "เพิ่มเอกสาร", desc: "อ่านและบันทึก PDF หนึ่งไฟล์" },
    { path: "/batch", ico: "inbox", label: "จัดการเอกสาร", desc: "นำเข้าหลายไฟล์ ตรวจข้อมูล และดูเอกสารรอตรวจ" },
  ]
const navTo = p => { navigate(p); setMobileMenu(false); setSearch(""); setPage(1) }
  const isActive = navPath => navPath === "/" ? path === "/" : path.startsWith(navPath)

  // ⚡ Prefetch route chunk on hover → กดแล้วเปิดทันที (chunk loaded อยู่แล้ว)
  const prefetched = new Set()
  const prefetch = (p) => {
    if (prefetched.has(p)) return
    prefetched.add(p)
    switch (p) {
      case "/upload":   import("./pages/UploadPage"); break
      case "/batch":    import("./pages/BatchUploadPage"); break
      case "/invoice":  import("./pages/InvoicePage"); break
      case "/quotation": import("./pages/QuotationPage"); break
      case "/manual":   import("./pages/ManualPage"); break
      // DetailPage prefetch — เผื่อ user คลิก row
      default: if (p.startsWith("/policies/")) import("./pages/DetailPage")
    }
  }

  const navItem = (it) => {
    const active = !it.disabled && isActive(it.path)
    return (
      <button key={it.path} type="button"
        className={`sb-nav-link${active ? " on" : ""}`}
        onClick={() => !it.disabled && navTo(it.path)}
        disabled={it.disabled}
        title={it.desc}
        aria-current={active ? "page" : undefined}
        onMouseEnter={() => prefetch(it.path)}
      >
        <span className="sb-nav-icon"><Ico n={it.ico} s={18} /></span>
        <span className="sb-nav-label">{it.label}</span>
        {!it.disabled && it.badge > 0 && <span className="sb-nav-badge">{it.badge}</span>}
      </button>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`app${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>

        {/* ── TOPNAV ── */}
        <header className="sb">
          {/* โลโก้ */}
          <div className="sb-logo" style={{ cursor: "pointer" }} onClick={() => navTo("/")}>
            <img src="/logo_no_bg.png" alt="ประกันคุ้มภัย" style={{ height: 56, width: 56, objectFit: "contain" }} />
            <img src="/image.png" alt="" style={{ height: 40, width: 40, objectFit: "cover", borderRadius: "50%" }} />
            <div className="sb-brand-wrap">
              <div className="sb-brand">ประกันคุ้มภัย</div>
              <div className="sb-brand-sub">ระบบจัดการกรมธรรม์</div>
            </div>
          </div>
          <button
            type="button"
            className="sb-collapse-toggle"
            onClick={() => setSidebarCollapsed(value => !value)}
            title={sidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
            aria-label={sidebarCollapsed ? "ขยายเมนูด้านข้าง" : "ย่อเมนูด้านข้าง"}
            aria-expanded={!sidebarCollapsed}
          >
            <Ico n={sidebarCollapsed ? "chevR" : "chevL"} s={16} />
          </button>
          {/* เมนูหลัก: ใช้ปุ่มจริง เพื่อกดด้วยคีย์บอร์ดและไม่ตัดคำหลายบรรทัด */}
          <nav className="sb-nav" aria-label="เมนูหลัก">
            <div className="sb-nav-group">
              {NAV_VIEW.map(navItem)}
              {NAV_ACTION.filter(it => it.path !== "/upload").map(navItem)}
            </div>
            {NAV_ACTION.filter(it => it.path === "/upload").map(it => {
              const active = isActive(it.path)
              return (
                <button key={it.path} type="button"
                  className={`sb-nav-primary${active ? " on" : ""}`}
                  onClick={() => navTo(it.path)}
                  title={it.desc}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={() => prefetch(it.path)}
                >
                  <span className="sb-nav-primary-icon"><Ico n={it.ico} s={18} /></span>
                  <span>{it.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Right area */}
          <div className="sb-tools">
            <div className="sb-status" title={statusMeta.label}>
              <div
                className="sb-dot"
                style={{
                  background: statusMeta.color,
                  boxShadow: `0 0 0 2px ${statusMeta.shadow}`,
                  animation: serverStatus === "checking" ? "sb-dot-pulse 1.1s ease-in-out infinite" : "none",
                }}
              />
              <span className="sb-status-txt">{statusMeta.label}</span>
            </div>
            <button className="theme-btn" onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "โหมดสว่าง" : "โหมดมืด"}>
              <Ico n={darkMode ? "sun" : "moon"} s={20} />
            </button>

            <button
              className={`theme-btn text-size-btn${largeText ? " on" : ""}`}
              onClick={() => setLargeText(v => !v)}
              title={largeText ? "ใช้ขนาดตัวอักษรปกติ" : "ขยายตัวอักษรให้อ่านง่าย"}
              aria-pressed={largeText}
            >
              <span aria-hidden="true">A+</span>
              <span className="sr-only">{largeText ? "ใช้ขนาดตัวอักษรปกติ" : "ขยายตัวอักษรให้อ่านง่าย"}</span>
            </button>
            {/* ── Logout ── */}
            {onLogout && <button
              className="theme-btn sb-logout"
              onClick={onLogout}
              title="ออกจากระบบ"
            >
              <Ico n="logout" s={19} />
            </button>}
            <button className="ham" aria-label="เปิดเมนู" aria-expanded={mobileMenu} onClick={() => setMobileMenu(m => !m)}>
              <Ico n="menu" s={22} />
            </button>
          </div>

          {/* Mobile dropdown — improved with sections */}
          {mobileMenu && (
            <>
              <div
                onClick={() => setMobileMenu(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 998 }}
              />
              <div className="mob-menu open" style={{ zIndex: 999, padding: 12, maxHeight: "80vh", overflowY: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t3)", letterSpacing: 1, padding: "10px 12px 6px" }}>
                  ดูข้อมูล
                </div>
                {NAV_VIEW.map(it => {
                  const active = !it.disabled && isActive(it.path)
                  return (
                    <div key={it.path}
                      className={`mob-item${active ? " on" : ""}`}
                      onClick={() => !it.disabled && navTo(it.path)}
                      aria-disabled={it.disabled || undefined}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 14px",
                        borderRadius: 11,
                        marginBottom: 6,
                        background: active ? "var(--blue-bg)" : "transparent",
                        border: active ? "1px solid var(--blue-mid)" : "1px solid transparent",
                        cursor: it.disabled ? "not-allowed" : "pointer",
                        opacity: it.disabled ? .48 : 1
                      }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 11,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "var(--blue)" : "var(--sur2)",
                        color: active ? "white" : "var(--t2)",
                        flexShrink: 0
                      }}>
                        <Ico n={it.ico} s={21} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: active ? 700 : 600, color: active ? "var(--blue)" : "var(--t1)" }}>
                          {it.label}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--t3)", marginTop: 3 }}>
                          {it.desc}
                        </div>
                      </div>
                      {!it.disabled && it.badge > 0 && (
                        <span style={{
                          background: "var(--amber, #CA8A04)", color: "#1A0F0A",
                          padding: "4px 12px", borderRadius: 12, fontSize: 14, fontWeight: 700
                        }}>{it.badge}</span>
                      )}
                    </div>
                  )
                })}

                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t3)", letterSpacing: 1, padding: "16px 12px 6px" }}>
                  จัดการ
                </div>
                {NAV_ACTION.map(it => {
                  const active = !it.disabled && isActive(it.path)
                  return (
                    <div key={it.path}
                      onClick={() => !it.disabled && navTo(it.path)}
                      aria-disabled={it.disabled || undefined}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 14px",
                        borderRadius: 11,
                        marginBottom: 6,
                        background: active ? "var(--blue-bg)" : "transparent",
                        border: active ? "1px solid var(--blue-mid)" : "1px solid transparent",
                        cursor: it.disabled ? "not-allowed" : "pointer",
                        opacity: it.disabled ? .48 : 1
                      }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 11,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "var(--blue)" : "var(--sur2)",
                        color: active ? "white" : "var(--t2)",
                        flexShrink: 0
                      }}>
                        <Ico n={it.ico} s={21} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: active ? 700 : 600, color: active ? "var(--blue)" : "var(--t1)" }}>
                          {it.label}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--t3)", marginTop: 3 }}>
                          {it.desc}
                        </div>
                      </div>
                    </div>
                  )
                })}



                <div className="mobile-readable-row">
                  <div>
                    <div>ตัวอักษรอ่านง่าย</div>
                    <small>ขยายข้อความสำคัญทั้งระบบ</small>
                  </div>
                  <button
                    type="button"
                    className={`readable-toggle${largeText ? " on" : ""}`}
                    onClick={() => setLargeText(v => !v)}
                    aria-pressed={largeText}
                  >
                    {largeText ? "เปิดอยู่" : "ปกติ"}
                  </button>
                </div>

                {/* Logout row */}
                <div hidden={!onLogout} style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--brd)" }}>
                  <div
                    onClick={() => { setMobileMenu(false); onLogout() }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 14px", borderRadius: 11, cursor: "pointer",
                      border: "1px solid var(--red-brd)",
                      background: "var(--red-bg)",
                    }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 11,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--red-bg)", color: "var(--red)", flexShrink: 0,
                      border: "1.5px solid var(--red-brd)",
                    }}>
                      <Ico n="logout" s={21} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 600, color: "var(--red)" }}>ออกจากระบบ</div>
                      <div style={{ fontSize: 14, color: "var(--t3)", marginTop: 3 }}>ล้างข้อมูลและกลับหน้าล็อกอิน</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="main">
          <div className="utility-header">
            <div className="utility-actions">
              <form className="utility-search" role="search" onSubmit={submitHeaderSearch}>
                <Ico n="search" s={17} />
                <input
                  type="search"
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="ค้นหาเลขกรมธรรม์หรือผู้เอาประกัน..."
                  aria-label="ค้นหาเลขกรมธรรม์หรือผู้เอาประกัน"
                />
              </form>
              <div className="utility-profile" title="คุณปรีชา">
                <img src="/image.png" alt="คุณปรีชา" />
              </div>
            </div>
          </div>
          <Outlet context={{ search, setSearch: handleSearch, page, setPage, notify, setExpiringCount, serverStatus }} />
        </main>

        {/* มือถือแสดงเพียงสามงานหลัก เพื่อให้กดง่ายและไม่สับสน */}
        <nav className="mobile-bottom-nav" aria-label="เมนูหลักบนมือถือ">
          {[
            { path: "/", ico: "grid", label: "ภาพรวม" },
            { path: "/upload", ico: "upload", label: "เพิ่มเอกสาร" },
            { path: "/batch", ico: "inbox", label: "จัดการเอกสาร" },
          ].map(it => {
            const active = !it.disabled && isActive(it.path)
            return (
              <button
                key={it.path}
                type="button"
                className={`mobile-bottom-item${active ? " on" : ""}${it.path === "/upload" ? " mobile-bottom-primary" : ""}`}
                onClick={() => !it.disabled && navTo(it.path)}
                disabled={it.disabled}
                aria-current={active ? "page" : undefined}
              >
                <span className="mobile-bottom-icon"><Ico n={it.ico} s={21} /></span>
                <span>{it.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

    </>
  )
}

/* ── Root with BrowserRouter ── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={null} />}>
          <Route index              element={<ListPage tab="dashboard" />} />
          <Route path="policies"    element={<ListPage tab="policies" />} />
          <Route path="expiring"    element={<ListPage tab="expiring" />} />
          <Route path="upload"      element={<Suspense fallback={<_Loading />}><UploadPage /></Suspense>} />
          <Route path="batch"       element={<Suspense fallback={<_Loading />}><BatchUploadPage /></Suspense>} />
          <Route path="manual"      element={<Suspense fallback={<_Loading />}><ManualPage /></Suspense>} />
          <Route path="invoice"     element={<Suspense fallback={<_Loading />}><InvoicePage /></Suspense>} />
          <Route path="quotation"   element={<Suspense fallback={<_Loading />}><QuotationPage /></Suspense>} />
          <Route path="policies/:id" element={<Suspense fallback={<_Loading />}><DetailPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
