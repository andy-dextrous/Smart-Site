import assert from "node:assert/strict"
import { test } from "node:test"
import { canRunPublication } from "../../src/lib/publication/access"
test("publication runner denies missing secrets and non-admin roles", () => {
  for (const secret of [undefined, "", " "])
    assert.equal(
      canRunPublication(
        { headers: new Headers({ authorization: "Bearer undefined" }) },
        secret
      ),
      false
    )
  for (const role of ["editor", "ai-agent"])
    assert.equal(
      canRunPublication({ user: { role }, headers: new Headers() }, "secret"),
      false
    )
  assert.equal(
    canRunPublication({ user: { role: "admin" }, headers: new Headers() }, "secret"),
    true
  )
  assert.equal(
    canRunPublication(
      { headers: new Headers({ authorization: "Bearer secret" }) },
      "secret"
    ),
    true
  )
})
