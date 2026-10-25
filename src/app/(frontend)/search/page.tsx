import { getSearchConfig } from "@/website/features"
import { getSearchResults } from "@/website/data/search"
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
      <div className="max-w-container gap-content-xl mx-auto flex flex-col">
        <section className="gap-content-sm flex flex-col">
          <h1 className="text-h3 text-dark">Search</h1>
          <form action="/search" method="get" className="gap-content-sm flex flex-col">
            <Input
              type="search"
              name="q"
              defaultValue={results.query}
              placeholder="Search pages and posts"
              aria-label="Search"
            />
            <div className="gap-content-sm flex items-center">
              <Button type="submit">Search</Button>
              {hasSubmittedQuery ? (
                <Button type="button" variant="ghost" asChild>
                  <Link href="/search">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="gap-content-lg flex flex-col">
          {shouldPromptForQuery ? (
            <p className="text-dark-600 text-base">
              Enter at least two characters to see search suggestions.
            </p>
          ) : null}

          {results.hasQuery ? (
            hasResults ? (
              <div className="gap-content flex flex-col">
                <p className="text-dark-600 text-sm">
                  Showing {results.items.length} of {results.total} result
                  {results.total === 1 ? "" : "s"} for &ldquo;{results.query}&rdquo;
                </p>
                <ul className="gap-content flex flex-col">
                  {results.items.map(item => {
                    return (
                      <li
                        key={item.id}
                        className="border-dark-border gap-content-sm p-content-lg flex flex-col rounded-md border bg-white"
                      >
                        <div className="gap-content-xs flex flex-col">
                          <span className="text-dark-600 text-xs tracking-[0.12em] uppercase">
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
                          <div className="gap-content-xs flex flex-wrap">
                            {item.categories.map(category => {
                              if (!category.id) {
                                return null
                              }

                              return (
                                <span
                                  key={category.id}
                                  className="border-dark-border text-dark-600 px-content-xs py-control-xs rounded-full border text-xs"
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
                  <Pagination
                    page={results.page}
                    totalPages={results.totalPages}
                    archiveUri={archiveUri}
                  />
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
