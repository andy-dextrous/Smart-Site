import { Link, List, LucideProps } from "lucide-react"
import { ExoticComponent } from "react"
import { FaFileAlt, FaSearch, FaUserAlt, FaWpforms } from "react-icons/fa"
import { IoIosDocument } from "react-icons/io"
import { IoDocumentsSharp, IoSettings } from "react-icons/io5"
import { HiTemplate } from "react-icons/hi"
import { IconType } from "react-icons/lib"

import {
  MdReviews,
  MdBorderBottom,
  MdBorderTop,
  MdBusinessCenter,
  MdOutlinePermMedia,
} from "react-icons/md"
import { RiTeamFill } from "react-icons/ri"

export const navIconMap: Partial<
  Record<string, ExoticComponent<LucideProps> | IconType>
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
  templates: HiTemplate,
  default: IoIosDocument,
  testimonials: MdReviews,
}

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug) ? navIconMap[slug] : navIconMap.default
