const components = {
  Nav: "@/payload/components/backend/nav",
  actions: ["@/payload/components/backend/actions"],
  views: {
    dashboard: {
      Component: "@/payload/components/backend/dashboard#Dashboard",
    },
  },
  beforeLogin: ["@/payload/components/backend/before-login#BeforeLogin"],
  graphics: {
    Icon: "@/payload/components/backend/logo#Icon",
    Logo: "@/payload/components/backend/logo#Logo",
  },
}

export default components
