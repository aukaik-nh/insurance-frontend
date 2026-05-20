import { useState, useEffect } from "react"

/** ดึง token จาก localStorage */
const getToken = () => localStorage.getItem("auth_token") || ""

/**
 * Hook: fetch PDF ผ่าน auth header → คืน Blob URL
 * (iframe ส่ง Authorization header ไม่ได้ → ต้อง fetch เองแล้วใช้ blob URL แทน)
 */
export function usePdfBlob(apiUrl) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!apiUrl) { setBlobUrl(null); return }

    let objectUrl = null
    let cancelled = false

    setLoading(true)
    setBlobUrl(null)

    fetch(apiUrl, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch(() => { if (!cancelled) setBlobUrl(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [apiUrl])

  return { blobUrl, loading }
}

/** Download PDF via auth → trigger browser download */
export async function downloadPdf(apiUrl, filename = "document.pdf") {
  try {
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ")
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert("ดาวน์โหลดไม่สำเร็จ: " + e.message)
  }
}

/** เปิด PDF ในแท็บใหม่ via auth (fetch → blob → window.open) */
export async function openPdfTab(apiUrl) {
  try {
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error("โหลดไม่สำเร็จ")
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    window.open(url, "_blank")
    // blob URL จะถูก revoke เมื่อแท็บปิด (browser จัดการเอง)
  } catch (e) {
    alert("เปิดไม่สำเร็จ: " + e.message)
  }
}
