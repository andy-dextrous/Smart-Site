import { PayloadRequest } from "payload"
import { uriDependentUpdatesHandler } from "./dependency-updates/handler"

const jobs = {
  access: {
    run: ({ req }: { req: PayloadRequest }): boolean => {
      if (req.user) return true
      const authHeader = req.headers.get("authorization")
      return authHeader === `Bearer ${process.env.CRON_SECRET}`
    },
  },
  tasks: [
    {
      retries: 3,
      slug: "dependent-uri-updates",
      handler: uriDependentUpdatesHandler,
      inputSchema: [
        {
          name: "operation",
          type: "text" as const,
          required: true,
          label: "Dependent Updates Operation Type",
        },
        {
          name: "entityId",
          type: "text" as const,
          required: true,
          label: "Entity ID",
        },
        {
          name: "additionalData",
          type: "json" as const,
          label: "Additional Data",
        },
      ],
      outputSchema: [
        {
          name: "success",
          type: "checkbox" as const,
          label: "Operation Success",
        },
        {
          name: "documentsUpdated",
          type: "number" as const,
          label: "Documents Updated",
        },
        {
          name: "redirectsCreated",
          type: "number" as const,
          label: "Redirects Created",
        },
        {
          name: "cacheEntriesCleared",
          type: "number" as const,
          label: "Cache Entries Cleared",
        },
        {
          name: "errors",
          type: "json" as const,
          label: "Errors",
        },
        {
          name: "processedAt",
          type: "text" as const,
          label: "Processed At",
        },
        {
          name: "operation",
          type: "text" as const,
          label: "Operation Type",
        },
        {
          name: "impactSize",
          type: "number" as const,
          label: "Impact Size",
        },
      ],
    },
  ],
}

export default jobs
