import type { GlobalConfig } from "payload"
import { authenticated } from "@/admin/payload/access/authenticated"
import { anyone } from "@/admin/payload/access/anyone"

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
      ],
    },
  ],
}