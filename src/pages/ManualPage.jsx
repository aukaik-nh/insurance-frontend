import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import api from "../api"
import { Ico } from "../icons"
import { PolicyForm } from "../components/PolicyForm"

export function ManualPage() {
  const navigate = useNavigate()
  const { notify } = useOutletContext()

  const [data, setData]     = useState({})
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState("")

  const doSave = async () => {
    if (!data.policy_number?.toString().trim()) {
      setErr("กรุณากรอก 'เลขกรมธรรม์' ก่อน"); return
    }
    setSaving(true); setErr("")
    try {
      await api.post("/save-policy", data)
      notify("บันทึกกรมธรรม์เรียบร้อยแล้ว")
      navigate("/")
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
      setSaving(false)
    }
  }

  const filled = Object.values(data).filter(v => v != null && v !== "").length

  return (
    <div className="page-wrap">
      <div className="page-hd">
        <button className="page-back" onClick={() => navigate(-1)}>
          <Ico n="chevL" s={19} /> กลับ
        </button>
        <div className="page-hd-div" />
        <div className="page-hd-info">
          <div className="page-title">กรอกข้อมูลกรมธรรม์ด้วยตนเอง</div>
          <div className="page-sub">กรอกเฉพาะช่องที่ทราบ · กรอกแล้ว {filled} ช่อง</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-b" onClick={doSave} disabled={saving}>
            <Ico n="save" s={18} />
            {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
          </button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 820 }}>
        {err && (
          <div className="bnr er" style={{ marginBottom: 20 }}>
            <Ico n="warn" s={22} />
            <div className="bnr-body"><div className="bnr-t">{err}</div></div>
            <button onClick={() => setErr("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", display: "flex" }}>
              <Ico n="x" s={18} />
            </button>
          </div>
        )}

        <PolicyForm values={data} onChange={setData} />

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn btn-w" onClick={() => navigate(-1)}>ยกเลิก</button>
          <button className="btn btn-b" onClick={doSave} disabled={saving}>
            <Ico n="save" s={18} />
            {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  )
}
