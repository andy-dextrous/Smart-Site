export interface PayloadMeUser {
  id: string
  email: string
  name?: string
  avatar?: {
    url: string
    width: number
    height: number
    alt?: string
  }
  [key: string]: any
}

export interface PayloadAdminBarProps {
  id?: string
  adminPath?: string
  apiPath?: string
  authCollectionSlug?: string
  className?: string
  cmsURL?: string
  collectionLabels?: {
    plural: string
    singular: string
  }
  collectionSlug?: string
  devMode?: boolean
  onPreviewExit?: () => void
  preview?: boolean
}
