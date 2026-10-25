import { canRunPublication } from "@/lib/publication/access"
import { queuePublication } from "@/lib/publication/intent"
import { PayloadRequest } from "payload"

const jobs = {
  access: {
    run: ({ req }: { req: PayloadRequest }): boolean => canRunPublication(req),
  },
  tasks: [
    {
      retries: 3,
      slug: "dependent-uri-updates",
      handler: async ({ req }: { req: PayloadRequest }) => {
        const workId = await queuePublication(
          req,
          "routes",
          "legacy/dependent-uri-updates"
        )
        return { output: { success: true, workId, state: "pending" } }
      },
      inputSchema: [
        { name: "operations", type: "json" as const },
        { name: "requestId", type: "text" as const },
        { name: "batchedAt", type: "text" as const },
        {
          name: "operation",
          type: "text" as const,
          required: false,
          label: "Dependent Updates Operation Type",
        },
        {
          name: "entityId",
          type: "text" as const,
          required: false,
          label: "Entity ID",
        },
        {
          name: "additionalData",
          type: "json" as const,
          label: "Additional Data",
        },
      ],
      outputSchema: [
        { name: "workId", type: "text" as const },
        { name: "state", type: "text" as const },
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
