// test 셸 엔트리 — 전체 기능 워크벤치
import 'pretendard/dist/web/variable/pretendardvariable.css'
// Tabler 아이콘 폰트(<i class="ti ti-…">) — 진로달성 화면이 쓴다. 패키지는 폰트 생성 도구까지 끌고 와서 CSS·woff2 만 들여왔다
import '@/appearance/vendor/tabler-icons/tabler-icons.min.css'
import '@/appearance/styles.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from '@/shared/router' // 전체 라우트

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
