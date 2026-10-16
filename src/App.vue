<script setup lang="ts">
import {ref,onMounted,onUnmounted,watch,nextTick,defineAsyncComponent,computed} from 'vue';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {author,poems,songs,contacts} from './data/content';
import {sortCatalog,formatDate} from './utils/catalog.mjs';
const latestPoems=computed(()=>sortCatalog(poems).slice(0,3));
const latestSongs=computed(()=>sortCatalog(songs).slice(0,3));
gsap.registerPlugin(ScrollTrigger);
const CinematicStage=defineAsyncComponent(()=>import('./components/CinematicStage.vue'));
const stageReady=ref(false),opening=ref(0),loadStage=ref(false);
let cancelStageLoad=()=>{};
const chapter=ref(0),progress=ref(0),menu=ref(false),selected=ref<number|null>(null),sound=ref(false),playing=ref(-1),ready=ref(false);
const poetryDialog=ref<HTMLDialogElement|null>(null);
watch(selected,async(value)=>{await nextTick();if(value!==null){poetryDialog.value?.showModal();document.body.style.overflow='hidden'}else{poetryDialog.value?.close();document.body.style.overflow=''}});
const chapters=['Тишина','Слово','Автор','Стихи','Песни','Послесловие','Контакт'];
const audioError=ref('');
let fileAudio:HTMLAudioElement|undefined;
let ctx:AudioContext|undefined,master:GainNode|undefined,timer:ReturnType<typeof setInterval>|undefined,tick=0;
function stop(){if(fileAudio){fileAudio.pause();fileAudio.removeAttribute('src');fileAudio=undefined}if(timer)clearInterval(timer);timer=undefined;playing.value=-1;if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.2)}
function tone(freq:number,duration=3,volume=.045){if(!ctx||!master)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(volume,ctx.currentTime+.1);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+duration)}
async function initAudio(){ctx??=new AudioContext();await ctx.resume();if(!master){master=ctx.createGain();master.connect(ctx.destination)}master.gain.setTargetAtTime(.7,ctx.currentTime,.2)}
async function play(i:number){if(playing.value===i){stop();return}stop();audioError.value='';sound.value=false;if(songs[i].audioSrc){fileAudio=new Audio(songs[i].audioSrc);fileAudio.onended=()=>stop();fileAudio.onerror=()=>{stop();audioError.value='Не удалось загрузить запись.'};playing.value=i;try{await fileAudio.play()}catch{stop();audioError.value='Не удалось воспроизвести запись.'}return}await initAudio();playing.value=i;tick=0;const step=()=>{tone(songs[i].notes[tick++%4]);tone(songs[i].notes[(tick+1)%4]/2,4,.025)};step();timer=setInterval(step,850)}
async function ambience(){if(sound.value){sound.value=false;stop();return}stop();await initAudio();sound.value=true;tone(110,8,.03);tone(164.81,8,.018);timer=setInterval(()=>{tone(110,8,.03);tone(164.81,8,.018)},6000)}
function go(i:number){menu.value=false;const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';if(i===0){window.scrollTo({top:0,behavior});return}document.querySelectorAll('main section')[i]?.scrollIntoView({behavior})}
function key(e:KeyboardEvent){if(e.key==='Escape'){selected.value=null;menu.value=false}}
let scope:gsap.Context;
onMounted(()=>{
 ready.value=true;window.addEventListener('keydown',key);
 const idleWindow=window as Window&{requestIdleCallback?:(callback:()=>void,options:{timeout:number})=>number;cancelIdleCallback?:(id:number)=>void};
 let idleId:number|undefined,timeoutId:ReturnType<typeof setTimeout>|undefined;
 const paint=requestAnimationFrame(()=>{if(idleWindow.requestIdleCallback){idleId=idleWindow.requestIdleCallback(()=>{loadStage.value=true},{timeout:1200})}else{timeoutId=setTimeout(()=>{loadStage.value=true},120)}});
 cancelStageLoad=()=>{cancelAnimationFrame(paint);if(idleId!==undefined)idleWindow.cancelIdleCallback?.(idleId);if(timeoutId!==undefined)clearTimeout(timeoutId)};
 scope=gsap.context(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){opening.value=1;gsap.set('.theatre-curtains',{display:'none'});}
  else{
   gsap.set('.stage-world .mic',{left:'50%'});
   const overture=gsap.timeline({onUpdate:()=>{opening.value=overture.progress()},defaults:{ease:'none'},scrollTrigger:{trigger:'.intro',start:'top top',end:'+=65%',pin:true,scrub:.55,anticipatePin:1,invalidateOnRefresh:true}});
   overture.to('.curtain-left',{xPercent:-103,duration:.86,ease:'sine.inOut'},.04)
    .to('.curtain-right',{xPercent:103,duration:.86,ease:'sine.inOut'},.04)
    .to('.curtain-valance',{yPercent:-110,opacity:0,duration:.65,ease:'sine.inOut'},.08)
    .to('.hero-title',{opacity:0,y:-24,duration:.28},.12)
    .to('.intro-label,.vertical-note',{opacity:0,duration:.24},.2)
    .to('.theatre-curtains',{opacity:0,duration:.1},.9);
  }
  ScrollTrigger.create({trigger:'main',start:'top top',end:'bottom bottom',onUpdate:s=>{progress.value=s.progress;void 0}});
  gsap.utils.toArray<HTMLElement>('main section').forEach((el,i)=>{
   ScrollTrigger.create({trigger:el,start:'top 55%',end:'bottom 55%',onEnter:()=>chapter.value=i,onEnterBack:()=>chapter.value=i});
   if(!reduced) gsap.fromTo(el.querySelectorAll('.reveal'),{opacity:0,y:45},{opacity:1,y:0,stagger:.09,scrollTrigger:{trigger:el,start:'top 85%',end:'top 25%',scrub:1}});
  });
  if(reduced)return;
  // The WebGL camera follows progress; keep a modest CSS fallback for older devices.
  gsap.to('.stage-world',{scale:1.12,xPercent:-2,rotation:1.5,ease:'sine.inOut',scrollTrigger:{trigger:'main',start:'top top',end:'bottom bottom',scrub:1.2}});
  gsap.to('.stage-world .mic',{left:'64%',ease:'sine.inOut',scrollTrigger:{trigger:'main',start:'8% top',end:'30% top',scrub:1.4}});
  gsap.to('.author-photo img',{yPercent:10,scale:1.16,ease:'none',scrollTrigger:{trigger:'.author-photo',start:'top bottom',end:'bottom top',scrub:1}});
  gsap.utils.toArray<HTMLElement>('.poem-card').forEach((card,i)=>gsap.to(card,{y:i===1?-40:20,ease:'none',scrollTrigger:{trigger:'.poem-grid',start:'top bottom',end:'bottom top',scrub:1}}));
 });
});
onUnmounted(()=>{cancelStageLoad();scope?.revert();stop();ctx?.close();document.body.style.overflow='';window.removeEventListener('keydown',key)});
</script>

