const components = {
  Nav: "@/admin/payload/components/backend/nav",
  actions: ["@/admin/payload/components/backend/actions"],
  views: {
    dashboard: {
      Component: "@/admin/payload/components/backend/dashboard#Dashboard",
    },
  },
  beforeLogin: ["@/admin/payload/components/backend/before-login#BeforeLogin"],
  graphics: {
    Icon: "@/admin/payload/components/backend/logo#Icon",
    Logo: "@/admin/payload/components/backend/logo#Logo",
  },
  providers: [
    "@/admin/payload/components/providers/ai-provider#AIProvider",
    "@/admin/payload/components/providers/layout-provider#AILayoutProvider",
  ],
}

export default components
