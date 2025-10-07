import { z } from "zod"

/*************************************************************************/
/*  SMARTSITE CONFIGURATION SCHEMA
/*************************************************************************/

const SitemapConfigSchema = z.object({
  enabled: z.boolean(),
  priority: z.number(),
  changefreq: z.enum([
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never",
  ]),
  respectNoIndex: z.boolean(),
})

const CollectionConfigSchema = z.object({
  enabled: z.boolean(),
  frontend: z.boolean(),
  label: z.string(),
  seo: z.boolean().optional(),
  frontendOptions: z
    .object({
      seoSchemaType: z
        .enum([
          "WebPage",
          "Article",
          "Service",
          "Person",
          "Organization",
          "LocalBusiness",
          "Product",
          "Event",
          "FAQPage",
          "HowTo",
        ])
        .optional(),
      enablePreview: z.boolean().default(true),
      enableLivePreview: z.boolean().default(true),
      customHooks: z.boolean().default(true),
      slugLocked: z.boolean().default(true),
    })
    .optional(),
  sitemap: SitemapConfigSchema.optional(),
})

const MediaCollectionConfigSchema = CollectionConfigSchema.extend({
  provider: z
    .enum(["local", "vercel-blob", "s3", "cloudinary", "uploadthing"])
    .optional(),
  config: z.record(z.any()).optional(),
  staticDir: z.string().optional(),
})

const GrayscaleSchema = z.object({
  "0": z.string(),
  "50": z.string(),
  "100": z.string(),
  "150": z.string(),
  "200": z.string(),
  "250": z.string(),
  "300": z.string(),
  "350": z.string(),
  "400": z.string(),
  "450": z.string(),
  "500": z.string(),
  "550": z.string(),
  "600": z.string(),
  "650": z.string(),
  "700": z.string(),
  "750": z.string(),
  "800": z.string(),
  "850": z.string(),
  "900": z.string(),
  "950": z.string(),
  "1000": z.string(),
})

const AdminThemeSchema = z.object({
  colors: z.object({
    accent: z.string(),
    accentLight: z.string(),
    accentLightest: z.string(),
    error: z.string(),
    success: z.string(),
    warning: z.string(),
    grayscale: GrayscaleSchema,
  }),
  layout: z.object({
    sidebarWidth: z.string(),
    headerHeight: z.string(),
    borderRadius: z.string(),
    contentMaxWidth: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.string(),
    lineHeight: z.string(),
  }),
})

const AdminMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  favicon: z.string().optional(),
})

const ImageOptimizationSchema = z.object({
  quality: z.object({
    default: z.number().min(1).max(100),
    thumbnail: z.number().min(1).max(100).optional(),
    hero: z.number().min(1).max(100).optional(),
  }),
  sizes: z.array(
    z.object({
      name: z.string(),
      width: z.number(),
      height: z.number().optional(),
      crop: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
    })
  ),
  breakpoints: z.record(z.string(), z.number()),
})

const GSAPConfigSchema = z.object({
  scrollTrigger: z.boolean(),
  scrollSmoother: z.boolean(),
  flip: z.boolean(),
  draggable: z.boolean(),
  morphSVG: z.boolean(),
  drawSVG: z.boolean(),
  splitText: z.boolean(),
  customEase: z.boolean(),
  physics2D: z.boolean(),
  textPlugin: z.boolean(),
  scrambleText: z.boolean(),
  globalAnimations: z.boolean(),
})

const BreadcrumbConfigSchema = z.object({
  enabled: z.boolean().default(true),
  homeLabel: z.string().default("Home"),
  separator: z.enum(["slash", "chevron", "arrow", "dot"]).default("slash"),
  maxDepth: z.number().min(0).optional(),
  showCurrent: z.boolean().default(true),
  className: z.string().optional(),
})

const I18nConfigSchema = z
  .object({
    defaultLocale: z.string().min(1),
    locales: z.array(z.string().min(1)).min(1),
    prefixDefaultLocale: z.boolean().optional(),
    localeCookie: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.locales.includes(value.defaultLocale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "defaultLocale must be included in locales",
        path: ["locales"],
      })
    }
  })

