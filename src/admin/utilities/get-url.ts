import canUseDOM from "./can-use-dom"

export const getServerSideURL = () => {
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
}

export const getClientSideURL = () => {
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
}
