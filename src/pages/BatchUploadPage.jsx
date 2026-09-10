import { useState, useRef, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { fmtDate, POLICY_TYPE_LABEL } from "../helpers"
import { usePdfBlob } from "../pdfUtils"
import { PdfLightbox } from "../components/PdfLightbox"

const DOCUMENT_LABELS = {
  motor_main: "กรมธรรม์รถยนต์",
  motor_prb: "พ.ร.บ.",
  renewal_notice: "หนังสือแจ้งเตือนต่ออายุ",
  endorsement: "สลักหลัง",
  credit_note: "ใบลดหนี้ / ใบคืนเบี้ย",
  invoice: "ใบแจ้งหนี้",
  receipt: "ใบเสร็จรับเงิน",
  fire: "กรมธรรม์อัคคีภัย",
  sme_property: "กรมธรรม์ทรัพย์สิน",
  other_policy: "กรมธรรม์ประเภทอื่น (PA / TA / ฯลฯ)",
  unknown: "เอกสารรอตรวจประเภท",
}

// สรุปข้อมูลย่อของ record ที่ตัวอ่าน PDF อ่านได้ — ใช้โชว์ในรายการรีวิว
function recLine(r) {
  const typeLabel = DOCUMENT_LABELS[r?.doc_type] || POLICY_TYPE_LABEL?.[r?.policy_type] || r?.policy_type || "—"
  return {
    name:  r?.insured_name || "— ไม่พบชื่อ —",
    plate: r?.license_plate || "—",
    type:  typeLabel,
    pol:   r?.policy_number || "—",
    end:   r?.coverage_end ? fmtDate(r.coverage_end) : "—",
    err:   r?.parse_error || null,
    docType: r?.doc_type || "unknown",
  }
}

export function BatchUploadPage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()

  const ref = useRef()
  const [files, setFiles]       = useState([])      // File[] ที่เลือก (ก่อนส่ง)
  const [drag, setDrag]         = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [data, setData]         = useState(null)    // ผลจาก /batch/extract
  const [checked, setChecked]   = useState(new Set())
  const [committing, setCommitting] = useState(false)
  const [done, setDone]         = useState(null)     // ผลจาก /commit
  const [err, setErr]           = useState("")
  const [elapsed, setElapsed]   = useState(0)        // นับวินาทีระหว่างอ่าน PDF
  const [progress, setProgress] = useState(null)     // {done, total, current, chunk, chunk_total} ระหว่างอ่าน
  const [expandedKey, setExpandedKey] = useState(null)
  const [activeMenu, setActiveMenu] = useState("import")
  const [history, setHistory] = useState([])
  const [inboxDocuments, setInboxDocuments] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // จับเวลาระหว่าง extracting — ให้ผู้ใช้เห็นว่ากำลังทำงาน ไม่ได้ค้าง
  useEffect(() => {
    if (!extracting) return
    setElapsed(0)
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [extracting])

  const addFiles = list => {
    const pdfs = Array.from(list || []).filter(
      f => f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf")
    )
    if (!pdfs.length) { setErr("รองรับเฉพาะไฟล์ PDF เท่านั้น"); return }
    setErr("")
    setFiles(prev => {
      const seen = new Set(prev.map(f => f.name + f.size))
      const next = [...prev, ...pdfs.filter(f => !seen.has(f.name + f.size))]
      if (next.length > 20) {
        setErr("นำเข้าได้สูงสุด 20 ไฟล์ต่อชุด ระบบเลือกไว้เฉพาะ 20 ไฟล์แรก")
      }
      return next.slice(0, 20)
    })
  }

  const removeFile = i => setFiles(prev => prev.filter((_, idx) => idx !== i))
  const resetAll = () => { setFiles([]); setData(null); setChecked(new Set()); setDone(null); setErr(""); setExpandedKey(null); setActiveMenu("import") }

  const loadHistory = async () => {
    setHistoryLoading(true); setErr("")
    try {
      const [historyRes, inboxRes] = await Promise.all([
        api.get("/batch/history"),
        api.get("/documents/inbox"),
      ])
      setHistory(historyRes.data?.items || [])
      setInboxDocuments(inboxRes.data?.data || [])
    } catch (e) {
      setErr("โหลดประวัติไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally {
      setHistoryLoading(false)
    }
  }

  const selectMenu = menu => {
    setActiveMenu(menu)
    if (menu === "history") loadHistory()
  }

  // ── รวมรายการที่ "บันทึกได้" เป็น key เดียวกัน เพื่อทำ checkbox ──
  const buildItems = (d) => {
    const out = []
    ;(d.pairs || []).forEach((p, i) =>
      out.push({ key: `pair-${i}`, kind: "pair", main: p.main, prb: p.prb, status: p.status }))
    ;(d.orphan_main || []).forEach((r, i) =>
      out.push({ key: `om-${i}`, kind: "orphan_main", main: r, prb: null }))
    ;(d.orphan_prb || []).forEach((r, i) =>
      out.push({ key: `op-${i}`, kind: "orphan_prb", main: r, prb: null }))
    ;(d.others || []).forEach((r, i) =>
      out.push({ key: `ot-${i}`, kind: "other", main: r, prb: null }))
    return out
  }

  const doExtract = async () => {
    if (!files.length) return
    setExtracting(true); setErr(""); setProgress({ done: 0, total: files.length, current: null, chunk: 0, chunk_total: Math.ceil(files.length / 10) })
    try {
      const fd = new FormData()
      files.forEach(f => fd.append("files", f))
      // 1) อัปไฟล์ + สั่งอ่านเบื้องหลัง → ได้ batch_id ทันที
      const res = await api.post("/batch/extract", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
      })
      const bid = res.data.batch_id
      // 2) poll ความคืบหน้าทีละไฟล์ จน status = done
      let result = null
      let consecutivePollErrors = 0
      while (!result) {                         // งานกองใหญ่ใช้เวลานานได้ ไม่ตัดกลางคันตามจำนวนไฟล์
        await new Promise(r => setTimeout(r, 1500))
        let pr
        try {
          pr = (await api.get(`/batch/${bid}/progress`, { timeout: 30000 })).data
          consecutivePollErrors = 0
        } catch {
          consecutivePollErrors += 1
          if (consecutivePollErrors >= 5) {
            throw new Error("ติดต่อเซิร์ฟเวอร์ไม่ได้ กรุณากดอ่านใหม่เมื่อเซิร์ฟเวอร์พร้อม")
          }
          continue
        }
        setProgress({ done: pr.done || 0, total: pr.total || files.length, current: pr.current, chunk: pr.chunk || 0, chunk_total: pr.chunk_total || Math.ceil(files.length / 10) })
        if (pr.status === "done")  { result = (await api.get(`/batch/${bid}`)).data; break }
        if (pr.status === "error") throw new Error(pr.error || "ประมวลผลไม่สำเร็จ")
      }
      setData(result)
      setActiveMenu("review")
      // เลือกบันทึกเฉพาะคู่ที่หลักฐานชัดเจนก่อน รายการกำกวมให้คนเปิดตรวจและติ๊กเอง
      setChecked(new Set(buildItems(result)
        .filter(it => it.kind === "pair" && it.status === "auto" && !it.main?.parse_error && !it.prb?.parse_error && !it.main?.requires_review && !it.prb?.requires_review)
        .map(it => it.key)))
    } catch (e) {
      setErr("อ่านไฟล์ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally {
      setExtracting(false); setProgress(null)
    }
  }

  const toggle = key => setChecked(prev => {
    const n = new Set(prev)
    n.has(key) ? n.delete(key) : n.add(key)
    return n
  })

  const updateRecord = (key, side, field, value) => {
    setData(prev => {
      if (!prev) return prev
      const [kind, rawIndex] = key.split("-")
      const index = Number(rawIndex)
      const update = record => ({ ...(record || {}), [field]: value })
      if (kind === "pair") {
        const pairs = [...(prev.pairs || [])]
        pairs[index] = { ...pairs[index], [side]: update(pairs[index]?.[side]) }
        return { ...prev, pairs }
      }
      const map = { om: "orphan_main", op: "orphan_prb", ot: "others" }
      const listName = map[kind]
      if (!listName) return prev
      const list = [...(prev[listName] || [])]
      list[index] = update(list[index])
      return { ...prev, [listName]: list }
    })
  }

  const items = data ? buildItems(data) : []
  const selectedCount = items.filter(it => checked.has(it.key)).length

  const doCommit = async () => {
    if (!data || !selectedCount) return
    setCommitting(true); setErr("")
    try {
      const payload = {
        items: items.filter(it => checked.has(it.key)).map(it => ({
          main:         it.main,
          prb:          it.prb || null,
          main_file_id: it.main?.file_id,
          prb_file_id:  it.prb?.file_id || null,
        })),
      }
      const res = await api.post(`/batch/${data.batch_id}/commit`, payload)
      setDone(res.data)
      setActiveMenu("review")
      const summary = res.data.summary || {}
      notify(`บันทึก กธ. ${summary.created || 0} · ผูกเอกสาร ${summary.attached || 0} · รอตรวจ ${summary.inbox || 0}`, "success")
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally {
      setCommitting(false)
    }
  }

  const discard = async () => {
    if (data?.batch_id) { try { await api.delete(`/batch/${data.batch_id}`) } catch {} }
    resetAll()
  }

  const S = data?.summary || {}
  const dups = data?.duplicates || []
  const pdfFlowPaused = false

  return (
    <div className="page-wrap">
      <div className="page-hd">
        <button className="page-back" onClick={() => navigate(-1)}>
          <Ico n="chevL" s={20} /><span className="btn-label">กลับ</span>
        </button>
        <div className="page-hd-div" />
        <div className="page-hd-info">
          <div className="page-title">นำเข้าเอกสารเป็นชุด</div>
          <div className="page-sub">เลือก PDF หลายไฟล์ · ระบบอ่านข้อมูลและช่วยจับคู่ กธ. กับ พ.ร.บ.</div>
        </div>
        <div className="page-hd-right">
          {data && !done && (
            <button className="btn btn-b" onClick={doCommit} disabled={!selectedCount || committing}>
              {committing
                ? <span className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : <Ico n="check" s={18} />}
              <span className="btn-txt">บันทึก {selectedCount} รายการ</span>
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <nav className={`pdf-menu-tabs${pdfFlowPaused ? " is-paused" : ""}`} aria-label="เมนูจัดการ PDF">
          <button type="button" className={activeMenu === "import" ? "active" : ""}
            onClick={() => selectMenu("import")} disabled={pdfFlowPaused || (!!data && !done)}>
            <span>1</span><div><strong>นำเข้า PDF</strong><small>เลือกพร้อมกัน 1–20 ไฟล์</small></div>
          </button>
          <button type="button" className={activeMenu === "review" ? "active" : ""}
            onClick={() => selectMenu("review")} disabled={pdfFlowPaused || (!data && !done)}>
            <span>2</span><div><strong>ตรวจสอบและจับคู่</strong><small>เทียบ PDF ก่อนบันทึก</small></div>
          </button>
          <button type="button" className={activeMenu === "history" ? "active" : ""}
            onClick={() => selectMenu("history")} disabled={pdfFlowPaused}>
            <span>3</span><div><strong>เอกสารรอตรวจ / ประวัติ</strong><small>เอกสารที่ยังจับคู่ไม่ได้และงานที่ผ่านมา</small></div>
          </button>
        </nav>

        {pdfFlowPaused ? (
          <div className="pdf-flow-paused" role="status">
            <span><Ico n="lock" s={28} /></span>
            <strong>ปิดใช้งานจัดการ PDF ชั่วคราว</strong>
            <p>ทั้ง 3 เมนูกำลังปรับปรุงระบบอ่านข้อมูลให้เสถียร กรุณาใช้เมนู “เพิ่มกรมธรรม์” สำหรับไฟล์เดี่ยวก่อน</p>
            <button type="button" className="btn btn-b" onClick={() => navigate("/upload")}><Ico n="upload" s={18} />ไปหน้าเพิ่มกรมธรรม์</button>
          </div>
        ) : <>

        {err && (
          <div className="bnr er" style={{ marginBottom: 16 }}>
            <Ico n="warn" s={20} />
            <div className="bnr-body"><div className="bnr-t">{err}</div></div>
          </div>
        )}

        {/* ── เนื้อหาตามเมนู ── */}
        {activeMenu === "history" ? (
          <BatchHistory items={history} pendingDocuments={inboxDocuments} loading={historyLoading} onRefresh={loadHistory}
            onOpen={async batchId => {
              try {
                const result = (await api.get(`/batch/${batchId}`)).data
                setData(result); setDone(null); setChecked(new Set()); setActiveMenu("review")
              } catch (e) {
                setErr("เปิดชุดนำเข้าไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
              }
            }} />
        ) : activeMenu === "review" && !data && !done ? (
          <div className="pdf-menu-empty"><Ico n="inbox" s={34} /><strong>ยังไม่มีเอกสารให้ตรวจ</strong><span>เริ่มจากเมนูนำเข้า PDF ก่อน</span></div>
        ) : done ? (
          <div className="info-card" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "34px 24px" }}>
            <div style={{ fontSize: 48, color: "var(--green)", marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)" }}>
              บันทึกกรมธรรม์ {done.summary?.created || 0} · ผูกเอกสาร {done.summary?.attached || 0} · รอตรวจ {done.summary?.inbox || 0}
            </div>
            {(done.summary?.failed || 0) > 0 && (
              <div style={{ fontSize: 15, color: "var(--red)", marginTop: 6 }}>
                ล้มเหลว {done.summary.failed} รายการ
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
              <button className="btn btn-b" onClick={() => navigate("/policies")}>
                <Ico n="list" s={18} /><span>ดูรายการกรมธรรม์</span>
              </button>
              <button className="btn btn-w" onClick={resetAll}>
                <Ico n="upload" s={18} /><span>อัปโหลดกองใหม่</span>
              </button>
              {(done.summary?.inbox || 0) > 0 && (
                <button className="btn btn-w" onClick={() => selectMenu("history")}>
                  <Ico n="inbox" s={18} /><span>ดูเอกสารรอตรวจ</span>
                </button>
              )}
            </div>
          </div>
        ) : !data ? (
          /* ── STEP 1: drop zone เต็มหน้า + รายการไฟล์ที่เลือก ── */
          <>
            <div
              className={`batch-dropzone${drag ? " is-dragging" : ""}${files.length ? " has-files" : ""}`}
              onClick={() => ref.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={e => { e.preventDefault(); setDrag(false) }}
              onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            >
              <div className="batch-drop-icon">
                <Ico n="upload" s={34} />
              </div>
              <div className="batch-drop-kicker">ขั้นตอนที่ 1</div>
              <div className="batch-drop-title">{files.length ? "เพิ่มไฟล์ PDF อีก" : "เลือกไฟล์ PDF ที่ต้องการนำเข้า"}</div>
              <div className="batch-drop-desc">{files.length ? `เลือกไว้ ${files.length} ไฟล์แล้ว · สามารถเพิ่มไฟล์ได้อีก` : "ลากไฟล์มาวาง หรือเลือกไฟล์จากเครื่องได้หลายไฟล์พร้อมกัน"}</div>
              <button type="button" className="btn btn-b batch-pick-btn" onClick={e => { e.stopPropagation(); ref.current?.click() }}>
                <Ico n="upload" s={18} /> เลือกไฟล์ PDF
              </button>
              <div className="batch-drop-notes">
                <span><Ico n="doc" s={15} /> รองรับ PDF เท่านั้น</span>
                <span><Ico n="inbox" s={15} /> สูงสุด 20 ไฟล์ต่อชุด</span>
                <span><Ico n="shield" s={15} /> ยังไม่บันทึกจนกดยืนยัน</span>
              </div>
            </div>
            <input ref={ref} type="file" accept=".pdf" multiple style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = "" }} />

            {files.length > 0 && (
              <div className="info-card" style={{ marginTop: 18 }}>
                <div className="info-card-hd" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span><Ico n="doc" s={18} /> รวบรวมไว้ {files.length} ไฟล์</span>
                  <button className="btn btn-w" style={{ padding: "6px 12px" }} onClick={() => setFiles([])}>ล้างทั้งหมด</button>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {files.map((f, i) => (
                    <div key={f.name + i} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                      borderBottom: "1px solid var(--sur2)", fontSize: 14.5,
                    }}>
                      <Ico n="doc" s={16} />
                      <span style={{ flex: 1, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      <span style={{ color: "var(--t3)", fontSize: 13 }}>{(f.size / 1024).toFixed(0)} KB</span>
                      <button onClick={() => removeFile(i)} title="เอาออก"
                        style={{ border: "none", background: "transparent", color: "var(--t3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
                <div className="batch-file-footer">
                  {extracting ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14.5, fontWeight: 600, color: "var(--t1)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span className="spin" style={{ width: 16, height: 16, borderWidth: 2 }} />
                          กำลังอ่าน PDF รอบ {progress?.chunk || 1} / {progress?.chunk_total || Math.ceil(files.length / 10)} · {progress?.done ?? 0} / {progress?.total ?? files.length} ไฟล์
                        </span>
                        <span style={{ color: "var(--t3)", fontWeight: 500 }}>{elapsed}s</span>
                      </div>
                      <div style={{ height: 8, background: "var(--sur)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--brd)" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.round(((progress?.done ?? 0) / (progress?.total || files.length)) * 100)}%`,
                          background: "var(--blue)", transition: "width .3s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--t3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {progress?.current ? `กำลังอ่าน: ${progress.current}` : "อัปโหลด/เตรียมไฟล์… อย่าปิดหน้านี้"}
                      </div>
                    </div>
                  ) : (
                    <div className="batch-file-ready">
                      <span><Ico n="shield" s={16} /> เพิ่มไฟล์ได้ครบแล้วจึงเริ่มอ่าน · ระบบอ่านครั้งละ 10 ไฟล์</span>
                      <button className="btn btn-b" onClick={doExtract} disabled={extracting}>
                        <Ico n="upload" s={18} /><span>เริ่มอ่าน PDF ทั้งชุด ({files.length} ไฟล์)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── STEP 2: รีวิวสรุป ── */
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
              <SumTile label="ทั้งหมด" val={S.total} />
              <SumTile label="คู่ กธ+พรบ" val={S.pairs} color="var(--green)" />
              <SumTile label="ต้องตรวจ" val={S.need_review} color="var(--amber)" />
              <SumTile label="กธ เดี่ยว" val={S.orphan_main} />
              <SumTile label="พรบ เดี่ยว" val={S.orphan_prb} />
              <SumTile label="อื่นๆ" val={S.others} />
              <SumTile label="ไฟล์ซ้ำ" val={dups.length} color="var(--t3)" />
            </div>

            <Section title="คู่ กรมธรรม์ + พ.ร.บ." icon="checkc" count={(data.pairs || []).length}>
              {(data.pairs || []).map((p, i) => (
                <ReviewRow key={`pair-${i}`} k={`pair-${i}`} checked={checked} toggle={toggle}
                  main={p.main} prb={p.prb} status={p.status} reasons={p.reasons} margin={p.margin}
                  batchId={data.batch_id} sourceFiles={files} expanded={expandedKey === `pair-${i}`} onExpand={() => setExpandedKey(k => k === `pair-${i}` ? null : `pair-${i}`)} onUpdate={updateRecord} />
              ))}
            </Section>

            <Section title="กรมธรรม์เดี่ยว (ไม่มี พ.ร.บ. จับคู่)" icon="doc" count={(data.orphan_main || []).length}>
              {(data.orphan_main || []).map((r, i) => (
                <ReviewRow key={`om-${i}`} k={`om-${i}`} checked={checked} toggle={toggle} main={r}
                  batchId={data.batch_id} sourceFiles={files} expanded={expandedKey === `om-${i}`} onExpand={() => setExpandedKey(k => k === `om-${i}` ? null : `om-${i}`)} onUpdate={updateRecord} />
              ))}
            </Section>

            <Section title="พ.ร.บ. เดี่ยว (จับคู่ กธ. เดิม หรือเก็บรอตรวจ)" icon="doc" count={(data.orphan_prb || []).length}>
              {(data.orphan_prb || []).map((r, i) => (
                <ReviewRow key={`op-${i}`} k={`op-${i}`} checked={checked} toggle={toggle} main={r}
                  batchId={data.batch_id} sourceFiles={files} expanded={expandedKey === `op-${i}`} onExpand={() => setExpandedKey(k => k === `op-${i}` ? null : `op-${i}`)} onUpdate={updateRecord} />
              ))}
            </Section>

            <Section title="เอกสารอื่น (แจ้งต่ออายุ / สลักหลัง / การเงิน / กธ. ประเภทอื่น)" icon="doc" count={(data.others || []).length}>
              {(data.others || []).map((r, i) => (
                <ReviewRow key={`ot-${i}`} k={`ot-${i}`} checked={checked} toggle={toggle} main={r}
                  batchId={data.batch_id} sourceFiles={files} expanded={expandedKey === `ot-${i}`} onExpand={() => setExpandedKey(k => k === `ot-${i}` ? null : `ot-${i}`)} onUpdate={updateRecord} />
              ))}
            </Section>

            {dups.length > 0 && (
              <Section title="ไฟล์ซ้ำ (ข้าม ไม่บันทึก)" icon="warn" count={dups.length}>
                {dups.map((r, i) => (
                  <div key={`dup-${i}`} style={{ padding: "10px 14px", color: "var(--t3)", fontSize: 14, borderBottom: "1px solid var(--sur2)" }}>
                    {r.orig_filename || r.file_id} — {r.parse_error || "ซ้ำกับไฟล์ก่อนหน้า"}
                  </div>
                ))}
              </Section>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-w" onClick={discard}>
                <Ico n="trash" s={18} /><span>ยกเลิกกองนี้</span>
              </button>
              <button className="btn btn-b" onClick={doCommit} disabled={!selectedCount || committing}>
                {committing
                  ? <><span className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} /><span>กำลังบันทึก…</span></>
                  : <><Ico n="check" s={18} /><span>บันทึก {selectedCount} รายการลงระบบ</span></>}
              </button>
            </div>
          </>
        )}
        </>}
      </div>
    </div>
  )
}

function BatchHistory({ items, pendingDocuments = [], loading, onRefresh, onOpen }) {
  const labels = {
    processing: ["กำลังอ่าน", "processing"], review: ["รอตรวจสอบ", "review"],
    committed: ["บันทึกแล้ว", "committed"], error: ["ผิดพลาด", "error"],
  }
  return (
    <>
    <section className="batch-history" style={{ marginBottom: 18 }}>
      <div className="batch-history-head">
        <div><strong>เอกสารที่ยังจับคู่ไม่ได้</strong><span>เก็บแยกจากกรมธรรม์ เพื่อไม่ให้ยอดและข้อมูลหลักผิด</span></div>
      </div>
      {!loading && !pendingDocuments.length
        ? <div className="pdf-menu-empty"><Ico n="checkc" s={34} /><strong>ไม่มีเอกสารค้างตรวจ</strong></div>
        : <div className="batch-history-list">{pendingDocuments.map(doc => {
            const label = DOCUMENT_LABELS[doc.document_type] || doc.document_type || "เอกสารไม่ทราบประเภท"
            return <article key={doc.id}>
              <div className="batch-history-main">
                <strong>{label}</strong>
                <span>{doc.original_filename || doc.pdf_filename || "PDF"}</span>
              </div>
              <div className="batch-history-main">
                <strong>{doc.reference_policy_number || "ไม่พบเลข กธ. อ้างอิง"}</strong>
                <span>{doc.insured_name || doc.license_plate || "ต้องตรวจข้อมูล"}</span>
              </div>
              <span className="batch-history-status review">รอตรวจ</span>
              {doc.pdf_url && <a className="btn btn-w" href={doc.pdf_url} target="_blank" rel="noreferrer">เปิด PDF</a>}
            </article>
          })}</div>}
    </section>
    <section className="batch-history">
      <div className="batch-history-head">
        <div><strong>ประวัติการนำเข้า PDF</strong><span>แสดงสูงสุด 50 ชุดล่าสุด</span></div>
        <button className="btn btn-w" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? <span className="spin" /> : <Ico n="refresh" s={17} />} โหลดใหม่
        </button>
      </div>
      {loading && !items.length ? <div className="pdf-menu-empty"><span className="spin" /><span>กำลังโหลดประวัติ…</span></div>
        : !items.length ? <div className="pdf-menu-empty"><Ico n="inbox" s={34} /><strong>ยังไม่มีประวัติ</strong><span>ชุดที่นำเข้าจะปรากฏที่นี่</span></div>
        : <div className="batch-history-list">{items.map(item => {
          const meta = labels[item.status] || [item.status || "ไม่ทราบสถานะ", "unknown"]
          const date = item.updated_at ? new Date(item.updated_at).toLocaleString("th-TH") : "—"
          return <article key={item.batch_id}>
            <div className="batch-history-main"><strong>ชุด {item.batch_id}</strong><span>{date}</span></div>
            <div className="batch-history-count"><strong>{item.total || 0}</strong><span>ไฟล์</span></div>
            <span className={`batch-history-status ${meta[1]}`}>{meta[0]}</span>
            {item.status === "processing" && <span className="batch-history-progress">{item.progress?.done || 0}/{item.progress?.total || item.total || 0}</span>}
            {item.status === "review" && <button className="btn btn-w" type="button" onClick={() => onOpen(item.batch_id)}>เปิดตรวจ</button>}
          </article>
        })}</div>}
    </section>
    </>
  )
}

function SumTile({ label, val, color }) {
  return (
    <div style={{ background: "var(--sur2)", borderRadius: 12, padding: "10px 16px", minWidth: 96 }}>
      <div style={{ fontSize: 12.5, color: "var(--t3)", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || "var(--t1)", lineHeight: 1.2 }}>{val ?? 0}</div>
    </div>
  )
}

function Section({ title, icon, count, children }) {
  if (!count) return null
  return (
    <div className="info-card" style={{ marginBottom: 14 }}>
      <div className="info-card-hd">
        <span><Ico n={icon} s={18} /> {title}</span>
        <span style={{ marginLeft: 8, color: "var(--t3)", fontWeight: 500 }}>({count})</span>
      </div>
      <div>{children}</div>
    </div>
  )
}

function ReviewRow({ k, checked, toggle, main, prb, status, reasons = [], margin, batchId, sourceFiles, expanded, onExpand, onUpdate }) {
  const m = recLine(main)
  const p = prb ? recLine(prb) : null
  const isSupportDocument = ["motor_prb", "renewal_notice", "endorsement", "credit_note", "invoice", "receipt", "unknown"].includes(m.docType)
  const on = checked.has(k)
  return (
    <article className={`batch-review-row${on ? "" : " is-unselected"}${expanded ? " is-open" : ""}`}>
      <div className="batch-review-summary">
        <input type="checkbox" checked={on} onChange={() => toggle(k)} aria-label={`เลือก ${m.name}`} />
        <div className="batch-review-main">
          <div className="batch-review-title">
            <strong>{m.name}</strong>
            <span className="batch-doc-chip">{m.type}</span>
            {p && <span className="batch-prb-chip">มี พ.ร.บ. จับคู่</span>}
          </div>
          <div className="batch-review-facts">
            <span>{isSupportDocument ? "เลข กธ. อ้างอิง" : "กธ."} {m.pol}</span><span>ทะเบียน {m.plate}</span><span>หมดอายุ {m.end}</span>
            {main?.chassis_no && <span>ตัวถัง {main.chassis_no}</span>}
          </div>
          {(m.err || reasons.length) && <div className="batch-review-note">{m.err || reasons.join(" · ")}</div>}
        </div>
        {status && <span className={`batch-match-status ${status === "auto" ? "ok" : "review"}`}>{status === "auto" ? "จับคู่แล้ว" : "ต้องตรวจ"}</span>}
        <button className="batch-open-btn" type="button" onClick={onExpand} aria-expanded={expanded}>
          {expanded ? "ซ่อนรายละเอียด" : "ตรวจ/แก้ข้อมูล"} <Ico n={expanded ? "chevU" : "chevD"} s={16} />
        </button>
      </div>
      {expanded && (
        <div className="batch-editor-wrap">
          <div className="batch-editor-help">เทียบข้อมูลกับ PDF แล้วแก้ไขได้ทันที ก่อนเลือกบันทึก รายการที่แก้ไขจะถูกบันทึกตามค่านี้</div>
          <div className="batch-review-workspace">
            <BatchPdfEvidence batchId={batchId} main={main} prb={prb} sourceFiles={sourceFiles} />
            <div className="batch-editor-column">
              <RecordEditor title={isSupportDocument ? "ข้อมูลเอกสารและข้อมูลอ้างอิง" : "ข้อมูลกรมธรรม์"} record={main} onChange={(field, value) => onUpdate(k, "main", field, value)} />
              {prb && <RecordEditor title="ข้อมูล พ.ร.บ. ที่จับคู่" record={prb} onChange={(field, value) => onUpdate(k, "prb", field, value)} />}
            </div>
          </div>
          {status === "review" && <div className="batch-review-warning">กรุณาตรวจเลขตัวถัง ทะเบียน และวันคุ้มครองของทั้งสองเอกสารก่อนเลือกบันทึก{margin != null ? ` (คะแนนห่างคู่รอง ${margin})` : ""}</div>}
        </div>
      )}
    </article>
  )
}

function BatchPdfEvidence({ batchId, main, prb, sourceFiles = [] }) {
  const docs = [
    { key: "main", label: "กรมธรรม์", record: main },
    ...(prb ? [{ key: "prb", label: "พ.ร.บ.", record: prb }] : []),
  ].filter(doc => doc.record?.file_id)
  const [active, setActive] = useState(docs[0]?.key || "main")
  const [fullscreen, setFullscreen] = useState(false)
  const current = docs.find(doc => doc.key === active) || docs[0]
  const sourceFile = current
    ? sourceFiles.find(file => file.name === current.record.orig_filename)
    : null
  const [localUrl, setLocalUrl] = useState(null)
  useEffect(() => {
    if (!sourceFile) { setLocalUrl(null); return undefined }
    const url = URL.createObjectURL(sourceFile)
    setLocalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [sourceFile])
  const apiUrl = !localUrl && current ? `${api.defaults.baseURL}/batch/${batchId}/files/${current.record.file_id}/pdf` : null
  const { blobUrl, loading } = usePdfBlob(apiUrl)
  const pdfUrl = localUrl || blobUrl

  if (!current) return null
  return (
    <aside className="batch-pdf-evidence" aria-label="เอกสาร PDF สำหรับตรวจสอบ">
      <div className="batch-pdf-head">
        <div><Ico n="doc" s={18} /><span>เอกสารอ้างอิง</span></div>
        <button type="button" className="batch-pdf-expand" onClick={() => setFullscreen(true)} disabled={!pdfUrl} title="เปิด PDF เต็มจอ">
          <Ico n="expand" s={17} /><span>เต็มจอ</span>
        </button>
      </div>
      <div className="batch-pdf-tabs" role="tablist" aria-label="เลือกเอกสาร">
        {docs.map(doc => (
          <button key={doc.key} type="button" role="tab" aria-selected={active === doc.key}
            className={active === doc.key ? "active" : ""} onClick={() => setActive(doc.key)}>
            {doc.label}<span>{doc.record.orig_filename || "PDF"}</span>
          </button>
        ))}
      </div>
      <div className="batch-pdf-frame">
        {loading && <div className="batch-pdf-loading"><span className="spin" /> กำลังเปิด PDF…</div>}
        {!loading && pdfUrl && <iframe src={pdfUrl} title={`PDF ${current.label}`} />}
        {!loading && !pdfUrl && <div className="batch-pdf-loading">ไฟล์ชั่วคราวหมดอายุ กรุณาเลือก PDF ชุดนี้ใหม่</div>}
      </div>
      <p>PDF นี้ใช้เพื่อตรวจทานเท่านั้น และจะเก็บเข้าระบบเมื่อกดบันทึกรายการ</p>
      {fullscreen && <PdfLightbox src={pdfUrl} filename={current.record.orig_filename} sizeKB={current.record.size ? Math.round(current.record.size / 1024) : null} onClose={() => setFullscreen(false)} />}
    </aside>
  )
}

function RecordEditor({ title, record = {}, onChange }) {
  const fields = [
    ["doc_type", "ประเภทเอกสาร", "document_type"],
    ["policy_number", "เลขกรมธรรม์"], ["company_code", "รหัสบริษัท"], ["app_number", "เลขใบคำขอ"],
    ["policy_type", "ประเภทกรมธรรม์"], ["new_renew", "ใหม่ / ต่ออายุ"], ["insured_name", "ผู้เอาประกัน"],
    ["phone", "เบอร์โทรศัพท์"], ["insured_address", "ที่อยู่", "wide"],
    ["risk_address", "สถานที่เอาประกัน (อัคคีภัย)", "wide"],
    ["agent_code", "รหัสตัวแทน"], ["broker_name", "ตัวแทน / นายหน้า"], ["broker_license", "เลขที่ใบอนุญาต"],
    ["license_plate", "ทะเบียนรถ"], ["license_province", "จังหวัดทะเบียน"], ["chassis_no", "เลขตัวถัง"],
    ["car_make", "ยี่ห้อรถ"], ["car_model", "รุ่นรถ"], ["car_year", "ปีรถ", "number"],
    ["sum_insured", "ทุนเอาประกัน (บาท)", "number"], ["coverage_start", "วันเริ่มคุ้มครอง", "date"], ["coverage_end", "วันสิ้นสุดคุ้มครอง", "date"],
    ["net_premium", "เบี้ยสุทธิ", "number"], ["stamp_duty", "อากร", "number"], ["vat", "ภาษี VAT", "number"], ["total_premium", "เบี้ยรวม", "number"],
  ]
  return (
    <section className="batch-record-editor">
      <h4><Ico n="doc" s={17} /> {title}</h4>
      <div className="batch-editor-grid">
        {fields.map(([key, label, kind]) => (
          <label key={key} className={kind === "wide" ? "wide" : ""}>
            <span>{label}</span>
            {kind === "document_type" ? (
              <select value={record[key] ?? "unknown"} onChange={e => onChange(key, e.target.value)}>
                {Object.entries(DOCUMENT_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            ) : (
              <input type={kind === "date" ? "date" : kind === "number" ? "number" : "text"}
                value={record[key] ?? ""} onChange={e => onChange(key, e.target.value)} />
            )}
          </label>
        ))}
      </div>
    </section>
  )
}
