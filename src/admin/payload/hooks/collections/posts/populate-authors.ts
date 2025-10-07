import type { CollectionAfterReadHook } from "payload"
import type { Team, User } from "@/admin/payload/payload-types"

type PopulatedAuthorProfile = {
  id?: string | null
  name?: string | null
  lastName?: string | null
  user?: User
  teamMember?: Team | null
}

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({
  doc,
  req,
  req: { payload },
}) => {
  if (doc?.authors && doc?.authors?.length > 0) {
    const authorDocs: User[] = []
    const populatedProfiles: PopulatedAuthorProfile[] = []

    for (const author of doc.authors) {
      try {
        const authorDoc = await payload.findByID({
          id: typeof author === "object" ? author?.id : author,
          collection: "users",
          depth: 2,
          overrideAccess: true,
        })

        if (authorDoc) {
          authorDocs.push(authorDoc)

          const teamRelation = authorDoc.teamMember

          let teamMember: Team | null = null

          if (teamRelation) {
            if (typeof teamRelation === "string") {
              try {
                teamMember = await payload.findByID({
                  collection: "team",
                  id: teamRelation,
                  depth: 2,
                  overrideAccess: true,
                })
              } catch {
                teamMember = null
              }
            } else {
              teamMember = teamRelation as Team
            }
          }

          const displayName = (() => {
            if (teamMember?.name) {
              return teamMember.name
            }

            const nameParts = [authorDoc.name, authorDoc.lastName].filter(Boolean)
            if (nameParts.length > 0) {
              return nameParts.join(" ")
            }

            if (authorDoc.username) {
              return authorDoc.username
            }

            return authorDoc.email || "Anonymous"
          })()

          populatedProfiles.push({
            id: teamMember?.id || authorDoc.id,
            name: displayName,
            lastName: teamMember ? null : authorDoc.lastName || null,
            user: authorDoc,
            teamMember,
          })
        }
      } catch {
        // swallow error
      }
    }

    if (authorDocs.length > 0) {
      // Populate the full author data for frontend use
      doc.authors = authorDocs

      // Also maintain the limited populatedAuthors field for backward compatibility
      doc.populatedAuthors = populatedProfiles
    }
  }

  return doc
}
