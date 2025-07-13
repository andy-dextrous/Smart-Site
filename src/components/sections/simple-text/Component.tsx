import RichText from "@/payload/components/frontend/rich-text"

/*************************************************************************/
/*  SIMPLE TEXT COMPONENT
/*************************************************************************/

interface SimpleTextBlockProps {
  content: any
}

export function SimpleTextComponent({ content }: SimpleTextBlockProps) {
  return (
    <section className="side-border-dark">
      <div className="container-sm">
        <RichText data={content} className="prose prose-xl lg:prose-2xl !max-w-none" />
      </div>
    </section>
  )
}
