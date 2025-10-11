/*************************************************************************/
/*  SEO SCORING TYPES
/*************************************************************************/

export interface SEOScore {
  overall: number // 0-100
  components: {
    title: SEOComponentScore
    description: SEOComponentScore
    keywords: SEOComponentScore
    content: SEOComponentScore
    images: SEOComponentScore
    structure: SEOComponentScore
    social: SEOComponentScore
    technical: SEOComponentScore
  }
  suggestions: SEOSuggestion[]
  status: "poor" | "needs-improvement" | "good" | "excellent"
}

export interface SEOComponentScore {
  score: number // 0-100
  weight: number // How important this component is
  status: "error" | "warning" | "good" | "excellent"
  issues: string[]
  suggestions: string[]
}

export interface SEOSuggestion {
  type: "error" | "warning" | "info" | "success"
  category:
    | "title"
    | "description"
    | "keywords"
    | "content"
    | "images"
    | "structure"
    | "social"
    | "technical"
  message: string
  priority: "high" | "medium" | "low"
  actionable: boolean
}

export interface SEOAnalysisOptions {
  focusKeyword?: string
  targetAudience?: "general" | "technical" | "local"
  contentType?: "article" | "page" | "service" | "person"
}

/*************************************************************************/
/*  MAIN SEO ANALYSIS FUNCTION
/*************************************************************************/

export function analyzeSEO(doc: any, options: SEOAnalysisOptions = {}): SEOScore {
  const components = {
    title: analyzeTitle(doc, options),
    description: analyzeDescription(doc, options),
    keywords: analyzeKeywords(doc, options),
    content: analyzeContent(doc, options),
    images: analyzeImages(doc, options),
    structure: analyzeStructure(doc, options),
    social: analyzeSocial(doc, options),
    technical: analyzeTechnical(doc, options),
  }

  const suggestions = generateSuggestions(components)
  const overall = calculateOverallScore(components)
  const status = getScoreStatus(overall)

  return {
    overall,
    components,
    suggestions,
    status,
  }
}

/*************************************************************************/
/*  COMPONENT ANALYSIS FUNCTIONS
/*************************************************************************/

function analyzeTitle(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  const metaTitle = (doc.seo as any)?.meta?.title
  const fallbackTitle = "title" in doc ? doc.title : "name" in doc ? doc.name : ""
  const title = metaTitle || fallbackTitle
  const focusKeyword = (doc.seo as any)?.meta?.focusKeywords || options.focusKeyword

  // Title existence (30 points)
  if (!title) {
    issues.push("Missing page title")
    suggestions.push("Add a descriptive title for this page")
  } else {
    score += 30
  }

  // Title length (25 points)
  if (title) {
    const titleLength = title.length
    if (titleLength < 30) {
      issues.push("Title too short (under 30 characters)")
      suggestions.push("Expand your title to 30-60 characters for better visibility")
      score += 10
    } else if (titleLength > 60) {
      issues.push("Title too long (over 60 characters)")
      suggestions.push("Shorten your title to under 60 characters to prevent truncation")
      score += 15
    } else {
      score += 25
    }
  }

  // Focus keyword in title (25 points)
  if (focusKeyword && title) {
    const keywordVariations = generateKeywordVariations(focusKeyword)
    const titleLower = title.toLowerCase()
    const hasKeyword = keywordVariations.some(variation =>
      titleLower.includes(variation.toLowerCase())
    )

    if (hasKeyword) {
      score += 25
    } else {
      issues.push("Focus keyword not found in title")
      suggestions.push(`Include your focus keyword "${focusKeyword}" in the title`)
    }
  } else if (!focusKeyword) {
    suggestions.push("Add a focus keyword to improve SEO optimization")
    score += 10 // Partial credit for having a title
  }

  // Title uniqueness and appeal (20 points)
  if (title) {
    const hasNumbers = /\d/.test(title)
    const hasActionWords =
      /\b(how|why|what|when|where|guide|tips|best|top|ultimate|complete)\b/i.test(title)
    const hasBrandingWords = /\b(free|new|proven|easy|simple|ultimate|complete)\b/i.test(
      title
    )

    let appealScore = 0
    if (hasNumbers) appealScore += 7
    if (hasActionWords) appealScore += 7
    if (hasBrandingWords) appealScore += 6

    score += appealScore

    if (appealScore < 10) {
      suggestions.push(
        "Consider adding power words, numbers, or action words to make your title more compelling"
      )
    }
  }

  const status = getComponentStatus(score)
  return { score, weight: 20, status, issues, suggestions }
}

