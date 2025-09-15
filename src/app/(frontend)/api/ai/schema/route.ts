import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const m = authHeader.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

function isAuthorized(req: Request): boolean {
  const token = extractBearerToken(req.headers.get("Authorization"))
  return !!token && token === process.env.AI_AGENT_API_KEY
}

function readFileSafe(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf8")
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const base = path.join(process.cwd(), "public", ".well-known", "smartsite")
  const sdlPath = path.join(base, "schema.graphql")
  const jsonPath = path.join(base, "schema.json")
  const verPath = path.join(base, "schema.version")

  const sdl = readFileSafe(sdlPath)
  const json = readFileSafe(jsonPath)
  const ver = readFileSafe(verPath)

  if (!sdl || !json) {
    return Response.json(
      {
        error: "Schema not generated",
        hint: "Run pnpm --filter @product-studio/smart-site run generate:graphql:schema (or build) to generate",
      },
      { status: 503 }
    )
  }

  const schemaVersion = (ver || crypto.createHash("sha256").update(sdl).digest("hex")).substring(0, 12)
  const etag = `W/"${schemaVersion}"`

  const ifNoneMatch = request.headers.get("if-none-match")
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  }

  const body = {
    siteId: process.env.AI_AGENT_USER_ID || null,
    siteUrl: process.env.NEXT_PUBLIC_URL || null,
    schemaVersion,
    generatedAt: new Date().toISOString(),
    sdl,
    introspection: JSON.parse(json),
  }

  return Response.json(body, {
    headers: {
      ETag: etag,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}

