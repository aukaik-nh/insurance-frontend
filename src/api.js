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
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("auth_token")
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export default api
