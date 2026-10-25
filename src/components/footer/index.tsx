import LogoPrimary from "@/components/logos/logo"
import { getGlobal, getSettings } from "@/website/data/globals"
import { CMSLink } from "@/components/fields/link"
import { SocialLinks } from "@/components/fields/social-links"
import type { Footer as FooterType, Setting } from "@/payload-types"
import Link from "next/link"

/*************************************************************************/
/*  FOOTER COMPONENT
/*************************************************************************/

export async function Footer() {
  const [footerData, settingsData] = await Promise.all([
    getGlobal("footer" as never, 1),
    getSettings(),
  ])

  const footer = footerData as FooterType
  const settings = settingsData as Setting

  return (
    <footer className="border-dark-border bg-neutral text-dark px-section-x py-section-lg border-t">
      <div className="container">
        {/* Logo Row */}
        <div className="pb-content-xl">
          <Link href="/" className="block">
            <LogoPrimary className="h-logo w-auto" />
          </Link>
        </div>

        {/* Navigation Columns */}
        <div className="mb-section-sm gap-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* CMS Menu Columns */}
          {footer?.menus?.map((menu, index) => (
            <div key={index}>
              <h5 className="mb-content-sm text-dark">{menu.title}</h5>
              <ul className="gap-content-xs flex flex-col">
                {menu.menuItems?.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <CMSLink {...item.link} className="text-dark-600 hover:text-dark">
                      {item.link.label}
                    </CMSLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Office Locations from Settings */}
          {settings?.locations?.locations?.map((location, index) => (
            <div key={`location-${index}`}>
              <h5 className="mb-content-sm text-dark">{location.country}</h5>
              <div className="gap-content-sm flex flex-col">
                {/* Address with Google Maps Link */}
                {location.street && (
                  <>
                    {location.googleMapsLink ? (
                      <a
                        href={location.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dark-600 hover:text-dark block"
                      >
                        <p>{location.street}</p>
                        {location.city && (
                          <p className="text-dark-600">
                            {location.city}
                            {location.zip && `, ${location.zip}`}
                          </p>
                        )}
                      </a>
                    ) : (
                      <>
                        <p className="text-dark-600">{location.street}</p>
                        {location.city && (
                          <p className="text-dark-600">
                            {location.city}
                            {location.zip && `, ${location.zip}`}
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Phone with tel link */}
                {location.phone && (
                  <a
                    href={`tel:${location.phone}`}
                    className="text-dark-600 hover:text-dark block"
                  >
                    {location.phone}
                  </a>
                )}

                {/* Email with mailto link */}
                {location.email && (
                  <a
                    href={`mailto:${location.email}`}
                    className="text-dark-600 hover:text-dark block"
                  >
                    {location.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="gap-content border-dark-border pt-content flex flex-col border-t md:flex-row md:items-center md:justify-between">
          {/* Left Side - Legal Links */}
          <div className="gap-content-sm flex flex-col">
            {footer?.legals && footer.legals.length > 0 && (
              <div className="gap-content-sm text-dark-600 flex flex-wrap justify-center text-sm md:justify-start">
                {footer.legals.map((legal, index) => (
                  <div key={index} className="gap-content-sm flex items-center">
                    <CMSLink {...legal.link} className="hover:text-dark">
                      {legal.link.label}
                    </CMSLink>
                    {index < footer.legals!.length - 1 && (
                      <span className="text-dark-600/60">|</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center - Copyright */}
          <div className="text-dark-600 text-center">
            <p className="text-dark-600 text-sm">
              © {new Date().getFullYear()}{" "}
              {settings?.general?.siteName || "smart-site.info"} | All Rights Reserved
            </p>
          </div>

          {/* Right Side - Social Icons */}
          <SocialLinks
            socialLinks={settings?.social?.socialLinks || []}
            variant="icon-button"
            className="[&>a]:border-dark-border [&>a]:text-dark-600 [&>a]:hover:border-dark [&>a]:hover:text-dark justify-center md:justify-end"
          />
        </div>
      </div>
    </footer>
  )
}
