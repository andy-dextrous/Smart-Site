/**
 * Payload's MCP bridge returns an SSE response before the tool finishes. Next
 * snapshots pending cache invalidations when the route returns. Consume this
 * finite POST response first so completed saves and their invalidations are
 * included in that snapshot. MCP framing/status/headers remain unchanged.
 */
export async function settleMcpResponse(response: Response): Promise<Response> {
  if (!response.body) return response
  const body = await response.arrayBuffer()
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
