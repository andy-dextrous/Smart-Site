import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { postgresAdapter } from "@payloadcms/db-postgres"

const pg = postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL!,
  },
  schemaName: "smart-site",
  idType: "uuid",
})

const mongoose = mongooseAdapter({
  url: process.env.DATABASE_URL || "",
})

const db = process.env.DATABASE_PROVIDER === "mongoose" ? mongoose : pg

export default db
