import type { ContactFormBlock } from "@/payload/payload-types"
import { SectionIntro } from "@/components/layout/section-intro"
import { CMSForm } from "@/payload/components/frontend/cms-form"

export const ContactFormComponent: React.FC<ContactFormBlock> = ({
  heading,
  description,
  form,
  variant,
}) => {
  return (
    <section className="side-border-dark">
      <SectionIntro heading={heading} description={description} />

      {form && (
        <div className="container-sm">
          <CMSForm form={form} variant={variant} />
        </div>
      )}
    </section>
  )
}
