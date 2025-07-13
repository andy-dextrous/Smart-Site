import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { postgresAdapter } from "@payloadcms/db-postgres"

const vercel = postgresAdapter({
  pool: {
    connectionString: process.env.POSTGRES_URL!,
  },
  tablesFilter: ["!mastra_*"],
  schemaName: "payload",
  idType: "uuid",
})

const mongoose = mongooseAdapter({
  url: process.env.DATABASE_URI || "",
})

const db = process.env.DATABASE_PROVIDER === "mongoose" ? mongoose : vercel

export default db
