const noTailwindVar = require("./rules/no-tailwind-var.cjs")
const sectionRequiresWrapper = require("./rules/section-requires-wrapper.cjs")
const sectionSettingsLast = require("./rules/section-settings-last.cjs")
const sectionSlugMatchesFolder = require("./rules/section-slug-matches-folder.cjs")
const sectionImportsType = require("./rules/section-imports-type.cjs")
const noHeaderFooterSections = require("./rules/no-header-footer-sections.cjs")
const noRelativeParentImports = require("./rules/no-relative-parent-imports.cjs")

module.exports = {
  rules: {
    "no-tailwind-var": noTailwindVar,
    "section-requires-wrapper": sectionRequiresWrapper,
    "section-settings-last": sectionSettingsLast,
    "section-slug-matches-folder": sectionSlugMatchesFolder,
    "section-imports-type": sectionImportsType,
    "no-header-footer-sections": noHeaderFooterSections,
    "no-relative-parent-imports": noRelativeParentImports,
  },
}
