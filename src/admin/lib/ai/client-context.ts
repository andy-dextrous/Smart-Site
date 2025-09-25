export interface SmartSiteClientContextUser {
	id?: string
	displayName?: string
	email?: string
	roles?: string[]
}

export interface SmartSiteClientContextSurface {
	scope?: "admin" | "frontend"
	pathname?: string
}

export interface SmartSiteClientContextSelection {
	collection?: string
	documentId?: string
	fieldPath?: string
}

export interface SmartSiteClientContextThread {
	id?: string
}

export interface SmartSiteClientContextRequest {
	id?: string
	timestamp?: number
}

export interface SmartSiteClientContext {
	user?: SmartSiteClientContextUser | null
	surface?: SmartSiteClientContextSurface | null
	selection?: SmartSiteClientContextSelection | null
	thread?: SmartSiteClientContextThread | null
	request?: SmartSiteClientContextRequest | null
}

