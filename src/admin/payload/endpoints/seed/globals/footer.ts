type FooterArgs = {
  services?: any[]
}

export const footerGlobal = ({ services = [] }: FooterArgs = {}): Omit<
  any,
  "updatedAt" | "id" | "createdAt"
> => {
  // Find specific services by slug for reference links
  const strategyService = services.find(s => s.slug === "strategy")
  const technologyService = services.find(s => s.slug === "technology")
  const operationsService = services.find(s => s.slug === "operations")

  return {
    menus: [
      {
        title: "Services",
        menuItems: [
          {
            link: strategyService
              ? {
                  type: "reference",
                  newTab: false,
                  reference: {
                    relationTo: "services",
                    value: strategyService.id,
                  },
                  label: "Strategic Planning",
                }
              : {
                  type: "custom",
                  newTab: false,
                  url: "/services/strategy",
                  label: "Strategic Planning",
                },
          },
          {
            link: technologyService
              ? {
                  type: "reference",
                  newTab: false,
                  reference: {
                    relationTo: "services",
                    value: technologyService.id,
                  },
                  label: "Technology Solutions",
                }
              : {
                  type: "custom",
                  newTab: false,
                  url: "/services/technology",
                  label: "Technology Solutions",
                },
          },
          {
            link: operationsService
              ? {
                  type: "reference",
                  newTab: false,
                  reference: {
                    relationTo: "services",
                    value: operationsService.id,
                  },
                  label: "Operations",
                }
              : {
                  type: "custom",
                  newTab: false,
                  url: "/services/operations",
                  label: "Operations",
                },
          },
        ],
      },
      {
        title: "Company",
        menuItems: [
          {
            link: {
              type: "custom",
              newTab: false,
              url: "/about-us",
              label: "About Us",
            },
          },
          {
            link: {
              type: "custom",
              newTab: false,
              url: "/insights",
              label: "Insights",
            },
          },
          {
            link: {
              type: "custom",
              newTab: false,
              url: "/contact",
              label: "Contact",
            },
          },
        ],
      },
    ],
    legals: [
      {
        link: {
          type: "custom",
          newTab: false,
          url: "/privacy",
          label: "Privacy Policy",
        },
      },
      {
        link: {
          type: "custom",
          newTab: false,
          url: "/terms",
          label: "Terms of Service",
        },
      },
    ],
  }
}
