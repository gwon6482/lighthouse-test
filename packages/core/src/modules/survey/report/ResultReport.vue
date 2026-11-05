<template>
  <div class="rp">
    <ReportPage
      v-for="(page, i) in PAGES"
      :key="i"
      :n="i + 1"
      :total="PAGES.length"
      :meta="meta"
      :cover="i === 0"
    >
      <component :is="S" v-for="(S, j) in page" :key="j" :data="data" :meta="meta" />
    </ReportPage>
  </div>
</template>

<script setup lang="ts">
/**
 * PDF 결과지(A4) — 화면 결과지와 **별개의 양식**이다. 데이터(API 응답)만 같다.
 *
 * 🔁 랜딩 lighthouse-landing components/survey/report 의 **사본**(2026-11-06 이식). 정본은 랜딩이다 —
 *    양식을 고치면 두 레포를 같이 고칠 것(레포가 달라 자동으로 맞춰지지 않는다).
 *
 * 편집 안내
 *   - 쪽 구성: 아래 PAGES — 한 줄이 한 쪽, 그 안의 구역을 위에서부터 차례로 쌓는다.
 *     구역을 다른 쪽으로 옮기거나 순서를 바꾸려면 이 배열만 고친다. 쪽 번호는 자동.
 *     첫 쪽은 표지(공통 머리말 없음)다.
 *   - 구역 내용: sections/Sec*.vue (구역 하나 = 파일 하나)
 *   - 고정 문구: reportText.ts / 색·크기: report.scss
 *   - ⚠️ 쪽 높이는 고정이라 넘치면 **잘린다.** PDF 를 만들 때 넘친 쪽이 있으면 콘솔에 경고가 뜬다
 *     (findPageOverflow). 경고가 뜨면 구역을 다음 쪽으로 옮길 것.
 *
 * 내보낼 때는 화면 밖에 그려 두고 `.rp-page` 를 한 장씩 찍어 PDF 로 합친다(useResultExport.buildPdfFromPages).
 */
import { computed } from 'vue'
import type { ResearchResultData } from './reportData'
import ReportPage from './ReportPage.vue'
import SecCover from './sections/SecCover.vue'
import SecDataSummary from './sections/SecDataSummary.vue'
import SecType from './sections/SecType.vue'
import SecPersonality from './sections/SecPersonality.vue'
import SecPersonalityDefs from './sections/SecPersonalityDefs.vue'
import SecTalent from './sections/SecTalent.vue'
import SecValues from './sections/SecValues.vue'
import SecInterest from './sections/SecInterest.vue'
import SecSummaryLine from './sections/SecSummaryLine.vue'
import SecEnvironment from './sections/SecEnvironment.vue'
import SecEnvironmentFit from './sections/SecEnvironmentFit.vue'
import SecCurrentJob from './sections/SecCurrentJob.vue'
import SecJobs from './sections/SecJobs.vue'
import SecGuide from './sections/SecGuide.vue'
import { formatDate, type ReportMeta } from './reportUtil'

const PAGES = [
  [SecCover, SecDataSummary, SecType, SecPersonality],
  [SecPersonalityDefs, SecTalent, SecValues],
  // 앱만 다르다: '맞는/맞지 않는 환경'(SecEnvironmentFit)을 4쪽으로 — 관심 분야를 많이 고르면(33개) 3쪽이 122px 넘쳐
  // 잘렸다(2026-11-06). 앱엔 실무자 구역(SecCurrentJob)이 없어 4쪽이 늘 절반 넘게 빈다. 랜딩은 실무자 때문에 그대로 둔다
  [SecInterest, SecSummaryLine, SecEnvironment],
  [SecEnvironmentFit, SecCurrentJob, SecJobs, SecGuide],   // SecCurrentJob 은 연구 설문 실무자만 — 앱에서는 늘 빈 구역
]

const props = defineProps<{ data: ResearchResultData }>()
const meta = computed<ReportMeta>(() => ({
  id: props.data.respondent_id.replace(/^(res_|SURV)/, ''),   // 랜딩 res_… · 앱 SURV…
  date: formatDate(props.data.completed_at),
}))
</script>

<!-- 전역(scoped 아님) — 구역 컴포넌트들이 같이 쓴다. ⚠️ @use 로 불러오면 프로젝트 공통 SCSS 머리말과 충돌해 빌드가 깨진다 -->
<style lang="scss" src="./report.scss"></style>
