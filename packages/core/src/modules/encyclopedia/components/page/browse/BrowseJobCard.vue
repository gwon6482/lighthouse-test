<template>
  <!-- 분류로 찾기 목록 카드 — '진로 둘러보기' 카드(rjc)에 이유 줄과 연봉 한 줄을 더했다(2026-11-17 시안 2판).
       점수·%·순위 번호와 '추천·맞춤'은 쓰지 않는다. 이 목록은 '나에게 맞는'이 아니라 '이것을 많이 쓰는' 직업이다 -->
  <div class="rjc bjc" role="button" tabindex="0" @click="emit('open')" @keydown.enter="emit('open')">
    <div class="rjc__body">
      <p class="rjc__title">
        {{ row.title }}
        <span v-if="bundleSize > 1" class="rjc__group">유사 {{ bundleSize }}개</span>
      </p>
      <!-- 묶음 줄 설명은 묶음 이름과 같은 구성원의 하는 일(서버가 고른다). 없으면 함께 조사했다는 말만 -->
      <p v-if="row.overview" class="rjc__desc">{{ row.overview }}</p>
      <p v-if="bundleSize > 1" class="bjc__bundle">비슷한 직업 {{ bundleSize }}개를 함께 조사했어요</p>
      <div class="rjc__tags rjc__tags--line">
        <span v-if="row.group" class="rjc__tag rjc__tag--group">{{ row.group.name }}</span>
        <JobGateBadges :job-code="row.jobCode" class="rjc__gates-inline" />
      </div>
      <!-- '하나만 빼고 맞아요' 카드 — 무엇이 안 맞는지(2026-11-19 다듬기 2차 9). 빨강이 아니라 옅은 갈색(잘못이 아니라 차이),
           화면 읽기에도 '안 맞아요' 글로 읽힌다. 서버 missing.parts 가 없으면(옛 서버) 그리지 않는다 -->
      <p v-if="miss" class="bjc__miss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>
        <span v-if="miss.kind === 'miss'"><b>안 맞아요</b> {{ miss.text }}</span>
        <span v-else><b>자료 없음</b> {{ miss.axis }} 자료가 없어 맞는지 알 수 없어요</span>
      </p>
      <!-- 이유 줄 — 고른 조건마다 한 줄, 세 줄까지(서버가 조건마다 실제 자료 이름으로 써 준다) -->
      <ul v-if="reasons.length" class="bjc__why">
        <li v-for="r in reasons" :key="r.axis">{{ r.text }}</li>
      </ul>
      <p v-if="row.salary.median" class="bjc__sal">
        연봉 중간값
        <!-- 비회원에게는 숫자를 그리지 않는다(화면 읽기 프로그램에도 안 읽히게 자리표시만) -->
        <b v-if="guest" class="bjc__veil" aria-hidden="true">0,000만 원</b>
        <b v-else>{{ formatManwon(row.salary.median) }}</b>
        · 경력자 포함
        <span v-if="guest" class="g-pill bjc__lock"><AppIcon name="ui-privacy" :size="11" />가입 후</span>
      </p>
    </div>
    <div class="rjc__arrow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'
import { formatManwon, missLine } from '../../../lib/browseQuery'
import type { BrowseRow } from '../../../types/browse'

const props = defineProps<{ row: BrowseRow; guest?: boolean }>()
const emit = defineEmits<{ open: [] }>()

const bundleSize = computed(() => props.row.members?.length ?? 1)
const reasons = computed(() => props.row.reasons.slice(0, 3))
const miss = computed(() => missLine(props.row.missing))
</script>
