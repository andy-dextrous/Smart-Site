function normalizePath(filename) {
  return filename.replace(/\\/g, "/")
}

function isSectionComponentFile(filename) {
  const normalized = normalizePath(filename)
  return /src\/components\/sections\/[^/]+\/Component\.tsx$/.test(normalized)
}

function isSectionConfigFile(filename) {
  const normalized = normalizePath(filename)
  return /src\/components\/sections\/[^/]+\/config\.ts$/.test(normalized)
}

function expectedSlugFromFilename(filename) {
  const normalized = normalizePath(filename)
  const match = normalized.match(/src\/components\/sections\/([^/]+)\/config\.ts$/)
  return match ? match[1] : null
}

function unwrapExpression(node) {
  let current = node
  while (
    current &&
    (current.type === "TSAsExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "TSNonNullExpression" ||
      current.type === "ParenthesizedExpression")
  ) {
    current = current.expression
  }
  return current
}

function getObjectProperty(objectExpression, propertyName) {
  if (!objectExpression || objectExpression.type !== "ObjectExpression") {
    return null
  }

  return objectExpression.properties.find(prop => {
    if (prop.type !== "Property") return false
    const { key } = prop
    if (key.type === "Identifier") {
      return key.name === propertyName
    }
    if (key.type === "Literal") {
      return key.value === propertyName
    }
    return false
  })
}

function getExportedBlockObjects(context) {
  const sourceCode = context.getSourceCode()
  const blocks = []

  for (const statement of sourceCode.ast.body) {
    if (
      statement.type === "ExportNamedDeclaration" &&
      statement.declaration &&
      statement.declaration.type === "VariableDeclaration"
    ) {
      for (const declarator of statement.declaration.declarations) {
        const unwrapped = unwrapExpression(declarator.init)
        if (unwrapped && unwrapped.type === "ObjectExpression") {
          blocks.push(unwrapped)
        }
      }
    }
  }

  return blocks
}

module.exports = {
  normalizePath,
  isSectionComponentFile,
  isSectionConfigFile,
  expectedSlugFromFilename,
  unwrapExpression,
  getObjectProperty,
  getExportedBlockObjects,
}
