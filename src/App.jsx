import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom"
import CSS from "./styles"
import { Ico } from "./icons"
import { Toast } from "./components/Toast"
import { ListPage } from "./pages/ListPage"
import { UploadPage } from "./pages/UploadPage"
import { ManualPage } from "./pages/ManualPage"
import { DetailPage } from "./pages/DetailPage"
import { InvoicePage } from "./pages/InvoicePage"
import { LoginPage } from "./pages/LoginPage"

/* ── Layout shell (nav + outlet) ── */
function Layout({ onLogout }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [darkMode,      setDarkMode]      = useState(() => localStorage.getItem("theme") === "dark")
  const [mobileMenu,    setMobileMenu]    = useState(false)
  const [search,        setSearch]        = useState("")
  const [page,          setPage]          = useState(1)
  const [toast,         setToast]         = useState(null)
  const [expiringCount, setExpiringCount] = useState(0)

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode)
    localStorage.setItem("theme", darkMode ? "dark" : "light")
  }, [darkMode])

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
    { path: "/upload",    ico: "upload",   label: "อัปโหลด PDF",   desc: "เพิ่มกรมธรรม์ใหม่" },
    { path: "/invoice",   ico: "banknote", label: "ใบแจ้งหนี้",     desc: "สร้าง invoice + QR" },
  ]
const navTo = p => { navigate(p); setMobileMenu(false); setSearch(""); setPage(1) }
  const isActive = navPath => navPath === "/" ? path === "/" : path.startsWith(navPath)

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── TOPNAV ── */}
        <header className="sb" style={{ position: "relative" }}>
          {/* โลโก้ */}
          <div className="sb-logo" style={{ cursor: "pointer" }} onClick={() => navTo("/")}>
            <img src="/logo_no_bg.png" alt="ประกันคุ้มภัย" style={{ height: 46, width: 46, objectFit: "contain" }} />
            <img src="/image.png" alt="" style={{ height: 36, width: 36, objectFit: "cover", borderRadius: "50%" }} />
            <div className="sb-brand">ประกันคุ้มภัย</div>
          </div>

          {/* เมนูหลัก (desktop) */}
          <nav className="sb-nav" style={{ gap: 4 }}>
            {NAV_VIEW.map(it => {
              const active = isActive(it.path)
              return (
                <div key={it.path}
                  onClick={() => navTo(it.path)}
                  title={it.desc}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "9px 16px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 15.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--blue)" : "var(--t2)",
                    background: active ? "var(--blue-bg)" : "transparent",
                    transition: "all 0.13s",
                    height: 42,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--sur2)" }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
                >
                  <Ico n={it.ico} s={17} />
                  <span>{it.label}</span>
                  {it.badge > 0 && (
                    <span style={{
                      background: "#F59E0B",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: 11,
                      fontSize: 13.5,
                      fontWeight: 700,
                      marginLeft: 2,
                    }}>{it.badge}</span>
                  )}
                </div>
              )
            })}
            <div style={{ width: 1, height: 26, background: "var(--brd)", margin: "0 10px" }} />
            {NAV_ACTION.map(it => {
              const active = isActive(it.path)
              return (
                <div key={it.path}
                  onClick={() => navTo(it.path)}
                  title={it.desc}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "9px 16px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 15.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--blue)" : "var(--t2)",
                    background: active ? "var(--blue-bg)" : "transparent",
                    transition: "all 0.13s",
                    height: 42,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--sur2)" }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
                >
                  <Ico n={it.ico} s={17} />
                  <span>{it.label}</span>
                </div>
              )
            })}
          </nav>

          {/* Right area */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="sb-dot" />
              <span className="sb-status-txt">ระบบพร้อมใช้งาน</span>
            </div>
            <button className="theme-btn" onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "โหมดสว่าง" : "โหมดมืด"}>
              <Ico n={darkMode ? "sun" : "moon"} s={20} />
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
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

/* ── Root with BrowserRouter + Auth gate ── */
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"))

  const handleLogin = (t) => {
    localStorage.setItem("auth_token", t)
    setToken(t)
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
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
      const t = localStorage.getItem("auth_token")
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
          <Route path="upload"      element={<UploadPage />} />
          <Route path="manual"      element={<ManualPage />} />
          <Route path="invoice"     element={<InvoicePage />} />
          <Route path="policies/:id" element={<DetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
