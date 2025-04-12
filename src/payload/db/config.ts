import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { vercelPostgresAdapter } from "@payloadcms/db-vercel-postgres"

const vercel = vercelPostgresAdapter({
  pool: {
    connectionString: process.env.POSTGRES_URL!,
  },
})

const mongoose = mongooseAdapter({
  url: process.env.DATABASE_URI || "",
})

const db = process.env.DATABASE_PROVIDER === "mongoose" ? mongoose : vercel

export default db
