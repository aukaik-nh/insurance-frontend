import { useState, useEffect, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom"
import CSS from "./styles"
import { Ico } from "./icons"
import { Toast } from "./components/Toast"
import { ListPage } from "./pages/ListPage"        // หน้าแรก → eager
import { LoginPage } from "./pages/LoginPage"      // login → eager
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
const Lazy = (C) => <Suspense fallback={<_Loading />}><C /></Suspense>

/* ── Layout shell (nav + outlet) ── */
function Layout({ onLogout }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [darkMode,      setDarkMode]      = useState(() => localStorage.getItem("theme") === "dark")
  const [largeText,     setLargeText]     = useState(() => localStorage.getItem("large_text") === "true")
  const [mobileMenu,    setMobileMenu]    = useState(false)
  const [search,        setSearch]        = useState("")
  const [page,          setPage]          = useState(1)
  const [toast,         setToast]         = useState(null)
  const [expiringCount, setExpiringCount] = useState(0)
  const [serverStatus,  setServerStatus]  = useState("checking") // checking | ready | error

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode)
    localStorage.setItem("theme", darkMode ? "dark" : "light")
  }, [darkMode])

  useEffect(() => {
    document.body.classList.toggle("text-large", largeText)
    localStorage.setItem("large_text", String(largeText))
  }, [largeText])

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
    checking: { color: "#F59E0B", shadow: "rgba(245,158,11,.35)", label: "กำลังปลุกเซิร์ฟเวอร์..." },
    ready:    { color: "#34D399", shadow: "rgba(52,211,153,.3)",  label: "ระบบพร้อมใช้งาน" },
    error:    { color: "#EF4444", shadow: "rgba(239,68,68,.3)",   label: "เซิร์ฟเวอร์ไม่ตอบสนอง" },
  }[serverStatus]

  // reset page when search changes
  const handleSearch = v => { setSearch(v); setPage(1) }

  const notify = (msg, type = "success") => setToast({ msg, type })

  const path = location.pathname

  // เมนูแบ่งเป็น 2 กลุ่ม
  const NAV_VIEW = [
    { path: "/",         ico: "grid", label: "ภาพรวม",        desc: "Dashboard + สถิติ",       badge: 0 },
    { path: "/expiring", ico: "bell", label: "ใกล้หมดอายุ",   desc: "ภายใน 30 วัน",            badge: expiringCount },
  ]
  const NAV_ACTION = [
    { path: "/upload",    ico: "upload",   label: "เพิ่มกรมธรรม์", desc: "อัปโหลด PDF เพื่อเพิ่มกรมธรรม์ใหม่" },
    { path: "/batch",     ico: "inbox",    label: "นำเข้าเป็นชุด", desc: "เลือกหลายไฟล์ · AI ช่วยจัดคู่เอกสาร" },
    { path: "/invoice",   ico: "banknote", label: "ใบแจ้งหนี้",     desc: "สร้าง invoice + QR" },
    { path: "/quotation", ico: "doc",      label: "ใบเสนอราคา",    desc: "รูปแบบคุ้มภัย" },
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
    const active = isActive(it.path)
    return (
      <button key={it.path} type="button"
        className={`sb-nav-link${active ? " on" : ""}`}
        onClick={() => navTo(it.path)}
        title={it.desc}
        aria-current={active ? "page" : undefined}
        onMouseEnter={() => prefetch(it.path)}
      >
        <Ico n={it.ico} s={19} />
        <span>{it.label}</span>
        {it.badge > 0 && <span className="sb-nav-badge">{it.badge}</span>}
      </button>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── TOPNAV ── */}
        <header className="sb" style={{ position: "relative" }}>
          {/* โลโก้ */}
          <div className="sb-logo" style={{ cursor: "pointer" }} onClick={() => navTo("/")}>
            <img src="/logo_no_bg.png" alt="ประกันคุ้มภัย" style={{ height: 56, width: 56, objectFit: "contain" }} />
            <img src="/image.png" alt="" style={{ height: 40, width: 40, objectFit: "cover", borderRadius: "50%" }} />
            <div className="sb-brand-wrap">
              <div className="sb-brand">ประกันคุ้มภัย</div>
              <div className="sb-brand-sub">ระบบจัดการกรมธรรม์</div>
            </div>
          </div>

          {/* เมนูหลัก: ใช้ปุ่มจริง เพื่อกดด้วยคีย์บอร์ดและไม่ตัดคำหลายบรรทัด */}
          <nav className="sb-nav" aria-label="เมนูหลัก">
            <div className="sb-nav-group">
              {NAV_VIEW.map(navItem)}
              <span className="sb-nav-sep" aria-hidden="true" />
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
                  <Ico n={it.ico} s={19} />
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
            <button
              className="theme-btn sb-logout"
              onClick={onLogout}
              title="ออกจากระบบ"
            >
              <Ico n="logout" s={19} />
            </button>
            <button className="ham" onClick={() => setMobileMenu(m => !m)}>
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
                  const active = isActive(it.path)
                  return (
                    <div key={it.path}
                      className={`mob-item${active ? " on" : ""}`}
                      onClick={() => navTo(it.path)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 14px",
                        borderRadius: 11,
                        marginBottom: 6,
                        background: active ? "var(--blue-bg)" : "transparent",
                        border: active ? "1px solid var(--blue-mid)" : "1px solid transparent",
                        cursor: "pointer"
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
                      {it.badge > 0 && (
                        <span style={{
                          background: "var(--amber, #f59e0b)", color: "white",
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
                  const active = isActive(it.path)
                  return (
                    <div key={it.path}
                      onClick={() => navTo(it.path)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 14px",
                        borderRadius: 11,
                        marginBottom: 6,
                        background: active ? "var(--blue-bg)" : "transparent",
                        border: active ? "1px solid var(--blue-mid)" : "1px solid transparent",
                        cursor: "pointer"
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
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--brd)" }}>
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
          <Outlet context={{ search, setSearch: handleSearch, page, setPage, notify, setExpiringCount }} />
        </main>

        {/* Mobile: keep the five most-used actions within thumb reach.  The
            complete menu (invoice, quotation, settings) remains under More. */}
        <nav className="mobile-bottom-nav" aria-label="เมนูหลักบนมือถือ">
          {[
            { path: "/",         ico: "grid",   label: "ภาพรวม" },
            { path: "/expiring", ico: "bell",   label: "ใกล้หมด" },
            { path: "/upload",   ico: "upload", label: "เพิ่ม" },
            { path: "/batch",    ico: "inbox",  label: "หลายไฟล์" },
          ].map(it => {
            const active = isActive(it.path)
            return (
              <button
                key={it.path}
                type="button"
                className={`mobile-bottom-item${active ? " on" : ""}${it.path === "/upload" ? " mobile-bottom-primary" : ""}`}
                onClick={() => navTo(it.path)}
                aria-current={active ? "page" : undefined}
              >
                <span className="mobile-bottom-icon"><Ico n={it.ico} s={21} /></span>
                <span>{it.label}</span>
                {it.path === "/expiring" && expiringCount > 0 && (
                  <b className="mobile-bottom-badge">{expiringCount > 99 ? "99+" : expiringCount}</b>
                )}
              </button>
            )
          })}
          <button
            type="button"
            className={`mobile-bottom-item${mobileMenu ? " on" : ""}`}
            onClick={() => setMobileMenu(m => !m)}
            aria-expanded={mobileMenu}
            aria-label="เมนูเพิ่มเติม"
          >
            <span className="mobile-bottom-icon"><Ico n="menu" s={22} /></span>
            <span>เพิ่มเติม</span>
          </button>
        </nav>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Scroll-to-top floating button (always visible) ── */}
      <button
        className="scroll-top"
        onClick={() => {
          // Custom smooth scroll — easeOutQuart curve, ~800ms duration
          const startY = window.scrollY
          if (startY === 0) return
          const startTime = performance.now()
          const duration = Math.min(900, 400 + startY * 0.4)  // scale by distance, cap 900ms
          const easeOutQuart = t => 1 - Math.pow(1 - t, 4)
          const step = (now) => {
            const t = Math.min((now - startTime) / duration, 1)
            window.scrollTo(0, startY * (1 - easeOutQuart(t)))
            if (t < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }}
        title="กลับไปด้านบน"
        aria-label="กลับไปด้านบน"
      >
        <Ico n="chevU" s={22} />
      </button>
    </>
  )
}

/* ── Root with BrowserRouter + Auth gate ── */
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token"))

  const handleLogin = (t, { remember = true } = {}) => {
    localStorage.removeItem("auth_token")
    sessionStorage.removeItem("auth_token")
    ;(remember ? localStorage : sessionStorage).setItem("auth_token", t)
    setToken(t)
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    sessionStorage.removeItem("auth_token")
    // ล้าง policies cache กันข้อมูลค้างข้าม account
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith("policies-cache:")) localStorage.removeItem(k)
    }
    setToken(null)
  }

  // ── Keep-alive backend + auto re-check token ตอน tab กลับมา ──
  //   1. ping /health ทุก 10 นาที (กันกรณี GitHub Actions cron delay/หาย)
  //   2. ping + ตรวจ token ตอน tab visible อีกครั้ง (กรณีเปิดทิ้งไว้นานๆ)
  //   3. ถ้า JWT หมดอายุ → logout ทันที (เด้งไป login โดยไม่ต้องรอ API call)
  useEffect(() => {
    if (!token) return

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api"
    const healthUrl = apiBase.replace(/\/api\/?$/, "") + "/health"
    const ping = () => fetch(healthUrl, { method: "GET", cache: "no-store" }).catch(() => {})

    const checkToken = () => {
      const t = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
      if (!t) { handleLogout(); return }
      try {
        const payload = JSON.parse(atob(t.split(".")[1]))
        if (payload.exp && payload.exp * 1000 < Date.now()) handleLogout()
      } catch {
        handleLogout()
      }
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") ping()
    }, 10 * 60 * 1000)

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        ping()
        checkToken()
      }
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [token])

  // หน้า login — แสดงนอก BrowserRouter (ไม่มี nav)
  if (!token) {
    return (
      <>
        <style>{CSS}</style>
        <LoginPage onLogin={handleLogin} />
      </>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={handleLogout} />}>
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
