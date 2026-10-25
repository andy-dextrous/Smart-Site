import fs from "node:fs"
import path from "node:path"
import { parseEnv } from "node:util"

const generatedHeader = "# SmartSite build environment: literal POSIX assignments v1\n"
const quoteEscape = `'"'"'`

function readArgs(argv) {
  const args = {
    source: ".smartsite-self-hosted/generated/production.env",
    output: ".smartsite-self-hosted/generated/production.build.env",
  }
  const names = {
    "--source": "source",
    "--output": "output",
    "--database-url": "databaseUrl",
    "--public-url": "publicUrl",
    "--deployment-id": "deploymentId",
  }
  for (let index = 0; index < argv.length; index += 1) {
    const key = Object.hasOwn(names, argv[index]) ? names[argv[index]] : undefined
    if (!key || argv[index + 1] === undefined)
      throw new Error("Unknown or incomplete build environment argument")
    args[key] = argv[++index]
  }
  return args
}

function readValues(content) {
  if (content.includes("\0")) throw new Error("Build environment cannot contain NUL bytes")
  if (!content.startsWith("# SmartSite build environment:")) return parseEnv(content)
  if (!content.startsWith(generatedHeader))
    throw new Error("Unsupported generated build environment format")
  // Only decode our exact generated format; never evaluate shell input. This
  // lets the wrapper update a stage-one file without changing literal values.
  const body = content.slice(generatedHeader.length)
  const assignment = /([A-Za-z_][A-Za-z0-9_]*)='((?:[^']|'"'"')*)'\n/y
  const values = Object.create(null)
  let offset = 0
  while (offset < body.length) {
    assignment.lastIndex = offset
    const match = assignment.exec(body)
    if (!match) throw new Error("Malformed generated build environment")
    values[match[1]] = match[2].replaceAll(quoteEscape, "'")
    offset = assignment.lastIndex
  }
  return values
}

function serialize(values) {
  return generatedHeader + Object.entries(values).map(([key, value]) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
      throw new Error("Build environment keys must be portable shell identifiers")
    if (typeof value !== "string" || value.includes("\0"))
      throw new Error("Build environment values must be strings without NUL bytes")
    return `${key}='${value.replaceAll("'", quoteEscape)}'\n`
  }).join("")
}

function main() {
  const options = readArgs(process.argv.slice(2))
  const releaseOverrides = options.publicUrl !== undefined || options.deploymentId !== undefined
  if (releaseOverrides && (!options.publicUrl || !options.deploymentId))
    throw new Error("Release overrides require both --public-url and --deployment-id")
  if (!options.databaseUrl && !releaseOverrides)
    throw new Error("Provide --database-url or both --public-url and --deployment-id")

  const sourcePath = path.resolve(process.cwd(), options.source)
  const outputPath = path.resolve(process.cwd(), options.output)
  const values = readValues(fs.readFileSync(sourcePath, "utf8"))
  if (options.databaseUrl !== undefined) values.DATABASE_URL = options.databaseUrl
  if (options.publicUrl !== undefined) {
    Object.assign(values, {
      NODE_ENV: "production",
      SMARTSITE_DEPLOYMENT_PROFILE: "self-hosted-mongo",
      NEXT_PUBLIC_URL: options.publicUrl,
      NEXT_PUBLIC_SITE_URL: options.publicUrl,
      NEXT_PUBLIC_PRODUCTION_URL: options.publicUrl,
      NEXT_DEPLOYMENT_ID: options.deploymentId,
    })
  }
  const serialized = serialize(values)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o700 })
  const output = fs.openSync(outputPath, "w", 0o600)
  try {
    // Tighten an existing file before writing any new secret bytes.
    fs.fchmodSync(output, 0o600)
    fs.writeFileSync(output, serialized)
  } finally {
    fs.closeSync(output)
  }
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`)
}

main()
