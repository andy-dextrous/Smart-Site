import fs from "fs"
import path from "path"

const DEFAULT_TARGET = "smartsite-deployment.json"
const DEFAULT_TEMPLATE = "smartsite-deployment.example.json"

/*************************************************************************/
/*  ARGUMENTS
/*************************************************************************/

function readArgs(argv) {
  const args = {
    config: DEFAULT_TARGET,
    template: DEFAULT_TEMPLATE,
    force: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === "--config" && next) {
      args.config = next
      index += 1
      continue
    }

    if (current === "--template" && next) {
      args.template = next
      index += 1
      continue
    }

    if (current === "--force") {
      args.force = true
    }
  }

  return args
}

/*************************************************************************/
/*  INITIALIZATION
/*************************************************************************/

function copyTemplate(targetPath, templatePath, force) {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  if (fs.existsSync(targetPath) && !force) {
    throw new Error(`Config already exists: ${targetPath}`)
  }

  fs.copyFileSync(templatePath, targetPath)
}

/*************************************************************************/
/*  CLI ENTRYPOINT
/*************************************************************************/

function main() {
  const options = readArgs(process.argv.slice(2))
  const cwd = process.cwd()
  const targetPath = path.resolve(cwd, options.config)
  const templatePath = path.resolve(cwd, options.template)

  copyTemplate(targetPath, templatePath, options.force)

  console.log(`Created ${path.relative(cwd, targetPath) || path.basename(targetPath)}`)
  console.log("Next: update the URLs and run `pnpm self-hosted:run -- promote`.")
}

main()
