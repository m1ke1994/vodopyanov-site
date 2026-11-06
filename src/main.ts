import { loadEditableContent } from './cms';
import { initTrackNodeAnalytics } from './tracknode-analytics.mjs';
import {createApp} from 'vue';
import App from './App.vue';
import './style.css';
createApp(App).mount('#app');

initTrackNodeAnalytics();

void loadEditableContent();
