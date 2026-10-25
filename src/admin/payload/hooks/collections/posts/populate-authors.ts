import type { CollectionAfterReadHook } from "payload"

// Public authors are deliberately a display shape, never a serialized user.
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req }) => {
  if (!Array.isArray(doc?.authors)) return doc
  const refs = doc.authors
    .map((author: any) => (typeof author === "object" ? author?.id : author))
    .filter(Boolean)
  doc.authors = refs
  doc.populatedAuthors = []
  for (const id of refs) {
    try {
      // Only these public profile fields cross the private users boundary.
      const author = await req.payload.findByID({
        collection: "users",
        id,
        depth: 0,
        req,
        overrideAccess: true,
        select: { name: true, lastName: true, avatar: true, teamMember: true },
      })
      let team: any = null
      if (author.teamMember) {
        try {
          team = await req.payload.findByID({
            collection: "team",
            id:
              typeof author.teamMember === "object"
                ? author.teamMember.id
                : author.teamMember,
            depth: 1,
            draft: false,
            req,
            overrideAccess: false,
          })
        } catch {
          /* A private profile is not a public byline. */
        }
      }
      const profile: any = {
        id,
        name:
          team?.name ||
          [author.name, author.lastName].filter(Boolean).join(" ") ||
          "Anonymous",
      }
      if (team)
        profile.teamMember = {
          id: team.id,
          name: team.name,
          uri: team.uri,
          role: team.role,
          bio: team.bio,
          image: team.image,
          socialLinks: team.socialLinks,
        }
      if (author.avatar) {
        try {
          profile.avatar = await req.payload.findByID({
            collection: "media",
            id: typeof author.avatar === "object" ? author.avatar.id : author.avatar,
            depth: 0,
            req,
            overrideAccess: false,
            // Payload's URL hook needs filename even when selecting URL explicitly.
            select: {
              filename: true,
              url: true,
              alt: true,
              width: true,
              height: true,
              mimeType: true,
              updatedAt: true,
            },
          })
        } catch {
          /* Missing/private avatar is omitted. */
        }
      }
      doc.populatedAuthors.push(profile)
    } catch {
      /* Deleted author references remain IDs but have no public profile. */
    }
  }
  return doc
}
