import type { Block } from "payload"
import { sectionIntro } from "@/payload/fields/section-intro"

export const GlobeLocations: Block = {
  slug: "globe-locations",
  imageURL: "/api/media/file/globe-600x327.png",
  interfaceName: "GlobeLocationsBlock",
  admin: {
    group: "Business Sections",
  },
  fields: [
    sectionIntro({
      collapsibleLabel: "Section Intro",
      headingDescription:
        "Main heading for the locations section. Use <span> tags for gradient text.",
      descriptionDescription:
        "Brief description of your global presence and office locations",
    }),
  ],
}
