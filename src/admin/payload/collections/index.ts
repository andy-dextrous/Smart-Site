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

/*************************************************************************/
/*  COLLECTIONS
/*************************************************************************/

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
  URIIndex,
]

export default collections
