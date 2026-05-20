import { useState, useEffect } from "react"

/** ดึง token จาก localStorage */
const getToken = () => localStorage.getItem("auth_token") || ""

/* ─────────────────────────────────────────────────────────────────
   PDF Blob Cache (module-level)
   ────────────────────────────────────────────────────────────────
   - cache blob URL ตาม apiUrl → กดเข้า/ออกหน้าซ้ำๆ ไม่ต้อง fetch ใหม่
   - dedupe in-flight requests → hover แล้วคลิก ไม่ยิงซ้ำ
   - LRU cap 12 entries → กัน memory โต ถ้าดู PDF เยอะๆ ติดกัน
   ─────────────────────────────────────────────────────────────── */
const MAX_CACHE = 12
const blobCache = new Map()      // apiUrl → { url, blob }
const inflight  = new Map()      // apiUrl → Promise<url>

function touch(apiUrl) {
  // LRU: ลบแล้วใส่ใหม่ → ย้ายไปท้าย Map (most-recently-used)
  const entry = blobCache.get(apiUrl)
  if (entry) {
    blobCache.delete(apiUrl)
    blobCache.set(apiUrl, entry)
  }
}

function evictIfNeeded() {
  while (blobCache.size > MAX_CACHE) {
    const oldestKey = blobCache.keys().next().value
    const oldest = blobCache.get(oldestKey)
    if (oldest?.url) URL.revokeObjectURL(oldest.url)
    blobCache.delete(oldestKey)
  }
}

function fetchPdfBlob(apiUrl) {
  if (!apiUrl) return Promise.reject(new Error("no url"))
  if (blobCache.has(apiUrl)) { touch(apiUrl); return Promise.resolve(blobCache.get(apiUrl).url) }
  if (inflight.has(apiUrl)) return inflight.get(apiUrl)

  const p = fetch(apiUrl, { headers: { Authorization: `Bearer ${getToken()}` } })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      blobCache.set(apiUrl, { url, blob })
      evictIfNeeded()
      inflight.delete(apiUrl)
      return url
    })
    .catch(err => {
      inflight.delete(apiUrl)
      throw err
    })

  inflight.set(apiUrl, p)
  return p
}

/** ⚡ prefetch PDF blob (เรียกตอน hover row, ไม่ block ใคร) */
export function prefetchPdf(apiUrl) {
  if (!apiUrl) return
  fetchPdfBlob(apiUrl).catch(() => {})
}

/**
 * Hook: fetch PDF ผ่าน auth header → คืน Blob URL
 * - มี cache ระหว่าง mount/unmount → ไม่ refetch ถ้า url ซ้ำ
 * - หลีกเลี่ยง iframe ส่ง Authorization header ไม่ได้
 */
export function usePdfBlob(apiUrl) {
  // init จาก cache ถ้ามี → render ครั้งแรกเห็น PDF ทันที (ไม่ต้องรอ effect)
  const [blobUrl, setBlobUrl] = useState(() =>
    apiUrl && blobCache.has(apiUrl) ? (touch(apiUrl), blobCache.get(apiUrl).url) : null
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!apiUrl) { setBlobUrl(null); setLoading(false); return }

    // hit cache → ใช้ทันที ไม่ต้อง fetch
    if (blobCache.has(apiUrl)) {
      touch(apiUrl)
      setBlobUrl(blobCache.get(apiUrl).url)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setBlobUrl(null)

    fetchPdfBlob(apiUrl)
      .then(url => { if (!cancelled) setBlobUrl(url) })
      .catch(() => { if (!cancelled) setBlobUrl(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // ⚠️ ไม่ revoke URL ใน cleanup — cache จัดการ lifecycle เอง (LRU)
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

/** เปิด PDF ในแท็บใหม่ via auth (fetch → blob → window.open)
 *  ⚠️  ต้องเปิด window ก่อน await เพื่อหลีกเลี่ยง popup blocker */
export async function openPdfTab(apiUrl) {
  // เปิด window synchronously (ก่อน await) — popup blocker อนุญาตเฉพาะที่เกิดจาก user gesture โดยตรง
  const win = window.open("", "_blank")
  if (!win) {
    alert("กรุณาอนุญาตให้เปิดแท็บใหม่ในเบราว์เซอร์ (popup ถูกบล็อก)")
    return
  }
  try {
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error("โหลดไม่สำเร็จ")
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    win.location.href = url
  } catch (e) {
    win.close()
    alert("เปิดไม่สำเร็จ: " + e.message)
  }
}
