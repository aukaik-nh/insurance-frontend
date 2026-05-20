import { useState } from "react"
import api from "../api"
import { Ico } from "../icons"

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState("")

  const submit = async e => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErr("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"); return
    }
    setLoading(true); setErr("")
    try {
      const res = await api.post("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      })
      onLogin(res.data.token)
    } catch (e) {
      setErr(e.response?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      {/* card */}
      <div className="login-card">

        {/* ── Brand ── */}
        <div className="login-brand">
          <div className="login-logo-wrap">
            <img src="/logo_no_bg.png" alt="logo"
              style={{ width: 52, height: 52, objectFit: "contain" }} />
          </div>
          <div>
            <div className="login-app-name">ประกันคุ้มภัย</div>
            <div className="login-app-sub">ระบบจัดการกรมธรรม์ประกันภัย</div>
          </div>
        </div>

        <div className="login-divider" />

        {/* ── Error banner ── */}
        {err && (
          <div className="bnr er" style={{ marginBottom: 20, padding: "13px 16px" }}>
            <Ico n="warn" s={19} />
            <div className="bnr-body">
              <div className="bnr-t" style={{ fontSize: 15 }}>{err}</div>
            </div>
            <button
              onClick={() => setErr("")}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "var(--red)", display: "flex", flexShrink: 0 }}>
              <Ico n="x" s={17} />
            </button>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Username */}
          <div className="login-field">
            <label className="login-label">ชื่อผู้ใช้</label>
            <div className="login-input-wrap">
              <span className="login-input-ico">
                <Ico n="person" s={18} />
              </span>
              <input
                className="login-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้"
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">รหัสผ่าน</label>
            <div className="login-input-wrap">
              <span className="login-input-ico">
                <Ico n="lock" s={18} />
              </span>
              <input
                className="login-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
                title={showPass ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                <Ico n={showPass ? "eyeOff" : "eye"} s={17} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-b login-submit"
            disabled={loading}
          >
            {loading
              ? <>
                  <div className="spin"
                    style={{ width: 17, height: 17, borderWidth: 2, margin: 0 }} />
                  กำลังเข้าสู่ระบบ…
                </>
              : <>
                  <Ico n="arrowR" s={18} />
                  เข้าสู่ระบบ
                </>
            }
          </button>
        </form>

        {/* ── Footer ── */}
        <div className="login-footer">
          <Ico n="shield" s={14} />
          ระบบสำหรับเจ้าหน้าที่เท่านั้น
        </div>
      </div>

      {/* background decoration */}
      <div className="login-bg-blob login-bg-blob-1" />
      <div className="login-bg-blob login-bg-blob-2" />
    </div>
  )
}
