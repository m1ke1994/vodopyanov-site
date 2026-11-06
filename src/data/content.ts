import { reactive, ref } from 'vue';
import { applyKnownFields, cmsSections, cmsPoems, cmsSongs, cmsContacts, mediaUrl } from '../utils/tracknode-cms.mjs';

export type Poem={id:string;title:string;theme:string;publishedAt?:string;demo?:boolean;lines:string[]};
export type Song={id:string;title:string;theme:string;publishedAt?:string;demo?:boolean;notes:number[];audioSrc?:string};
// Даты демонстрационные. Для настоящих работ указывайте дату публикации YYYY-MM-DD.
export const author=reactive({name:'Александр Водопьянов',role:'Автор песен и стихов',bio:'У каждого чувства есть свой голос. У каждой тишины — свои слова.',email:'',telegram:'@A1exdr56',portrait_image:'/images/portrait.webp'});
export const poems=reactive<Poem[]>([{id:'lit-window',publishedAt:'2026-10-15',demo:true,title:'Пока горит окно',theme:'О близости',lines:['Пока горит окно на той стороне,','У ночи есть причина быть светлее.','И город, засыпая в тишине,','Кого-то ждёт. И оттого теплее.']},{id:'distance',publishedAt:'2026-10-10',demo:true,title:'На расстоянии',theme:'О любви',lines:['Меж нами — города и поезда,','Но расстояние не измеряют вёрстами.','Ты просто оставайся. Иногда','Достаточно, что мы под теми ж звёздами.']},{id:'quiet-shore',publishedAt:'2026-10-01',demo:true,title:'Тихий берег',theme:'О себе',lines:['Я возвращаюсь к берегу реки,','Где время не торопится случиться.','И все мои несказанные строки','Ложатся на ладони, словно птицы.']}]);
export const songs=reactive<Song[]>([{id:'after-midnight',publishedAt:'2026-10-14',demo:true,title:'После полуночи',theme:'Ночной город',notes:[220,261.63,329.63,293.66]},{id:'where-you-are',publishedAt:'2026-10-07',demo:true,title:'Там, где ты',theme:'Близость',notes:[196,246.94,293.66,369.99]},{id:'warm-wind',publishedAt:'2026-09-28',demo:true,title:'Тёплый ветер',theme:'Дорога',notes:[174.61,220,261.63,349.23]}]);

// Контакты автора.
export const contacts=reactive([
 {label:'Telegram',caption:'@A1exdr56',href:'https://t.me/A1exdr56'},
 {label:'ВКонтакте',caption:'vk.ru/positiveactive',href:'https://vk.ru/positiveactive'},
 {label:'Email',caption:'Для сотрудничества',href:''}
]);

export const hero = reactive({
  first_name:'Александр', last_name:'Водопьянов',
  subtitle_first:'Стихи обретают голос.', subtitle_second:'Песни обретают смысл.',
  intro_label:'МЕЖДУ СТРОК / АВТОРСКИЙ МИР',
})
export const word = reactive({
  title:'Всё начинается', accent:'с одной строки.',
  text_first:'Иногда она становится стихотворением.', text_second:'Иногда — песней.',
})
export const about = reactive({
  headline_first:'Чувствовать.', headline_second:'Находить', headline_accent:'слова.',
  note_first:'Разные темы.', note_second:'Одно желание — быть услышанным.',
})
export const poetry = reactive({
  title:'То, что говорят', accent:'шёпотом.',
  description_first:'О близости и расстояниях.', description_second:'О том, что остаётся внутри.',
})
export const music = reactive({
  title:'Когда словам', accent:'нужны крылья.',
  description_first:'Истории, которые хочется', description_second:'услышать ещё раз.',
})
export const outro = reactive({title:'Песня заканчивается.', accent:'Слова остаются.'})
export const contactCopy = reactive({
  title:'Услышим', accent:'друг друга.',
  description_first:'Для творческого сотрудничества,',
  description_second:'новых песен и простых человеческих слов.',
})
export const cmsRevision = ref(0)
export function applyCmsBundle(bundle: unknown): boolean {
  const sections = cmsSections(bundle)
  if (!sections) return false
  applyKnownFields(hero, sections.hero, ['first_name','last_name','subtitle_first','subtitle_second','intro_label'])
  applyKnownFields(word, sections.word, ['title','accent','text_first','text_second'])
  applyKnownFields(about, sections.about, ['headline_first','headline_second','headline_accent','note_first','note_second'])
  applyKnownFields(author, sections.about, ['name','role','bio','portrait_image'])
  author.portrait_image = mediaUrl(author.portrait_image) || '/images/portrait.webp'
  applyKnownFields(poetry, sections.poems, ['title','accent','description_first','description_second'])
  applyKnownFields(music, sections.songs, ['title','accent','description_first','description_second'])
  applyKnownFields(outro, sections.outro, ['title','accent'])
  applyKnownFields(contactCopy, sections.contacts, ['title','accent','description_first','description_second'])
  const newPoems = cmsPoems(sections.poems?.items)
  if (newPoems) poems.splice(0, poems.length, ...newPoems)
  const newSongs = cmsSongs(sections.songs?.items)
  if (newSongs) songs.splice(0, songs.length, ...newSongs)
  const newContacts = cmsContacts(sections.contacts?.items)
  if (newContacts) contacts.splice(0, contacts.length, ...newContacts)
  cmsRevision.value += 1
  return true
}
