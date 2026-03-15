import type { NextRequest } from "next/server"

/*************************************************************************/
/*  REQUEST ORIGIN RESOLUTION
/*************************************************************************/

function pickHeaderValue(value: string | null): string | null {
  if (!value) {
    return null
  }

  const [firstValue] = value.split(",")
  const trimmedValue = firstValue?.trim()

  return trimmedValue || null
}

function getHostName(value: string | null) {
  if (!value) {
    return null
  }

  try {
    const hostUrl = new URL(`http://${value}`)
    return hostUrl.hostname
  } catch {
    return null
  }
}

function isLocalHost(value: string | null) {
  const hostName = getHostName(value)

  if (!hostName) {
    return false
  }

  return (
    hostName === "localhost" ||
    hostName === "127.0.0.1" ||
    hostName === "0.0.0.0" ||
    hostName === "::1"
  )
}

export function getRequestOrigin(request: NextRequest) {
  const publicOrigin = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
  const forwardedProto = pickHeaderValue(request.headers.get("x-forwarded-proto"))
  const forwardedHost = pickHeaderValue(request.headers.get("x-forwarded-host"))
  const host = forwardedHost || pickHeaderValue(request.headers.get("host")) || request.nextUrl.host
  const publicProtocol = (() => {
    try {
      return new URL(publicOrigin).protocol.replace(/:$/, "")
    } catch {
      return "http"
    }
  })()
  const protocol = forwardedProto || request.nextUrl.protocol.replace(/:$/, "") || publicProtocol

  if (host && !isLocalHost(host)) {
    return `${protocol}://${host}`
  }

  return publicOrigin
}

export function createRequestUrl(request: NextRequest, pathname: string) {
  return new URL(pathname, getRequestOrigin(request))
}
