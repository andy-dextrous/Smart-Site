import { getServerSideURL } from "@/utilities/get-url"

/*************************************************************************/
/*  STRUCTURED DATA TYPES
/*************************************************************************/

export interface BaseSchema {
  "@context": "https://schema.org"
  "@type": string
  name?: string
  description?: string
  url?: string
  image?: string | string[]
}

export interface OrganizationSchema extends BaseSchema {
  "@type": "Organization" | "LocalBusiness" | "Corporation"
  logo?: string
  foundingDate?: string
  address?: {
    "@type": "PostalAddress"
    streetAddress?: string
    addressLocality?: string
    postalCode?: string
    addressCountry?: string
  }
  contactPoint?: {
    "@type": "ContactPoint"
    telephone?: string
    email?: string
  }
}

export interface ArticleSchema extends BaseSchema {
  "@type": "Article"
  headline?: string
  author?: {
    "@type": "Person"
    name: string
  }[]
  datePublished?: string
  dateModified?: string
  publisher?: OrganizationSchema
  mainEntityOfPage?: string
}

export interface WebPageSchema extends BaseSchema {
  "@type": "WebPage"
  breadcrumb?: {
    "@type": "BreadcrumbList"
    itemListElement: {
      "@type": "ListItem"
      position: number
      name: string
      item: string
    }[]
  }
}

export interface PersonSchema extends BaseSchema {
  "@type": "Person"
  email?: string
  jobTitle?: string
  worksFor?: OrganizationSchema
  sameAs?: string[]
}

export interface ServiceSchema extends BaseSchema {
  "@type": "Service"
  provider?: OrganizationSchema
  serviceType?: string
}

type EnrichedAuthor = {
  id?: string | null
  name?: string | null
  lastName?: string | null
  user?: {
    name?: string | null
    lastName?: string | null
    username?: string | null
    email?: string | null
    bio?: string | null
    avatar?: {
      url?: string | null
    } | null
  } | null
  teamMember?: {
    id?: string | null
    name?: string | null
    role?: string | null
    bio?: string | null
    image?: {
      url?: string | null
    } | null
  } | null
}

/*************************************************************************/
/*  STRUCTURED DATA GENERATOR
/*************************************************************************/

/**
 * Generate structured data for a document based on its type and settings
 */
export function generateStructuredData(doc: any, globalSettings?: any): object[] {
  const schemas: object[] = []
  const baseURL = getServerSideURL()

  // Check if structured data is enabled for this document
  const structuredData = (doc.seo as any)?.structuredData
  if (!structuredData?.enableStructuredData) {
    return schemas
  }

  const schemaType = structuredData.schemaType || "WebPage"
  const customProperties = structuredData.customSchemaProperties

  // Generate organization schema from global settings
  const organizationSchema = generateOrganizationSchema(globalSettings)
  if (organizationSchema) {
    schemas.push(organizationSchema)
  }

  // Generate document-specific schema
  switch (schemaType) {
    case "Article":
      if ("content" in doc || "sections" in doc) {
        schemas.push(generateArticleSchema(doc as any, baseURL, organizationSchema))
      }
      break

    case "Person":
      if ("name" in doc && "email" in doc) {
        schemas.push(generatePersonSchema(doc as any, baseURL, organizationSchema))
      }
      break

    case "Service":
      if ("description" in doc) {
        schemas.push(generateServiceSchema(doc as any, baseURL, organizationSchema))
      }
      break

    case "WebPage":
    default:
      schemas.push(generateWebPageSchema(doc, baseURL))
      break
  }

  // Merge custom properties if provided
  if (customProperties && schemas.length > 0) {
    try {
      const custom =
        typeof customProperties === "string"
          ? JSON.parse(customProperties)
          : customProperties

      if (typeof custom === "object" && custom !== null) {
        const lastSchema = schemas[schemas.length - 1] as any
        Object.assign(lastSchema, custom)
      }
    } catch (error) {
      console.warn("Invalid custom schema properties:", error)
    }
  }

  return schemas
}

/*************************************************************************/
/*  SCHEMA GENERATORS
/*************************************************************************/

function generateOrganizationSchema(settings?: any): OrganizationSchema | null {
  const seoSettings = (settings as any)?.seo
  if (!seoSettings?.organization?.name) {
    return null
  }

  const org = seoSettings.organization
  const baseURL = getServerSideURL()

  const schema: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": org.type || "Organization",
    name: org.name,
    url: baseURL,
  }

  if (org.description) {
    schema.description = org.description
  }

  if (org.logo && typeof org.logo === "object" && org.logo.url) {
    schema.logo = `${baseURL}${org.logo.url}`
  }

  if (org.foundingDate) {
    schema.foundingDate = org.foundingDate
  }

  // Add location data if available
  const location = settings?.locations?.locations?.[0]
  if (location) {
    if (location.street || location.city || location.zip || location.country) {
      schema.address = {
        "@type": "PostalAddress",
        streetAddress: location.street || undefined,
        addressLocality: location.city || undefined,
        postalCode: location.zip || undefined,
        addressCountry: location.country || undefined,
      }
    }

    if (location.phone || location.email) {
      schema.contactPoint = {
        "@type": "ContactPoint",
        telephone: location.phone || undefined,
        email: location.email || undefined,
      }
    }
  }

  return schema
}

