// Called only by the MCP client. Never run this through a logged terminal.
import { readFile } from "node:fs/promises"
const credentials = JSON.parse(
  await readFile(
    new URL("../../.smartsite/local/credentials.json", import.meta.url),
    "utf8"
  )
)
process.stdout.write(JSON.stringify({ Authorization: `Bearer ${credentials.mcpKey}` }))
