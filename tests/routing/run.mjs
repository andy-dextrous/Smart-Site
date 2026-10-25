// Always include the focused terminal-batch/template regression in release routing.
// Each lifecycle cleans its own state before the next fixture starts.
await import("./boundaries.mjs")
if (!process.argv.includes("--boundaries")) {
  process.argv.push("--routing")
  await import("../integration/run.mjs")
}
