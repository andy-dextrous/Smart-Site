import { getSearchConfig } from "@/admin/config/features"
import { getSearchResults } from "@/admin/data/search"
import { Pagination } from "@/components/fields/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { notFound } from "next/navigation"

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[]
    page?: string | string[]
  }>
}

const ITEMS_PER_PAGE = 12

function parsePageParam(raw?: string): number {
  if (!raw) {
    return 1
  }

  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

function buildArchiveUri(query: string): string {
  if (!query) {
    return "/search"
  }

  const encoded = encodeURIComponent(query)
  return `/search?q=${encoded}`
}

function toSingleValue(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined
  }

  return Array.isArray(value) ? value[0] : value
}

export default async function SearchPage(props: SearchPageProps) {
  const searchFeature = getSearchConfig()

  if (!searchFeature.enabled || searchFeature.mode === "modal") {
    notFound()
  }

  const searchParams = (await props.searchParams) || {}

  const queryParam = toSingleValue(searchParams.q) || ""
  const pageParam = parsePageParam(toSingleValue(searchParams.page))

  const results = await getSearchResults({
    query: queryParam,
    page: pageParam,
    limit: ITEMS_PER_PAGE,
  })

  const archiveUri = buildArchiveUri(results.query)
  const hasResults = results.items.length > 0
  const shouldPromptForQuery = !results.hasQuery
  const hasSubmittedQuery = results.query.length > 0

  return (
    <main className="mt-nav px-section-x pb-section-xl pt-section-lg">
      <div className="max-w-container mx-auto flex flex-col gap-content-xl">
        <section className="flex flex-col gap-content-sm">
          <h1 className="text-h3 text-dark">Search</h1>
          <form action="/search" method="get" className="flex flex-col gap-content-sm">
            <Input
              type="search"
              name="q"
              defaultValue={results.query}
              placeholder="Search pages and posts"
              aria-label="Search"
            />
            <div className="flex items-center gap-content-sm">
              <Button type="submit">Search</Button>
              {hasSubmittedQuery ? (
                <Button type="button" variant="ghost" asChild>
                  <Link href="/search">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="flex flex-col gap-content-lg">
          {shouldPromptForQuery ? (
            <p className="text-dark-600 text-base">
              Enter at least two characters to see search suggestions.
            </p>
          ) : null}

          {results.hasQuery ? (
            hasResults ? (
              <div className="flex flex-col gap-content">
                <p className="text-dark-600 text-sm">
                  Showing {results.items.length} of {results.total} result
                  {results.total === 1 ? "" : "s"} for &ldquo;{results.query}&rdquo;
                </p>
                <ul className="flex flex-col gap-content">
                  {results.items.map(item => {
                    return (
                      <li
                        key={item.id}
                        className="border-dark-border bg-white flex flex-col gap-content-sm rounded-md border p-content-lg"
                      >
                        <div className="flex flex-col gap-content-xs">
                          <span className="text-xs uppercase tracking-[0.12em] text-dark-600">
                            {item.collectionLabel}
                          </span>
                          <Link
                            href={item.href}
                            className="text-h4 text-dark no-underline hover:underline"
                          >
                            {item.title}
                          </Link>
                        </div>
                        {item.description ? (
                          <p className="text-dark-600 text-base">{item.description}</p>
                        ) : null}
                        {item.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-content-xs">
                            {item.categories.map(category => {
                              if (!category.id) {
                                return null
                              }

                              return (
                                <span
                                  key={category.id}
                                  className="border-dark-border text-dark-600 rounded-full border px-content-xs py-control-xs text-xs"
                                >
                                  {category.title || "Category"}
                                </span>
                              )
                            })}
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>

                {results.totalPages > 1 ? (
                  <Pagination page={results.page} totalPages={results.totalPages} archiveUri={archiveUri} />
                ) : null}
              </div>
            ) : (
              <p className="text-dark-600 text-base">
                No results found for &ldquo;{results.query}&rdquo;. Try another keyword.
              </p>
            )
          ) : null}
        </section>
      </div>
    </main>
  )
}
