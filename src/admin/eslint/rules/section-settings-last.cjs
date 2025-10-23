const {
  getExportedBlockObjects,
  getObjectProperty,
  isSectionConfigFile,
} = require("../utils.cjs")

function isSectionSettingsCall(element) {
  if (!element) return false
  if (element.type === "CallExpression") {
    const callee = element.callee
    return callee.type === "Identifier" && callee.name === "sectionSettings"
  }
  return false
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure Smart Site block schemas end with sectionSettings().",
      recommended: true,
    },
    schema: [],
    messages: {
      missingFields:
        "Section block configs must define a `fields` array that ends with sectionSettings().",
      missingSectionSettings:
        "The last entry in the fields array must be sectionSettings().",
    },
  },
  create(context) {
    const filename = context.getFilename()
    if (!isSectionConfigFile(filename)) {
      return {}
    }

    return {
      "Program:exit"() {
        const blocks = getExportedBlockObjects(context)
        for (const block of blocks) {
          const fieldsProp = getObjectProperty(block, "fields")
          if (
            !fieldsProp ||
            fieldsProp.value.type !== "ArrayExpression" ||
            fieldsProp.value.elements.length === 0
          ) {
            context.report({ node: block, messageId: "missingFields" })
            continue
          }

          const elements = fieldsProp.value.elements.filter(Boolean)
          const lastElement = elements[elements.length - 1]

          if (!isSectionSettingsCall(lastElement)) {
            context.report({
              node: lastElement || fieldsProp.value,
              messageId: "missingSectionSettings",
            })
          }
        }
      },
    }
  },
}

module.exports = rule
