import type { Post, Media } from "@/admin/payload/payload-types"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ArrowRightIcon from "@/components/icons/arrow-right"
import { Media as PayloadMedia } from "@/admin/payload/components/frontend/media"
import { cn } from "@/utilities/ui"

/*************************************************************************/
/*  POST CARD COMPONENT
/*************************************************************************/

interface PostCardProps {
  post: Post
  className?: string
}

export function PostCard({ post, className }: PostCardProps) {
  return (
    <article
      className={cn(
        "group border-light-border relative flex flex-col overflow-hidden border-x border-y transition-all duration-500 ease-in-out hover:translate-y-[-5px]",
        className
      )}
    >
      <div className="relative z-30 mb-4 aspect-[4/3] overflow-hidden md:mb-6">
        {post.heroImage && typeof post.heroImage === "object" && (
          <PayloadMedia
            resource={post.heroImage as Media}
            alt={post.title}
            fill
            imgClassName="object-cover transition-transform duration-500 ease-in-out group-hover:scale-107"
          />
        )}
        <div className="article-image-gradient absolute inset-0 opacity-40 duration-500 ease-in-out group-hover:opacity-60" />
      </div>
      <div className="z-30 flex flex-1 flex-col px-6 pt-8 pb-12 md:p-6 lg:p-8">
        <Link
          href={post.uri || `/insights/${post.slug || ""}`}
          className="z-40 before:absolute before:inset-0 before:z-40 before:size-full"
        >
          <h5 className="z-50 mb-3 text-white md:mb-4">{post.title}</h5>
        </Link>
        <p className="z-50 mb-4 flex-1 text-sm font-light text-white/80 md:mb-6">
          {post.seo?.meta?.description || "Read more about this topic..."}
        </p>
        <Button
          variant="outlineGradient"
          size="md"
          className="group-hover:text-dark self-start transition-all duration-500 ease-in-out group-hover:bg-white"
        >
          Read More
          <ArrowRightIcon className="!h-[7px] !w-[12px]" />
        </Button>
      </div>
    </article>
  )
}
