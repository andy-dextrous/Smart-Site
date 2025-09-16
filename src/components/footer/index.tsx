import LogoPrimary from "@/components/logos/logo"
import { getGlobal, getSettings } from "@/admin/data/globals"
import { CMSLink } from "@/components/fields/link"
import { SocialLinks } from "@/components/fields/social-links"
import type { Footer as FooterType, Setting } from "@/admin/payload/payload-types"
import Link from "next/link"

/*************************************************************************/
/*  FOOTER COMPONENT

Animate the container

Before
- translate: none; rotate: none; scale: none; transform-origin: 50% 100%; opacity: 0; transform: translate(0%, -50%) rotateX(-5deg);

After
- translate: none; rotate: none; scale: none; transform-origin: 50% 100%; opacity: 1; transform: translate(0px, 0px);
/*************************************************************************/

export async function Footer() {
  const [footerData, settingsData] = await Promise.all([
    getGlobal("footer" as never, 1),
    getSettings(),
  ])

  const footer = footerData as FooterType
  const settings = settingsData as Setting

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200">
      <div className="container px-8 py-16">
        {/* Logo Row */}
        <div className="pb-10">
          <Link href="/" className="block">
            <LogoPrimary className="h-10 w-auto" />
          </Link>
        </div>

        {/* Navigation Columns */}
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* CMS Menu Columns */}
          {footer?.menus?.map((menu, index) => (
            <div key={index}>
              <h3 className="mb-4 text-base font-semibold text-zinc-900">{menu.title}</h3>
              <ul className="space-y-3">
                {menu.menuItems?.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <CMSLink {...item.link} className="text-sm text-zinc-600 hover:text-zinc-900">
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
              <h3 className="mb-4 text-base font-semibold text-zinc-900">{location.country}</h3>
              <div className="space-y-2">
                {/* Address with Google Maps Link */}
                {location.street && (
                  <>
                    {location.googleMapsLink ? (
                      <a href={location.googleMapsLink} target="_blank" rel="noopener noreferrer" className="block text-sm text-zinc-600 hover:text-zinc-900">
                        <p>{location.street}</p>
                        {location.city && (
                          <p>
                            {location.city}
                            {location.zip && `, ${location.zip}`}
                          </p>
                        )}
                      </a>
                    ) : (
                      <>
                        <p className="text-sm text-zinc-600">{location.street}</p>
                        {location.city && (
                          <p className="text-sm text-zinc-600">
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
                  <a href={`tel:${location.phone}`} className="block text-sm text-zinc-600 hover:text-zinc-900">
                    {location.phone}
                  </a>
                )}

                {/* Email with mailto link */}
                {location.email && (
                  <a href={`mailto:${location.email}`} className="block text-sm text-zinc-600 hover:text-zinc-900">
                    {location.email}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col space-y-6 border-t border-zinc-200 pt-6 md:flex-row md:items-center md:justify-between md:space-y-0">
          {/* Left Side - Legal Links */}
          <div className="space-y-4">
            {footer?.legals && footer.legals.length > 0 && (
              <div className="flex flex-wrap justify-center gap-x-4 text-sm text-zinc-600 md:justify-start">
                {footer.legals.map((legal, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <CMSLink {...legal.link} className="hover:text-zinc-900">
                      {legal.link.label}
                    </CMSLink>
                    {index < footer.legals!.length - 1 && <span className="text-zinc-400">|</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center - Copyright */}
          <div className="text-center text-zinc-500">
            <p className="text-sm">
              © {new Date().getFullYear()}{" "}
              {settings?.general?.siteName || "smart-site.info"} | All Rights Reserved
            </p>
          </div>

          {/* Right Side - Social Icons */}
          <SocialLinks
            socialLinks={settings?.social?.socialLinks || []}
            variant="icon-button"
            className="justify-center md:justify-end"
          />
        </div>
      </div>
    </footer>
  )
}
