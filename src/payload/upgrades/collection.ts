import type { CollectionConfig } from "payload"
import { canRunPublication } from "@/lib/publication/access"

export const UpgradeReceipts: CollectionConfig = {
  slug: "site-upgrade-receipts",
  dbName: "site-upgrade-receipts",
  admin: { hidden: true },
  access: {
    read: ({ req }) => canRunPublication(req),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: "release", type: "text", required: true, unique: true },
    { name: "fingerprint", type: "text", required: true },
    { name: "status", type: "select", options: ["running", "completed"], required: true },
    { name: "workId", type: "text" },
    { name: "convertedJobs", type: "json", defaultValue: [] },
  ],
}
