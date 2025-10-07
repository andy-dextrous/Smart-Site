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

function resolveDatabaseTarget(): "prod" | "staging" | "default" {
  if (process.env.SMARTSITE_DATABASE_TARGET === "prod") return "prod"
  if (process.env.SMARTSITE_DATABASE_TARGET === "staging") return "staging"
  if (process.env.STAGING_DATABASE_URL && process.env.NODE_ENV !== "production") return "staging"
  return "prod"
}

export const databaseInfo = {
  target: resolveDatabaseTarget(),
  provider: process.env.DATABASE_PROVIDER === "mongoose" ? "mongoose" : "postgres",
  url: connectionUrl,
}

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
