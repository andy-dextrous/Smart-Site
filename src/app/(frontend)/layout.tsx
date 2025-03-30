import React from "react"
import "./css/globals.css"
import { Inter } from "next/font/google"
import Providers from "@/providers"

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

  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
