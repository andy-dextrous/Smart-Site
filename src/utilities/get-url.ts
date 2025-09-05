export const getServerSideURL = () => {
  // Use environment variable or default
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
}

export const getClientSideURL = () => {
  // Use environment variable or default
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
}