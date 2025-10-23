const { isSectionComponentFile } = require("../utils.cjs")

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure Smart Site sections render the shared <Section> wrapper exactly once.",
      recommended: true,
    },
    schema: [],
    messages: {
      missingImport:
        'Section components must import { Section } from "@/components/fields/section".',
      missingUsage: "Section components must wrap their markup in a single <Section> element.",
      multipleUsage:
        "Section components should render exactly one <Section> wrapper at the top level.",
    },
  },
  create(context) {
    const filename = context.getFilename()
    if (!isSectionComponentFile(filename)) {
      return {}
    }

    const sectionIdentifiers = new Set()
    let hasSectionImport = false
    let sectionUsages = 0

    return {
      ImportDeclaration(node) {
        if (
          node.source.type === "Literal" &&
          node.source.value === "@/components/fields/section"
        ) {
          hasSectionImport = true
          for (const specifier of node.specifiers) {
            if (
              specifier.type === "ImportSpecifier" &&
              specifier.imported.type === "Identifier" &&
              specifier.imported.name === "Section"
            ) {
              sectionIdentifiers.add(specifier.local.name)
            }
          }
        }
      },
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return
        if (sectionIdentifiers.has(node.name.name)) {
          sectionUsages += 1
        }
      },
      "Program:exit"(program) {
        if (!hasSectionImport || sectionIdentifiers.size === 0) {
          context.report({ node: program, messageId: "missingImport" })
          return
        }

        if (sectionUsages === 0) {
          context.report({ node: program, messageId: "missingUsage" })
        } else if (sectionUsages > 1) {
          context.report({ node: program, messageId: "multipleUsage" })
        }
      },
    }
  },
}

module.exports = rule