function generateArticleSchema(
  doc: any,
  baseURL: string,
  organization?: OrganizationSchema | null
): ArticleSchema {
  const schema: ArticleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.seo?.meta?.title || doc.title,
    url: `${baseURL}${doc.uri}`,
    mainEntityOfPage: `${baseURL}${doc.uri}`,
  }

  if (doc.seo?.meta?.description) {
    schema.description = doc.seo.meta.description
  }

  if (
    doc.seo?.meta?.image &&
    typeof doc.seo.meta.image === "object" &&
    doc.seo.meta.image.url
  ) {
    schema.image = `${baseURL}${doc.seo.meta.image.url}`
  }

  if (doc.publishedAt) {
    schema.datePublished = doc.publishedAt
  }

  if (doc.updatedAt) {
    schema.dateModified = doc.updatedAt
  }

  // Add authors if available
  if (doc.populatedAuthors && doc.populatedAuthors.length > 0) {
    const authors = doc.populatedAuthors as EnrichedAuthor[]

    schema.author = authors.map(author => {
      const team = author?.teamMember || null
      const resolvedName = team?.name || author?.name || null

      const person: {
        "@type": "Person"
        name: string
        jobTitle?: string
        description?: string
        image?: string
      } = {
        "@type": "Person",
        name: resolvedName ?? "Anonymous",
      }

      if (team?.role) {
        person.jobTitle = team.role
      }

      if (team?.bio) {
        person.description = team.bio
      }

      if (team?.image?.url) {
        person.image = `${baseURL}${team.image.url}`
      }

      return person
    })
  }

  if (organization) {
    schema.publisher = organization
  }

  return schema
}

function generatePersonSchema(
  doc: any,
  baseURL: string,
  organization?: OrganizationSchema | null
): PersonSchema {
  const schema: PersonSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: doc.name,
    url: `${baseURL}${doc.uri}`,
  }

  if (doc.email) {
    schema.email = doc.email
  }

  const role = doc.role ?? doc.content?.role
  if (role) {
    schema.jobTitle = role
  }

  const bio = doc.bio ?? doc.content?.bio
  if (bio) {
    schema.description = bio
  }

  const image = doc.image ?? doc.content?.image
  if (image && typeof image === "object" && image?.url) {
    schema.image = `${baseURL}${image.url}`
  }

  if (organization) {
    schema.worksFor = organization
  }

  // Add social media links
  const socialLinks = doc.socialLinks ?? doc.content?.socialLinks
  if (Array.isArray(socialLinks) && socialLinks.length > 0) {
    schema.sameAs = socialLinks
      .filter((link: any) => link.url)
      .map((link: any) => link.url!)
  }

  return schema
}

function generateServiceSchema(
  doc: any,
  baseURL: string,
  organization?: OrganizationSchema | null
): ServiceSchema {
  const schema: ServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: doc.seo?.meta?.title || doc.title,
    url: `${baseURL}${doc.uri}`,
  }

  if (doc.description) {
    schema.description = doc.description
  } else if (doc.seo?.meta?.description) {
    schema.description = doc.seo.meta.description
  }

  if (
    doc.seo?.meta?.image &&
    typeof doc.seo.meta.image === "object" &&
    doc.seo.meta.image.url
  ) {
    schema.image = `${baseURL}${doc.seo.meta.image.url}`
  }

  if (organization) {
    schema.provider = organization
  }

  return schema
}

function generateWebPageSchema(doc: any, baseURL: string): WebPageSchema {
  const schema: WebPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name:
      doc.seo?.meta?.title ||
      ("title" in doc ? doc.title : "name" in doc ? doc.name : "Page"),
    url: `${baseURL}${doc.uri}`,
  }

  if (doc.seo?.meta?.description) {
    schema.description = doc.seo.meta.description
  }

  if (
    doc.seo?.meta?.image &&
    typeof doc.seo.meta.image === "object" &&
    doc.seo.meta.image.url
  ) {
    schema.image = `${baseURL}${doc.seo.meta.image.url}`
  }

  // Add breadcrumbs if available
  if ("breadcrumbs" in doc && doc.breadcrumbs && doc.breadcrumbs.length > 0) {
    schema.breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: doc.breadcrumbs.map((crumb: any, index: number) => ({
        "@type": "ListItem" as const,
        position: index + 1,
        name: crumb.label || "Page",
        item: crumb.url ? `${baseURL}${crumb.url}` : `${baseURL}${doc.uri}`,
      })),
    }
  }

  return schema
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

/**
 * Convert structured data to JSON-LD script tag
 */
export function structuredDataToJsonLd(schemas: object[]): string {
  if (schemas.length === 0) {
    return ""
  }

  const jsonLd = schemas.length === 1 ? schemas[0] : schemas

  return `<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>`
}

/**
 * Generate all structured data for a document
 */
export async function getDocumentStructuredData(
  doc: any,
  globalSettings?: any
): Promise<string> {
  const schemas = generateStructuredData(doc, globalSettings)
  return structuredDataToJsonLd(schemas)
}
