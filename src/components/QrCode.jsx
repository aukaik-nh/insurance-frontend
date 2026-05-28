import { useEffect, useRef } from "react"
import QRCode from "qrcode"

/**
 * Render real QR code from payload string.
 * Usage: <QrCode value="00020101..." size={88} />
 */
export function QrCode({ value, size = 96, level = "H" }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!value || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: level,
      color: { dark: "#000000", light: "#ffffff" },
    }, (err) => {
      if (err) console.warn("[QrCode] generate failed:", err)
    })
  }, [value, size, level])

  return <canvas ref={canvasRef} style={{ display: "block" }} width={size} height={size} />
}
