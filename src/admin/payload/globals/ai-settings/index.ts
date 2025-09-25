import type { GlobalConfig } from "payload"
import { authenticated } from "@/admin/payload/access/authenticated"
import { anyone } from "@/admin/payload/access/anyone"
import { sections } from "@/components/sections/config"
import { afterAISettingsChange } from "@/admin/payload/hooks/globals/ai-settings"

const sectionOptions = sections.sectionBlocks
  .map(block => {
    const label =
      typeof block.labels === "object" && block.labels !== null && "singular" in block.labels
        ? String(block.labels.singular)
        : block.slug
    return {
      label,
      value: block.slug,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

export const AISettings: GlobalConfig = {
  slug: "ai-settings",
  label: "AI Settings",
  access: {
    read: anyone,
    update: authenticated,
  },
  admin: {
    hideAPIURL: process.env.NODE_ENV === "production",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "general",
          label: "General",
          fields: [
            {
              name: "enabled",
              type: "checkbox",
              label: "Enable AI Assistant",
              defaultValue: false,
              admin: {
                description: "Master switch for all AI functionality",
              },
            },
            {
              name: "businessContext",
              type: "textarea",
              label: "Business Context",
              admin: {
                description: "Describe your business, industry, target audience, and unique value proposition",
                rows: 6,
              },
            },
            {
              name: "brandVoice",
              type: "textarea",
              label: "Brand Voice",
              admin: {
                description: "Describe how your brand should sound (e.g., professional yet approachable, technical but clear, friendly and conversational)",
                rows: 4,
              },
            },
            {
              name: "customInstructions",
              type: "textarea",
              label: "Custom Instructions",
              admin: {
                description: "Specific instructions for how the AI should behave, write, and represent your brand",
                rows: 6,
              },
            },
          ],
        },
        {
          name: "social",
          label: "Social Media",
          fields: [
            {
              name: "autoPosting",
              type: "checkbox",
              label: "Enable Auto-Posting",
              defaultValue: false,
              admin: {
                description: "Automatically post content updates to social media",
              },
            },
            {
              name: "platforms",
              type: "array",
              label: "Connected Platforms",
              fields: [
                {
                  name: "platform",
                  type: "select",
                  label: "Platform",
                  required: true,
                  options: [
                    { label: "Twitter/X", value: "twitter" },
                    { label: "LinkedIn", value: "linkedin" },
                    { label: "Facebook", value: "facebook" },
                    { label: "Instagram", value: "instagram" },
                  ],
                },
                {
                  name: "connected",
                  type: "checkbox",
                  label: "Connected",
                  defaultValue: false,
                  admin: {
                    description: "OAuth connection status (configure via OAuth flow)",
                  },
                },
                {
                  name: "postingSchedule",
                  type: "select",
                  label: "Posting Schedule",
                  options: [
                    { label: "Daily", value: "daily" },
                    { label: "Twice Weekly", value: "twice-weekly" },
                    { label: "Weekly", value: "weekly" },
                    { label: "When Content Published", value: "on-publish" },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "restrictions",
          label: "Restrictions",
          fields: [
            {
              name: "requireApproval",
              type: "checkbox",
              label: "Require Approval for AI Actions",
              defaultValue: true,
              admin: {
                description: "AI suggestions must be approved before applying",
              },
            },
            {
              type: "group",
              name: "allowedOperations",
              label: "Allowed Operations",
              admin: {
                description: "Select which operations the AI is allowed to perform",
              },
              fields: [
                {
                  name: "generateContent",
                  type: "checkbox",
                  label: "Generate Content",
                  defaultValue: true,
                  admin: {
                    description: "Allow AI to generate new content (blog posts, pages, descriptions)",
                  },
                },
                {
                  name: "editContent",
                  type: "checkbox",
                  label: "Edit Existing Content",
                  defaultValue: false,
                  admin: {
                    description: "Allow AI to modify existing content",
                  },
                },
                {
                  name: "publishContent",
                  type: "checkbox",
                  label: "Publish Content",
                  defaultValue: false,
                  admin: {
                    description: "Allow AI to publish content directly without draft review",
                  },
                },
                {
                  name: "socialPosting",
                  type: "checkbox",
                  label: "Social Media Posting",
                  defaultValue: false,
                  admin: {
                    description: "Allow AI to create and schedule social media posts",
                  },
                },
                {
                  name: "seoOptimization",
                  type: "checkbox",
                  label: "SEO Optimization",
                  defaultValue: true,
                  admin: {
                    description: "Allow AI to optimize content for search engines",
                  },
                },
                {
                  name: "imageGeneration",
                  type: "checkbox",
                  label: "Image Generation",
                  defaultValue: false,
                  admin: {
                    description: "Allow AI to generate images using AI models",
                  },
                },
              ],
            },
          ],
        },
        {
          name: "sections",
          label: "Section Guidance",
          fields: [
            {
              name: "sectionGuidance",
              label: "Section Guidance",
              type: "array",
              admin: {
                description:
                  "Control which sections the AI can use and describe how it should apply them when composing page layouts.",
                initCollapsed: true,
              },
              fields: [
                {
                  name: "sectionSlug",
                  label: "Section",
                  type: "select",
                  options: sectionOptions,
                  required: true,
                },
                {
                  name: "includeInDesigns",
                  label: "Include In AI-Generated Designs",
                  type: "checkbox",
                  defaultValue: true,
                },
                {
                  name: "usageInstructions",
                  label: "Usage Instructions",
                  type: "textarea",
                  admin: {
                    rows: 5,
                    description:
                      "Describe ideal use cases, required content, or sequencing notes that the AI should follow when selecting this section.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [afterAISettingsChange],
  },
}
