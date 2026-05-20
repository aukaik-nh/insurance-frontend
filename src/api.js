import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
})

// ── แนบ token ทุก request ──
api.interceptors.request.use(config => {
  const token = localStorage.getItem("auth_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── 401 → ล้าง token แล้ว reload (จะโชว์หน้า login) ──
//   ⚠️ ยกเว้น 401 จากหน้า login เอง (นั่นคือกรอกรหัสผิด ไม่ใช่ session หมดอายุ)
//   ถ้า reload จะปัดหน้าจอใหม่ ทำให้ผู้ใช้ไม่เห็น error message
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ""
      const isLoginAttempt = url.includes("/auth/login")
      if (!isLoginAttempt) {
        localStorage.removeItem("auth_token")
        window.location.reload()
      }
    }
    return Promise.reject(err)
  }
)

export default api
