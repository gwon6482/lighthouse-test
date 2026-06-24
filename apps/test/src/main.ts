// test 셸 엔트리 — 전체 기능 워크벤치
import 'pretendard/dist/web/variable/pretendardvariable.css'
import '@/appearance/styles.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from '@/shared/router' // 전체 라우트

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
