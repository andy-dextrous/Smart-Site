import { Users } from "@/admin/payload/collections/users"
import { Media } from "@/admin/payload/collections/media"
import { Pages } from "@/admin/payload/collections/pages"
import { Posts } from "@/admin/payload/collections/posts"
import { Categories } from "@/admin/payload/collections/categories"
import { Team } from "@/admin/payload/collections/team"
import { Services } from "@/admin/payload/collections/services"
import { Testimonials } from "@/admin/payload/collections/testimonials"
import { Templates } from "@/admin/payload/collections/templates"
import { getURIIndexCollection } from "@/admin/payload/collections/uri-index"
import { getFrontendCollections } from "@/admin/config/frontend"
import { CollectionConfig, CollectionSlug } from "payload"

/*************************************************************************/
/*  COLLECTIONS
/*************************************************************************/

const frontendRelationSlugs = getFrontendCollections().map(
  collection => collection.slug as CollectionSlug
)

const collections: CollectionConfig[] = [
  Pages,
  Posts,
  Team,
  Services,
  Testimonials,
  Templates,
  Media,
  Categories,
  Users,
  getURIIndexCollection(frontendRelationSlugs),
]

export default collections
