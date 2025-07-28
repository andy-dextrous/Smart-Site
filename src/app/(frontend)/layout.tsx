import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"
import { SmartSiteAdminBar } from "@/admin/payload/components/backend/admin-bar"
import { getSettings } from "@/admin/lib/data/globals"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import parse from "html-react-parser"
import Providers from "@/providers"
import React from "react"
import "./css/globals.css"

/*************************************************************************/
/*  ROOT LAYOUT
/*************************************************************************/

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  const { integrations } = settings

  /**
  /*  Get code in head and body end from settings
  */

  const gtmId = integrations?.googleTagManager
  const gaId = integrations?.googleAnalytics
  const head = integrations?.head
  const bodyEnd = integrations?.bodyEnd

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        {gtmId && <link href="https://www.googletagmanager.com" rel="preconnect" />}
        {gaId && <link href="https://www.google-analytics.com" rel="preconnect" />}
        <link rel="stylesheet" href="https://use.typekit.net/dhn4bxv.css" />
        {head && parse(head)}
      </head>

      <body>
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
        {gaId && <GoogleAnalytics gaId={gaId} />}

        <Providers>
          <SmartSiteAdminBar settings={settings} />
          <Header />
          <div id="smooth-wrapper">
            <div id="smooth-content">
              {children}
              <Footer />
            </div>
          </div>
          {bodyEnd && parse(bodyEnd)}
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata() {
  const settings = await getSettings()

  return {
    description: settings.general?.siteDescription || "Smart Site",
    title: settings.general?.siteName || "Smart Site",
  }
}