function analyzeDescription(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  const metaDescription = (doc.seo as any)?.meta?.description
  const fallbackDescription =
    "description" in doc ? doc.description : "bio" in doc ? (doc as any).content?.bio : ""
  const description = metaDescription || fallbackDescription
  const focusKeyword = (doc.seo as any)?.meta?.focusKeywords || options.focusKeyword

  // Description existence (40 points)
  if (!description) {
    issues.push("Missing meta description")
    suggestions.push("Add a compelling meta description to improve click-through rates")
  } else {
    score += 40
  }

  // Description length (30 points)
  if (description) {
    const descLength = description.length
    if (descLength < 120) {
      issues.push("Meta description too short (under 120 characters)")
      suggestions.push("Expand your meta description to 120-160 characters")
      score += 15
    } else if (descLength > 160) {
      issues.push("Meta description too long (over 160 characters)")
      suggestions.push("Shorten your meta description to under 160 characters")
      score += 20
    } else {
      score += 30
    }
  }

  // Focus keyword in description (20 points)
  if (focusKeyword && description) {
    const keywordVariations = generateKeywordVariations(focusKeyword)
    const descLower = description.toLowerCase()
    const hasKeyword = keywordVariations.some(variation =>
      descLower.includes(variation.toLowerCase())
    )

    if (hasKeyword) {
      score += 20
    } else {
      issues.push("Focus keyword not found in meta description")
      suggestions.push(
        `Include your focus keyword "${focusKeyword}" in the meta description`
      )
    }
  }

  // Call-to-action appeal (10 points)
  if (description) {
    const hasCallToAction =
      /\b(learn|discover|find|get|try|start|explore|read|see|check)\b/i.test(description)
    if (hasCallToAction) {
      score += 10
    } else {
      suggestions.push("Consider adding a call-to-action to encourage clicks")
    }
  }

  const status = getComponentStatus(score)
  return { score, weight: 15, status, issues, suggestions }
}

function analyzeKeywords(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  const focusKeywords = (doc.seo as any)?.meta?.focusKeywords || options.focusKeyword
  const title =
    (doc.seo as any)?.meta?.title ||
    ("title" in doc ? doc.title : "name" in doc ? doc.name : "")
  const description =
    (doc.seo as any)?.meta?.description || ("description" in doc ? doc.description : "")

  // Focus keyword defined (25 points)
  if (!focusKeywords) {
    issues.push("No focus keywords defined")
    suggestions.push("Define primary focus keywords for this content")
  } else {
    score += 25
  }

  // Keyword research and quality (25 points)
  if (focusKeywords) {
    const keywords = focusKeywords.split(",").map((k: string) => k.trim())

    if (keywords.length === 0) {
      issues.push("No valid keywords found")
    } else if (keywords.length > 5) {
      issues.push("Too many focus keywords (over 5)")
      suggestions.push("Focus on 3-5 primary keywords for better optimization")
      score += 10
    } else {
      score += 25
    }

    // Check for keyword stuffing
    const allText = `${title} ${description}`.toLowerCase()
    keywords.forEach((keyword: string) => {
      const keywordLower = keyword.toLowerCase()
      const occurrences = (allText.match(new RegExp(keywordLower, "g")) || []).length
      const wordCount = allText.split(" ").length
      const density = (occurrences / wordCount) * 100

      if (density > 3) {
        issues.push(
          `Keyword "${keyword}" appears too frequently (${density.toFixed(1)}% density)`
        )
        suggestions.push("Reduce keyword density to 1-3% to avoid keyword stuffing")
      }
    })
  }

  // Keyword placement (25 points)
  if (focusKeywords && title) {
    const keywords = focusKeywords.split(",").map((k: string) => k.trim())
    const titleLower = title.toLowerCase()

    const keywordsInTitle = keywords.filter((keyword: string) =>
      titleLower.includes(keyword.toLowerCase())
    ).length

    if (keywordsInTitle > 0) {
      score += 15
    } else {
      suggestions.push("Include focus keywords in your title")
    }

    // Early placement bonus
    const firstKeyword = keywords[0]?.toLowerCase()
    if (firstKeyword && titleLower.indexOf(firstKeyword) < 60) {
      score += 10
    }
  }

  // Semantic keywords (25 points)
  if (focusKeywords) {
    const hasVariations = focusKeywords.includes(" ") || focusKeywords.includes(",")
    if (hasVariations) {
      score += 15
    } else {
      suggestions.push("Consider using keyword variations and semantic keywords")
    }

    // Long-tail keyword bonus
    const keywords = focusKeywords.split(",").map((k: string) => k.trim())
    const hasLongTail = keywords.some((keyword: string) => keyword.split(" ").length >= 3)
    if (hasLongTail) {
      score += 10
    } else {
      suggestions.push("Include long-tail keywords (3+ words) for better targeting")
    }
  }

  const status = getComponentStatus(score)
  return { score, weight: 18, status, issues, suggestions }
}

