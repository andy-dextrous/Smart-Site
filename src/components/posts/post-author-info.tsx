"use client"

import { Media } from "@/components/fields/media"
import type { Media as MediaType, Post, Team, User } from "@/admin/payload/payload-types"
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaTwitch,
  FaTiktok,
  FaGithub,
  FaGlobe,
} from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { useMemo, type ReactNode } from "react"
import { cn } from "@/utilities/ui"

/*************************************************************************/
/*  POST AUTHOR INFO COMPONENT
/*************************************************************************/

export function PostAuthorInfo({ post }: { post: Post }) {
  const primaryProfile = useMemo(() => {
    if (!post?.populatedAuthors || post.populatedAuthors.length === 0) {
      return null
    }

    const first = post.populatedAuthors[0] as (typeof post.populatedAuthors)[number] & {
      user?: User | null
      teamMember?: Team | null
    }

    const team = first?.teamMember && typeof first.teamMember === "object" ? first.teamMember : null
    const user = first?.user && typeof first.user === "object" ? first.user : null

    if (!team && !user) {
      return null
    }

    return { team, user }
  }, [post?.populatedAuthors])

  if (!primaryProfile) {
    return null
  }

  const { team, user } = primaryProfile
  const publishedDate = post?.publishedAt || null

  const teamContent = team?.content || null

  const avatar: MediaType | string | null = teamContent?.image || user?.avatar || null
  const authorName = team?.name || user?.name || post?.populatedAuthors?.[0]?.name || "Anonymous"
  const role = teamContent?.role || null
  const bio = teamContent?.bio || user?.bio || null
  const socialLinks = teamContent?.socialLinks?.filter(link => link?.platform && link?.url) || []
  const education = teamContent?.education?.filter(entry => entry?.degree || entry?.institution || entry?.year) || []

  const formatPublishDate = (value: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getSocialIcon = (platform: string) => {
    const iconMap: Record<string, ReactNode> = {
      twitter: <FaTwitter className="h-5 w-5" />,
      facebook: <FaFacebook className="h-5 w-5" />,
      instagram: <FaInstagram className="h-5 w-5" />,
      linkedin: <FaLinkedin className="h-5 w-5" />,
      youtube: <FaYoutube className="h-5 w-5" />,
      twitch: <FaTwitch className="h-5 w-5" />,
      tiktok: <FaTiktok className="h-5 w-5" />,
      github: <FaGithub className="h-5 w-5" />,
      website: <FaGlobe className="h-5 w-5" />,
    }

    return iconMap[platform] ?? null
  }

  const formattedDate = formatPublishDate(publishedDate)

  return (
    <div className="mt-section-y container-sm">
      <article
        className={cn(
          "aurora-card relative w-full overflow-hidden border items-stretch text-left",
          "[--aurora-background:rgba(9,10,14,0.92)] [--aurora-border:rgba(255,255,255,0.12)] [--aurora-highlight:var(--color-secondary-500)]",
          "px-section-x py-section-y"
        )}
      >
        <span
          className="aurora-card__glow pointer-events-none absolute top-[-20%] left-1/2 h-[120%] w-[120%] -translate-x-1/2 opacity-70"
          aria-hidden
        />
        <span
          className="aurora-card__indicator pointer-events-none absolute top-[-1px] left-1/2 -translate-x-1/2"
          aria-hidden
        />
        <span
          className="aurora-card__edge pointer-events-none absolute top-0 left-0 hidden h-full w-px md:block"
          aria-hidden
        />
        <span
          className="aurora-card__edge pointer-events-none absolute top-0 right-0 hidden h-full w-px md:block"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-8 text-left md:flex-row md:items-center md:gap-12">
          {avatar && (
            <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full border border-white/10 shadow-lg">
              <Media resource={avatar} className="h-full w-full object-cover" />
              <span className="pointer-events-none absolute inset-0 rounded-full border border-white/20" aria-hidden />
            </div>
          )}

          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Written by</p>
              <div className="flex flex-col gap-1 text-white">
                <h3 className="text-h4 text-white font-normal">{authorName}</h3>
                {role && <p className="text-sm text-white/70">{role}</p>}
              </div>
            </div>

            {bio && <p className="max-w-3xl text-base leading-relaxed text-white/80">{bio}</p>}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {formattedDate && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Published</p>
                  <p className="text-sm text-white">{formattedDate}</p>
                </div>
              )}

              {education.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Education</p>
                  <ul className="mt-2 space-y-2 text-sm text-white/80">
                    {education.map((entry, index) => {
                      const summary = [entry?.degree, entry?.institution, entry?.year]
                        .filter(Boolean)
                        .join(" · ")

                      if (!summary) return null

                      return <li key={`${summary}-${index}`}>{summary}</li>
                    })}
                  </ul>
                </div>
              )}

              {socialLinks.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">Connect</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {socialLinks.map((link, index) => {
                      const icon = getSocialIcon(link?.platform as string)
                      if (!icon || !link?.url) return null

                      return (
                        <Button
                          key={`${link.platform}-${index}`}
                          asChild
                          variant="outlineGradient"
                          size="sm"
                          aria-label={`Visit ${link.platform}`}
                        >
                          <a href={link.url as string} target="_blank" rel="noopener noreferrer">
                            {icon}
                          </a>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
