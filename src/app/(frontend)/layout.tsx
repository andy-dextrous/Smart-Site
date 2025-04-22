import Providers from "@/providers"
import { Inter } from "next/font/google"
import React from "react"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { getSettings } from "@/lib/queries/globals"
import { getCurrentUser } from "@/lib/queries/user"
import { WildChildAdminBar } from "@/payload/components/admin-bar"
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"
import parse from "html-react-parser"
import { draftMode } from "next/headers"
import "./css/globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export async function generateMetadata() {
  const settings = await getSettings()

  return {
    description: settings.general?.siteDescription || "Wild Child",
    title: settings.general?.siteName || "Wild Child",
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { isEnabled } = await draftMode()
  const { integrations } = await getSettings()

  /*******************************************************/
  /* Get Site Settings
  /*******************************************************/

  const gtmId = integrations?.googleTagManager
  const gaId = integrations?.googleAnalytics
  const head = integrations?.head
  const bodyEnd = integrations?.bodyEnd

  const isLoggedIn = await getCurrentUser()

  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        {gtmId && <link href="https://www.googletagmanager.com" rel="preconnect" />}
        {gaId && <link href="https://www.google-analytics.com" rel="preconnect" />}
        {head && parse(head)}
      </head>

      <body className={isLoggedIn ? "relative !pt-[32px]" : ""}>
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <Providers>
          <WildChildAdminBar preview={isEnabled} />

          <Header />
          {children}
          <Footer />

          {bodyEnd && parse(bodyEnd)}
        </Providers>
      </body>
    </html>
  )
}
