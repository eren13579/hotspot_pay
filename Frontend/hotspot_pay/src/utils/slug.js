const SLUG_STORAGE_KEY = 'hotspot_slug_map'

function slugify(text) {
  if (!text) return 'hotspot'
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'hotspot'
}

export function makeHotspotSlug(hotspot) {
  const id = hotspot.hotspot_id ?? hotspot.id
  if (!id) return ''
  const name = slugify(hotspot.name)
  const prefix = id.replace(/-/g, '').slice(0, 8)
  return `${name}-${prefix}`
}

export function resolveHotspotSlug(slug) {
  const map = JSON.parse(sessionStorage.getItem(SLUG_STORAGE_KEY) || '{}')
  if (map[slug]) return map[slug]
  const lastDash = slug.lastIndexOf('-')
  return lastDash !== -1 ? slug.slice(lastDash + 1) : slug
}

export function storeSlugMapping(slug, id) {
  const map = JSON.parse(sessionStorage.getItem(SLUG_STORAGE_KEY) || '{}')
  map[slug] = id
  sessionStorage.setItem(SLUG_STORAGE_KEY, JSON.stringify(map))
}
