import { withPayload } from "@payloadcms/next/withPayload"

import redirects from "./redirects.js"
import { NextConfig } from "next"

const NEXT_PUBLIC_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

const nextConfig = {
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_URL].map(item => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(":", ""),
        }
      }),
      {
        hostname: "picsum.photos",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
  redirects,
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      })
    )

    return config
  },
} as NextConfig

export default withPayload(nextConfig, { devBundleServerPackages: false })