function analyzeContent(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  // Get content from different document types
  let content = ""
  let wordCount = 0

  if ("content" in doc && doc.content) {
    // Extract text from rich text content
    content = extractTextFromRichText(doc.content)
  } else if ("sections" in doc && doc.sections) {
    // Extract text from sections/blocks
    content = extractTextFromSections(doc.sections)
  } else if ("bio" in doc && (doc as any).content?.bio) {
    content = (doc as any).content.bio
  }

  wordCount = content.split(/\s+/).filter(word => word.length > 0).length

  // Content length (30 points)
  if (wordCount === 0) {
    issues.push("No content found")
    suggestions.push("Add substantial content to improve SEO")
  } else if (wordCount < 300) {
    issues.push(`Content too short (${wordCount} words)`)
    suggestions.push("Aim for at least 300 words of content")
    score += 10
  } else if (wordCount < 600) {
    suggestions.push("Consider expanding content for better SEO (600+ words recommended)")
    score += 20
  } else {
    score += 30
  }

  // Keyword density in content (25 points)
  const focusKeyword = (doc.seo as any)?.meta?.focusKeywords || options.focusKeyword
  if (focusKeyword && content) {
    const keywordVariations = generateKeywordVariations(focusKeyword)
    const contentLower = content.toLowerCase()

    let totalOccurrences = 0
    keywordVariations.forEach(variation => {
      const occurrences = (
        contentLower.match(new RegExp(variation.toLowerCase(), "g")) || []
      ).length
      totalOccurrences += occurrences
    })

    const density = (totalOccurrences / wordCount) * 100

    if (density === 0) {
      issues.push("Focus keyword not found in content")
      suggestions.push("Include your focus keyword naturally throughout the content")
    } else if (density < 0.5) {
      suggestions.push("Consider increasing keyword density slightly (0.5-2.5%)")
      score += 10
    } else if (density > 3) {
      issues.push(`Keyword density too high (${density.toFixed(1)}%)`)
      suggestions.push("Reduce keyword usage to avoid keyword stuffing")
      score += 10
    } else {
      score += 25
    }
  }

  // Content structure (25 points)
  let structureScore = 0
  if (content) {
    // Check for headings (basic structure analysis)
    const hasHeadings = /<h[1-6]>/i.test(content) || content.includes("#")
    if (hasHeadings) {
      structureScore += 10
    } else {
      suggestions.push("Add headings to improve content structure")
    }

    // Check for lists
    const hasLists = /<[ou]l>/i.test(content) || /^[\s]*[-*+]\s/m.test(content)
    if (hasLists) {
      structureScore += 8
    } else {
      suggestions.push("Consider using bullet points or numbered lists")
    }

    // Check for paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    if (paragraphs.length > 1) {
      structureScore += 7
    } else {
      suggestions.push("Break content into multiple paragraphs for better readability")
    }

    score += structureScore
  }

  // Readability (20 points)
  if (content && wordCount > 0) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const averageWordsPerSentence = wordCount / sentences.length

    let readabilityScore = 0
    if (averageWordsPerSentence > 25) {
      issues.push("Sentences are too long on average")
      suggestions.push("Break up long sentences for better readability")
      readabilityScore += 5
    } else if (averageWordsPerSentence < 8) {
      suggestions.push("Consider varying sentence length for better flow")
      readabilityScore += 15
    } else {
      readabilityScore += 20
    }

    score += readabilityScore
  }

  const status = getComponentStatus(score)
  return { score, weight: 15, status, issues, suggestions }
}

