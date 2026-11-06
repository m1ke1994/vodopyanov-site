import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyEditableSeo } from '../src/utils/seo.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')
const pages = [
  ['index.html', 'https://stariy-site.ru/'],
  ['poems.html', 'https://stariy-site.ru/poems.html'],
  ['songs.html', 'https://stariy-site.ru/songs.html'],
]
const titles = new Set()
for (const [file, canonical] of pages) {
  const html = read(file)
  assert.ok(html.includes('<html lang="ru">'), file + ' missing language')
  assert.ok(html.includes('rel="canonical" href="' + canonical + '"'), file + ' wrong canonical')
  assert.ok(html.includes('rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=20261106-2"'))
    assert.ok(html.includes('rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=20261106-2"'))
    assert.ok(html.includes('rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=20261106-2"'))
  assert.ok(html.includes('property="og:url" content="' + canonical + '"'))
  for (const field of ['name="description"', 'property="og:title"', 'property="og:description"',
    'property="og:image"', 'name="twitter:card"', 'name="robots"', 'application/ld+json'])
    assert.ok(html.includes(field), file + ' missing ' + field)
  const title = html.match(/<title>(.*?)<\/title>/)?.[1]
  assert.ok(title && !titles.has(title), file + ' nonunique SEO title')
  titles.add(title)
  const schema = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
  const graph = JSON.parse(schema)['@graph']
  assert.ok(graph.some(item => item['@type'] === 'WebSite'), file + ' missing WebSite')
  assert.ok(graph.some(item => item['@type'] === 'Person'), file + ' missing Person')
  if (file !== 'index.html') assert.ok(graph.some(item => item['@type'] === 'CollectionPage'))
}
const favicon = readFileSync(resolve(root,'public/favicon.ico'))
assert.equal(favicon.readUInt16LE(0),0)
assert.equal(favicon.readUInt16LE(2),1)
assert.ok(favicon.readUInt16LE(4)>=2)
for(const size of [16,32]){
  const raw=readFileSync(resolve(root,'public/favicon-'+size+'.png'))
  assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
  assert.equal(raw.readUInt32BE(16),size)
  assert.equal(raw.readUInt32BE(20),size)
}
const sitemap = read('public/sitemap.xml')
const robots = read('public/robots.txt')
for(const [,url] of pages) assert.ok(sitemap.includes('<loc>'+url+'</loc>'))
assert.ok(robots.includes('Sitemap: https://stariy-site.ru/sitemap.xml'))
const css = read('src/style.css')
assert.ok(css.includes('--reader-serif:Literata,Georgia,serif'))
assert.ok(css.includes('font-size:clamp(18px,1.65vw,22px)'))
const catalog=read('src/components/Catalog.vue')
for (const field of ['page.heading_start','page.heading_accent','page.intro','page.sort_label','page.empty_message','page.footer_link'])
  assert.ok(catalog.includes(field),'Missing CMS catalog field '+field)
const mock = new Map()
const fakeDoc = {
  title:'before',
  querySelector: selector => ({setAttribute:(name,value)=>mock.set(selector+':'+name,value)}),
}
applyEditableSeo({seo_title:'Новое название',seo_description:'Новое описание'}, {documentRef:fakeDoc})
assert.equal(fakeDoc.title,'Новое название')
assert.equal(mock.get('meta[name="description"]:content'),'Новое описание')
assert.equal(mock.get('meta[property="og:title"]:content'),'Новое название')
console.log('SEO, favicon, typography and catalog CMS tests passed')
