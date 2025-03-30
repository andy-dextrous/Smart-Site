import { getServerSideURL } from "./utilities/getURL"

const url = getServerSideURL()

const wildChildConfig = {
  name: "Wild Child Official",
  description: "Wild Child Official App Starter",
  frontendUrl: url,
  logo: url + "/assets/logos/logo.svg",
  withColorTheme: false,
  smoothScroll: false,
  i18n: false,
  withSearch: false,
}

export default wildChildConfig
