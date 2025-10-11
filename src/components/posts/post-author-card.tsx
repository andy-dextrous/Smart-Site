import type { Media as MediaType, Post, Team, User } from "@/admin/payload/payload-types"
import { Media } from "@/components/fields/media"
import { cn } from "@/utilities/ui"

interface PostAuthorCardProps {
  post: Post
  className?: string
}

type ResolvedAuthor = {
  name: string
  role?: string | null
  bio?: string | null
  avatar?: MediaType | string | null
  socials?: Array<{ platform?: string | null; url?: string | null } | null> | null
}

function resolvePrimaryAuthor(post: Post): ResolvedAuthor | null {
  if (!post?.populatedAuthors || post.populatedAuthors.length === 0) {
    return null
  }

  const first = post.populatedAuthors[0] as (typeof post.populatedAuthors)[number] & {
    user?: User | null
    teamMember?: Team | null
  }

  if (!first) return null

  const team = first.teamMember && typeof first.teamMember === "object" ? first.teamMember : null
  const user = first.user && typeof first.user === "object" ? first.user : null

  const name =
    team?.name ||
    user?.name ||
    first.name ||
    user?.username ||
    user?.email ||
    "Anonymous"

  const avatar = team?.content?.image || user?.avatar || null
  const role = team?.content?.role || null
  const bio = team?.content?.bio || null
  const socials = team?.content?.socialLinks || null

  return {
    name,
    role,
    bio,
    avatar,
    socials,
  }
}

export function PostAuthorCard({ post, className }: PostAuthorCardProps) {
  const author = resolvePrimaryAuthor(post)

  if (!author) return null

  const { name, role, bio, avatar, socials } = author

  const filteredSocials =
    socials?.filter(
      link => link && typeof link === "object" && link.platform && link.url
    ) ?? []

  return (
    <aside
      className={cn(
        "rounded-2xl border border-dark-border bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        {avatar ? (
          <div className="relative size-20 flex-shrink-0 overflow-hidden rounded-full border border-dark-border">
            <Media resource={avatar} className="size-full object-cover" />
          </div>
        ) : null}

        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-dark-600">
              Written By
            </p>
            <h3 className="text-xl font-semibold text-dark">{name}</h3>
            {role ? <p className="text-sm text-dark-600">{role}</p> : null}
          </div>

          {bio ? <p className="text-base leading-relaxed text-dark-600">{bio}</p> : null}

          {filteredSocials.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-3 text-sm text-dark-600">
              {filteredSocials.map(link => {
                if (!link?.platform || !link.url) return null
                return (
                  <li key={`${link.platform}-${link.url}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-dark"
                    >
                      {link.platform}
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
