import { cn } from "@/utilities/ui"
import RichText from "@/components/fields/rich-text"

/*************************************************************************/
/*  HERO SIMPLE COMPONENT
/*************************************************************************/

interface HeroSimpleBlockProps {
  heading: string
  content?: any
  align?: "left" | "center"
}

export function HeroSimpleComponent({ heading, content, align = "center" }: HeroSimpleBlockProps) {
  return (
    <section className="side-border-dark bg-zinc-50 pt-nav min-h-[60vh] flex items-center border-b border-zinc-200">
      <div className={cn("container-sm text-balance w-full", align === "center" ? "text-center" : "text-left")}>
        <h1 className={cn("text-3xl font-bold tracking-tight md:text-5xl text-zinc-900", align === "center" ? "mx-auto" : undefined)}>
          {heading}
        </h1>
        {content ? (
          <div className={cn("mx-auto mt-6 max-w-3xl", align === "center" ? "text-center" : "text-left")}>
            <RichText data={content} variant="prose" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
