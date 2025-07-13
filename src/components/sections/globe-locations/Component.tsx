import { getSettings } from "@/lib/data/globals"
import type { GlobeLocationsBlock, Setting } from "@/payload/payload-types"
import { GlobeLocationsClientComponent } from "./client-component"

/*************************************************************************/
/*  GLOBE LOCATIONS COMPONENT
/*************************************************************************/

export const GlobeLocationsComponent = async ({
  heading,
  description,
}: GlobeLocationsBlock) => {
  const settings = (await getSettings()) as Setting
  const locations = settings?.locations?.locations || []

  return (
    <GlobeLocationsClientComponent
      heading={heading}
      description={description}
      locations={locations}
    />
  )
}
