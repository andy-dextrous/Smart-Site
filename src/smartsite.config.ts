import { defineConfig } from "@/admin/config"

/*************************************************************************/
/*  SMART SITE CONFIG - CLIENT CONFIG
/*************************************************************************/

const smartSiteConfig = defineConfig({
  settings: {
    gsap: true,
    smoothScroll: true,
    themeToggle: false,
    i18n: false,
    gsapDevTools: true,
    ai: {
      enabled: true,
      url: process.env.NEXT_PUBLIC_AI_URL,
    },
    search: true,
    analytics: true,
    templateSupport: true,
    media: {
      storage: "local", // "local" | "vercel" | "s3" | "uploadThing" <=== All have options
    },
  },

  /*
    PAYLOAD EXTENSIONS

    Concept: Smart Site represents a WordPress-like, AI-native CMS built for most small-medium businesses and their needs. It is fully customisable and extensible.

    To work directly with the standard Payload config, you can access the default Payload config options via the payload key. To enable overrides, collections, globals and blocks can passed in separately in order to allow a {string:boolean} object if you want to disable a default collection, global or block.

   Add any collections, globals, blocks overrides and extensions here:
   - Disable default collections: [{ services: false, team: false }]
   - Add new collections: [CustomProducts, CustomFAQ]
   - Same for globals and blocks
   - Other payload config goes in payload: {}

   */

  collections: [
    // { services: false }, Disable services collection
    // CustomProducts,      Add custom collection
  ],

  globals: [
    // { footer: false },   Disable footer global
  ],

  blocks: [
    //    { form: false },       // Disable form block
  ],

  /*
    Other payload config goes here such as plugins, email extensions, etc. Use it for extensions or complete overrides of all smart site defaults.

    Example:
      payload: {
        admin: {
          meta: {
            title: "Admin | My Custom Site",
            description: "Custom admin panel description",
            icons: [{
              rel: "icon",
              type: "image/png",
              url: "/custom-favicon.png"
            }]
          }
        }
      }
   */
  payload: {},
})

export default smartSiteConfig
