import { applyCmsBundle } from './data/content'
import { cmsSections, TRACKNODE_BASE } from './utils/tracknode-cms.mjs'

export async function loadEditableContent() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    let response
    try {
      response = await fetch(TRACKNODE_BASE + '/api/sites/vodopyanov/', {
        credentials: 'omit',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      })
    } finally {
      clearTimeout(timeout)
    }
    if (!response.ok) return false
    const bundle = await response.json()
    if (!cmsSections(bundle)) return false
    return applyCmsBundle(bundle)
  } catch {
    // The previously bundled content stays available if the API is offline.
    return false
  }
}
