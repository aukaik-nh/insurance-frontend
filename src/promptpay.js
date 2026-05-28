// PromptPay payload generator (EMVCo QR) — JavaScript port of services/invoice_generator.py
// Output payload string can be passed to a QR code generator (qrcode lib)

function _crc16(data) {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

function _tlv(tag, value) {
  const len = value.length.toString().padStart(2, "0")
  return `${tag}${len}${value}`
}

/**
 * Generate PromptPay EMVCo payload.
 * @param {string} target - phone (10 digits, starts with 0) | nat-ID (13) | e-wallet (15)
 * @param {number|null} amount - if set, payload is "single-use" with amount
 * @returns {string} EMVCo payload (to feed into a QR code library)
 */
export function generatePromptPayPayload(target, amount = null) {
  const pid = (target || "").replace(/[-\s]/g, "")

  let merchantId
  if (pid.length === 10 && pid.startsWith("0")) {
    // phone — prepend 0066 (Thailand country code) and drop leading 0
    merchantId = _tlv("01", "0066" + pid.substring(1))
  } else if (pid.length === 13) {
    merchantId = _tlv("02", pid)
  } else if (pid.length === 15) {
    merchantId = _tlv("03", pid)
  } else {
    throw new Error(`PromptPay target must be 10/13/15 digits (got ${pid.length})`)
  }

  const info = _tlv("00", "A000000677010111") + merchantId

  let payload = _tlv("00", "01")                          // payload format indicator
    + _tlv("01", amount ? "12" : "11")                    // single-use vs multi-use
    + _tlv("29", info)
    + _tlv("53", "764")                                    // currency THB
    + (amount ? _tlv("54", Number(amount).toFixed(2)) : "")
    + _tlv("58", "TH")                                     // country

  payload += "6304"                                        // CRC tag + length
  return payload + _crc16(payload)
}
