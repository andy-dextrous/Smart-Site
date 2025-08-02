import type { ContactFormBlock } from "@/admin/payload/payload-types"
import { SectionIntro } from "@/components/fields/section-intro"
import { CMSForm } from "@/components/fields/form"

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
