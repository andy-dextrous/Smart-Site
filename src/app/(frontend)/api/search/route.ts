import { NextResponse } from "next/server"
import { getSearchConfig } from "@/lib/features"
import { getSearchResults } from "@/lib/data/search"

function parseInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    return fallback
  }

  return parsed
}

export async function GET(request: Request) {
  console.log("[search-api] incoming request", {
    url: request.url,
  })

  const searchFeature = getSearchConfig()

  if (!searchFeature.enabled) {
    console.log("[search-api] feature disabled")

    return NextResponse.json(
      {
        items: [],
        page: 1,
        total: 0,
        totalPages: 0,
        query: "",
        hasQuery: false,
        enabled: false,
      },
      { status: 200 }
    )
  }

  const url = new URL(request.url)
  const searchParams = url.searchParams
  const query = searchParams.get("q") ?? undefined
  const limit = Math.max(1, Math.min(parseInteger(searchParams.get("limit"), 20), 50))
  const page = Math.max(1, parseInteger(searchParams.get("page"), 1))

  console.log("[search-api] resolved params", {
    query,
    limit,
    page,
  })

  const result = await getSearchResults({
    query,
    limit,
    page,
  })

  console.log("[search-api] result summary", {
    total: result.total,
    totalPages: result.totalPages,
    page: result.page,
    returned: result.items.length,
    query: result.query,
    hasQuery: result.hasQuery,
  })

  return NextResponse.json(
    {
      items: result.items,
      page: result.page,
      total: result.total,
      totalPages: result.totalPages,
      query: result.query,
      hasQuery: result.hasQuery,
      enabled: true,
    },
    { status: 200 }
  )
}
