export function getTimeZoneOptions(): { label: string; value: string }[] {
  const fallback = ["Asia/Dubai", "Europe/London", "Europe/Dublin"]
  let zones: string[] = fallback
  try {
    const fn: any = (Intl as any).supportedValuesOf
    if (typeof fn === "function") {
      const supported: string[] = fn.call(Intl, "timeZone")
      if (Array.isArray(supported) && supported.length > 0) {
        zones = supported
      }
    }
  } catch (_) {}

  const common = ["Asia/Dubai", "Europe/London", "Europe/Dublin"].filter(z => zones.includes(z))
  const rest = zones.filter(z => !common.includes(z))
  return [...common, ...rest].map(value => ({ label: value, value }))
}

