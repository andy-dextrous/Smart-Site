import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { postgresAdapter } from "@payloadcms/db-postgres"

const provider = process.env.DATABASE_PROVIDER
if (provider !== 'mongoose' && provider !== 'postgres') throw new Error('Set DATABASE_PROVIDER explicitly to mongoose or postgres. See getting-started.md.')
const target = process.env.SMARTSITE_DATABASE_TARGET || 'default'
if (!['default', 'prod', 'staging'].includes(target)) throw new Error('Unknown database target')
const connectionUrl = target === 'staging' ? process.env.STAGING_DATABASE_URL : process.env.DATABASE_URL
if (!connectionUrl) throw new Error('The explicitly selected database URL is missing; no fallback is permitted')
export const databaseInfo = { target, provider, url: connectionUrl }
export default provider === 'mongoose'
  ? mongooseAdapter({ url: connectionUrl })
  : postgresAdapter({ pool: { connectionString: connectionUrl }, schemaName: 'smart-site', idType: 'uuid', push: process.env.SMARTSITE_ENVIRONMENT === 'local' })
