import { websiteCollections } from "./collection-metadata"
export type { WebsiteCollection as FrontendCollection } from "./collection-metadata"
export async function getFrontendCollections() {
  const { default: config } = await import("@payload-config")
  return websiteCollections(await config)
}
export async function isFrontendCollection(slug: string) {
  return (await getFrontendCollections()).some(item => item.slug === slug)
}
export function getArchivePageFieldName(collection: string) {
  return `${collection}ArchivePage`
}
export function getTemplateFieldName(collection: string) {
  return collection === "pages" ? "pagesDefaultTemplate" : `${collection}SingleTemplate`
}
export function getSettingsFieldValue(settings: any, name: string): string | undefined {
  const value = settings?.routing?.[name]
  return typeof value === "string" ? value : value?.id
}
export function getTemplateIdFromSettings(settings: any, collection: string) {
  return getSettingsFieldValue(settings, getTemplateFieldName(collection))
}
