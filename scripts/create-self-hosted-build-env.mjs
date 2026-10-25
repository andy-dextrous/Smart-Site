import fs from "fs"
import path from "path"

function readArgs(argv) {
  const args = {
    source: ".smartsite-self-hosted/generated/production.env",
    output: ".smartsite-self-hosted/generated/production.build.env",
    databaseUrl: "",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === "--source" && next) {
      args.source = next
      index += 1
      continue
    }

    if (current === "--output" && next) {
      args.output = next
      index += 1
      continue
    }

    if (current === "--database-url" && next) {
      args.databaseUrl = next
      index += 1
    }
  }

  return args
}

function parseEnv(content) {
  return content.split(/\r?\n/)
}

function upsertEnv(lines, key, value) {
  let found = false

  const nextLines = lines.map(line => {
    if (!line || line.trim().startsWith("#")) {
      return line
    }

    if (!line.startsWith(`${key}=`)) {
      return line
    }

    found = true
    return `${key}=${value}`
  })

  if (!found) {
    nextLines.push(`${key}=${value}`)
  }

  return nextLines
}

function formatShellValue(value) {
  if (/^[A-Za-z0-9_./:@?&=,+%-]*$/.test(value)) {
    return value
  }

  return `'${value.replace(/'/g, `'\"'\"'`)}'`
}

function main() {
  const options = readArgs(process.argv.slice(2))

  if (!options.databaseUrl) {
    throw new Error("Missing required --database-url")
  }

  const sourcePath = path.resolve(process.cwd(), options.source)
  const outputPath = path.resolve(process.cwd(), options.output)

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source env file not found: ${sourcePath}`)
  }

  const sourceLines = parseEnv(fs.readFileSync(sourcePath, "utf8"))
  const outputLines = upsertEnv(sourceLines, "DATABASE_URL", options.databaseUrl)

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const serialized = outputLines
    .filter(line => typeof line === "string")
    .map(line => {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) {
        return line
      }

      const separatorIndex = line.indexOf("=")
      const key = line.slice(0, separatorIndex)
      const value = line.slice(separatorIndex + 1)

      return `${key}=${formatShellValue(value)}`
    })
    .join("\n")

  fs.writeFileSync(outputPath, `${serialized.replace(/\n+$/, "")}\n`)

  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`)
  console.log(`DATABASE_URL=${options.databaseUrl}`)
}

main()
