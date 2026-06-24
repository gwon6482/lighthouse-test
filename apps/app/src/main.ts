// app 셸 엔트리 — 프로덕션(완성 기능만)
import 'pretendard/dist/web/variable/pretendardvariable.css'
import '@/appearance/styles.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from '@/shared/router/app' // 완성 기능만(승격 게이트)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
