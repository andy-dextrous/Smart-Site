"use client"

import useClickableCard from "@/admin/utilities/use-clickable-card"
import Link from "next/link"
import React, { Fragment } from "react"
import { Media } from "../media"
import "./styles.scss"
import { Post } from "@/admin/payload/payload-types"

export type CardPostData = Pick<any, "slug" | "categories" | "meta" | "title">

export const Card: React.FC<{
  alignItems?: "center"
  className?: string
  doc?: Post
  relationTo?: "blog"
  showCategories?: boolean
  title?: string
}> = props => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, seo, title } = doc || {}
  const meta = seo?.meta
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, " ") // replace non-breaking space with white space
  // Use URI field if available, otherwise fallback to basic slug construction
  const href = (doc as any)?.uri || `/${slug}`

  return (
    <article className={`card ${className || ""}`} ref={card.ref}>
      <div className="card__image-container">
        {!metaImage && <div className="card__empty-image">No image</div>}
        {metaImage && typeof metaImage !== "string" && (
          <Media resource={metaImage} size="33vw" />
        )}
      </div>
      <div className="card__content">
        {showCategories && hasCategories && (
          <div className="card__categories">
            {showCategories && hasCategories && (
              <div>
                {categories?.map((category, index) => {
                  if (typeof category === "object") {
                    const { title: titleFromCategory } = category

                    const categoryTitle = titleFromCategory || "Untitled category"

                    const isLast = index === categories.length - 1

                    return (
                      <Fragment key={index}>
                        <span className="card__category">{categoryTitle}</span>
                        {!isLast && <Fragment>, &nbsp;</Fragment>}
                      </Fragment>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
        )}
        {titleToUse && (
          <div className="card__title">
            <h3>
              <Link className="card__title-link" href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {description && (
          <div className="card__description">
            {description && <p>{sanitizedDescription}</p>}
          </div>
        )}
      </div>
    </article>
  )
}
