import admin from "@/payload/admin"
import collections from "@/payload/collections"
import globals from "@/payload/globals"
import { plugins } from "@/payload/plugins"
import { getServerSideURL } from "@/utilities/getURL"
// import { vercelPostgresAdapter } from "@payloadcms/db-vercel-postgres"
import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig, PayloadRequest } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin,
  editor: lexicalEditor(),
  // db: vercelPostgresAdapter({
  //   pool: {
  //     connectionString: process.env.POSTGRES_URL!,
  //   },
  // }),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || "",
  }),
  collections,
  cors: [getServerSideURL()].filter(Boolean),
  globals,
  plugins,
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const authHeader = req.headers.get("authorization")
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
