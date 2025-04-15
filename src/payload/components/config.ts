const components = {
  Nav: "@/payload/components/nav",
  actions: ["@/payload/components/actions"],
  views: {
    dashboard: {
      Component: "@/payload/components/dashboard#Dashboard",
    },
  },
  beforeLogin: ["@/payload/components/before-login#BeforeLogin"],
  graphics: {
    Icon: "@/payload/components/logo#Icon",
    Logo: "@/payload/components/logo#Logo",
  },
}

export default components
