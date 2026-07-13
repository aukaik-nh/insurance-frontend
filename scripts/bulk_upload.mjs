// Bulk-upload PDFs to insurance backend.
//
// Env vars:
//   API_URL   e.g. https://insurance.up.railway.app/api
//   USERNAME  login username
//   PASSWORD  login password
//   PDF_DIR   folder containing PDFs
//   DELAY_MS  (optional) delay between files, default 800
//   DRY_RUN   (optional) "1" = call preview-pdf only, don't upload/save
//
// Usage (PowerShell):
//   $env:API_URL="https://insurance.up.railway.app/api"
//   $env:USERNAME="..."; $env:PASSWORD="..."
//   $env:PDF_DIR="C:\Users\Administrator\Downloads\New folder"
//   node scripts/bulk_upload.mjs

import { readdir, readFile, writeFile, stat } from "node:fs/promises"
import { join, resolve } from "node:path"

const API_URL  = process.env.API_URL
const USERNAME = process.env.USERNAME
const PASSWORD = process.env.PASSWORD
const PDF_DIR  = process.env.PDF_DIR
const DELAY_MS = Number(process.env.DELAY_MS ?? 800)
const DRY_RUN  = process.env.DRY_RUN === "1"

if (!API_URL || !USERNAME || !PASSWORD || !PDF_DIR) {
  console.error("Missing env: API_URL, USERNAME, PASSWORD, PDF_DIR are required")
  process.exit(1)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`login ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.token) throw new Error("no token in login response")
  return data.token
}

async function postForm(path, token, file, filename) {
  const fd = new FormData()
  fd.append("file", new Blob([file], { type: "application/pdf" }), filename)
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return text }
}

async function postJson(path, token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`)
  return JSON.parse(text)
}

async function processFile(token, filePath, filename) {
  const bytes = await readFile(filePath)

  // 1) AI preview
  const preview = await postForm("/preview-pdf", token, bytes, filename)
  const parsed = preview?.parsed || {}
  const hasAny = Object.values(parsed).some(v => v !== null && v !== "" && v !== undefined)
  if (!hasAny) throw new Error("AI ไม่ได้ดึงข้อมูล (empty parsed)")

  if (DRY_RUN) return { id: null, parsed, skipped: "dry-run" }

  // 2) upload PDF → R2
  const up = await postForm("/upload-pdf-only", token, bytes, filename)
  const pdfMeta = {
    pdf_url:      up?.pdf_url,
    pdf_filename: up?.pdf_filename || filename,
    pdf_size:     up?.pdf_size,
  }

  // 3) save policy
  const saved = await postJson("/save-policy", token, {
    ...parsed,
    ...pdfMeta,
    pdf_filename: pdfMeta.pdf_filename || filename,
  })
  return { id: saved?.id, parsed, pdfMeta }
}

async function main() {
  const dir = resolve(PDF_DIR)
  const dirStat = await stat(dir).catch(() => null)
  if (!dirStat?.isDirectory()) {
    console.error(`PDF_DIR not found or not a directory: ${dir}`)
    process.exit(1)
  }
  const all = await readdir(dir)
  const pdfs = all.filter(f => f.toLowerCase().endsWith(".pdf")).sort()

  console.log(`API:   ${API_URL}`)
  console.log(`Dir:   ${dir}`)
  console.log(`PDFs:  ${pdfs.length}`)
  console.log(`Delay: ${DELAY_MS}ms  DryRun: ${DRY_RUN}`)
  console.log("Logging in...")
  const token = await login()
  console.log("Logged in.\n")

  const results = []
  let ok = 0, fail = 0
  for (let i = 0; i < pdfs.length; i++) {
    const name = pdfs[i]
    const label = `[${i + 1}/${pdfs.length}] ${name}`
    process.stdout.write(`${label} ... `)
    try {
      const r = await processFile(token, join(dir, name), name)
      ok++
      console.log(`OK  id=${r.id ?? "-"} plate=${r.parsed?.license_plate ?? "-"} ins=${r.parsed?.insured_name ?? "-"}`)
      results.push({ file: name, status: "ok", id: r.id, parsed: r.parsed })
    } catch (e) {
      fail++
      console.log(`FAIL  ${e.message}`)
      results.push({ file: name, status: "fail", error: String(e.message) })
    }
    if (i < pdfs.length - 1) await sleep(DELAY_MS)
  }

  const logPath = join(dir, `bulk_upload_${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
  await writeFile(logPath, JSON.stringify(results, null, 2), "utf8")
  console.log(`\nDone. OK=${ok}  FAIL=${fail}`)
  console.log(`Log: ${logPath}`)
}

main().catch(e => {
  console.error("FATAL:", e.message)
  process.exit(1)
})
