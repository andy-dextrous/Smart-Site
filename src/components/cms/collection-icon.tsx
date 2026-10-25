"use client"

import { ComponentType, Suspense, createElement, useMemo } from "react"
import { IoIosDocument } from "react-icons/io"
import dynamic from "next/dynamic"
import { navIconMap } from "@/components/cms/nav/navIconMap"
import { IconConfig, CollectionCustomMetadata } from "@/types/icon-types"

/*************************************************************************/
/*  UNIFIED COLLECTION ICON COMPONENT
/*************************************************************************/

/**
 * A flexible icon component that can work with:
 * 1. Just a slug (uses navIconMap)
 * 2. An iconConfig object (for custom icons)
 * 3. A full item object with custom metadata (extracts iconConfig)
 */

const iconLoaders: Record<string, () => Promise<any>> = {
  // Lucide icons
  lucide: () => import("lucide-react"),

  // React Icons libraries
  fa: () => import("react-icons/fa"),
  fa6: () => import("react-icons/fa6"),
  md: () => import("react-icons/md"),
  ri: () => import("react-icons/ri"),
  io: () => import("react-icons/io"),
  io5: () => import("react-icons/io5"),
  hi: () => import("react-icons/hi"),
  hi2: () => import("react-icons/hi2"),
  ai: () => import("react-icons/ai"),
  bi: () => import("react-icons/bi"),
  bs: () => import("react-icons/bs"),
  cg: () => import("react-icons/cg"),
  ci: () => import("react-icons/ci"),
  di: () => import("react-icons/di"),
  fc: () => import("react-icons/fc"),
  fi: () => import("react-icons/fi"),
  gi: () => import("react-icons/gi"),
  go: () => import("react-icons/go"),
  gr: () => import("react-icons/gr"),
  im: () => import("react-icons/im"),
  lu: () => import("react-icons/lu"),
  pi: () => import("react-icons/pi"),
  rx: () => import("react-icons/rx"),
  si: () => import("react-icons/si"),
  sl: () => import("react-icons/sl"),
  tb: () => import("react-icons/tb"),
  tfi: () => import("react-icons/tfi"),
  ti: () => import("react-icons/ti"),
  vsc: () => import("react-icons/vsc"),
  wi: () => import("react-icons/wi"),
}

// Cache for loaded components
const componentCache = new Map<string, ComponentType<{ className?: string }>>()

function getIconCacheKey(config: IconConfig) {
  if (config.type === "lucide") {
    return `lucide:${config.name}`
  }
  if (config.type === "react-icons") {
    return `ri:${config.name}`
  }
  return `custom:${config.mediaId ?? config.url ?? "unknown"}`
}

function createDynamicIcon(config: IconConfig): ComponentType<{ className?: string }> {
  const cacheKey = getIconCacheKey(config)

  // Check cache first
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey)!
  }

  const DynamicIcon = dynamic(
    async () => {
      try {
        if (config.type === "lucide") {
          const mod = await iconLoaders.lucide()
          const Icon = mod[config.name]
          if (!Icon) {
            console.warn(`Lucide icon not found: ${config.name}`)
            return { default: IoIosDocument }
          }
          return { default: Icon }
        } else if (config.type === "react-icons") {
          const [lib, iconName] = config.name.split("/")
          const loader = iconLoaders[lib]

          if (!loader) {
            console.warn(`React Icons library not found: ${lib}`)
            return { default: IoIosDocument }
          }

          const mod = await loader()
          const Icon = mod[iconName]

          if (!Icon) {
            console.warn(`React icon not found: ${config.name}`)
            return { default: IoIosDocument }
          }

          return { default: Icon }
        }

        // Custom icons not supported yet
        return { default: IoIosDocument }
      } catch (error) {
        console.warn(`Failed to load icon:`, error)
        return { default: IoIosDocument }
      }
    },
    {
      loading: () => <IoIosDocument className="animate-pulse" />,
      ssr: true, // Enable SSR with fallback
    }
  )

  // Cache the component
  componentCache.set(cacheKey, DynamicIcon)

  return DynamicIcon
}

interface CollectionIconProps {
  slug: string
  className?: string
  // Optional: pass iconConfig directly (for server components)
  iconConfig?: IconConfig | null
  // Optional: pass full item (for client components with useConfig)
  item?: any
}

export function CollectionIcon({
  slug,
  iconConfig,
  item,
  className,
}: CollectionIconProps) {
  const resolvedConfig = useMemo<IconConfig | null>(() => {
    if (iconConfig) {
      return iconConfig
    }
    if (item) {
      const customMetadata = (item.admin?.custom || item.custom) as
        CollectionCustomMetadata | undefined
      if (customMetadata?.icon) {
        return customMetadata.icon
      }
    }
    return null
  }, [iconConfig, item])

  const dynamicIconElement = useMemo(() => {
    if (!resolvedConfig) {
      return null
    }
    const Component = createDynamicIcon(resolvedConfig)
    return createElement(Component, { className })
  }, [resolvedConfig, className])

  if (dynamicIconElement) {
    return (
      <Suspense fallback={<IoIosDocument className={`${className} animate-pulse`} />}>
        {dynamicIconElement}
      </Suspense>
    )
  }

  const FallbackIcon = navIconMap[slug] || navIconMap.default || IoIosDocument
  return <FallbackIcon className={className} />
}
