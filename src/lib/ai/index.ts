import { Mastra } from "@mastra/core/mastra"
import { PinoLogger } from "@mastra/loggers"
import { postgresStore } from "./database"

/*************************************************************************/
/*  SMART SITE AI CONFIGURATION
/*************************************************************************/

export const mastra = new Mastra({
  agents: {},
  workflows: {},
  storage: postgresStore,
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
