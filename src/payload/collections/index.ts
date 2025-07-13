import { Users } from "@/payload/collections/users"
import { Media } from "@/payload/collections/media"
import { Pages } from "@/payload/collections/pages"
import { Posts } from "@/payload/collections/posts"
import { Categories } from "@/payload/collections/categories"
import { Team } from "@/payload/collections/team"
import { Services } from "@/payload/collections/services"
import { Testimonials } from "@/payload/collections/testimonials"
import { Templates } from "@/payload/collections/templates"
import { URIIndex } from "@/payload/collections/uri-index"
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
