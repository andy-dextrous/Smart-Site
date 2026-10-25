import type { Media as MediaType, Post, Team, User } from "@/payload-types"
import { Media } from "@/components/fields/media"
import { cn } from "@/lib/ui"

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
    avatar?: MediaType | null
    teamMember?: Team | null
  }

  if (!first) return null

  const team =
    first.teamMember && typeof first.teamMember === "object" ? first.teamMember : null

  const name = team?.name || first.name || "Anonymous"

  const teamDetails = team as
    | (Team & {
        image?: MediaType | string | null
        role?: string | null
        bio?: string | null
        socialLinks?: Array<{
          platform?: string | null
          url?: string | null
        } | null> | null
      })
    | null

  const legacyContent =
    teamDetails && typeof teamDetails === "object"
      ? ((teamDetails as unknown as Record<string, unknown>).content as
          | {
              image?: MediaType | string | null
              role?: string | null
              bio?: string | null
              socialLinks?: Array<{
                platform?: string | null
                url?: string | null
              } | null> | null
            }
          | null
          | undefined)
      : null

  const avatar = teamDetails?.image ?? legacyContent?.image ?? first.avatar ?? null
  const role = teamDetails?.role ?? legacyContent?.role ?? null
  const bio = teamDetails?.bio ?? legacyContent?.bio ?? null
  const socials = teamDetails?.socialLinks ?? legacyContent?.socialLinks ?? null

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
        "border-dark-border p-content-lg rounded-2xl border bg-white shadow-sm",
        className
      )}
    >
      <div className="gap-content md:gap-content-lg flex flex-col md:flex-row md:items-center">
        {avatar ? (
          <div className="border-dark-border relative size-20 flex-shrink-0 overflow-hidden rounded-full border">
            <Media
              resource={avatar}
              fill
              size="80px"
              className="size-full"
              imgClassName="object-cover"
            />
          </div>
        ) : null}

        <div className="gap-content-sm flex flex-1 flex-col">
          <div>
            <p className="text-dark-600 text-sm tracking-[0.18em] uppercase">
              Written By
            </p>
            <h3 className="text-dark text-xl">{name}</h3>
            {role ? <p className="text-dark-600 text-sm">{role}</p> : null}
          </div>

          {bio ? <p className="text-dark-600 text-base">{bio}</p> : null}

          {filteredSocials.length > 0 ? (
            <ul className="gap-content-sm text-dark-600 flex flex-wrap items-center text-sm">
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
