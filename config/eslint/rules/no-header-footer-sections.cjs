const {
  getExportedBlockObjects,
  getObjectProperty,
  isSectionComponentFile,
  isSectionConfigFile,
} = require("../utils.cjs")

const HEADER_FOOTER_PATTERN = /(header|footer)/i

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent header and footer implementations from being re-created as sections.",
      recommended: true,
    },
    schema: [],
    messages: {
      noHeaderFooterSlug:
        "Header and footer are managed via globals. Do not create sections with header/footer slugs.",
      noHeaderFooterImport:
        "Header/Footer components should not be imported into sections. Use the Payload globals instead.",
    },
  },
  create(context) {
    const filename = context.getFilename()

    if (isSectionConfigFile(filename)) {
      return {
        "Program:exit"() {
          const blocks = getExportedBlockObjects(context)
          for (const block of blocks) {
            const slugProp = getObjectProperty(block, "slug")
            if (
              slugProp &&
              slugProp.value.type === "Literal" &&
              typeof slugProp.value.value === "string" &&
              HEADER_FOOTER_PATTERN.test(slugProp.value.value)
            ) {
              context.report({ node: slugProp.value, messageId: "noHeaderFooterSlug" })
            }
          }
        },
      }
    }

    if (isSectionComponentFile(filename)) {
      return {
        ImportDeclaration(node) {
          if (
            node.source.type === "Literal" &&
            typeof node.source.value === "string" &&
            /@\/components\/(header|footer)/.test(node.source.value)
          ) {
            context.report({ node, messageId: "noHeaderFooterImport" })
          }
        },
      }
    }

    return {}
  },
}

module.exports = rule
