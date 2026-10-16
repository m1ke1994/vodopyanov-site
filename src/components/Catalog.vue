<script setup lang="ts">
import {computed,ref,watch,nextTick,onUnmounted} from 'vue';
import {poems,songs,type Poem,type Song} from '../data/content';
import {sortCatalog,formatDate} from '../utils/catalog.mjs';
const props=defineProps<{kind:'poems'|'songs'}>();
const isPoems=props.kind==='poems';
const order=ref('newest'),limit=ref(12),selected=ref<Poem|null>(null),dialog=ref<HTMLDialogElement|null>(null),playing=ref<string|null>(null);
const works=computed(()=>sortCatalog(isPoems?poems:songs,order.value));
const visibleWorks=computed(()=>works.value.slice(0,limit.value));
watch(order,()=>{limit.value=12});
watch(selected,async(value)=>{await nextTick();if(value){dialog.value?.showModal();document.body.style.overflow='hidden'}else{dialog.value?.close();document.body.style.overflow=''}});
let ctx:AudioContext|undefined,timer:ReturnType<typeof setInterval>|undefined,gain:GainNode|undefined;
function stopDemo(){if(timer)clearInterval(timer);timer=undefined;if(ctx&&gain)gain.gain.setTargetAtTime(0,ctx.currentTime,.1);playing.value=null}
async function playDemo(song:Song){if(playing.value===song.id){stopDemo();return}stopDemo();document.querySelectorAll('audio').forEach(a=>a.pause());ctx??=new AudioContext();await ctx.resume();gain=ctx.createGain();gain.gain.value=.5;gain.connect(ctx.destination);playing.value=song.id;let n=0;const sound=()=>{if(!ctx||!gain||!song.notes.length)return;const oscillator=ctx.createOscillator(),envelope=ctx.createGain();oscillator.frequency.value=song.notes[n++%song.notes.length];envelope.gain.setValueAtTime(.05,ctx.currentTime);envelope.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+2);oscillator.connect(envelope);envelope.connect(gain);oscillator.start();oscillator.stop(ctx.currentTime+2)};sound();timer=setInterval(sound,850)}
function nativePlay(event:Event){stopDemo();document.querySelectorAll('audio').forEach(a=>{if(a!==event.target)a.pause()})}
function read(work:Poem){selected.value=work}
function nextPoem(){if(!selected.value)return;const i=works.value.findIndex(p=>p.id===selected.value?.id);selected.value=works.value[(i+1)%works.value.length] as Poem}
onUnmounted(()=>{stopDemo();ctx?.close();document.body.style.overflow=''});
</script>
<template>
<div class="catalog-page">
<header class="catalog-header"><a class="wordmark" href="/">АВ<span>Александр Водопьянов</span></a><nav aria-label="Навигация каталога"><a href="/">Главная</a><a href="/poems.html" :aria-current="isPoems?'page':undefined">Стихи</a><a href="/songs.html" :aria-current="!isPoems?'page':undefined">Песни</a></nav></header>
<main class="catalog-main"><a href="/" class="catalog-back">← Вернуться к истории</a><div class="scene-caption">МЕЖДУ СТРОК / {{isPoems?'ПОЭЗИЯ':'МУЗЫКА'}}</div><h1>Все <em>{{isPoems?'стихи.':'песни.'}}</em></h1><p class="catalog-intro">{{isPoems?'Строки о близости, расстояниях и внутреннем мире.':'Истории, которые обретают голос.'}}</p>
<div class="catalog-toolbar"><p role="status" aria-live="polite">Всего работ: {{works.length}}</p><label>По дате публикации<select v-model="order"><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option></select></label></div>
<div v-if="works.length" class="catalog-list">
<article v-for="(work,i) in visibleWorks" :key="work.id" class="catalog-work"><div class="catalog-index">{{String(i+1).padStart(2,'0')}}</div><div class="catalog-work-body"><div class="catalog-meta"><span>{{work.theme}}</span><time v-if="work.publishedAt" :datetime="work.publishedAt">{{formatDate(work.publishedAt)}}</time><span v-else>Дата не указана</span></div><h2>{{work.title}}</h2><p v-if="isPoems" class="catalog-excerpt">{{(work as Poem).lines.slice(0,2).join('\n')}}</p><span v-if="work.demo" class="catalog-demo">{{isPoems?'Демонстрационный текст и дата':'Звуковой эскиз · демонстрационная дата'}}</span><audio v-if="!isPoems&&(work as Song).audioSrc" :src="(work as Song).audioSrc" controls preload="none" @play="nativePlay" :aria-label="work.title"></audio></div><button v-if="isPoems" class="catalog-action" @click="read(work as Poem)" :aria-label="'Читать '+work.title">Читать <span>↗</span></button><button v-else-if="!(work as Song).audioSrc" class="catalog-action" @click="playDemo(work as Song)" :aria-pressed="playing===work.id">{{playing===work.id?'Остановить':'Слушать демо'}} <span>{{playing===work.id?'Ⅱ':'▷'}}</span></button></article>
</div><p v-else class="catalog-empty">Здесь скоро появятся {{isPoems?'стихи':'песни'}} автора.</p>
<div class="catalog-more"><span>Показано {{visibleWorks.length}} из {{works.length}}</span><button v-if="limit<works.length" class="view-all" @click="limit+=12">Показать ещё <span>↓</span></button></div>
<p v-if="works.some(w=>w.demo)" class="footnote">Работы с пометкой «демо» и их даты — примеры для макета. Звуковые демо синтезированы без вокала.</p>
<footer class="catalog-footer"><span>Александр Водопьянов<br><small>Автор песен и стихов</small></span><a :href="isPoems?'/songs.html':'/poems.html'">{{isPoems?'Перейти к песням':'Перейти к стихам'}} ↗</a></footer><a class="site-credit" href="https://tracknode.ru" aria-label="Сайт разработан TrackNode — перейти на tracknode.ru">by <span>TrackNode</span></a>
</main>
<dialog ref="dialog" class="poem-dialog" aria-label="Чтение стихотворения" @click="selected=null" @cancel.prevent="selected=null" @close="selected=null"><article v-if="selected" @click.stop><button class="close" @click="selected=null">Закрыть ×</button><div class="scene-caption">{{selected.theme}} / {{formatDate(selected.publishedAt)}}</div><h2>{{selected.title}}</h2><p v-for="(line,i) in selected.lines" :key="i">{{line||'\u00a0'}}</p><small v-if="selected.demo">Демонстрационный текст и дата</small><button v-if="works.length>1" class="next-poem" @click="nextPoem">Следующее стихотворение →</button></article></dialog>
</div>
</template>
