import React from "react"
import { Inter } from "next/font/google"
import Providers from "@/providers"

import "./css/globals.css"
import { AdminBar } from "@/payload/components/admin-bar"
import { draftMode } from "next/headers"
import { Header } from "@/payload/globals/header/component"
import { Footer } from "@/payload/globals/footer/Component"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata = {
  description: "Wild Child Official App Starter",
  title: "Wild Child Official App Starter",
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { isEnabled } = await draftMode()

  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
