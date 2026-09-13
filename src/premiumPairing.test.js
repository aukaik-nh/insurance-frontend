import assert from "node:assert/strict"
import { test } from "node:test"
import { documentYear, selectPremiumPair } from "./premiumPairing.js"
import { calculateBilling } from "./helpers.js"

const main = (id, plate = "กม 320 กท", chassis = "JTFHS02P100048203", year = 2570) => ({
  id, policy_type: "M", license_plate: plate, chassis_no: chassis,
  pdf_filename: `กธ.${String(year).slice(-2)}.pdf`, net_premium: 15870, total_premium: 17049.38,
})
const prb = (id, plate = "กม320กท", chassis = "JTFHS02P100048203", year = 2570) => ({
  id, policy_type: "P", license_plate: plate, chassis_no: chassis,
  pdf_filename: `พรบ.${String(year).slice(-2)}.pdf`, net_premium: 900, total_premium: 967.28,
})

test("selected year uses the document year visible in the PDF list", () => {
  assert.equal(documentYear({ pdf_filename: "กม320กท กธ.70.pdf", coverage_start: "2026-07-03" }), 2570)
  assert.equal(documentYear({ pdf_filename: "กม320กท-พรบ.-2569.pdf" }), 2569)
  assert.equal(documentYear({ doc_type: "prb", label: "พ.ร.บ. ปี 2570", pdf_filename: "กม320กท-พรบ.-2569.pdf" }), 2570)
})

test("pairs only the same car and selected document year", () => {
  const selected = main("main")
  const result = selectPremiumPair({
    activePolicy: selected, parentPolicy: selected,
    relatedPolicies: [main("old", "กม320กท", "JTFHS02P100048203", 2569), prb("other", "3กต8862", "DIFFERENT"), prb("pair"), prb("old-prb", "กม320กท", "JTFHS02P100048203", 2569)],
  })
  assert.equal(result.prb?.id, "pair")
  assert.equal(result.year, 2570)
})

test("does not combine unrelated or ambiguous same-year premiums", () => {
  const selected = main("main", "กม320กท", "")
  const unrelated = selectPremiumPair({ activePolicy: selected, parentPolicy: selected, relatedPolicies: [prb("other", "3กต8862", "")] })
  assert.equal(unrelated.prb, null)
  assert.equal(unrelated.status, "unpaired")
  const ambiguous = selectPremiumPair({ activePolicy: selected, parentPolicy: selected, relatedPolicies: [prb("a", "กม320กท", ""), prb("b", "กม320กท", "")] })
  assert.equal(ambiguous.status, "ambiguous")
  assert.equal(ambiguous.prb, null)
  const chosen = selectPremiumPair({ activePolicy: selected, parentPolicy: selected, relatedPolicies: [prb("a", "กม320กท", ""), prb("b", "กม320กท", "")], preferredPairId: "policy:b" })
  assert.equal(chosen.prb?.id, "b")
})

test("a PRB attachment uses its linked parent only in the same year", () => {
  const selected = main("main")
  const attachment = { id: "att", doc_type: "prb", label: "พ.ร.บ. ปี 2570", total_premium: 967.28 }
  const pair = selectPremiumPair({ activePolicy: selected, parentPolicy: selected, attachments: [attachment], activeDocId: "att" })
  assert.equal(pair.main?.id, "main")
  assert.equal(pair.prb?.id, "att")
  const wrongYear = selectPremiumPair({ activePolicy: selected, parentPolicy: selected, attachments: [{ ...attachment, label: "พ.ร.บ. ปี 2569" }], activeDocId: "att" })
  assert.equal(wrongYear.main, null)
  const otherDocument = selectPremiumPair({ activePolicy: selected, parentPolicy: selected, attachments: [{ id: "notice", doc_type: "renewal_notice", label: "แจ้งเตือนต่ออายุ ปี 2569" }], activeDocId: "notice" })
  assert.equal(otherDocument.status, "no-policy")
  assert.equal(otherDocument.main, null)
})

test("combined total follows the premium formula for the verified pair", () => {
  const selected = main("main")
  const pair = selectPremiumPair({ activePolicy: selected, parentPolicy: selected, relatedPolicies: [prb("prb")] })
  assert.equal(calculateBilling(pair.main, pair.prb).collected, 18016.66)
})
