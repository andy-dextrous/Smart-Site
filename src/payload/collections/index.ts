import { Users } from "@/payload/collections/users"
import { Media } from "@/payload/collections/media"
import { Pages } from "@/payload/collections/pages"
import { Posts } from "@/payload/collections/posts"
import { Categories } from "@/payload/collections/categories"
import { Menus } from "@/payload/collections/menus"
import { Team } from "@/payload/collections/team"
import { Services } from "@/payload/collections/services"
import { CollectionConfig } from "payload"

const collections: CollectionConfig[] = [
  Pages,
  Posts,
  Team,
  Services,
  Media,
  Categories,
  Users,
  // Menus,
]

export default collections