const I18nFeatureSchema = z.union([z.boolean(), I18nConfigSchema])

const FeaturesConfigSchema = z.object({
  ai: z.object({
    enabled: z.boolean(),
    endpoint: z.string(),
    registrationPath: z.string().default("/api/internal/identities"),
  }),
  darkMode: z.boolean(),
  i18n: I18nFeatureSchema,
  analytics: z.boolean(),
  search: z.boolean(),
  sitemaps: z.boolean(),
})

const ExtensionsConfigSchema = z.object({
  collections: z.array(z.string()).default([]),
  blocks: z.array(z.string()).default([]),
  globals: z.array(z.string()).default([]),
  plugins: z.array(z.string()).default([]),
})

export const SmartSiteConfigSchema = z.object({
  collections: z.record(z.union([MediaCollectionConfigSchema, CollectionConfigSchema])),
  features: FeaturesConfigSchema,
  admin: z.object({
    theme: AdminThemeSchema,
    meta: AdminMetaSchema,
  }),
  images: ImageOptimizationSchema,
  gsap: GSAPConfigSchema,
  breadcrumbs: BreadcrumbConfigSchema,
  extensions: ExtensionsConfigSchema.optional(),
})

/*************************************************************************/
/*  TYPE EXPORTS
/*************************************************************************/

export type SmartSiteConfig = z.infer<typeof SmartSiteConfigSchema>
export type CollectionConfig = z.infer<typeof CollectionConfigSchema>
export type MediaCollectionConfig = z.infer<typeof MediaCollectionConfigSchema>
export type AdminTheme = z.infer<typeof AdminThemeSchema>
export type AdminMeta = z.infer<typeof AdminMetaSchema>
export type ImageOptimizationConfig = z.infer<typeof ImageOptimizationSchema>
export type GSAPConfig = z.infer<typeof GSAPConfigSchema>
export type BreadcrumbConfig = z.infer<typeof BreadcrumbConfigSchema>
export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>
export type I18nConfig = z.infer<typeof I18nConfigSchema>
export type I18nFeature = z.infer<typeof I18nFeatureSchema>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type UserConfig = DeepPartial<SmartSiteConfig>

/*************************************************************************/
/*  SMARTSITE DEFAULT CONFIGURATION
/*************************************************************************/

const DEFAULT_AI_ENDPOINT =
  process.env.SMARTSITE_AI_ENDPOINT?.trim() || "https://smart-site-ai-core.vercel.app"

