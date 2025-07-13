import type { User } from "@/payload/payload-types"

export const seedUser = (): Omit<User, "updatedAt" | "id" | "createdAt"> => {
  return {
    name: "Andrew",
    lastName: "Scrivens",
    role: "admin",
    email: "andrew@wildcreative.com.au",
    password: "Xp7#mK9@nV4$qW8!",
    username: "scrivo", // Simple alphanumeric username
    socialLinks: [],
    education: [],
    loginAttempts: 0,
    // Note: Avatar will be assigned after media creation
  }
}
