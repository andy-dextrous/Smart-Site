import RichText from "@/components/fields/rich-text"
import { cn } from "@/utilities/ui"

/*************************************************************************/
/*  CONTENT COMPONENT (ALIAS OF SIMPLE TEXT)
/*************************************************************************/

interface ContentBlockProps {
  content: any
}

export function ContentComponent({ content }: ContentBlockProps) {
  return (
    <section>
      <div className="container-sm">
        <div className={cn("prose mx-auto max-w-3xl")}>
          <RichText data={content} variant="prose" />
        </div>
      </div>
    </section>
  )
}
