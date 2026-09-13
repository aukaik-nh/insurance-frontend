const yearFromDate = value => {
  const year = Number(String(value || "").match(/^(\d{4})-/)?.[1])
  if (!year) return null
  return year >= 2400 ? year : year + 543
}

export const documentYear = record => {
  if (!record) return null
  const label = String(record.label || "").match(/ปี\s*((?:25|26)\d{2})/)
  if (record.doc_type && label) return Number(label[1])
  const filename = String(record.pdf_filename || "")
  const full = filename.match(/[-.]((?:25|26)\d{2})(?: \(\d+\))?\.pdf$/i)
  if (full) return Number(full[1])
  const short = filename.match(/\.(\d{2})(?: \(\d+\))?\.pdf$/i)
  if (short) return 2500 + Number(short[1])
  return label ? Number(label[1]) : yearFromDate(record.coverage_start) || yearFromDate(record.coverage_end)
}

const normalize = value => String(value || "").replace(/[\s-]/g, "").toUpperCase()
const isPrb = record => record?.doc_type === "prb" || String(record?.policy_type || "").toUpperCase() === "P"
const isMotor = record => {
  if (!record || isPrb(record) || (record.doc_type && record.doc_type !== "main")) return false
  const type = String(record.policy_type || "").toUpperCase().trim()
  // Older imported motor policies use insurer-specific type codes. A vehicle
  // identifier is stronger evidence than that code, but never for another doc type.
  return ["M", "STY"].includes(type) || !!(normalize(record.chassis_no) || normalize(record.license_plate))
}
const sameId = (a, b) => String(a) === String(b)

function carMatchScore(main, prb) {
  const mainChassis = normalize(main.chassis_no)
  const prbChassis = normalize(prb.chassis_no)
  if (mainChassis && prbChassis && mainChassis !== prbChassis) return 0
  const chassisMatch = !!mainChassis && mainChassis === prbChassis
  const mainPlate = normalize(main.license_plate)
  const prbPlate = normalize(prb.license_plate)
  const plateMatch = !!mainPlate && mainPlate === prbPlate
  if (!chassisMatch && !plateMatch) return 0
  const mainProvince = normalize(main.license_province)
  const prbProvince = normalize(prb.license_province)
  if (!chassisMatch && mainProvince && prbProvince && mainProvince !== prbProvince) return 0
  return chassisMatch ? 80 : 60
}

/** A same-year document is never enough evidence to combine premiums. */
export function selectPremiumPair({ activePolicy, parentPolicy, relatedPolicies = [], attachments = [], activeDocId = "main", preferredPairId = "" }) {
  const selectedAttachment = sameId(activePolicy?.id, parentPolicy?.id) && activeDocId !== "main"
    ? attachments.find(item => sameId(item.id, activeDocId))
    : null
  const selected = selectedAttachment || activePolicy
  const year = documentYear(selected) || documentYear(activePolicy)
  if (!selected || !year) return { main: null, prb: null, year, status: "no-year", options: [] }

  const policies = [parentPolicy, ...relatedPolicies].filter((item, index, list) =>
    item?.id && list.findIndex(other => sameId(other?.id, item.id)) === index
  )
  const selectedIsPrb = isPrb(selected)
  const main = selectedIsPrb ? null : (isMotor(activePolicy) && documentYear(activePolicy) === year ? activePolicy : null)
  const prb = selectedIsPrb ? selected : null
  if (!main && !prb) return {
    main: selectedAttachment ? null : selected,
    prb: null,
    year,
    status: selectedAttachment ? "no-policy" : "not-motor",
    options: [],
  }

  const candidates = []
  if (main) {
    if (sameId(main.id, parentPolicy?.id)) {
      for (const attachment of attachments) {
        if (isPrb(attachment) && (documentYear(attachment) || year) === year) {
          candidates.push({ record: attachment, key: `attachment:${attachment.id}`, score: 100 })
        }
      }
    }
    for (const policy of policies) {
      if (sameId(policy.id, main.id) || !isPrb(policy) || documentYear(policy) !== year) continue
      const score = carMatchScore(main, policy)
      if (score) candidates.push({ record: policy, key: `policy:${policy.id}`, score })
    }
  } else {
    for (const policy of policies) {
      if (!isMotor(policy) || documentYear(policy) !== year) continue
      const score = selectedAttachment && sameId(policy.id, parentPolicy?.id)
        ? 100 : carMatchScore(policy, prb)
      if (score) candidates.push({ record: policy, key: `policy:${policy.id}`, score })
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  const preferred = candidates.find(candidate => candidate.key === preferredPairId)
  const choice = preferred || (candidates.length === 1 || candidates[0]?.score > candidates[1]?.score ? candidates[0] : null)
  return {
    main: main || choice?.record || null,
    prb: prb || choice?.record || null,
    year,
    status: choice ? "paired" : candidates.length ? "ambiguous" : "unpaired",
    options: candidates,
    chosenKey: choice?.key || "",
  }
}
