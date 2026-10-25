const {
  expectedSlugFromFilename,
  getExportedBlockObjects,
  getObjectProperty,
  isSectionConfigFile,
} = require("../utils.cjs")

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure section block metadata matches the folder name and defines an interfaceName.",
      recommended: true,
    },
    schema: [],
    messages: {
      missingSlug: "Section block configs must define a slug literal.",
      slugMismatch: 'Section slug "{{found}}" must match the folder name "{{expected}}".',
      missingInterface:
        "Section block configs must define an interfaceName string literal.",
    },
  },
  create(context) {
    const filename = context.getFilename()
    if (!isSectionConfigFile(filename)) {
      return {}
    }

    const expectedSlug = expectedSlugFromFilename(filename)
    if (!expectedSlug) return {}

    return {
      "Program:exit"() {
        const blocks = getExportedBlockObjects(context)
        for (const block of blocks) {
          const slugProp = getObjectProperty(block, "slug")
          if (!slugProp || slugProp.value.type !== "Literal") {
            context.report({ node: block, messageId: "missingSlug" })
          } else if (slugProp.value.value !== expectedSlug) {
            context.report({
              node: slugProp.value,
              messageId: "slugMismatch",
              data: {
                expected: expectedSlug,
                found: slugProp.value.value,
              },
            })
          }

          const interfaceProp = getObjectProperty(block, "interfaceName")
          if (
            !interfaceProp ||
            interfaceProp.value.type !== "Literal" ||
            typeof interfaceProp.value.value !== "string"
          ) {
            context.report({ node: block, messageId: "missingInterface" })
          }
        }
      },
    }
  },
}

module.exports = rule
