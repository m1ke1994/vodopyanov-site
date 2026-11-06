// Validate the expected site and normalize editable CMS data before applying it.
export const TRACKNODE_BASE = 'https://tracknode.ru'
const KEYS = ['hero','word','about','poems','songs','outro','contacts','catalog-poems','catalog-songs','home-seo']
export function cmsSections(bundle) {
  const site = bundle?.site
  const domain = String(site?.domain || '').trim().toLowerCase().replace(/^www\./, '')
  if (site?.slug !== 'vodopyanov' || domain !== 'stariy-site.ru' || site?.is_active === false) return null
  if (!Array.isArray(bundle.sections)) return null
  const sections = {}
  for (const section of bundle.sections) {
    if (!KEYS.includes(section?.key) || section?.is_active === false) continue
    if (section?.content && typeof section.content === 'object' && !Array.isArray(section.content))
      sections[section.key] = section.content
  }
  return sections
}
export function applyKnownFields(target, content, fields) {
  if (!content || typeof content !== 'object') return
  for (const field of fields)
    if (typeof content[field] === 'string') target[field] = content[field]
}
export function mediaUrl(value) {
  const path = String(value || '').trim()
  if (!path) return ''
  if (path.startsWith('/media/')) return TRACKNODE_BASE + path
  if (path.startsWith('/') && !path.startsWith('//')) return path
  try {
    const url = new URL(path)
    if (url.protocol === 'https:') return url.href
  } catch {}
  return ''
}
export function contactHref(value) {
  const raw = String(value || '').trim()
  if (/^(mailto:|tel:)/i.test(raw)) return raw
  try {
    const url = new URL(raw)
    if (url.protocol === 'https:') return url.href
  } catch {}
  return ''
}
export function cmsPoems(items) {
  if (!Array.isArray(items)) return null
  const ids = new Set()
  return items.filter(item => item && typeof item === 'object').map((item,index) => {
    const requested = String(item.id || '').trim()
    const id = requested && !ids.has(requested) ? requested : 'poem-' + index
    ids.add(id)
    return {
      id, title:String(item.title || ''), theme:String(item.theme || ''),
      publishedAt:String(item.publishedAt || ''), demo:item.demo === true,
      lines:String(item.lines ?? '').split(/\r?\n/),
    }
  })
}
export function cmsSongs(items) {
  if (!Array.isArray(items)) return null
  const ids = new Set()
  return items.filter(item => item && typeof item === 'object').map((item,index) => {
    const requested = String(item.id || '').trim()
    const id = requested && !ids.has(requested) ? requested : 'song-' + index
    ids.add(id)
    const notes = String(item.notes || '').split(',').map(Number).filter(n => Number.isFinite(n) && n > 20 && n < 8000)
    return {
      id, title:String(item.title || ''), theme:String(item.theme || ''),
      publishedAt:String(item.publishedAt || ''), demo:item.demo === true,
      audioSrc:mediaUrl(item.audioSrc),
      notes:notes.length ? notes : [220,261.63,329.63,293.66],
    }
  })
}
export function cmsContacts(items) {
  if (!Array.isArray(items)) return null
  return items.filter(item => item && typeof item === 'object').map(item => ({
    label:String(item.label || ''), caption:String(item.caption || ''), href:contactHref(item.href),
  }))
}