<template>
<div class="experience" :class="{ready}" :data-chapter="chapter">
<div class="cinema" :class="{'has-webgl':stageReady}" aria-hidden="true"><div class="stage-world"><div class="back-wall"></div><div class="light-beam"></div><div class="light-beam second"></div><div class="curtain"></div><div class="floor"></div><div class="halo"></div><div class="mic"><div class="mic-depth"><div class="mic-head"></div><div class="mic-arm"></div><div class="mic-pole"></div><div class="mic-foot"></div></div></div><div class="city"><i v-for="n in 24" :key="n" :style="{'--n':n}"></i></div><div class="dust"><i v-for="n in 25" :style="{'--n':n}" :key="n"></i></div></div><CinematicStage v-if="loadStage" :suspended="menu||selected!==null" :progress="progress" :opening="opening" @ready="stageReady=true"/><div class="vignette"></div><div class="scene-blackout"></div><div class="theatre-curtains"><div class="curtain-panel curtain-left"></div><div class="curtain-panel curtain-right"></div><div class="curtain-valance"></div></div><div class="grain"></div></div>
<header><a href="#" class="wordmark" @click.prevent="go(0)">АВ<span>Александр Водопьянов</span></a><nav class="desktop-nav" aria-label="Главная навигация"><button @click="go(2)">Автор</button><button @click="go(3)">Стихи</button><button @click="go(4)">Песни</button><button @click="go(6)">Контакт</button></nav><div class="header-right"><button class="sound" @click="ambience" :aria-pressed="sound"><span class="bars" :class="{active:sound||playing>=0}"><i></i><i></i><i></i><i></i></span>Звук {{sound?'вкл':'выкл'}}</button><button class="menu-toggle" @click="menu=!menu" :aria-expanded="menu">{{menu?'Закрыть':'Содержание'}} <span>{{menu?'−':'+'}}</span></button></div></header>
<nav v-if="menu" class="contents" aria-label="Содержание"><button v-for="(c,i) in chapters" @click="go(i)"><small>0{{i+1}}</small>{{c}}<span>↗</span></button></nav>
<aside class="chapter-rail"><span>0{{chapter+1}}</span><div class="rail"><i :style="{height:progress*100+'%'}"></i></div><span>07</span></aside>
<main v-memo="[playing,selected,audioError,opening>.4]">
<section class="intro"><div class="hero-shade"></div><div class="eyebrow intro-label">МЕЖДУ СТРОК / АВТОРСКИЙ МИР</div><div class="hero-title" :inert="opening>.4"><span class="small-name">ПОЭЗИЯ И МУЗЫКА</span><h1>Александр<br><em>Водопьянов</em></h1><div class="hero-sub"><span class="dash"></span><p>Стихи обретают голос.<br>Песни обретают смысл.</p></div><div class="hero-actions"><button @click="go(3)">Читать стихи <span>↗</span></button><button @click="go(4)">Открыть песни <span>↗</span></button></div></div><span class="vertical-note">ПОЭЗИЯ / МУЗЫКА / ЧУВСТВО</span><div class="bottom-line"><span>Автор песен и стихов</span><button @click="go(1)">Откройте занавес <span>↓</span></button><span class="film-index">ИНТЕРАКТИВНАЯ ИСТОРИЯ — 01 / 07</span></div></section>
<section class="word"><div class="scene-caption reveal">01 / РОЖДЕНИЕ СЛОВА</div><h2 class="reveal">Всё начинается<br>с одной <em>строки.</em></h2><p class="reveal quiet">Иногда она становится стихотворением.<br>Иногда — песней.</p><span class="floating-word" aria-hidden="true">чувствовать</span></section>
<section class="about"><div class="section-top reveal"><div class="scene-caption">02 / ЧЕЛОВЕК ЗА СТРОКОЙ</div><span class="edition">АЛЕКСАНДР ВОДОПЬЯНОВ</span></div><div class="author-editorial"><figure class="author-photo reveal"><img src="/images/portrait.webp" alt="Портрет Александра Водопьянова в тёмном костюме" loading="lazy" decoding="async" width="1280" height="1092"><figcaption>Свет. Пауза. Человек.</figcaption></figure><div class="author-story reveal"><span class="asterisk">✳</span><h2>Чувствовать.<br>Находить<br><em>слова.</em></h2><h3>{{author.name}}</h3><p>{{author.role}}.</p><p>{{author.bio}}</p><div class="author-topics"><span>Любовь</span><span>Память</span><span>Дорога</span><span>Жизнь</span></div><button class="text-link" @click="go(3)">Войти в мир стихов ↗</button></div></div><div class="author-note reveal"><span>НЕСКОЛЬКО СЛОВ О ГЛАВНОМ</span><p>Разные темы.<br>Одно желание — <em>быть услышанным.</em></p></div></section>
<section class="poetry"><div class="section-top reveal"><div class="scene-caption">03 / СТИХИ</div><span class="edition">СЛОВА НА ТЁПЛОЙ БУМАГЕ</span></div><div class="collection-heading reveal"><h2>То, что говорят<br><em>шёпотом.</em></h2><p>О близости и расстояниях.<br>О том, что остаётся внутри.</p></div><div class="poem-grid"><button v-for="(p,i) in latestPoems" :key="p.title" class="poem-card reveal" @click="selected=p.sourceIndex" :class="'poem-card-'+i"><div class="poem-card-art"><span class="poem-symbol" aria-hidden="true">{{['Окно.','Рядом.','Берег.'][i]}}</span><span class="number">СТИХОТВОРЕНИЕ / 0{{i+1}}</span><span class="card-open">↗</span></div><div class="poem-card-copy"><small>{{p.theme}} · {{formatDate(p.publishedAt)}}{{p.demo?' · демо':''}}</small><h3>{{p.title}}</h3><p>{{p.lines[0]}}<br>{{p.lines[1]}}</p><span class="read-link">Читать полностью <span>↗</span></span></div></button></div><a class="view-all reveal" href="/poems.html">Посмотреть все стихи <span>↗</span></a><p v-if="latestPoems.some(p=>p.demo)" class="footnote demo-note reveal">Тексты и даты с пометкой «демо» — примеры для макета, не произведения автора.</p></section>
<section class="music"><div class="section-top reveal"><div class="scene-caption">04 / ПЕСНИ</div><span class="edition">У КАЖДОЙ СТРОКИ СВОЙ ГОЛОС</span></div><div class="collection-heading reveal"><h2>Когда словам<br>нужны <em>крылья.</em></h2><p>Истории, которые хочется<br>услышать ещё раз.</p></div><div class="music-grid"><button v-for="(s,i) in latestSongs" class="song-card reveal" :class="{playing:playing===s.sourceIndex}" @click="play(s.sourceIndex)" :aria-label="(playing===s.sourceIndex?'Остановить ':'Слушать звуковой эскиз ')+s.title"><div class="song-art"><div class="record" aria-hidden="true"><span>АВ</span></div><span class="song-index">{{s.demo?'ЗВУКОВОЙ ЭСКИЗ':'КОМПОЗИЦИЯ'}} / 0{{i+1}}</span><span class="song-play">{{playing===s.sourceIndex?'Ⅱ':'▷'}}</span><span class="wave"><i v-for="n in 24" :key="n" :style="{'--n':n}"></i></span></div><div class="song-meta"><div><small>{{s.theme}} · {{formatDate(s.publishedAt)}}{{s.demo?' · демо':''}}</small><h3>{{s.title}}</h3></div><span class="song-state">{{playing===s.sourceIndex?'Звучит':'Слушать'}} ↗</span></div></button></div><a class="view-all reveal" href="/songs.html">Посмотреть все песни <span>↗</span></a><p v-if="latestSongs.some(s=>s.demo)" class="footnote demo-note reveal">Демо — синтезированные эскизы без вокала.</p><p v-if="audioError" role="status" class="footnote">{{audioError}}</p></section>
<section class="silence"><div class="scene-caption reveal">05 / ПОСЛЕСЛОВИЕ</div><h2 class="reveal">Песня заканчивается.<br><em>Слова остаются.</em></h2><span class="end-dot reveal">•</span></section>
<section class="contact"><div class="scene-caption reveal">06 / ПРОДОЛЖЕНИЕ ИСТОРИИ</div><h2 class="reveal">Услышим<br><em>друг друга.</em></h2><p class="reveal contact-copy">Для творческого сотрудничества,<br>новых песен и простых человеческих слов.</p><div class="contact-channels reveal"><div v-for="(contact,i) in contacts" :key="contact.label" class="contact-channel"><span class="contact-order">0{{i+1}}</span><a v-if="contact.href" :href="contact.href" :target="contact.label==='Email'?undefined:'_blank'" rel="noopener noreferrer"><span>{{contact.label}}</span><small>{{contact.caption}}</small><span class="channel-arrow">↗</span></a><div v-else class="channel-pending"><span>{{contact.label}}</span><small>Адрес скоро появится</small><span class="channel-arrow">—</span></div></div></div><footer><span>Александр Водопьянов<br><small>Автор песен и стихов</small></span><button @click="go(0)">К первому кадру ↑</button><span>МЕЖДУ СТРОК / 2026</span></footer><a class="site-credit" href="https://tracknode.ru" aria-label="Сайт разработан TrackNode — перейти на tracknode.ru">by <span>TrackNode</span></a></section>
</main>
<div class="scene-name" aria-hidden="true">{{chapters[chapter]}}<span> / 0{{chapter+1}}</span></div>
<dialog ref="poetryDialog" class="poem-dialog" aria-label="Чтение стихотворения" @cancel.prevent="selected=null" @close="selected=null" @click="selected=null"><article v-if="selected!==null" @click.stop><button class="close" @click="selected=null" aria-label="Закрыть стихотворение">Закрыть ×</button><div class="scene-caption">{{poems[selected].theme}}</div><h2>{{poems[selected].title}}</h2><p v-for="line in poems[selected].lines">{{line}}</p><small v-if="poems[selected].demo">Демонстрационный текст для макета</small><button class="next-poem" @click="selected=(selected+1)%poems.length">Следующее стихотворение →</button></article></dialog>
</div>
</template>
