import { withPayload } from "@payloadcms/next/withPayload"
import path from "path"
import { fileURLToPath } from "url"
import redirects from "./redirects.js"
import { NextConfig } from "next"

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

// Get monorepo root dynamically
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const monorepoRoot = path.resolve(__dirname, "../..")

const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
  },
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
  devIndicators: false,
  reactStrictMode: true,
  redirects,
  sassOptions: {
    silenceDeprecations: ["import", "global-builtin", "legacy-js-api"],
  },
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
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
  serverExternalPackages: ["@mastra/*", "sharp"],
} as NextConfig

export default withPayload(nextConfig, { devBundleServerPackages: false })
