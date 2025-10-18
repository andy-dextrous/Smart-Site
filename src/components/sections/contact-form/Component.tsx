import type { ContactFormBlock } from "@/admin/payload/payload-types"
import { Section } from "@/components/fields/section"
import { CMSForm } from "@/components/fields/form"
import RichText from "@/components/fields/rich-text"
import { tv } from "tailwind-variants"

const contactFormVariants = tv({
  slots: {
    container: "flex flex-col gap-content-lg",
    layout: "",
    supporting: "flex flex-col gap-content text-pretty",
    formWrapper: "rounded-2xl border border-dark-border bg-white p-content-lg shadow-sm",
  },
  variants: {
    layout: {
      split: {
        layout: "grid gap-grid-lg md:grid-cols-2 md:items-start",
        supporting: "md:pr-content",
      },
      stacked: {
        layout: "flex flex-col gap-content-lg",
      },
    },
    tone: {
      light: {
        supporting: "text-dark-600",
      },
      neutral: {
        supporting: "text-dark-600",
      },
      dark: {
        supporting: "text-white/80",
      },
    },
  },
  defaultVariants: {
    layout: "split",
    tone: "light",
  },
})

export function ContactFormComponent(props: ContactFormBlock) {
  const { supportingContent, layout, form, sectionSettings } = props

  const hasSupportingContent = Boolean(supportingContent)
  const resolvedLayout = hasSupportingContent ? layout ?? "split" : "stacked"
  const tone =
    sectionSettings?.colorScheme === "dark"
      ? "dark"
      : sectionSettings?.colorScheme === "neutral"
        ? "neutral"
        : "light"

  const { container, layout: layoutSlot, supporting, formWrapper } = contactFormVariants({
    layout: resolvedLayout,
    tone,
  })

  const containerClassName = container()
  const layoutClassName = layoutSlot()
  const supportingClassName = supporting()
  const formWrapperClassName = formWrapper()

  return (
    <Section sectionSettings={sectionSettings} containerClassName={containerClassName}>
      <div className={layoutClassName}>
        {hasSupportingContent ? (
          <RichText
            data={supportingContent!}
            enableGutter={false}
            textColor="inherit"
            className={supportingClassName}
          />
        ) : null}

        <div className={formWrapperClassName}>
          <CMSForm form={form} />
        </div>
      </div>
    </Section>
  )
}
