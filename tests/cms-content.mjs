import assert from 'node:assert/strict'
import { cmsSections,cmsPoems,cmsSongs,cmsContacts,mediaUrl,contactHref,applyKnownFields } from '../src/utils/tracknode-cms.mjs'
const section = (key,content) => ({key,is_active:true,content})
const site = {slug:'vodopyanov',domain:'stariy-site.ru',is_active:true}
const bundle = {site,sections:[
  section('about',{name:'Новый автор',bio:'Обновлённый текст',portrait_image:'/media/sites/7/about/portrait.webp'}),
  section('poems',{items:[{id:'new-poem',title:'Новый стих',theme:'Лирика',demo:false,lines:'Строка 1\nСтрока 2',publishedAt:'2026-11-06'}]}),
  section('songs',{items:[{id:'new-song',title:'Новая песня',theme:'Музыка',audioSrc:'https://cdn.example.org/music.mp3',notes:'220,261.63'}]}),
  section('contacts',{items:[{label:'Почта',caption:'Связаться',href:'mailto:hello@example.org'}]}),
]}
assert.deepEqual(Object.keys(cmsSections(bundle)), ['about','poems','songs','contacts'])
assert.equal(cmsSections({...bundle,site:{...site,slug:'tracknode'}}),null)
assert.equal(cmsSections({...bundle,site:{...site,domain:'evil.example'}}),null)
assert.equal(cmsSections({...bundle,site:{...site,is_active:false}}),null)
assert.equal(cmsSections({...bundle,sections:'invalid'}),null)
const parsed = cmsSections(bundle)
assert.deepEqual(cmsPoems(parsed.poems.items)[0].lines,['Строка 1','Строка 2'])
assert.equal(cmsSongs(parsed.songs.items)[0].audioSrc,'https://cdn.example.org/music.mp3')
assert.deepEqual(cmsSongs([{title:'Демо',notes:''}])[0].notes,[220,261.63,329.63,293.66])
assert.equal(cmsContacts(parsed.contacts.items)[0].href,'mailto:hello@example.org')
assert.equal(mediaUrl('/media/sites/7/about/portrait.webp'),'https://tracknode.ru/media/sites/7/about/portrait.webp')
assert.equal(mediaUrl('/images/portrait.webp'),'/images/portrait.webp')
assert.equal(mediaUrl('javascript:alert(1)'),'')
assert.equal(contactHref('javascript:alert(1)'),'')
assert.equal(contactHref('http://unsafe.example'),'')
assert.deepEqual(cmsPoems([]),[])
assert.deepEqual(cmsContacts([]),[])
const target = {name:'старое',role:'автор'}
applyKnownFields(target,{name:'новое',role:123},['name','role'])
assert.deepEqual(target,{name:'новое',role:'автор'})
console.log('Vodopyanov live editable CMS data tests passed')
