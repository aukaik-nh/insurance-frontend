import { useState, useRef } from "react"
import api from "../api"

const FIELDS = {
  policy_number: "เลขกรมธรรม์",
  insured_name: "ชื่อผู้เอาประกัน",
  insured_address: "ที่อยู่",
  license_plate: "ทะเบียนรถ",
  chassis_no: "เลขตัวถัง",
  car_make: "ยี่ห้อรถ",
  car_model: "รุ่นรถ",
  car_year: "ปีรถ",
  coverage_start: "วันเริ่มคุ้มครอง",
  coverage_end: "วันสิ้นสุดคุ้มครอง",
  net_premium: "เบี้ยสุทธิ",
  stamp_duty: "อากร",
  vat: "VAT",
  total_premium: "รวมเบี้ย",
  broker_name: "ชื่อตัวแทน",
}

const SECTIONS = [
  { title: "ข้อมูลกรมธรรม์", keys: ["policy_number", "broker_name"] },
  { title: "ผู้เอาประกัน", keys: ["insured_name", "insured_address"] },
  { title: "ข้อมูลรถ", keys: ["license_plate", "chassis_no", "car_make", "car_model", "car_year"] },
  { title: "ระยะเวลาคุ้มครอง", keys: ["coverage_start", "coverage_end"] },
  { title: "เบี้ยประกัน", keys: ["net_premium", "stamp_duty", "vat", "total_premium"] },
]

export default function Upload() {
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith(".pdf")) return alert("เฉพาะ PDF เท่านั้น")
    setLoading(true)
    setSaved(false)
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await api.post("/upload-pdf", form)
      setParsed(res.data.parsed)
    } catch (e) {
      alert("อ่าน PDF ไม่สำเร็จ: " + e.message)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    await api.post("/save-policy", parsed)
    setSaved(true)
    setParsed(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">อัปโหลด PDF กรมธรรม์</h1>
        <p className="text-slate-500 mt-1 text-sm">อัปโหลดไฟล์ PDF เพื่อดึงข้อมูลกรมธรรม์อัตโนมัติ</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl mb-6">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-sm">บันทึกกรมธรรม์เรียบร้อยแล้ว</span>
        </div>
      )}

      {!parsed && !loading && (
        <div
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200
            ${dragging
              ? "border-indigo-400 bg-indigo-50 scale-[1.01]"
              : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
            }`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors
            ${dragging ? "bg-indigo-100" : "bg-slate-100"}`}>
            <svg
              className={`w-8 h-8 transition-colors ${dragging ? "text-indigo-500" : "text-slate-400"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">ลากไฟล์ PDF มาวางที่นี่</p>
          <p className="text-slate-400 text-sm mt-1">หรือคลิกเพื่อเลือกไฟล์จากเครื่อง</p>
          <span className="inline-block mt-4 px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">
            รองรับ .PDF เท่านั้น
          </span>
          <input ref={inputRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700 font-medium">กำลังวิเคราะห์ไฟล์ PDF</p>
          <p className="text-slate-400 text-sm mt-1">อาจใช้เวลาสักครู่...</p>
        </div>
      )}

      {parsed && (
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-800 mb-6">ตรวจสอบและแก้ไขข้อมูล</h2>

              <div className="space-y-7">
                {SECTIONS.map((section) => (
                  <div key={section.title}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {section.title}
                      </span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {section.keys.map((key) => (
                        <div key={key} className={key === "insured_address" ? "col-span-2" : ""}>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5">
                            {FIELDS[key]}
                          </label>
                          <input
                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg
                              text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                              focus:border-indigo-400 transition-all duration-150"
                            value={parsed[key] ?? ""}
                            onChange={(e) => setParsed({ ...parsed, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-7 pt-6 border-t border-slate-100">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white
                    px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  บันทึกลงฐานข้อมูล
                </button>
                <button
                  onClick={() => setParsed(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600
                    rounded-lg text-sm font-medium transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>

          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sticky top-22">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ข้อความดิบจาก PDF
                </span>
              </div>
              <textarea
                readOnly
                className="w-full h-[520px] text-xs bg-slate-50 border border-slate-100 rounded-lg
                  p-3 text-slate-500 resize-none font-mono leading-relaxed"
                value={parsed.raw_text || ""}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