function analyzeImages(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  // Featured/main image (40 points)
  const featuredImage =
    "featuredImage" in doc
      ? doc.featuredImage
      : "image" in doc
        ? (doc as any).content?.image
        : null

  if (!featuredImage) {
    issues.push("No featured image found")
    suggestions.push("Add a featured image to improve visual appeal and social sharing")
  } else {
    score += 40
  }

  // SEO meta image (30 points)
  const metaImage = (doc.seo as any)?.meta?.image
  if (!metaImage) {
    if (featuredImage) {
      suggestions.push("Consider setting a custom SEO image for better search results")
      score += 15 // Partial credit if featured image exists
    } else {
      issues.push("No SEO meta image defined")
      suggestions.push("Add an SEO meta image for search results and social sharing")
    }
  } else {
    score += 30
  }

  // Social media images (20 points)
  const ogImage = (doc.seo as any)?.socialMedia?.openGraph?.image
  const twitterImage = (doc.seo as any)?.socialMedia?.twitter?.image

  let socialImageScore = 0
  if (ogImage) socialImageScore += 10
  if (twitterImage) socialImageScore += 10

  if (socialImageScore === 0) {
    suggestions.push("Add custom images for social media sharing")
  }

  score += socialImageScore

  // Image optimization suggestions (10 points)
  if (featuredImage || metaImage) {
    suggestions.push("Ensure images are optimized for web (WebP format, compressed)")
    suggestions.push("Include descriptive alt text for accessibility")
    score += 10
  }

  const status = getComponentStatus(score)
  return { score, weight: 10, status, issues, suggestions }
}

function analyzeStructure(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  // URL structure (25 points)
  const uri = doc.uri
  if (!uri) {
    issues.push("No URL/URI defined")
    suggestions.push("Ensure the page has a proper URL structure")
  } else {
    score += 15

    // URL best practices
    const urlParts = uri.split("/").filter((part: string) => part.length > 0)
    const isShort = urlParts.length <= 3
    const hasKeywords = (doc.seo as any)?.meta?.focusKeywords
      ?.split(",")
      .some((keyword: string) => uri.toLowerCase().includes(keyword.trim().toLowerCase()))

    if (isShort) score += 5
    if (hasKeywords) score += 5

    if (!isShort) {
      suggestions.push("Consider shortening the URL structure")
    }
    if (!hasKeywords) {
      suggestions.push("Include focus keywords in the URL")
    }
  }

  // Breadcrumbs (20 points)
  const breadcrumbs = "breadcrumbs" in doc ? doc.breadcrumbs : null
  if (breadcrumbs && breadcrumbs.length > 0) {
    score += 20
  } else {
    suggestions.push("Breadcrumb navigation helps with SEO and user experience")
  }

  // Structured data (25 points)
  const hasStructuredData = (doc.seo as any)?.structuredData?.enableStructuredData
  if (hasStructuredData) {
    score += 25
  } else {
    suggestions.push(
      "Enable structured data to help search engines understand your content"
    )
  }

  // Internal linking potential (15 points)
  if ("sections" in doc && doc.sections) {
    // Check if content has good structure for internal linking
    score += 15
  } else {
    suggestions.push("Consider adding internal links to related content")
    score += 5
  }

  // Page hierarchy (15 points)
  if ("parent" in doc && doc.parent) {
    score += 15
  } else if (uri && uri !== "/" && !uri.startsWith("/posts/")) {
    suggestions.push("Consider organizing pages in a hierarchical structure")
    score += 8
  } else {
    score += 15 // Homepage or blog posts get full credit
  }

  const status = getComponentStatus(score)
  return { score, weight: 12, status, issues, suggestions }
}

