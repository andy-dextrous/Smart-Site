const components = {
  Nav: "@/payload/components/backend/nav",
  actions: ["@/payload/components/backend/actions"],
  views: {
    myCustomView: {
      Component: "@/payload/components/backend/views/my-custom-view",
      path: "/my-custom-view" as const,
    },
    dashboard: {
      Component: "@/payload/components/backend/dashboard#Dashboard",
    },
  },
  beforeLogin: ["@/payload/components/backend/before-login#BeforeLogin"],
  graphics: {
    Icon: "@/payload/components/backend/logo#Icon",
    Logo: "@/payload/components/backend/logo#Logo",
  },
  providers: [
    "@/payload/components/providers/ai-provider#AIProvider",
    "@/payload/components/providers/layout-provider#AILayoutProvider",
  ],
}

export default components
