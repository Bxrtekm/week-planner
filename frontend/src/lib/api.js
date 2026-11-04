export async function apiGet(path) {
  const response = await fetch(`/api${path}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}
