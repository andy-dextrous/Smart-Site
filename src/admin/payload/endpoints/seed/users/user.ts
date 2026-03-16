import type { User } from "@/admin/payload/payload-types"

export const seedUser = (): Omit<User, "updatedAt" | "id" | "createdAt"> => {
  const email = process.env.PAYLOAD_ADMIN_EMAIL!
  const username = email.split("@")[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || "admin"

  return {
    name: process.env.PAYLOAD_ADMIN_NAME || "Admin",
    lastName: "",
    role: "developer",
    email,
    password: process.env.PAYLOAD_ADMIN_PASSWORD!,
    username,
    loginAttempts: 0,
    // Note: Avatar will be assigned after media creation
  }
}
