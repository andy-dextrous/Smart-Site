import { Link, List, LucideProps } from "lucide-react"
import { CollectionSlug, GlobalSlug } from "payload"
import { ExoticComponent } from "react"
import { FaFileAlt, FaSearch, FaUserAlt } from "react-icons/fa"
import { IoIosDocument } from "react-icons/io"
import { IoDocumentsSharp } from "react-icons/io5"
import { IconType } from "react-icons/lib"
import { MdOutlinePermMedia } from "react-icons/md"
import { FaWpforms } from "react-icons/fa"

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
}

export const getNavIcon = (slug: string) =>
  Object.hasOwn(navIconMap, slug)
    ? navIconMap[slug as CollectionSlug | GlobalSlug]
    : undefined
