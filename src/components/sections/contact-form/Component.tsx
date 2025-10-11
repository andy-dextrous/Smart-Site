import type { ContactFormBlock } from "@/admin/payload/payload-types"
import { Section } from "@/components/fields/section"
import { CMSForm } from "@/components/fields/form"
import RichText from "@/components/fields/rich-text"
import { cn } from "@/utilities/ui"

type ContactFormLayout = "split" | "stacked"

interface ExtendedContactFormBlock extends ContactFormBlock {
  layout?: ContactFormLayout
}

export function ContactFormComponent(props: ContactFormBlock) {
  const {
    supportingContent,
    layout = "split",
    form,
    variant = "white",
    sectionSettings,
  } = props as ExtendedContactFormBlock

  const hasSupportingContent =
    supportingContent && supportingContent !== null && supportingContent !== undefined

  const containerLayoutClass =
    layout === "split" && hasSupportingContent
      ? "grid gap-12 md:grid-cols-2 md:items-start"
      : "flex flex-col gap-10"

  return (
    <Section sectionSettings={sectionSettings} containerClassName="space-y-10">
      <div className={containerLayoutClass}>
        {hasSupportingContent ? (
          <div className="prose prose-lg max-w-none text-dark-600">
            <RichText data={supportingContent} enableGutter={false} textColor="inherit" />
          </div>
        ) : null}

        <div className="rounded-2xl border border-dark-border bg-white p-6 shadow-sm md:p-8">
          <CMSForm form={form as any} variant={variant as any} />
        </div>
      </div>
    </Section>
  )
}
