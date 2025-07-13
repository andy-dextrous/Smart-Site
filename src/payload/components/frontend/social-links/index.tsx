import React from "react"
import Link from "next/link"
import { cn } from "@/utilities/ui"
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaTwitter,
  FaTiktok,
  FaPinterest,
  FaSnapchat,
  FaWhatsapp,
  FaTelegram,
  FaDiscord,
  FaTwitch,
  FaReddit,
  FaGithub,
  FaEnvelope,
  FaPhone,
  FaGlobe,
} from "react-icons/fa"

/*************************************************************************/
/*  TYPES
/*************************************************************************/

type SocialLink = {
  platform: string
  url: string
  label?: string | null
}

type SocialLinksProps = {
  socialLinks?: SocialLink[]
  orientation?: "horizontal" | "vertical"
  variant?: "button" | "icon-button" | "icon"
  className?: string
}

/*************************************************************************/
/*  SOCIAL ICON COMPONENT
/*************************************************************************/

function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const iconClass = cn("h-5 w-5", className)

  switch (platform) {
    case "facebook":
      return <FaFacebook className={iconClass} />
    case "instagram":
      return <FaInstagram className={iconClass} />
    case "linkedin":
      return <FaLinkedin className={iconClass} />
    case "youtube":
      return <FaYoutube className={iconClass} />
    case "twitter":
      return <FaTwitter className={iconClass} />
    case "tiktok":
      return <FaTiktok className={iconClass} />
    case "pinterest":
      return <FaPinterest className={iconClass} />
    case "snapchat":
      return <FaSnapchat className={iconClass} />
    case "whatsapp":
      return <FaWhatsapp className={iconClass} />
    case "telegram":
      return <FaTelegram className={iconClass} />
    case "discord":
      return <FaDiscord className={iconClass} />
    case "twitch":
      return <FaTwitch className={iconClass} />
    case "reddit":
      return <FaReddit className={iconClass} />
    case "github":
      return <FaGithub className={iconClass} />
    case "email":
      return <FaEnvelope className={iconClass} />
    case "phone":
      return <FaPhone className={iconClass} />
    case "website":
      return <FaGlobe className={iconClass} />
    default:
      return <FaGlobe className={iconClass} />
  }
}

/*************************************************************************/
/*  SOCIAL LINKS COMPONENT
/*************************************************************************/

export const SocialLinks: React.FC<SocialLinksProps> = ({
  socialLinks = [],
  orientation = "horizontal",
  variant = "icon-button",
  className,
}) => {
  if (!socialLinks || socialLinks.length === 0) return null

  const formatUrl = (url: string, platform: string) => {
    if (platform === "email" && !url.startsWith("mailto:")) {
      return `mailto:${url}`
    }
    if (platform === "phone" && !url.startsWith("tel:")) {
      return `tel:${url}`
    }
    return url
  }

  const getLabel = (social: SocialLink) => {
    return (
      social.label || social.platform.charAt(0).toUpperCase() + social.platform.slice(1)
    )
  }

  const containerClass = cn(
    "flex gap-4",
    {
      "flex-row": orientation === "horizontal",
      "flex-col": orientation === "vertical",
    },
    className
  )

  const linkBaseClass = "transition-colors"

  const getLinkClass = () => {
    switch (variant) {
      case "button":
        return cn(
          linkBaseClass,
          "inline-flex items-center space-x-2 rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        )
      case "icon-button":
        return cn(
          linkBaseClass,
          "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-white/40 hover:text-white"
        )
      case "icon":
        return cn(linkBaseClass, "text-white/80 hover:text-white")
      default:
        return cn(
          linkBaseClass,
          "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-white/40 hover:text-white"
        )
    }
  }

  return (
    <div className={containerClass}>
      {socialLinks.map((social, index) => (
        <Link
          key={index}
          href={formatUrl(social.url, social.platform)}
          className={getLinkClass()}
          aria-label={getLabel(social)}
          {...(social.url.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <SocialIcon platform={social.platform} />
          {variant === "button" && <span className="text-sm">{getLabel(social)}</span>}
        </Link>
      ))}
    </div>
  )
}
