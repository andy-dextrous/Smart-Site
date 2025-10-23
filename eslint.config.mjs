import { dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import { FlatCompat } from "@eslint/eslintrc"

const require = createRequire(import.meta.url)
const smartSiteAdminPlugin = require("./src/admin/eslint/index.cjs")

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    plugins: {
      "smart-site-admin": smartSiteAdminPlugin,
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
