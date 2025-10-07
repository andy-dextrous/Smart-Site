import { Post, Team, User } from "@/admin/payload/payload-types"

type PopulatedAuthorProfile = NonNullable<Post["populatedAuthors"]>
type EnrichedAuthor = NonNullable<PopulatedAuthorProfile>[number] & {
  user?: User | null
  teamMember?: Team | null
  lastName?: string | null
}

/**
 * Formats an array of populatedAuthors from Posts into a prettified string.
 * @param authors - The populatedAuthors array from a Post.
 * @returns A prettified string of authors.
 * @example
 *
 * [Author1, Author2] becomes 'Author1 and Author2'
 * [Author1, Author2, Author3] becomes 'Author1, Author2, and Author3'
 *
 */
export const formatAuthors = (authors: NonNullable<Post["populatedAuthors"]>[number][]) => {
  const enriched = authors as unknown as EnrichedAuthor[]

  const authorNames = enriched
    .map(author => {
      const team = author.teamMember && typeof author.teamMember === "object" ? author.teamMember : null
      const user = author.user && typeof author.user === "object" ? author.user : null

      if (team?.name) {
        return team.name
      }

      const nameParts = [author.name, author.lastName ?? user?.lastName]
        .filter(part => typeof part === "string" && part.trim() !== "")
        .map(part => part as string)

      if (nameParts.length > 0) {
        return nameParts.join(" ")
      }

      if (user?.username) {
        return user.username
      }

      if (user?.email) {
        return user.email
      }

      return author.name || null
    })
    .filter((name): name is string => Boolean(name))

  if (authorNames.length === 0) return ""
  if (authorNames.length === 1) return authorNames[0]
  if (authorNames.length === 2) return `${authorNames[0]} and ${authorNames[1]}`

  return `${authorNames.slice(0, -1).join(", ")} and ${authorNames[authorNames.length - 1]}`
}
