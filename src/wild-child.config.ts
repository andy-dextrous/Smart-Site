import { getServerSideURL } from "./utilities/getURL"

const url = getServerSideURL()

const wildChildConfig = {
  // Identity
  name: "Wild Child Official",
  description: "Wild Child Official App Starter",
  frontendUrl: url,
  logo: url + "/assets/logos/logo.svg",

  // Collections
  posts: {
    slug: "blog",
    collection: "posts",
  },

  // Libraries
  withColorTheme: false,
  withGSAP: false,
  smoothScroll: false,

  // Features
  i18n: false,
  withSearch: false,
}

export default wildChildConfig
