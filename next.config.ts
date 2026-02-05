import { withPayload } from "@payloadcms/next/withPayload"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import redirects from "./redirects.js"
import { NextConfig } from "next"

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

// Get monorepo root dynamically
const configFilename = fileURLToPath(import.meta.url)
const configDirname = path.dirname(configFilename)

function resolveMonorepoRoot(startDir: string): string {
  let currentDir = startDir
  const filesystemRoot = path.parse(currentDir).root

  while (currentDir !== filesystemRoot) {
    const workspaceFile = path.join(currentDir, "pnpm-workspace.yaml")

    if (fs.existsSync(workspaceFile)) {
      return currentDir
    }

    currentDir = path.dirname(currentDir)
  }

  return startDir
}

const monorepoRoot = resolveMonorepoRoot(configDirname)

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
  devIndicators: false,
  reactStrictMode: true,
  redirects,
  sassOptions: {
    implementation: "sass-embedded",
    quietDeps: true,
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
  serverExternalPackages: [
    "@mastra/*",
    "@payloadcms/db-postgres",
    "@payloadcms/db-vercel-postgres",
    "@payloadcms/drizzle",
    "@esbuild/*",
    "drizzle-kit",
    "esbuild",
    "jsdom",
    "sharp",
  ],
} as NextConfig

export default withPayload(nextConfig, { devBundleServerPackages: false })
