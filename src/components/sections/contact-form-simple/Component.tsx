import type { Form } from "@/admin/payload/payload-types"
import { CMSForm } from "@/components/fields/form"

/*************************************************************************/
/*  CONTACT FORM SIMPLE - COMPONENT
/*************************************************************************/

interface ContactFormSimpleProps {
  form: Form | string | null
}

export function ContactFormSimpleComponent({ form }: ContactFormSimpleProps) {
  return (
    <section>
      <div className="container-sm">
        <CMSForm form={form as any} variant="white" />
      </div>
    </section>
  )
}

