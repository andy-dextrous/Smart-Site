const { isSectionComponentFile } = require("../utils.cjs")

const TARGET_IMPORT = "@/admin/payload/payload-types"

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Encourage section components to import their generated Payload types.",
      recommended: false,
    },
    schema: [],
    messages: {
      missingImport:
        "Import the generated Payload types from '@/admin/payload/payload-types' when defining section components.",
    },
  },
  create(context) {
    const filename = context.getFilename()
    if (!isSectionComponentFile(filename)) {
      return {}
    }

    let hasPayloadTypeImport = false

    return {
      ImportDeclaration(node) {
        if (
          node.source.type === "Literal" &&
          node.source.value === TARGET_IMPORT
        ) {
          hasPayloadTypeImport = true
        }
      },
      "Program:exit"(program) {
        if (!hasPayloadTypeImport) {
          context.report({ node: program, messageId: "missingImport" })
        }
      },
    }
  },
}

module.exports = rule
