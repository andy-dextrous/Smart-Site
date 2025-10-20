import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"
import { SmartSiteAdminBar } from "@/admin/payload/components/backend/admin-bar"
import { getSettings } from "@/admin/data/globals"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import parse from "html-react-parser"
import Providers from "@/providers"
import React from "react"
import { AIProvider } from "@/admin/payload/components/providers/ai-provider"
import { getSmartSiteConfig } from "@/admin/config"
import { getI18nConfig } from "@/admin/config/features"
import { generateRootLayoutMetadata } from "./layout-metadata"

import "./css/globals.css"

/*************************************************************************/
/*  ROOT LAYOUT
/*************************************************************************/

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  const { integrations } = settings
  const smartSiteConfig = getSmartSiteConfig()
  const i18n = getI18nConfig()
  const smoothScrollEnabled = Boolean(smartSiteConfig.gsap.scrollSmoother)
  /**
  /*  Get code in head and body end from settings
  */

  const gtmId = integrations?.googleTagManager
  const gaId = integrations?.googleAnalytics
  const head = integrations?.head
  const bodyEnd = integrations?.bodyEnd

  return (
    <html lang={i18n.defaultLocale} suppressHydrationWarning>
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

        <AIProvider withContainer={false}>
          <Providers enableDarkMode={smartSiteConfig.features.darkMode}>
            <SmartSiteAdminBar settings={settings} />
            <Header />
            {smoothScrollEnabled ? (
              <div id="smooth-wrapper">
                <div id="smooth-content">
                  {children}
                  <Footer />
                </div>
              </div>
            ) : (
              <>
                {children}
                <Footer />
              </>
            )}
            {bodyEnd && parse(bodyEnd)}
          </Providers>
        </AIProvider>
      </body>
    </html>
  )
}

export async function generateMetadata() {
  return await generateRootLayoutMetadata()
}
