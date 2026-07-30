import { useState, useRef } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { fmtDate, POLICY_TYPE_LABEL } from "../helpers"

// สรุปข้อมูลย่อของ record ที่ AI อ่านได้ — ใช้โชว์ในรายการรีวิว
function recLine(r) {
  const typeLabel = POLICY_TYPE_LABEL?.[r?.policy_type] || r?.policy_type || "—"
  return {
    name:  r?.insured_name || "— ไม่พบชื่อ —",
    plate: r?.license_plate || "—",
    type:  typeLabel,
    pol:   r?.policy_number || "—",
    end:   r?.coverage_end ? fmtDate(r.coverage_end) : "—",
    err:   r?.parse_error || null,
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

  const addFiles = list => {
    const pdfs = Array.from(list || []).filter(
      f => f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf")
    )
    if (!pdfs.length) { setErr("รองรับเฉพาะไฟล์ PDF เท่านั้น"); return }
    setErr("")
    setFiles(prev => {
      const seen = new Set(prev.map(f => f.name + f.size))
      return [...prev, ...pdfs.filter(f => !seen.has(f.name + f.size))]
    })
  }

  const removeFile = i => setFiles(prev => prev.filter((_, idx) => idx !== i))
  const resetAll = () => { setFiles([]); setData(null); setChecked(new Set()); setDone(null); setErr("") }

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
    setExtracting(true); setErr("")
    try {
      const fd = new FormData()
      files.forEach(f => fd.append("files", f))
      const res = await api.post("/batch/extract", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,   // AI อ่านหลายไฟล์อาจนาน
      })
      const d = res.data
      setData(d)
      // default: ติ๊กทุกรายการที่บันทึกได้
      setChecked(new Set(buildItems(d).map(it => it.key)))
    } catch (e) {
      setErr("อ่านไฟล์ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally {
      setExtracting(false)
    }
  }

  const toggle = key => setChecked(prev => {
    const n = new Set(prev)
    n.has(key) ? n.delete(key) : n.add(key)
    return n
  })

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
      notify(`บันทึกสำเร็จ ${res.data.summary?.created || 0} รายการ`, "success")
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

  return (
    <div className="page-wrap">
      <div className="page-hd">
        <button className="page-back" onClick={() => navigate(-1)}>
          <Ico n="chevL" s={20} /><span className="btn-label">กลับ</span>
        </button>
        <div className="page-hd-div" />
        <div className="page-hd-info">
          <div className="page-title">อัปโหลดหลายไฟล์</div>
          <div className="page-sub">โยน PDF ทีเดียวหลายไฟล์ · AI อ่าน + จับคู่ กธ↔พรบ ให้อัตโนมัติ</div>
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
        {err && (
          <div className="bnr er" style={{ marginBottom: 16 }}>
            <Ico n="warn" s={20} />
            <div className="bnr-body"><div className="bnr-t">{err}</div></div>
          </div>
        )}

        {/* ── ผลลัพธ์หลัง commit ── */}
        {done ? (
          <div className="info-card" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "34px 24px" }}>
            <div style={{ fontSize: 48, color: "var(--green)", marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)" }}>
              บันทึกสำเร็จ {done.summary?.created || 0} รายการ
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
            </div>
          </div>
        ) : !data ? (
          /* ── STEP 1: drop zone เต็มหน้า + รายการไฟล์ที่เลือก ── */
          <>
            <div
              onClick={() => ref.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={e => { e.preventDefault(); setDrag(false) }}
              onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
              style={{
                border: `2.5px dashed ${drag ? "var(--blue)" : "var(--brd2)"}`,
                background: drag ? "var(--blue-bg)" : "var(--sur2)",
                borderRadius: 20, minHeight: files.length ? 200 : 340,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all .15s", textAlign: "center", padding: 24,
              }}
            >
              <div className="drop-h-ic" style={{ width: 84, height: 84, borderRadius: 22, marginBottom: 14 }}>
                <Ico n="upload" s={40} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)" }}>
                ลากไฟล์ PDF หลายไฟล์มาวางที่นี่
              </div>
              <div style={{ fontSize: 16, color: "var(--t3)", marginTop: 6 }}>
                หรือคลิกเพื่อเลือก · โยนทั้ง กธ และ พรบ พร้อมกันได้เลย (สูงสุด 300 ไฟล์)
              </div>
            </div>
            <input ref={ref} type="file" accept=".pdf" multiple style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = "" }} />

            {files.length > 0 && (
              <div className="info-card" style={{ marginTop: 18 }}>
                <div className="info-card-hd" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span><Ico n="doc" s={18} /> เลือกไว้ {files.length} ไฟล์</span>
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
                <div style={{ padding: 16, display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-b" onClick={doExtract} disabled={extracting}>
                    {extracting
                      ? <><span className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} /><span>AI กำลังอ่าน {files.length} ไฟล์…</span></>
                      : <><Ico n="upload" s={18} /><span>อ่านด้วย AI ({files.length} ไฟล์)</span></>}
                  </button>
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
                  main={p.main} prb={p.prb} status={p.status} />
              ))}
            </Section>

            <Section title="กรมธรรม์เดี่ยว (ไม่มี พ.ร.บ. จับคู่)" icon="doc" count={(data.orphan_main || []).length}>
              {(data.orphan_main || []).map((r, i) => (
                <ReviewRow key={`om-${i}`} k={`om-${i}`} checked={checked} toggle={toggle} main={r} />
              ))}
            </Section>

            <Section title="พ.ร.บ. เดี่ยว (บันทึกเป็นกรมธรรม์ พ.ร.บ.)" icon="doc" count={(data.orphan_prb || []).length}>
              {(data.orphan_prb || []).map((r, i) => (
                <ReviewRow key={`op-${i}`} k={`op-${i}`} checked={checked} toggle={toggle} main={r} />
              ))}
            </Section>

            <Section title="เอกสารอื่น (อัคคีภัย / PA / ฯลฯ)" icon="doc" count={(data.others || []).length}>
              {(data.others || []).map((r, i) => (
                <ReviewRow key={`ot-${i}`} k={`ot-${i}`} checked={checked} toggle={toggle} main={r} />
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
      </div>
    </div>
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

function ReviewRow({ k, checked, toggle, main, prb, status }) {
  const m = recLine(main)
  const p = prb ? recLine(prb) : null
  const on = checked.has(k)
  return (
    <div onClick={() => toggle(k)}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
        borderBottom: "1px solid var(--sur2)", cursor: "pointer",
        background: on ? "transparent" : "var(--sur2)", opacity: on ? 1 : 0.6,
      }}>
      <input type="checkbox" checked={on} readOnly
        style={{ width: 18, height: 18, accentColor: "var(--blue)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: "var(--t1)", fontSize: 15 }}>{m.name}</span>
          <span style={{ fontSize: 12.5, background: "var(--blue-bg)", color: "var(--blue)", padding: "1px 8px", borderRadius: 99, fontWeight: 600 }}>{m.type}</span>
          {m.plate !== "—" && <span style={{ fontSize: 13, color: "var(--t2)" }}>· {m.plate}</span>}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 2 }}>
          {m.pol} · หมดอายุ {m.end}
          {p && <span style={{ color: "var(--green)" }}> · แนบ พ.ร.บ. ({p.plate})</span>}
          {m.err && <span style={{ color: "var(--amber)" }}> · ⚠ {m.err}</span>}
        </div>
      </div>
      {status && (
        <span style={{
          fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99, flexShrink: 0,
          background: status === "auto" ? "var(--green-bg)" : "var(--amber-bg)",
          color: status === "auto" ? "var(--green)" : "var(--amber)",
        }}>{status === "auto" ? "จับคู่แม่น" : "ควรตรวจ"}</span>
      )}
    </div>
  )
}
