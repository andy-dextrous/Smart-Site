import { Users } from "@/admin/payload/collections/users"
import { Media } from "@/admin/payload/collections/media"
import { Pages } from "@/admin/payload/collections/pages"
import { Posts } from "@/admin/payload/collections/posts"
import { Categories } from "@/admin/payload/collections/categories"
import { Team } from "@/admin/payload/collections/team"
import { Services } from "@/admin/payload/collections/services"
import { Testimonials } from "@/admin/payload/collections/testimonials"
import { Templates } from "@/admin/payload/collections/templates"
import { URIIndex } from "@/admin/payload/collections/uri-index"
import { CollectionConfig } from "payload"
import { 
  DefaultCollectionKeys, 
  CollectionOverride 
} from "@/admin/config"

/*************************************************************************/
/*  DEFAULT COLLECTIONS REGISTRY
/*************************************************************************/

// Registry of all default collections mapped by key
export const defaultCollections: Record<DefaultCollectionKeys, CollectionConfig> = {
  'team': Team,
  'services': Services,
  'testimonials': Testimonials,
  'posts': Posts,
  'categories': Categories,
  'templates': Templates,
  'pages': Pages,
  'media': Media,
  'users': Users,
  'uri-index': URIIndex,
}

/*************************************************************************/
/*  COLLECTION RESOLVER
/*************************************************************************/

/**
 * Resolves collections array with boolean override support
 * 
 * @param collections - Array of CollectionConfig or CollectionOverride objects
 * @returns Array of resolved CollectionConfig objects
 */
export function resolveCollections(
  collections?: (CollectionConfig | CollectionOverride)[]
): CollectionConfig[] {
  // Start with all default collections
  const enabledDefaults = { ...defaultCollections }
  const customCollections: CollectionConfig[] = []
  
  // Process client configuration
  if (collections) {
    for (const item of collections) {
      // Check if it's a boolean override object
      if (isCollectionOverride(item)) {
        // Apply boolean flags to disable defaults
        for (const [key, enabled] of Object.entries(item)) {
          if (enabled === false && key in enabledDefaults) {
            delete enabledDefaults[key as DefaultCollectionKeys]
          }
        }
      } else {
        // It's a custom collection config
        customCollections.push(item)
      }
    }
  }
  
  // Return enabled defaults + custom collections
  return [
    ...Object.values(enabledDefaults),
    ...customCollections
  ]
}

/*************************************************************************/
/*  TYPE GUARDS
/*************************************************************************/

function isCollectionOverride(
  item: CollectionConfig | CollectionOverride
): item is CollectionOverride {
  // Check if object has any default collection keys with boolean values
  const keys = Object.keys(item)
  return keys.some(key => 
    key in defaultCollections && 
    typeof (item as any)[key] === 'boolean'
  )
}