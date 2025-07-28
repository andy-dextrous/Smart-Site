/*************************************************************************/
/*  ADMIN BOUNDARY PUBLIC API
/*
/*  This is the ONLY file client code should import from admin boundary.
/*  Everything else in /admin is internal implementation.
/*************************************************************************/

// Core rendering components
export {
  SmartSiteURIRenderer,
  generateStaticParams,
  generateMetadata,
} from "./components/uri-renderer"
export { RenderSections } from "./components/render-sections"

// Configuration system
export { defineConfig } from "./config"
export type {
  SmartSiteConfig,
  SmartSiteClientConfig,
  SmartSiteSettings,
  i18nConfig,
} from "./config"

// Page data types
export type { PageData } from "./components/render-sections"
