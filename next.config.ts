import { withPayload } from "@payloadcms/next/withPayload"

import redirects from "./redirects.js"
import { NextConfig } from "next"

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

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
      {
        hostname: "logoipsum.com",
        protocol: "https",
      },
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
  redirects,
  sassOptions: {
    silenceDeprecations: ["import", "global-builtin", "legacy-js-api"],
  },
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
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
