export const getServerSideURL = () => {
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
}

export const getClientSideURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
}
