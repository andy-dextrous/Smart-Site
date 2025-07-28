import { inputVariants } from "@/components/ui/input"

/*************************************************************************/
/*  FORM VARIANT UTILITIES FOR PAYLOAD FIELDS
/*
/*  Dynamically extracts variant options from the UI form components
/*  to keep CMS fields in sync with actual form variants
/*************************************************************************/

export interface FormVariantOptions {
  variantOptions: Array<{ label: string; value: string }>
}

/*************************************************************************/
/*  EXTRACT VARIANT OPTIONS FROM UI COMPONENT
/*************************************************************************/

function formatVariantLabel(key: string): string {
  // Convert "form-white" to "White", "form-dark" to "Dark", etc.
  if (key.startsWith("form-")) {
    return (
      key.replace("form-", "").charAt(0).toUpperCase() + key.replace("form-", "").slice(1)
    )
  }
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
}

export function getFormVariantOptions(): FormVariantOptions {
  const variants = inputVariants.variants

  // Filter to only form-specific variants
  const formVariants = Object.keys(variants.variant || {})
    .filter(key => key.startsWith("form-"))
    .map(key => ({
      label: formatVariantLabel(key),
      value: key.replace("form-", ""), // Store as "white", "dark", etc.
    }))

  return {
    variantOptions: formVariants,
  }
}

/*************************************************************************/
/*  DEFAULT FORM VALUES
/*************************************************************************/

export const defaultFormProps = {
  variant: "white",
  enableIntro: false,
}

export function createDefaultForm(overrides: Record<string, any> = {}) {
  return {
    ...defaultFormProps,
    ...overrides,
  }
}
