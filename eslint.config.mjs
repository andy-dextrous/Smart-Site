import { createRequire } from "module"
import nextConfig from "eslint-config-next"

const require = createRequire(import.meta.url)
const smartSiteAdminPlugin = require("./src/admin/eslint/index.cjs")

const nextConfigWithHooks = nextConfig.map(entry => {
  if (entry?.rules) {
    const rules = { ...entry.rules }
    if ("react-hooks/exhaustive-deps" in rules) {
      rules["react-hooks/exhaustive-deps"] = "error"
    }
    if ("react-hooks/rules-of-hooks" in rules) {
      rules["react-hooks/rules-of-hooks"] = "error"
    }
    const hookRules = [
      "react-hooks/incompatible-library",
      "react-hooks/purity",
      "react-hooks/component-hook-factories",
      "react-hooks/static-components",
      "react-hooks/use-memo",
      "react-hooks/preserve-manual-memoization",
      "react-hooks/globals",
      "react-hooks/refs",
      "react-hooks/set-state-in-effect",
      "react-hooks/set-state-in-render",
      "react-hooks/error-boundaries",
      "react-hooks/immutability",
      "react-hooks/unsupported-syntax",
      "react-hooks/config",
      "react-hooks/gating",
    ]
    for (const rule of hookRules) {
      rules[rule] = "error"
    }
    return { ...entry, rules }
  }
  return entry
})

const eslintConfig = [
  {
    ignores: ["src/admin/payload/payload-types.ts"],
  },
  ...nextConfigWithHooks,
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-anonymous-default-export": "off",
      "@next/next/no-assign-module-variable": "off",
    },
  },
  {
    plugins: {
      "smart-site-admin": smartSiteAdminPlugin,
    },
  },
  {
    files: ["src/admin/payload/payload-types.ts"],
    rules: {
      "eslint-comments/no-unused-disable": "off",
    },
  },
  {
    files: [
      "src/components/sections/**/*.{ts,tsx}",
      "src/app/(frontend)/**/*.{ts,tsx}",
    ],
    rules: {
      "smart-site-admin/no-tailwind-var": "error",
      "smart-site-admin/section-requires-wrapper": "error",
      "smart-site-admin/section-settings-last": "error",
      "smart-site-admin/section-slug-matches-folder": "error",
      "smart-site-admin/section-imports-type": "warn",
      "smart-site-admin/no-header-footer-sections": "error",
      "smart-site-admin/no-relative-parent-imports": ["warn", { allowDepth: 1 }],
    },
  },
]

export default eslintConfig
