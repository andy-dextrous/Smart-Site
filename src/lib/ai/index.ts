import { Mastra } from "@mastra/core/mastra"
import { PinoLogger } from "@mastra/loggers"
import { postgresStore } from "./database"
import { LibSQLStore } from "@mastra/libsql"

/*************************************************************************/
/*  SMART SITE AI CONFIGURATION
/*************************************************************************/

export const mastra = new Mastra({
  agents: {},
  workflows: {},
  storage: new LibSQLStore({
    url: "file:./storage.db",
  }),
  logger: new PinoLogger({
    name: "SmartSiteAI",
    level: "info",
  }),
  server: {
    port: 4112,
    host: "localhost",
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
  },
})

export const smartSiteAI = mastra
