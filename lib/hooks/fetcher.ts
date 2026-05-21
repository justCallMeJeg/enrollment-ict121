export const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new Error(body?.error ?? `Request failed: ${r.status}`)
  }
  return r.json()
}
