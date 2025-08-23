type HeaderArgs = {
  services?: any[]
}

export const headerGlobal = ({ services = [] }: HeaderArgs = {}): Omit<
  any,
  "updatedAt" | "id" | "createdAt"
> => {
  const strategyService = services.find(s => s.slug === "strategy")
  const technologyService = services.find(s => s.slug === "technology")
  const operationsService = services.find(s => s.slug === "operations")

  return {
    navItems: [
      {
        item: {
          link: {
            type: "custom",
            newTab: false,
            url: "/about-us",
            label: "About Us",
          },
          subItems: [],
        },
      },
      {
        item: {
          link: {
            type: "custom",
            newTab: false,
            url: "/services",
            label: "Services",
          },
          hasDropdown: true,
          subItems: [
            {
              child: {
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
                subItems: [],
              },
            },
            {
              child: {
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
                subItems: [],
              },
            },
            {
              child: {
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
                subItems: [],
              },
            },
          ],
        },
      },
      {
        item: {
          link: {
            type: "custom",
            newTab: false,
            url: "/insights",
            label: "Insights",
          },
          subItems: [],
        },
      },
      {
        item: {
          link: {
            type: "custom",
            newTab: false,
            url: "/contact",
            label: "Contact",
          },
          hasDropdown: false,
          subItems: [],
        },
      },
    ],
  }
}
