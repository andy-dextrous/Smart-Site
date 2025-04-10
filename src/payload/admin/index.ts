import path from "path"
import { fileURLToPath } from "url"
import { Users } from "../collections/users"
import components from "../components"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const admin = {
  user: Users.slug,
  importMap: {
    baseDir: path.resolve(dirname),
  },
  autoLogin: {
    email: "andrew@wildcreative.com.au",
    password: "K@fe3xpress",
    prefillOnly: false,
  },
  components,
  meta: {
    title: "Admin | Wild Child",
    description: "The best admin panel in the world",
    icons: [
      {
        rel: "icon",
        type: "image/png",
        url: "/favicon.png",
      },
    ],
  },
  livePreview: {
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
}

export default admin
