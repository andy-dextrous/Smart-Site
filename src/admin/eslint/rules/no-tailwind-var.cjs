const VAR_PATTERN = /var\(/i

function checkStringValue(value, node, context) {
  if (typeof value !== "string") return
  if (VAR_PATTERN.test(value)) {
    context.report({
      node,
      messageId: "noTailwindVar",
    })
  }
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind classes that reference raw CSS variables (use generated token utilities instead).",
      recommended: true,
    },
    schema: [],
    messages: {
      noTailwindVar: "Use Tailwind token utilities instead of raw var() classes.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "className" || !node.value) return

        if (node.value.type === "Literal") {
          checkStringValue(node.value.value, node.value, context)
        } else if (node.value.type === "JSXExpressionContainer") {
          const expression = node.value.expression
          if (!expression) return

          if (expression.type === "Literal") {
            checkStringValue(expression.value, expression, context)
          } else if (expression.type === "TemplateLiteral") {
            expression.quasis.forEach(part => {
              checkStringValue(part.value.raw, part, context)
            })
          }
        }
      },
    }
  },
}

module.exports = rule