function analyzeSocial(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  const socialMedia = (doc.seo as any)?.socialMedia

  // Open Graph (50 points)
  let ogScore = 0
  if (socialMedia?.openGraph?.title) ogScore += 15
  if (socialMedia?.openGraph?.description) ogScore += 15
  if (socialMedia?.openGraph?.image) ogScore += 15
  if (socialMedia?.openGraph?.type) ogScore += 5

  if (ogScore === 0) {
    issues.push("No Open Graph tags configured")
    suggestions.push("Add Open Graph tags for better Facebook/LinkedIn sharing")
  } else if (ogScore < 40) {
    suggestions.push("Complete your Open Graph configuration for optimal social sharing")
  }

  score += ogScore

  // Twitter Cards (50 points)
  let twitterScore = 0
  if (socialMedia?.twitter?.title) twitterScore += 15
  if (socialMedia?.twitter?.description) twitterScore += 15
  if (socialMedia?.twitter?.image) twitterScore += 15
  if (socialMedia?.twitter?.cardType) twitterScore += 5

  if (twitterScore === 0) {
    issues.push("No Twitter Card tags configured")
    suggestions.push("Add Twitter Card tags for better Twitter sharing")
  } else if (twitterScore < 40) {
    suggestions.push("Complete your Twitter Card configuration")
  }

  score += twitterScore

  // Fallback scoring if no custom social media fields
  if (!socialMedia) {
    const hasBasicMeta =
      (doc.seo as any)?.meta?.title && (doc.seo as any)?.meta?.description
    if (hasBasicMeta) {
      score = 60 // Partial credit for basic meta that will be used for social
      suggestions.push("Consider adding custom social media titles and descriptions")
    } else {
      score = 20
      issues.push("Missing social media optimization")
      suggestions.push("Add Open Graph and Twitter Card metadata")
    }
  }

  const status = getComponentStatus(score)
  return { score, weight: 8, status, issues, suggestions }
}

function analyzeTechnical(doc: any, options: SEOAnalysisOptions): SEOComponentScore {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  // Meta robots (20 points)
  const noIndex = (doc.seo as any)?.meta?.noIndex
  const metaRobots = (doc.seo as any)?.meta?.metaRobots || []

  if (noIndex) {
    issues.push("Page is set to noindex")
    suggestions.push("Remove noindex if you want this page to appear in search results")
  } else {
    score += 15
  }

  if (Array.isArray(metaRobots) && metaRobots.length > 0) {
    score += 5
  }

  // Canonical URL (25 points)
  const canonicalUrl = (doc.seo as any)?.meta?.canonicalUrl
  if (canonicalUrl) {
    score += 25
  } else {
    suggestions.push(
      "Consider setting a canonical URL to prevent duplicate content issues"
    )
    score += 15 // Partial credit as system likely auto-generates
  }

  // Focus keywords defined (20 points)
  const focusKeywords = (doc.seo as any)?.meta?.focusKeywords
  if (focusKeywords) {
    score += 20
  } else {
    issues.push("No focus keywords defined")
    suggestions.push("Define focus keywords for better SEO targeting")
  }

  // Schema markup (25 points)
  const structuredData = (doc.seo as any)?.structuredData
  if (structuredData?.enableStructuredData && structuredData?.schemaType) {
    score += 25
  } else {
    suggestions.push("Enable structured data markup for better search visibility")
  }

  // Performance suggestions (10 points)
  suggestions.push("Ensure fast page loading times (under 3 seconds)")
  suggestions.push("Optimize for mobile devices")
  score += 10

  const status = getComponentStatus(score)
  return { score, weight: 7, status, issues, suggestions }
}

/*************************************************************************/
/*  HELPER FUNCTIONS
/*************************************************************************/

