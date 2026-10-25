import config from "../../src/payload.config"
import { siteContract } from "./site-contract"
import { writeFile } from "node:fs/promises"
const output = process.argv[2]
if (!output) throw new Error("Pass the output JSON path")
await writeFile(output, JSON.stringify(siteContract(await config), null, 2))
