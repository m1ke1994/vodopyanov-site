import assert from 'node:assert/strict'
import { validSiteBundle, enableTrackNode } from '../src/tracknode-analytics.mjs'

const site = { slug: 'vodopyanov', domain: 'stariy-site.ru', is_active: true, tracker_key: 'a-test-key-with-more-than-ten-characters' }
assert.equal(validSiteBundle({ site }), true)
assert.equal(validSiteBundle({ site: { ...site, slug: 'tracknode' } }), false)
assert.equal(validSiteBundle({ site: { ...site, domain: 'another-site.ru' } }), false)
assert.equal(validSiteBundle({ site: { ...site, is_active: false } }), false)
assert.equal(validSiteBundle({ site: { ...site, tracker_key: '' } }), false)

const added = []
const fakeDocument = {
  querySelector: () => null,
  createElement: () => ({ dataset: {} }),
  head: { appendChild: script => added.push(script) },
}
const ok = await enableTrackNode({
  fetchImpl: async () => ({ ok: true, json: async () => ({ site }) }),
  documentRef: fakeDocument,
})
assert.equal(ok, true)
assert.equal(added.length, 1)
assert.equal(added[0].src, 'https://tracknode.ru/tracker.js')
assert.equal(added[0].dataset.siteKey, site.tracker_key)
assert.equal(added[0].dataset.siteSlug, site.slug)
await assert.rejects(() => enableTrackNode({
  fetchImpl: async () => ({ ok: true, json: async () => ({ site: { ...site, domain: 'wrong.ru' } }) }),
  documentRef: fakeDocument,
}), /configuration mismatch/)
console.log('Vodopyanov isolated TrackNode analytics checks passed')
