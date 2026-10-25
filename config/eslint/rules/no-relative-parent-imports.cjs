const { normalizePath } = require("../utils.cjs")

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage deep relative imports in favour of absolute path aliases.",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowDepth: {
            type: "number",
            minimum: 0,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooDeep:
        "Avoid deep relative imports ({{depth}} levels). Prefer absolute aliases like '@/...'.",
    },
  },
  create(context) {
    const filename = normalizePath(context.getFilename())
    if (filename.includes("/src/admin/")) {
      return {}
    }

    if (
      !filename.includes("/src/components/sections/") &&
      !filename.includes("/src/app/(frontend)/")
    ) {
      return {}
    }

    const option = context.options[0] || {}
    const allowDepth = typeof option.allowDepth === "number" ? option.allowDepth : 0

    return {
      ImportDeclaration(node) {
        if (node.source.type !== "Literal" || typeof node.source.value !== "string") {
          return
        }

        const importPath = node.source.value
        const matches = importPath.match(/\.\.\//g)
        const depth = matches ? matches.length : 0

        if (depth > allowDepth) {
          context.report({
            node: node.source,
            messageId: "tooDeep",
            data: { depth },
          })
        }
      },
    }
  },
}

module.exports = rule
