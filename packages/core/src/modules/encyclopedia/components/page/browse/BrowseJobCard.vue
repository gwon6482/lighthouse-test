<template>
  <!-- 분류로 찾기 목록 카드 — '진로 둘러보기' 카드(rjc)에 이유 줄과 연봉 한 줄을 더했다(2026-11-17 시안 2판).
       점수·%·순위 번호와 '추천·맞춤'은 쓰지 않는다. 이 목록은 '나에게 맞는'이 아니라 '이것을 많이 쓰는' 직업이다 -->
  <div class="rjc bjc" :class="{ 'bjc--near': !!row.missing }" role="button" tabindex="0" @click="emit('open')" @keydown.enter="emit('open')">
    <div class="rjc__body">
      <p class="rjc__title">
        {{ row.title }}
        <span v-if="(row.members?.length ?? 1) > 1" class="rjc__group">유사 {{ row.members!.length }}개</span>
      </p>
      <p v-if="row.overview" class="rjc__desc">{{ row.overview }}</p>
      <div class="rjc__tags rjc__tags--line">
        <span v-if="row.group" class="rjc__tag rjc__tag--group">{{ row.group.name }}</span>
        <JobGateBadges :job-code="row.jobCode" class="rjc__gates-inline" />
      </div>
      <p v-if="reasonLine" class="bjc__why">{{ reasonLine }}</p>
      <p v-if="row.missing" class="bjc__near"><b>'{{ row.missing.label }}'</b>만 달라요</p>
      <p v-if="row.salary.median" class="bjc__sal">
        연봉 중간값 <b :class="{ 'g-veil': guest }">{{ formatManwon(row.salary.median) }}</b> · 경력 전체
        <span v-if="guest" class="g-pill bjc__lock"><AppIcon name="ui-privacy" :size="11" />가입 후</span>
      </p>
    </div>
    <div class="rjc__arrow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'
import { formatManwon } from '../../../lib/browseQuery'
import type { BrowseRow } from '../../../types/browse'

const props = defineProps<{ row: BrowseRow; guest?: boolean }>()
const emit = defineEmits<{ open: [] }>()

// 이유 줄은 두 개까지 한 줄로(서버가 고른 조건마다 실제 자료 이름으로 써 준다)
const reasonLine = computed(() => props.row.reasons.slice(0, 2).map((r) => r.text).join(' · '))
</script>
