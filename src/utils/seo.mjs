// Client-side SEO adjustments are progressive enhancements; each HTML page
// contains crawler-readable canonical, description, social tags and JSON-LD.
export function applyEditableSeo(config, { documentRef = document } = {}) {
  if (!config || typeof config !== 'object') return
  const title = String(config.seo_title || '').trim()
  const description = String(config.seo_description || '').trim()
  if (title) {
    documentRef.title = title
    for (const selector of ['meta[property="og:title"]','meta[name="twitter:title"]']) {
      const tag = documentRef.querySelector(selector)
      if (tag) tag.setAttribute('content', title)
    }
  }
  if (description) {
    for (const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']) {
      const tag = documentRef.querySelector(selector)
      if (tag) tag.setAttribute('content', description)
    }
  }
}
