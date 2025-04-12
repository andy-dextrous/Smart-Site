import React from "react"
import { Inter } from "next/font/google"
import Providers from "@/providers"

import "./css/globals.css"
import { AdminBar } from "@/payload/components/admin-bar"
import { draftMode } from "next/headers"
import { Header } from "@/payload/globals/header/component"
import { Footer } from "@/payload/globals/footer/Component"
import { GoogleTagManager } from "@next/third-parties/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import { getSettings } from "@/lib/queries/globals"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export async function generateMetadata() {
  const settings = await getSettings()

  return {
    description: settings.general?.siteDescription || "",
    title: settings.general?.siteName || "",
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { isEnabled } = await draftMode()
  const { integrations } = await getSettings()

  const gtmId = integrations?.googleTagManager
  const gaId = integrations?.googleAnalytics
  const beforeBody = integrations?.beforeBody
  const afterBody = integrations?.afterBody

  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        {/* {beforeBody && <script>{beforeBody}</script>} */}
      </head>
      <body>
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <Header />
          <main>{children}</main>
          <Footer />

          {/* {afterBody && <script>{afterBody}</script>} */}
        </Providers>
      </body>
    </html>
  )
}
