const components = {
  Nav: "@/components/cms/nav",
  actions: ["@/components/cms/actions"],
  views: {
    dashboard: {
      Component: "@/components/cms/dashboard#Dashboard",
      path: "/" as `/${string}`,
      exact: true,
    },
  },
  beforeLogin: ["@/components/cms/before-login#BeforeLogin"],
  graphics: {
    Icon: "@/components/cms/logo#Icon",
    Logo: "@/components/cms/logo#Logo",
  },
  providers: ["@/components/cms/providers/layout-provider#AdminLayoutProvider"],
}

export default components
