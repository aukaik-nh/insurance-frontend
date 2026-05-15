import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom"
import CSS from "./styles"
import { Ico } from "./icons"
import { Toast } from "./components/Toast"
import { ListPage } from "./pages/ListPage"
import { UploadPage } from "./pages/UploadPage"
import { ManualPage } from "./pages/ManualPage"
import { DetailPage } from "./pages/DetailPage"

/* ── Layout shell (nav + outlet) ── */
function Layout() {
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

  const NAV = [
    { path: "/",          ico: "grid",   label: "ภาพรวม",            badge: 0 },
    { path: "/policies",  ico: "doc",    label: "กรมธรรม์ทั้งหมด",   badge: 0 },
    { path: "/expiring",  ico: "bell",   label: "ใกล้หมดอายุ",       badge: expiringCount },
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
            <img src="/logo_no_bg.png" alt="ประกันคุ้มภัย" style={{ height: 52, width: 52, objectFit: "contain" }} />
            <div className="sb-brand">ประกันคุ้มภัย</div>
          </div>

          {/* เมนูหลัก (desktop) */}
          <nav className="sb-nav">
            {NAV.map(it => (
              <div key={it.path}
                className={`sb-item${isActive(it.path) ? " on" : ""}`}
                onClick={() => navTo(it.path)}>
                <Ico n={it.ico} s={15} />
                <span>{it.label}</span>
                {it.badge > 0 && <span className="sb-chip">{it.badge}</span>}
              </div>
            ))}
            <div className="sb-divider" />
            <div className={`sb-item${path === "/upload" ? " on" : ""}`}
              onClick={() => navigate("/upload")}>
              <Ico n="upload" s={15} />
              <span>อัปโหลด PDF</span>
            </div>
          </nav>

          {/* Right area */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="sb-dot" />
              <span className="sb-status-txt">ระบบพร้อมใช้งาน</span>
            </div>
            <button className="theme-btn" onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "โหมดสว่าง" : "โหมดมืด"}>
              <Ico n={darkMode ? "sun" : "moon"} s={16} />
            </button>
            <button className="ham" onClick={() => setMobileMenu(m => !m)}>
              <Ico n="menu" s={18} />
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenu && (
            <div className="mob-menu open">
              {NAV.map(it => (
                <div key={it.path}
                  className={`mob-item${isActive(it.path) ? " on" : ""}`}
                  onClick={() => navTo(it.path)}>
                  <Ico n={it.ico} s={18} />
                  <span>{it.label}</span>
                  {it.badge > 0 && <span className="sb-chip">{it.badge}</span>}
                </div>
              ))}
              <div className={`mob-item${path === "/upload" ? " on" : ""}`}
                onClick={() => { navigate("/upload"); setMobileMenu(false) }}>
                <Ico n="upload" s={18} />
                <span>อัปโหลด PDF</span>
              </div>
            </div>
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

/* ── Root with BrowserRouter + Routes ── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index              element={<ListPage tab="dashboard" />} />
          <Route path="policies"    element={<ListPage tab="policies" />} />
          <Route path="expiring"    element={<ListPage tab="expiring" />} />
          <Route path="upload"      element={<UploadPage />} />
          <Route path="manual"      element={<ManualPage />} />
          <Route path="policies/:id" element={<DetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
