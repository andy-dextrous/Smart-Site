import { loadState, readJSON, local, lock } from "./state.mjs"
import { ensureDatabase } from "./database.mjs"
import { startApp } from "./runtime.mjs"
const unlock = await lock()
try {
  const state = await loadState()
  await ensureDatabase(state, await readJSON(`${local}/credentials.json`))
  await startApp(state)
  console.log(
    JSON.stringify({ url: `http://127.0.0.1:${state.appPort}`, siteId: state.siteId })
  )
} finally {
  await unlock()
}
