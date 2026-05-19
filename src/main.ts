import 'pretendard/dist/web/variable/pretendardvariable.css'
import './appearance/styles.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './shared/router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
