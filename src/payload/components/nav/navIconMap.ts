import { Link, List, LucideProps } from "lucide-react"
import { CollectionSlug, GlobalSlug } from "payload"
import { ExoticComponent } from "react"
import { FaFileAlt, FaSearch, FaUserAlt, FaWpforms } from "react-icons/fa"
import { IoIosDocument } from "react-icons/io"
import { IconType } from "react-icons/lib"
import {
  MdBorderBottom,
  MdOutlinePermMedia,
  MdBorderTop,
  MdBusinessCenter,
} from "react-icons/md"
import { IoMenu, IoSettings, IoDocumentsSharp } from "react-icons/io5"
import { RiTeamFill } from "react-icons/ri"

export const navIconMap: Partial<
  Record<CollectionSlug | GlobalSlug, ExoticComponent<LucideProps> | IconType>
> = {
  categories: List,
  media: MdOutlinePermMedia,
  pages: IoIosDocument,
  posts: IoDocumentsSharp,
  users: FaUserAlt,
  redirects: Link,
  forms: FaWpforms,
  "form-submissions": FaFileAlt,
  search: FaSearch,
  settings: IoSettings,
  header: MdBorderTop,
  footer: MdBorderBottom,
  team: RiTeamFill,
  services: MdBusinessCenter,
}

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug)
    ? navIconMap[slug as CollectionSlug | GlobalSlug]
    : undefined
