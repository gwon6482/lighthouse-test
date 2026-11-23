<template>
  <!-- 공식 안내·응시료(2026-11-23 진로설계 보완 ⑧ — 오너 '1~9 권장대로'). 걸음 펼침의 단계 목록 아래.
       줄 이름은 '응시료'(계획 전체로 더하지 않는다), 감면 안내는 그리지 않는다(진로상담 검토 11-23). 칸이 없으면(옛 서버·민간 시험) 아무것도 그리지 않는다. 제휴 칸은 받지도 그리지도 않는다(지금 0개 — 열면 '제휴' 표시가 필요) -->
  <div v-if="links.length || cost" class="prep-off">
    <p class="prep-off__head">공식 안내</p>
    <a
      v-for="(l, li) in links"
      :key="li"
      class="prep-off__link"
      :href="l.url"
      target="_blank"
      rel="noopener noreferrer"
    ><span class="prep-off__name">{{ l.name }}</span><em class="prep-off__what">{{ l.what }} ↗</em></a>
    <template v-if="cost">
      <p class="prep-off__cost">{{ costAmountLine(cost) }}</p>
      <p class="prep-off__sub">{{ basisHead }}<span v-if="cost.at" class="prep-off__date">{{ basisDate }}</span></p>
      <p v-if="cost.note" class="prep-off__sub">{{ cost.note }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { costAmountLine, costBasisLine, resourcesOf } from '../../../../lib/preparation'
import type { PrepItem, PrepProject } from '../../../../types/encyclopedia'

const props = defineProps<{ item: PrepItem; project: PrepProject }>()
const res = computed(() => resourcesOf(props.item, props.project))
const links = computed(() => res.value.links)
const cost = computed(() => res.value.cost)
// 확인 날짜 '(확인 2026-11-23)'가 좁은 폰에서 '2026-'·'11-23'으로 갈리지 않게 따로 감싼다(글은 costBasisLine 그대로)
const basisDate = computed(() => (cost.value?.at ? `(확인 ${cost.value.at})` : ''))
const basisHead = computed(() => {
  if (!cost.value) return ''
  const line = costBasisLine(cost.value)
  return basisDate.value && line.endsWith(basisDate.value) ? line.slice(0, -basisDate.value.length) : line
})
</script>
