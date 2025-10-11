import { buttonVariants } from "@/components/ui/button"

/*************************************************************************/
/*  BUTTON VARIANT UTILITIES FOR PAYLOAD FIELDS
/*
/*  Dynamically extracts variant options from the UI button component
/*  to keep CMS fields in sync with actual button variants
/*************************************************************************/

export interface ButtonVariantOptions {
  variantOptions: Array<{ label: string; value: string }>
  layoutOptions: Array<{ label: string; value: string }>
  sizeOptions: Array<{ label: string; value: string }>
}

/*************************************************************************/
/*  EXTRACT VARIANT OPTIONS FROM UI COMPONENT
/*************************************************************************/

function formatVariantLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
}

export function getButtonVariantOptions(): ButtonVariantOptions {
  const variants = buttonVariants.variants

  return {
    variantOptions: Object.keys(variants.variant || {}).map(key => ({
      label: formatVariantLabel(key),
      value: key,
    })),
    layoutOptions: Object.keys(variants.layout || {}).map(key => ({
      label: formatVariantLabel(key),
      value: key,
    })),
    sizeOptions: Object.keys(variants.size || {}).map(key => ({
      label: formatVariantLabel(key),
      value: key,
    })),
  }
}
