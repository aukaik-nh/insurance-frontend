import { useEffect } from "react"
import { Ico } from "../icons"

export function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`toast ${type === "success" ? "ok" : "er"}`}>
      <Ico n={type === "success" ? "checkc" : "xc"} s={22} />
      <span>{msg}</span>
    </div>
  )
}
