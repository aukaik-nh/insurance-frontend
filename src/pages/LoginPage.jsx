import { useState } from "react"
import api from "../api"
import { Ico } from "../icons"

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState("")

  const submit = async e => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErr("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"); return
    }
    setLoading(true); setErr("")

    const body = { username: username.trim(), password: password.trim(), remember }
    // Render free tier อาจ cold start ~50s — retry 2 ครั้งสำหรับ network error / 5xx
    // timeout ต่อครั้ง 30s × 3 attempts = ครอบคลุม window cold start
    const attempt = (n) => api.post("/auth/login", body, { timeout: 30000 })
      .catch(err => {
        const status = err.response?.status
        const isNetworkErr = !err.response   // no response = timeout/offline/CORS
        const isServerDown = status >= 500 && status < 600
        // retry เฉพาะ network error หรือ 5xx — ไม่ retry 401/422 (รหัสผิด/รูปแบบไม่ถูก)
        if (n < 3 && (isNetworkErr || isServerDown)) {
          return new Promise(r => setTimeout(r, 1500))
            .then(() => attempt(n + 1))
        }
        throw err
      })

    try {
      const res = await attempt(1)
      onLogin(res.data.token, { remember })
    } catch (e) {
      const status = e.response?.status
      if (!e.response) {
        // network error / timeout — แยกข้อความให้ user รู้ว่าควรลองใหม่
        setErr("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — เซิร์ฟเวอร์อาจกำลังเริ่มทำงาน กรุณาลองใหม่อีกครั้งใน 30 วินาที")
      } else if (status === 401) {
        setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
      } else if (status >= 500) {
        setErr("เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้ง")
      } else {
        setErr(e.response?.data?.detail || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่")
      }
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
          <div className="login-app-name">ประกันคุ้มภัย</div>
          <div className="login-app-sub">ระบบจัดการกรมธรรม์ประกันภัย</div>
        </div>

        <div className="login-intro">
          <h1>เข้าสู่ระบบ</h1>
          <p>กรอกชื่อผู้ใช้และรหัสผ่านเพื่อจัดการข้อมูลกรมธรรม์</p>
        </div>

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

          <label className="login-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              disabled={loading}
            />
            <span>
              <strong>จำการเข้าสู่ระบบบนเครื่องนี้</strong>
              <small>{remember ? "ไม่ต้องเข้าสู่ระบบอีก 30 วัน" : "จะออกจากระบบเมื่อปิดเบราว์เซอร์"}</small>
            </span>
          </label>

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
                  กำลังเชื่อมต่อระบบ…
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
