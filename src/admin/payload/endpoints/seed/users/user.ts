import type { User } from "@/admin/payload/payload-types"

export const seedUser = (): Omit<User, "updatedAt" | "id" | "createdAt"> => {
  return {
    name: "Andrew",
    lastName: "Scrivens",
    role: "admin",
    email: process.env.PAYLOAD_ADMIN_EMAIL!,
    password: process.env.PAYLOAD_ADMIN_PASSWORD!,
    username: "scrivo", // Simple alphanumeric username
    socialLinks: [],
    education: [],
    loginAttempts: 0,
    // Note: Avatar will be assigned after media creation
  }
}
