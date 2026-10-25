import { loadState, lock } from "./state.mjs"
import { stopProcess } from "./runtime.mjs"
const unlock = await lock()
try {
  const state = await loadState()
  console.log(
    JSON.stringify({
      app: await stopProcess(state.appProcess),
      database: await stopProcess(state.databaseProcess),
      dataPreserved: true,
    })
  )
} finally {
  await unlock()
}
