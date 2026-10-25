import assert from "node:assert/strict"
import test from "node:test"
import { formDefaultValues } from "../../src/components/fields/form/default-values"

test("form values contain named inputs, preserve defaults, and exclude layout blocks", () => {
  const values = formDefaultValues([
    { blockType: "text", name: "name", defaultValue: "Studio" },
    { blockType: "email", name: "email" },
    { blockType: "checkbox", name: "consent" },
    { blockType: "number", name: "quantity", defaultValue: 0 },
    { blockType: "message", message: "Contact us" },
  ])
  values.email = "person@example.invalid"
  const submitted = JSON.parse(JSON.stringify(Object.entries(values).map(([field, value]) => ({ field, value }))))
  assert.deepEqual(submitted, [
    { field: "name", value: "Studio" },
    { field: "email", value: "person@example.invalid" },
    { field: "consent", value: false },
    { field: "quantity", value: 0 },
  ])
  assert.deepEqual(formDefaultValues(), {})
})