export const SMARTSITE_DEFAULTS: SmartSiteConfig = {
  /*************************************************************************/
  /*  COLLECTION CONFIGURATIONS
  /*************************************************************************/

  collections: {
    pages: {
      enabled: true,
      frontend: true,
      label: "Pages",
      seo: true,
      frontendOptions: {
        seoSchemaType: "WebPage",
        enablePreview: true,
        enableLivePreview: true,
        customHooks: true,
        slugLocked: true,
      },
      sitemap: {
        enabled: true,
        priority: 0.7,
        changefreq: "weekly",
        respectNoIndex: true,
      },
    },
    posts: {
      enabled: true,
      frontend: true,
      label: "Posts",
      seo: true,
      frontendOptions: {
        seoSchemaType: "Article",
        enablePreview: true,
        enableLivePreview: true,
        customHooks: true,
        slugLocked: true,
      },
      sitemap: {
        enabled: true,
        priority: 0.6,
        changefreq: "daily",
        respectNoIndex: true,
      },
    },
    categories: {
      enabled: true,
      frontend: false,
      label: "Categories",
    },
    team: {
      enabled: true,
      frontend: true,
      label: "Team",
      seo: true,
      frontendOptions: {
        seoSchemaType: "Person",
        enablePreview: true,
        enableLivePreview: true,
        customHooks: true,
        slugLocked: true,
      },
      sitemap: {
        enabled: true,
        priority: 0.5,
        changefreq: "monthly",
        respectNoIndex: true,
      },
    },
    services: {
      enabled: true,
      frontend: true,
      label: "Services",
      seo: true,
      frontendOptions: {
        seoSchemaType: "Service",
        enablePreview: true,
        enableLivePreview: true,
        customHooks: true,
        slugLocked: true,
      },
      sitemap: {
        enabled: true,
        priority: 0.7,
        changefreq: "weekly",
        respectNoIndex: true,
      },
    },
    testimonials: {
      enabled: true,
      frontend: false,
      label: "Testimonials",
    },
    templates: {
      enabled: true,
      frontend: false,
      label: "Templates",
    },
    users: {
      enabled: true,
      frontend: false,
      label: "Users",
    },
    media: {
      enabled: true,
      frontend: false,
      label: "Media",
      provider: "local",
      config: {},
    } as MediaCollectionConfig,
  },

  /*************************************************************************/
  /*  FEATURE FLAGS
  /*************************************************************************/

  features: {
    ai: {
      enabled: true,
      endpoint: DEFAULT_AI_ENDPOINT,
      registrationPath: "/api/internal/identities",
    },
    darkMode: false,
    i18n: false,
    analytics: true,
    search: true,
    sitemaps: true,
  },

  /*************************************************************************/
  /*  ADMIN THEME CONFIGURATION
  /*************************************************************************/

  admin: {
    theme: {
      colors: {
        accent: "#4f37fb",
        accentLight: "#8373fc",
        accentLightest: "#b8affd",
        error: "#dc2626",
        success: "#16a34a",
        warning: "#d97706",
        grayscale: {
          "0": "#ffffff",
          "50": "#f8f8f9",
          "100": "#ebebed",
          "150": "#dedee0",
          "200": "#d1d1d4",
          "250": "#c3c3c8",
          "300": "#b6b6bc",
          "350": "#a9a9af",
          "400": "#9c9ca3",
          "450": "#8e8e97",
          "500": "#81818b",
          "550": "#74747e",
          "600": "#686871",
          "650": "#5c5c63",
          "700": "#505056",
          "750": "#434349",
          "800": "#37373c",
          "850": "#202023",
          "900": "#18181a",
          "950": "#0f0f0f",
          "1000": "#0c0c0c",
        },
      },
      layout: {
        sidebarWidth: "240px",
        headerHeight: "60px",
        borderRadius: "0.375rem",
        contentMaxWidth: "1400px",
      },
      typography: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "14px",
        lineHeight: "1.5",
      },
    },
    meta: {
      title: "Admin | Smart Site",
      description: "Advanced admin panel for high-performance websites",
      favicon: "/favicon.png",
    },
  },

  /*************************************************************************/
  /*  IMAGE OPTIMIZATION CONFIGURATION
  /*************************************************************************/

  images: {
    quality: {
      default: 85,
      thumbnail: 75,
      hero: 90,
    },
    sizes: [
      { name: "thumbnail", width: 300 },
      { name: "square", width: 500, height: 500 },
      { name: "small", width: 600 },
      { name: "medium", width: 900 },
      { name: "large", width: 1400 },
      { name: "xlarge", width: 1920 },
      { name: "og", width: 1200, height: 630, crop: "center" },
    ],
    breakpoints: {
      "3xl": 1920,
      "2xl": 1536,
      xl: 1280,
      lg: 1024,
      md: 768,
      sm: 640,
    },
  },

  /*************************************************************************/
  /*  GSAP ANIMATION CONFIGURATION
  /*************************************************************************/

  gsap: {
    scrollTrigger: true,
    scrollSmoother: true,
    flip: false,
    draggable: false,
    morphSVG: false,
    drawSVG: false,
    splitText: false,
    customEase: false,
    physics2D: false,
    textPlugin: false,
    scrambleText: false,
    globalAnimations: false,
  },

  /*************************************************************************/
  /*  BREADCRUMB CONFIGURATION
  /*************************************************************************/

  breadcrumbs: {
    enabled: true,
    homeLabel: "Home",
    separator: "slash",
    maxDepth: 0,
    showCurrent: true,
    className: "text-sm text-white/70",
  },

  /*************************************************************************/
  /*  EXTENSIONS (NO DEFAULTS)
  /*************************************************************************/

  extensions: {
    collections: [],
    blocks: [],
    globals: [],
    plugins: [],
  },
}
