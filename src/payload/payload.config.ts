// storage-adapter-import-placeholder
import { vercelPostgresAdapter } from "@payloadcms/db-vercel-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { buildConfig } from "payload"
import { fileURLToPath } from "url"
import path from "path"
import sharp from "sharp"

// Collections
import { Users } from "@/payload/collections/users"
import { Media } from "@/payload/collections/media"
import { Pages } from "@/payload/collections/pages"
import { Posts } from "@/payload/collections/posts"
import { Categories } from "@/payload/collections/categories"
import { plugins } from "./plugins"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    autoLogin: {
      email: "andrew@wildcreative.com.au",
      password: "K@fe3xpress",
      prefillOnly: false,
    },
    components: {
      Nav: "@/payload/components/nav",
      actions: ["@/payload/components/actions"],
      beforeDashboard: ["@/payload/components/before-dashboard"],
      afterDashboard: ["@/payload/components/after-dashboard"],
      header: ["@/payload/components/header"],
      logout: {
        Button: "@/payload/components/logout",
      },
      views: {
        // dashboard: {
        //   Component: "@/payload/components/dashboard",
        // },
        myCustomView: {
          Component: "@/payload/components/custom-view",
          path: "/custom",
        },
      },
    },
  },

  collections: [Users, Media, Pages, Posts, Categories],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || "",
    },
  }),
  sharp,
  plugins,
})
