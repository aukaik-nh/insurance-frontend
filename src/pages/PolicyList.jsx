import { useEffect, useState } from "react"
import api from "../api"

export default function PolicyList() {
  const [policies, setPolicies] = useState([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = async () => {
    const res = await api.get("/policies", { params: { page, search } })
    setPolicies(res.data.data)
    setTotal(res.data.total || 0)
  }

  useEffect(() => { load() }, [page, search])

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">รายการกรมธรรม์</h1>
          <p className="text-slate-500 text-sm mt-1">
            ทั้งหมด <span className="font-semibold text-slate-700">{total}</span> รายการ
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                placeholder-slate-400 transition-all duration-150"
              placeholder="ค้นหา เลขกรมธรรม์ / ชื่อ / ทะเบียน..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["เลขกรมธรรม์", "ชื่อผู้เอาประกัน", "ทะเบียนรถ", "รวมเบี้ย", "วันหมดอายุ", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider
                      ${i === 5 ? "w-20 text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm">ไม่พบข้อมูลกรมธรรม์</span>
                    </div>
                  </td>
                </tr>
              ) : policies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100
                      px-2 py-0.5 rounded">
                      {p.policy_number}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{p.insured_name}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md
                      bg-blue-50 text-blue-700 text-xs font-medium">
                      {p.license_plate}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-800 font-semibold tabular-nums text-right pr-8">
                    {p.total_premium?.toLocaleString()}
                    <span className="text-slate-400 font-normal ml-1 text-xs">฿</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{p.coverage_end}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium
                      opacity-0 group-hover:opacity-100 transition-opacity">
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-400">หน้าที่ {page}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white
                border border-slate-200 rounded-lg hover:bg-slate-50
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ก่อนหน้า
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white
                border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ถัดไป
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
