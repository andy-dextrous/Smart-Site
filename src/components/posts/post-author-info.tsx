"use client"

import { Media } from "@/payload/components/frontend/media"
import { Post, User } from "@/payload/payload-types"
import { FaFacebook, FaTwitter, FaPinterest } from "react-icons/fa"
import { Button } from "@/components/ui/button"

/*************************************************************************/
/*  POST AUTHOR INFO COMPONENT
/*************************************************************************/

export function PostAuthorInfo({ post }: { post: Post }) {
  const author = post.authors?.[0]
  const authorObj = typeof author === "object" ? author : null
  const publishedDate = post.publishedAt

  if (!authorObj?.name) return null

  // Combine first name and last name to create full name
  const fullName = [authorObj.name, authorObj.lastName].filter(Boolean).join(" ")

  /*************************************************************************/
  /*  EDUCATION FORMATTING
  /*************************************************************************/

  function formatEducation(education: User["education"]): string | null {
    if (!education || education.length === 0) {
      return null
    }

    // Format multiple education entries
    const formattedEducations = education.map(edu => {
      let formatted = edu.degree
      if (edu.institution && edu.year) {
        formatted += ` (${edu.institution}, ${edu.year})`
      } else if (edu.institution) {
        formatted += ` (${edu.institution})`
      } else if (edu.year) {
        formatted += ` (${edu.year})`
      }
      return formatted
    })

    return formattedEducations.join(" • ")
  }

  /*************************************************************************/
  /*  DATE FORMATTING
  /*************************************************************************/

  function formatPublishDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  /*************************************************************************/
  /*  SOCIAL SHARE HANDLERS
  /*************************************************************************/

  function handleFacebookShare() {
    const url = window.location.href
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "width=600,height=400"
    )
  }

  function handleTwitterShare() {
    const url = window.location.href
    const text = post.title
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      "_blank",
      "width=600,height=400"
    )
  }

  function handlePinterestShare() {
    const url = window.location.href
    const description = post.title
    // Use hero image if available
    const imageUrl =
      typeof post.heroImage === "object" && post.heroImage?.url ? post.heroImage.url : ""
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}&media=${encodeURIComponent(imageUrl)}`,
      "_blank",
      "width=600,height=400"
    )
  }

  const educationText = formatEducation(authorObj?.education)

  return (
    <div className="border-light-border mt-section-y border p-8">
      <div className="flex items-center gap-6">
        {/* Avatar */}
        {authorObj?.avatar && (
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
            <Media resource={authorObj.avatar} className="h-full w-full object-cover" />
          </div>
        )}

        {/* Author Info */}
        <div className="flex-1">
          <div className="space-y-3">
            <p className="text-white">Written by {fullName}</p>
            {educationText && <p className="text-white/80">{educationText}</p>}
            {publishedDate && (
              <p className="text-gradient text-xs">{formatPublishDate(publishedDate)}</p>
            )}
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleFacebookShare}
            variant="outline"
            layout="centered"
            size="md"
            aria-label="Share on Facebook"
            className="hover:cursor-pointer"
          >
            <FaFacebook className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleTwitterShare}
            variant="outline"
            layout="centered"
            size="md"
            aria-label="Share on Twitter"
            className="hover:cursor-pointer"
          >
            <FaTwitter className="h-5 w-5" />
          </Button>
          <Button
            onClick={handlePinterestShare}
            variant="outline"
            layout="centered"
            size="md"
            aria-label="Share on Pinterest"
            className="hover:cursor-pointer"
          >
            <FaPinterest className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
