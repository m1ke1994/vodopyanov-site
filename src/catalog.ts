import {createApp} from 'vue';
import Catalog from './components/Catalog.vue';
import './style.css';
createApp(Catalog,{kind:location.pathname.endsWith('/songs.html')?'songs':'poems'}).mount('#app');
