import type { CollectionConfig } from "payload"
import { hasMinimumRole } from "@/payload/access/roles"

const deny = () => false
export const PublicationWork: CollectionConfig = {
  slug: "site-publication-work",
  dbName: "site-publication-work",
  admin: {
    hidden: true,
    useAsTitle: "source",
    defaultColumns: ["source", "status", "processed", "attempts", "updatedAt"],
    description:
      "Saved content is safe. Pending website refreshes resume automatically; administrators can retry failed work through the publication endpoint.",
  },
  access: { read: hasMinimumRole("admin"), create: deny, update: deny, delete: deny },
  fields: [
    { name: "source", type: "text", required: true },
    { name: "kind", type: "select", options: ["routes", "refresh"], required: true },
    {
      name: "status",
      type: "select",
      options: ["pending", "running", "completed", "failed"],
      defaultValue: "pending",
      required: true,
      index: true,
    },
    { name: "owner", type: "text" },
    { name: "generation", type: "number", required: true, defaultValue: 0 },
    { name: "leaseUntil", type: "date" },
    { name: "attempts", type: "number", required: true, defaultValue: 0 },
    { name: "processed", type: "number", required: true, defaultValue: 0 },
    { name: "checkpoint", type: "json" },
    { name: "error", type: "text" },
    { name: "cacheAcknowledgedAt", type: "date" },
  ],
}
