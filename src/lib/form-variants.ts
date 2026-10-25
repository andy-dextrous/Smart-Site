export const defaultFormProps = {
  enableIntro: false,
}

export function createDefaultForm(overrides: Record<string, any> = {}) {
  return {
    ...defaultFormProps,
    ...overrides,
  }
}
