import type { UserConfig } from "./defaults"

/*************************************************************************/
/*  TESTING HELPERS FOR SMARTSITE CONFIG
/*************************************************************************/

const USER_CONFIG_OVERRIDE_KEY = "__smartsite_user_config_override__"

type TestingGlobal = typeof globalThis & {
  [USER_CONFIG_OVERRIDE_KEY]?: UserConfig | null
}

function getTestingGlobal(): TestingGlobal {
  return globalThis as TestingGlobal
}

export function setTestingUserConfigOverride(config: UserConfig | null): void {
  const globals = getTestingGlobal()
  globals[USER_CONFIG_OVERRIDE_KEY] = config
}

export function getTestingUserConfigOverride(): UserConfig | null {
  const globals = getTestingGlobal()
  return globals[USER_CONFIG_OVERRIDE_KEY] ?? null
}

export function clearTestingUserConfigOverride(): void {
  const globals = getTestingGlobal()
  delete globals[USER_CONFIG_OVERRIDE_KEY]
}
