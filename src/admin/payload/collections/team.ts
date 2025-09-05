import { CollectionConfig } from "payload"
import { anyone } from "@/admin/payload/access/anyone"
import { canEditContent } from "@/admin/payload/access/editor"
// Frontend wrapper is now applied dynamically via resolver
import { CollectionCustomMetadata } from "@/admin/payload/types/icon-types"

const teamConfig: CollectionConfig = {
  slug: "team",
  access: {
    create: canEditContent,
    delete: canEditContent,
    read: anyone,
    update: canEditContent,
  },
  labels: {
    singular: "Team Member",
    plural: "Team Members",
  },
  admin: {
    useAsTitle: "name",
    description:
      "Team members are used to display the team on the website. They are different to users, which are used for the admin panel.",
    custom: {
      icon: {
        type: "react-icons",
        name: "ri/RiTeamFill",
      },
    } as CollectionCustomMetadata,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "email",
          type: "email",
          required: true,
        },
      ],
    },
    {
      name: "image",
      label: "Profile Image",
      admin: {
        description: "The image will be used as the profile image for the team member.",
      },
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "role",
      type: "text",
      required: true,
    },
    {
      name: "bio",
      type: "textarea",
      required: true,
    },
    {
      type: "array",
      name: "socialLinks",
      label: "Social Links",
      fields: [
        {
          name: "platform",
          type: "select",
          options: [
            "twitter",
            "facebook",
            "instagram",
            "linkedin",
            "youtube",
            "twitch",
            "tiktok",
            "github",
            "website",
          ],
        },
        {
          name: "url",
          type: "text",
        },
      ],
    },
  ],
  hooks: {},
}

// Frontend wrapper is now applied dynamically via resolver based on config
export const Team: CollectionConfig = teamConfig
