import { createRequire } from "module"

const require = createRequire(import.meta.url)

if (!(require as any).extensions?.[".css"]) {
  ;(require as any).extensions[".css"] = () => {}
}
