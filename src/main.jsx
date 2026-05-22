import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ปลุก backend (Render free tier spin-down) ก่อน user จะ login จะได้ไม่ต้องรอ cold start
const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api"
const healthUrl = apiBase.replace(/\/api\/?$/, "") + "/health"
fetch(healthUrl, { method: "GET", cache: "no-store" }).catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
