"use client"

import { SectionIntro } from "@/components/fields/section-intro"
import { cn } from "@/utilities/ui"
import dynamic from "next/dynamic"
import { useEffect, useState, useRef, useImperativeHandle } from "react"
import type { Setting } from "@/admin/payload/payload-types"

/*************************************************************************/
/*  DYNAMIC REACT GLOBE COMPONENT
/*************************************************************************/

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
})

/*************************************************************************/
/*  TYPES
/*************************************************************************/

interface GlobeLocation {
  id: string
  name: string
  lat: number
  lng: number
  color: string
}

interface GlobeComponentProps {
  locations: GlobeLocation[]
  ref?: React.Ref<GlobeComponentRef>
}

interface GlobeComponentRef {
  navigateToPoint: (lat: number, lng: number, altitude: number) => void
}

interface ClientComponentProps {
  heading?: string
  description?: any
  locations: NonNullable<NonNullable<Setting["locations"]>["locations"]>
}

/*************************************************************************/
/*  GLOBE COMPONENT
/*************************************************************************/

function GlobeComponent({ locations, ref }: GlobeComponentProps) {
  const [countries, setCountries] = useState([])
  const globeRef = useRef<any>(null)

  useEffect(() => {
    fetch("/assets/geojson/countries-list.geojson", {
      cache: "force-cache",
    })
      .then(res => res.json())
      .then(data => setCountries(data.features))
  }, [])

  /*************************************************************************/
  /*  GLOBE SETUP
  /*************************************************************************/

  const handleGlobeReady = () => {
    if (globeRef.current && locations.length > 0) {
      // Set initial view to first location
      const firstLocation = locations[0]
      globeRef.current.pointOfView(
        {
          lat: firstLocation.lat,
          lng: firstLocation.lng,
          altitude: 1.5,
        },
        400
      )
    }
  }

  /*************************************************************************/
  /*  NAVIGATION HANDLER
  /*************************************************************************/

  const navigateToPoint = (lat: number, lng: number, altitude: number) => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        {
          lat,
          lng,
          altitude,
        },
        400
      )
    }
  }

  useImperativeHandle(ref, () => ({
    navigateToPoint,
  }))

  return (
    <div className="pointer-events-none relative h-full w-full">
      <Globe
        ref={globeRef}
        onGlobeReady={handleGlobeReady}
        backgroundColor="rgba(0,0,0,0)"
        showGlobe={false}
        enablePointerInteraction={false}
        globeOffset={[-200, 0]}
        // Country polygons
        hexPolygonsData={countries}
        hexPolygonResolution={3}
        hexPolygonMargin={0.3}
        hexPolygonUseDots={true}
        hexPolygonColor={() => "#181A25"}
        hexPolygonAltitude={0.002}
        // Location markers
        pointsData={locations}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: any) => d.color}
        pointAltitude={0.02}
        pointRadius={0.8}
        pointLabel={(
          d: any
        ) => `<div style="background: black; color: white; padding: 8px; border-radius: 4px;">
          <strong>${d.name}</strong>
        </div>`}
        showAtmosphere={false}
      />
    </div>
  )
}

/*************************************************************************/
/*  LOCATION CARDS COMPONENT
/*************************************************************************/

function LocationCards({
  onLocationClick,
  selectedLocationId,
  locations,
}: {
  onLocationClick: (location: any) => void
  selectedLocationId: string
  locations: NonNullable<NonNullable<Setting["locations"]>["locations"]>
}) {
  const generateLocationColor = (index: number) => {
    const colors = ["#7944B3", "#4400FF", "#FF6B35", "#4ECDC4", "#FF6B6B", "#95E1D3"]
    return colors[index % colors.length]
  }

  return (
    <div className="w-full space-y-4">
      {locations.map((location, index) => {
        const locationId = location.id || `location-${index}`
        const color = generateLocationColor(index)

        return (
          <div
            key={locationId}
            onClick={() => onLocationClick({ ...location, id: locationId, color })}
            className={cn(
              "cursor-pointer border p-6 backdrop-blur-sm transition-all duration-300",
              selectedLocationId === locationId
                ? "bg-dark-950/60 gradient-border"
                : "bg-dark-950/40 hover:bg-dark-950/60 border-light-border"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className="mt-2 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-white">
                  {location.city || "Location"}
                </h3>
                <p className="mb-2 text-sm text-gray-300">{location.country}</p>
                <p className="mb-3 text-xs text-gray-400">{location.street}</p>
                {location.phone && (
                  <p className="text-sm text-gray-300">Phone: {location.phone}</p>
                )}
                {location.email && (
                  <p className="text-sm text-gray-300">Email: {location.email}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/*************************************************************************/
/*  MAIN CLIENT COMPONENT
/*************************************************************************/

export function GlobeLocationsClientComponent({
  heading,
  description,
  locations,
}: ClientComponentProps) {
  const globeRef = useRef<GlobeComponentRef>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")

  // Transform Payload locations to Globe locations
  const globeLocations: GlobeLocation[] = locations.map((location, index) => {
    const colors = ["#7944B3", "#4400FF", "#FF6B35", "#4ECDC4", "#FF6B6B", "#95E1D3"]
    const locationId = location.id || `location-${index}`

    return {
      id: locationId,
      name: location.city || "Location",
      lat: location.latitude || 0,
      lng: location.longitude || 0,
      color: colors[index % colors.length],
    }
  })

  // Set initial selected location
  useEffect(() => {
    if (globeLocations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(globeLocations[0].id)
    }
  }, [globeLocations, selectedLocationId])

  const handleLocationClick = (locationData: any) => {
    setSelectedLocationId(locationData.id)
    if (globeRef.current && locationData.latitude && locationData.longitude) {
      globeRef.current.navigateToPoint(locationData.latitude, locationData.longitude, 1.5)
    }
  }

  // Don't render if no locations with valid coordinates
  const validLocations = locations.filter(
    location => location.latitude && location.longitude
  )

  if (validLocations.length === 0) {
    return (
      <section className="bg-dark side-border-light relative">
        <SectionIntro
          heading={heading}
          description={description}
          headingClassName="text-white"
          descriptionClassName="font-light text-white"
        />
        <div className="container py-16">
          <p className="text-center text-gray-400">
            No locations with coordinates available
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-dark side-border-light relative">
      <SectionIntro
        heading={heading}
        description={description}
        headingClassName="text-white"
        descriptionClassName="font-light text-white"
      />

      <div className="relative h-screen w-full">
        <div className="relative z-10 container grid h-full grid-cols-10">
          <div className="col-span-3 col-start-8 flex h-full items-center">
            <LocationCards
              onLocationClick={handleLocationClick}
              selectedLocationId={selectedLocationId}
              locations={locations}
            />
          </div>
        </div>
        <div className="absolute inset-0 z-[0] min-h-screen w-full">
          <GlobeComponent ref={globeRef} locations={globeLocations} />
        </div>
      </div>
    </section>
  )
}
