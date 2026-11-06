// TrackNode is optional. The cinematic site loads normally even when the API is offline.
const TRACKNODE_BASE = 'https://tracknode.ru'
const SITE_SLUG = 'vodopyanov'
const SITE_DOMAIN = 'stariy-site.ru'
const CONSENT_KEY = 'vodopyanov:tracknode-consent:v1'

export function validSiteBundle(payload) {
  const site = payload?.site
  const domain = String(site?.domain || '').trim().toLowerCase().replace(/^www\./, '')
  return site?.slug === SITE_SLUG &&
    domain === SITE_DOMAIN &&
    site?.is_active !== false &&
    typeof site?.tracker_key === 'string' &&
    site.tracker_key.length > 10
}

export async function enableTrackNode({ fetchImpl = fetch, documentRef = document } = {}) {
  if (documentRef.querySelector('script[data-vodopyanov-tracknode]')) return true
  const response = await fetchImpl(`${TRACKNODE_BASE}/api/sites/${SITE_SLUG}/`, {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('TrackNode site is not registered yet')
  const payload = await response.json()
  if (!validSiteBundle(payload)) throw new Error('TrackNode site configuration mismatch')
  const script = documentRef.createElement('script')
  script.src = `${TRACKNODE_BASE}/tracker.js`
  script.async = true
  script.dataset.siteKey = payload.site.tracker_key
  script.dataset.siteSlug = SITE_SLUG
  script.dataset.vodopyanovTracknode = 'true'
  documentRef.head.appendChild(script)
  return true
}

function consentChoice() {
  try { return localStorage.getItem(CONSENT_KEY) } catch { return null }
}

function saveConsent(choice) {
  try { localStorage.setItem(CONSENT_KEY, choice) } catch { /* consent remains per page */ }
}

export function initTrackNodeAnalytics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const selected = consentChoice()
  if (selected === 'essential') return
  if (selected === 'analytics') {
    enableTrackNode().catch(() => { /* Nonessential tracking must not break the site. */ })
    return
  }

  const panel = document.createElement('aside')
  panel.className = 'tn-analytics-consent'
  panel.setAttribute('aria-label', 'Настройки аналитики')
  const description = document.createElement('p')
  description.textContent = 'Разрешить необязательную аналитику TrackNode? Она помогает понять, какие страницы посещают читатели. Без вашего согласия аналитика не запускается.'
  const choices = document.createElement('div')
  choices.className = 'tn-analytics-consent__actions'
  function action(label, value) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', () => {
      saveConsent(value)
      panel.remove()
      if (value === 'analytics') enableTrackNode().catch(() => {})
    })
    return button
  }
  choices.append(action('Только необходимые', 'essential'), action('Разрешить', 'analytics'))
  panel.append(description, choices)
  document.body.appendChild(panel)
}
