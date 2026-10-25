const components = {
  Nav: "@/admin/components/nav",
  actions: ["@/admin/components/actions"],
  views: {
    dashboard: {
      Component: "@/admin/components/dashboard#Dashboard",
      path: "/" as `/${string}`,
      exact: true,
    },
  },
  beforeLogin: ["@/admin/components/before-login#BeforeLogin"],
  graphics: {
    Icon: "@/admin/components/logo#Icon",
    Logo: "@/admin/components/logo#Logo",
  },
  providers: ["@/admin/providers/layout-provider#AdminLayoutProvider"],
}

export default components