function generateKeywordVariations(keyword: string): string[] {
  const variations = [keyword]
  const words = keyword.toLowerCase().split(" ")

  // Add singular/plural variations
  words.forEach(word => {
    if (word.endsWith("s") && word.length > 3) {
      variations.push(word.slice(0, -1))
    } else {
      variations.push(word + "s")
    }
  })

  // Add common variations
  if (words.length > 1) {
    variations.push(words.join("-"))
    variations.push(words.reverse().join(" "))
  }

  return [...new Set(variations)]
}

function extractTextFromRichText(richText: any): string {
  // Basic extraction - would need to be enhanced based on your rich text structure
  if (typeof richText === "string") return richText
  if (richText?.root?.children) {
    return richText.root.children.map((child: any) => child.text || "").join(" ")
  }
  return ""
}

function extractTextFromSections(sections: any[]): string {
  // Extract text from common section types
  return sections
    .map(section => {
      let text = ""
      if (section.heading) text += section.heading + " "
      if (section.content) text += extractTextFromRichText(section.content) + " "
      if (section.description) text += extractTextFromRichText(section.description) + " "
      if (section.text) text += section.text + " "
      return text
    })
    .join(" ")
}

function calculateOverallScore(components: SEOScore["components"]): number {
  let totalScore = 0
  let totalWeight = 0

  Object.values(components).forEach(component => {
    totalScore += component.score * (component.weight / 100)
    totalWeight += component.weight
  })

  return Math.round((totalScore / totalWeight) * 100)
}

function getScoreStatus(score: number): SEOScore["status"] {
  if (score >= 90) return "excellent"
  if (score >= 70) return "good"
  if (score >= 50) return "needs-improvement"
  return "poor"
}

function getComponentStatus(score: number): SEOComponentScore["status"] {
  if (score >= 90) return "excellent"
  if (score >= 70) return "good"
  if (score >= 40) return "warning"
  return "error"
}

function generateSuggestions(components: SEOScore["components"]): SEOSuggestion[] {
  const suggestions: SEOSuggestion[] = []

  Object.entries(components).forEach(([category, component]) => {
    component.issues.forEach(issue => {
      suggestions.push({
        type: component.status === "error" ? "error" : "warning",
        category: category as SEOSuggestion["category"],
        message: issue,
        priority: component.status === "error" ? "high" : "medium",
        actionable: true,
      })
    })

    component.suggestions.forEach(suggestion => {
      suggestions.push({
        type: "info",
        category: category as SEOSuggestion["category"],
        message: suggestion,
        priority: component.status === "warning" ? "medium" : "low",
        actionable: true,
      })
    })
  })

  // Sort by priority and type
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const typeOrder = { error: 4, warning: 3, info: 2, success: 1 }

    return (
      priorityOrder[b.priority] - priorityOrder[a.priority] ||
      typeOrder[b.type] - typeOrder[a.type]
    )
  })
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

/**
 * Get SEO score summary for quick display
 */
export function getSEOScoreSummary(score: SEOScore): {
  score: number
  status: string
  statusColor: string
  topIssues: string[]
  topSuggestions: string[]
} {
  const statusColors = {
    excellent: "green",
    good: "lime",
    "needs-improvement": "yellow",
    poor: "red",
  }

  const topIssues = score.suggestions
    .filter(s => s.type === "error")
    .slice(0, 3)
    .map(s => s.message)

  const topSuggestions = score.suggestions
    .filter(s => s.type === "info" && s.priority === "high")
    .slice(0, 3)
    .map(s => s.message)

  return {
    score: score.overall,
    status: score.status.replace("-", " "),
    statusColor: statusColors[score.status],
    topIssues,
    topSuggestions,
  }
}

/**
 * Check if document has critical SEO issues
 */
export function hasCriticalSEOIssues(score: SEOScore): boolean {
  return score.suggestions.some(s => s.type === "error" && s.priority === "high")
}

/**
 * Get component scores for dashboard display
 */
export function getComponentScores(score: SEOScore): Array<{
  name: string
  score: number
  status: string
  weight: number
}> {
  return Object.entries(score.components).map(([name, component]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    score: component.score,
    status: component.status,
    weight: component.weight,
  }))
}
