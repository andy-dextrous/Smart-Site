import { getProjectPaths, readAiEnabled, readText, setAiEnabled, writeText } from "./smartsite-local-tools.mjs"

/*************************************************************************/
/*  SMARTSITE AI ENABLE
/*************************************************************************/

function main() {
  const paths = getProjectPaths(process.cwd())
  const currentConfigText = readText(paths.configPath)
  const alreadyEnabled = readAiEnabled(currentConfigText)

  if (alreadyEnabled) {
    console.log("SmartSite AI is already enabled in src/smartsite.config.ts.")
    console.log("Next step: provision credentials with `npx smartsite ai rotate --project .` and then use the admin apply flow.")
    return
  }

  const nextConfigText = setAiEnabled(currentConfigText, true)
  writeText(paths.configPath, nextConfigText)

  console.log("SmartSite AI has been enabled in src/smartsite.config.ts.")
  console.log("")
  console.log("Next steps:")
  console.log("1. Provision credentials with `npx smartsite ai rotate --project .`.")
  console.log("2. Start the app with `pnpm dev` if it is not already running.")
  console.log("3. Use the admin AI access gate and apply flow.")
}

main()
