import { useState, useEffect } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { getStatus } from "../helpers"
import { PolicyTable } from "../components/PolicyTable"
import { PreviewPanel } from "../components/PreviewPanel"

const LIMIT = 10

const TAB_META = {
  dashboard: { title: "ภาพรวมระบบ",          sub: "สรุปสถานะกรมธรรม์ประกันภัยรถยนต์" },
  policies:  { title: "กรมธรรม์ทั้งหมด",      sub: "" },
  expiring:  { title: "กรมธรรม์ใกล้หมดอายุ",  sub: "" },
}

export function ListPage({ tab }) {
  const navigate = useNavigate()
  const { search, setSearch, page, setPage, notify, setExpiringCount } = useOutletContext()

  const [rows, setRows]               = useState([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [previewPolicy, setPreviewPolicy] = useState(null)
  const [pdfOnly, setPdfOnly]         = useState(false)
  const [sortKey, setSortKey]         = useState("created_at")
  const [sortDir, setSortDir]         = useState("desc")   // "asc" | "desc"

  // toggle sort: คลิก column เดิม → สลับ direction, คลิก column อื่น → ตั้ง asc
  const onSort = (col) => {
    if (sortKey === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(col)
      setSortDir("asc")
    }
    setPage(1)
  }

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, sort: sortKey, order: sortDir }
      if (search) params.search = search
      const res = await api.get("/policies", { params })
      const data = res.data.data || []
      setRows(data)
      setTotal(res.data.total || 0)

      const expCnt = data.filter(r => {
        if (!r.coverage_end) return false
        const d = (new Date(r.coverage_end) - new Date()) / 86400000
        return d >= 0 && d < 30
      }).length
      setExpiringCount(expCnt)
    } catch (e) {
      notify("โหลดข้อมูลไม่สำเร็จ: " + (e.response?.data?.detail || e.message), "error")
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, search, sortKey, sortDir])

  useEffect(() => { setPreviewPolicy(null) }, [tab])

  const expiring = rows.filter(r => {
    if (!r.coverage_end) return false
    const d = (new Date(r.coverage_end) - new Date()) / 86400000
    return d >= 0 && d < 30
  })
  const active     = rows.filter(r => r.coverage_end && new Date(r.coverage_end) > new Date()).length
  const sumPremium = rows.reduce((s, r) => s + (Number(r.total_premium) || 0), 0)
  const pages      = Math.ceil(total / LIMIT)

  const tabMeta = {
    dashboard: { title: "ภาพรวมระบบ",          sub: "สรุปสถานะกรมธรรม์ประกันภัยรถยนต์" },
    policies:  { title: "กรมธรรม์ทั้งหมด",      sub: `${total.toLocaleString()} รายการในระบบ` },
    expiring:  { title: "กรมธรรม์ใกล้หมดอายุ",  sub: `${expiring.length} รายการ · ต้องต่ออายุภายใน 30 วัน` },
  }

  // filter เฉพาะที่มี PDF (ฝั่ง client — เฉพาะ rows หน้านี้)
  const hasPdf = r => !!(r.pdf_url || r.pdf_filename || r.pdf_size)
  const baseRows = tab === "expiring" ? expiring : rows
  const displayRows = pdfOnly ? baseRows.filter(hasPdf) : baseRows
  const pdfCount = rows.filter(hasPdf).length
  const displayTotal = tab === "expiring" ? expiring.length : (pdfOnly ? pdfCount : total)

  return (
    <>
      {/* subtitle bar */}
      <div className="top">
        <div className="top-l">
          <div className="top-title">{tabMeta[tab]?.title}</div>
          <div className="top-sub">{tabMeta[tab]?.sub}</div>
        </div>
        {tab !== "dashboard" && (
          <div className="top-srch">
            <Ico n="search" s={15} />
            <input
              placeholder="ค้นหา เลขกรมธรรม์, ชื่อ, ทะเบียน..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button className="top-srch-clr" onClick={() => { setSearch(""); setPage(1) }}>
                <Ico n="x" s={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`list-layout${previewPolicy ? " has-pvp" : ""}`}>
        <div className="body">

          {tab === "dashboard" && (
            <>
              <div className="stats">
                {[
                  { ico: "doc",      cls: "bl", lbl: "กรมธรรม์ทั้งหมด",   val: total.toLocaleString(),  sub: "รายการในระบบ" },
                  { ico: "shield",   cls: "gr", lbl: "คุ้มครองอยู่",       val: active,                  sub: "ยังไม่หมดอายุ" },
                  { ico: "bell",     cls: "am", lbl: "ใกล้หมดอายุ",        val: expiring.length,         sub: "ภายใน 30 วัน" },
                  { ico: "banknote", cls: "pu", lbl: "เบี้ยรวม (หน้านี้)", val: sumPremium.toLocaleString("th-TH", { maximumFractionDigits: 0 }), sub: "บาท" },
                ].map(c => (
                  <div key={c.lbl} className="sc">
                    <div className={`sc-ico ${c.cls}`}><Ico n={c.ico} s={20} /></div>
                    <div className="sc-bd">
                      <div className="sc-lbl">{c.lbl}</div>
                      <div className="sc-val">{c.val}</div>
                      <div className="sc-sub">{c.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {expiring.length > 0 && (
                <div className="bnr am">
                  <Ico n="bell" s={18} />
                  <div className="bnr-body">
                    <div className="bnr-t">มี {expiring.length} กรมธรรม์ใกล้หมดอายุภายใน 30 วัน</div>
                    <div className="bnr-s">กรุณาติดต่อลูกค้าเพื่อต่ออายุกรมธรรม์</div>
                  </div>
                  <button className="btn btn-w"
                    style={{ fontSize: 13, padding: "7px 13px", flexShrink: 0 }}
                    onClick={() => navigate("/expiring")}>
                    ดูรายการ <Ico n="arrowR" s={13} />
                  </button>
                </div>
              )}

              {/* search */}
              <div className="big-srch-wrap">
                <div className="big-srch">
                  <Ico n="search" s={16} />
                  <input
                    placeholder="ค้นหา เลขกรมธรรม์, ชื่อผู้เอาประกัน, ทะเบียนรถ..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                  />
                  {search && (
                    <button className="big-srch-clr" onClick={() => { setSearch(""); setPage(1) }}>
                      <Ico n="x" s={15} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {tab !== "dashboard" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setPdfOnly(v => !v)}
                className={pdfOnly ? "btn btn-b" : "btn btn-w"}
                style={{ fontSize: 13, padding: "6px 12px" }}
              >
                <Ico n="doc" s={13} />
                {pdfOnly ? "แสดงทั้งหมด" : "เฉพาะที่มี PDF"}
              </button>
              <span style={{ fontSize: 12, color: "var(--t3)" }}>
                หน้านี้มี PDF {pdfCount}/{rows.length} รายการ
              </span>
            </div>
          )}

          <PolicyTable
            rows={displayRows}
            loading={loading}
            total={displayTotal}
            page={tab === "expiring" ? 1 : page}
            pages={tab === "expiring" ? 1 : pages}
            setPage={tab === "expiring" ? () => {} : setPage}
            onRow={r => setPreviewPolicy(prev => prev?.id === r.id ? null : r)}
            activeId={previewPolicy?.id}
            pageOffset={tab === "expiring" ? 0 : (page - 1) * LIMIT}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
          />
        </div>

        {previewPolicy && (
          <PreviewPanel
            p={previewPolicy}
            onClose={() => setPreviewPolicy(null)}
            onOpen={() => navigate(`/policies/${previewPolicy.id}`, { state: { policy: previewPolicy } })}
          />
        )}
      </div>
    </>
  )
}
