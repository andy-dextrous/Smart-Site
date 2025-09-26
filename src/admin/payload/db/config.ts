import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { postgresAdapter } from "@payloadcms/db-postgres"

function resolveDatabaseUrl(): string {
  if (process.env.SMARTSITE_DATABASE_TARGET === "prod") {
    return process.env.DATABASE_URL || ""
  }

  if (process.env.SMARTSITE_DATABASE_TARGET === "staging") {
    return process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || ""
  }

  if (process.env.STAGING_DATABASE_URL && process.env.NODE_ENV !== "production") {
    return process.env.STAGING_DATABASE_URL
  }

  return process.env.DATABASE_URL || ""
}

const connectionUrl = resolveDatabaseUrl()

const pg = postgresAdapter({
  pool: {
    connectionString: connectionUrl,
  },
  schemaName: "smart-site",
  idType: "uuid",
})

const mongoose = mongooseAdapter({
  url: connectionUrl,
})

const db = process.env.DATABASE_PROVIDER === "mongoose" ? mongoose : pg

export default db
