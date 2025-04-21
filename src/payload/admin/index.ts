import path from "path"
import { fileURLToPath } from "url"
import { Users } from "@/payload/collections/users"
import components from "@/payload/components/config"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const admin = {
  user: Users.slug,
  suppressHydrationWarning: true,
  importMap: {
    baseDir: path.resolve(dirname),
  },
  theme: "dark" as const,
  autoLogin:
    process.env.NODE_ENV === "development"
      ? {
          email: process.env.PAYLOAD_ADMIN_EMAIL!,
          password: process.env.PAYLOAD_ADMIN_PASSWORD!,
          prefillOnly: false,
        }
      : undefined,
  components,
  meta: {
    title: "Admin | Wild Child",
    description: "Advanced admin panel for high-performance websites",
    icons: [
      {
        rel: "icon",
        type: "image/png",
        url: "/favicon.png",
      },
    ],
  },
  livePreview: {
    collections: ["pages", "posts", "services"],
    globals: ["header", "footer"],
    url: "http://localhost:3000",
    breakpoints: [
      {
        label: "Mobile",
        name: "mobile",
        width: 375,
        height: 667,
      },
      {
        label: "Tablet",
        name: "tablet",
        width: 768,
        height: 1024,
      },
      {
        label: "Desktop",
        name: "desktop",
        width: 1440,
        height: 900,
      },
    ],
  },
  // avatar: {
  //   Component: "@/payload/components/avatar#Avatar",
  // },
  avatar: {
    Component: "@/payload/components/avatar#Avatar",
  },
}

export default admin
