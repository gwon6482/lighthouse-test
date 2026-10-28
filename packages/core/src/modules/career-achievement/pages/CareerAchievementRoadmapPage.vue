<template>
  <div class="rm">
    <div v-if="loading" class="ah__loading">불러오는 중...</div>

    <div v-else-if="!plan" class="ah__empty">
      <span class="ah__empty-icon"><AppIcon name="ui-target" /></span>
      <p class="ah__empty-text">아직 진로계획이 없어요</p>
      <button class="ah__empty-btn" @click="router.push('/career-design')">진로계획 만들러 가기</button>
    </div>

    <template v-else>
      <!-- 머리 — 전체에서 어디까지 왔나 -->
      <section class="rm-hero">
        <span class="rm-hero__eyebrow">나의 로드맵</span>
        <h1 class="rm-hero__title">{{ goalTitle }}</h1>
        <p class="rm-hero__period">{{ periodLabel }}</p>

        <div class="rm-progress">
          <div class="rm-progress__row">
            <strong class="rm-progress__pct">{{ progress.percent }}<small>%</small></strong>
            <span class="rm-progress__meta">항목 {{ progress.done }} / {{ progress.total }} 완료</span>
          </div>
          <span class="rm-progress__bar"><i :style="{ width: `${shown ? progress.percent : 0}%` }" /></span>
          <div class="rm-progress__facts">
            <span v-if="phase === 'running' && weekNumber">지금 <strong>{{ weekNumber }}주차</strong> / {{ totalWeeks }}주</span>
            <span v-else-if="phase === 'before'">출발 전</span>
            <span v-else>계획 기간 끝</span>
            <span>{{ remainingLabel }}</span>
          </div>
        </div>
      </section>

      <!-- 여정 — 시작 주차 순 정거장. '지금 여기'는 아직 시작 안 한 첫 정거장 앞 -->
      <ol class="rm-path">
        <li class="rm-node rm-node--start">
          <span class="rm-node__dot"><AppIcon name="onboard-launch" /></span>
          <div class="rm-node__flag"><strong>출발</strong> {{ startLabel }}</div>
        </li>

        <template v-for="(s, i) in roadmap" :key="s.project.id">
          <li v-if="i === hereIndex" ref="hereEl" class="rm-here">
            <span class="rm-here__pill">지금 여기<template v-if="weekNumber"> · {{ weekNumber }}주차</template></span>
          </li>
          <li class="rm-node" :class="`rm-node--${s.status}`">
            <span class="rm-node__dot">
              <AppIcon v-if="s.status === 'done'" name="ui-check" />
              <i v-else />
            </span>
            <button type="button" class="rm-stop" :aria-expanded="open[s.project.id] === 'all'" @click="toggle(s.project.id)">
              <span class="rm-stop__top">
                <span class="rm-stop__chip" :style="{ color: categoryColor(s.project.category), background: tint(categoryColor(s.project.category)) }">
                  <AppIcon :name="methodIcon(s.project.method) || 'ui-target'" />
                </span>
                <span class="rm-stop__when">{{ s.startWeek }}~{{ s.endWeek }}주차 · {{ weekSpanLabel(s.startWeek, s.endWeek) }}</span>
                <span class="rm-stop__status">{{ statusLabel(s) }}</span>
                <AppIcon name="ui-chevron-down" class="rm-stop__chev chevron-toggle" :class="{ 'chevron-toggle--open': open[s.project.id] === 'all' }" />
              </span>
              <span class="rm-stop__name">{{ s.project.name }}</span>
              <span class="rm-stop__cat">{{ categoryLabel(s.project.category) }}</span>
              <span v-if="s.total" class="rm-stop__bar">
                <i :style="{ width: `${(s.done / s.total) * 100}%`, background: categoryColor(s.project.category) }" />
              </span>
              <span v-if="s.total" class="rm-stop__count">{{ s.done }} / {{ s.total }}</span>
            </button>
            <!-- 진행 중 정거장은 처음엔 '이번 주'만, 누르면 전체 주차 -->
            <ul v-if="open[s.project.id]" class="rm-weeks">
              <li
                v-for="w in weeksShown(s)" :key="w.week" class="rm-week"
                :class="{ 'rm-week--now': s.startWeek + w.week - 1 === weekNumber }"
              >
                <span class="rm-week__label">
                  <template v-if="s.startWeek + w.week - 1 === weekNumber">이번 주 · </template>{{ w.week }}주차
                  <small>{{ weekSpanLabel(s.startWeek + w.week - 1, s.startWeek + w.week - 1) }}</small>
                </span>
                <span v-for="(e, k) in w.entries" :key="k" class="rm-week__item" :class="{ 'rm-week__item--done': e.done }">
                  <AppIcon :name="e.done ? 'ui-check' : 'ui-chevron-right'" />{{ e.text }}
                </span>
              </li>
              <li v-if="open[s.project.id] === 'week' && s.weeks.length > 1">
                <button type="button" class="rm-weeks__all" @click="open[s.project.id] = 'all'">전체 {{ s.weeks.length }}주 보기</button>
              </li>
            </ul>
          </li>
        </template>
        <li v-if="hereIndex === roadmap.length && phase === 'running'" ref="hereEl" class="rm-here">
          <span class="rm-here__pill">지금 여기<template v-if="weekNumber"> · {{ weekNumber }}주차</template></span>
        </li>

        <li class="rm-node rm-node--goal">
          <span class="rm-node__dot"><AppIcon name="ui-target" /></span>
          <div class="rm-node__flag">
            <strong>{{ plan.targetJob || '목표' }}</strong> {{ endLabel }}
            <span class="rm-node__dday">{{ dDay }}</span>
          </div>
        </li>
      </ol>

      <p v-if="!roadmap.length" class="rm-empty">타임라인에 배치한 프로젝트가 없어요.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
// 로드맵 — 전체 계획에서 지금 어디까지 왔고 남은 여정이 무엇인지(2026-10-28, 사용자 요청)
// 데이터·계산은 메인과 같은 usePlanBoard / lib/planBoard(roadmapStops)
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { usePlanBoard } from '../composables/usePlanBoard'
import { categoryColor, categoryLabel, parsePlanDate, daysBetween, type RoadmapStop } from '../lib/planBoard'
import { methodIcon } from '@/modules/career-design/composables/projectMethods'

const router = useRouter()
const { loading, plan, phase, today, load, progress, dDay, weekNumber, totalWeeks, roadmap, weekSpanLabel } = usePlanBoard()

const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`
const ymd = (s?: string) => { const d = parsePlanDate(s); return d ? `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}` : '' }
const startLabel = computed(() => ymd(plan.value?.startDate))
const endLabel = computed(() => ymd(plan.value?.endDate))
const periodLabel = computed(() => [startLabel.value, endLabel.value].filter(Boolean).join(' – '))
const goalTitle = computed(() => plan.value?.targetJob ? `${plan.value.targetJob}까지의 여정` : '나의 여정')
const remainingLabel = computed(() => {
  const e = parsePlanDate(plan.value?.endDate)
  if (!e) return ''
  const left = daysBetween(today.value, e)
  if (left < 0) return '계획 완료'
  const w = Math.ceil(left / 7)
  return left < 7 ? `남은 ${left}일` : `남은 약 ${w}주`
})

// '지금 여기' — 아직 시작 안 한 첫 정거장 앞(모두 시작했으면 맨 끝, 시작 전이면 맨 앞)
const hereIndex = computed(() => {
  if (phase.value !== 'running') return -1
  const i = roadmap.value.findIndex((s) => s.status === 'next')
  return i === -1 ? roadmap.value.length : i
})

function statusLabel(s: RoadmapStop): string {
  if (s.status === 'done') return '완료'
  if (s.status === 'now') return '진행 중'
  if (s.status === 'past') return `남은 항목 ${s.total - s.done}`
  const wk = weekNumber.value
  return wk && phase.value === 'running' ? `${s.startWeek - wk}주 뒤 시작` : '예정'
}

// 펼침 — 처음엔 진행 중인 정거장만 '이번 주'로 펼친다. 누르면 전체 주차 ↔ 접기
type OpenMode = 'week' | 'all'
const open = ref<Record<string, OpenMode | undefined>>({})
const toggle = (id: string) => { open.value = { ...open.value, [id]: open.value[id] === 'all' ? undefined : 'all' } }
function weeksShown(s: RoadmapStop) {
  if (open.value[s.project.id] !== 'week' || !weekNumber.value) return s.weeks
  const cur = weekNumber.value - s.startWeek + 1
  return s.weeks.filter((w) => w.week === cur)
}

const shown = ref(false)
const hereEl = ref<HTMLElement[] | HTMLElement | null>(null)
onMounted(async () => {
  await load()
  for (const s of roadmap.value) if (s.status === 'now') open.value[s.project.id] = 'week'
  await nextTick()
  requestAnimationFrame(() => requestAnimationFrame(() => { shown.value = true }))
  // 지금 위치로 데려간다
  const el = Array.isArray(hereEl.value) ? hereEl.value[0] : hereEl.value
  el?.scrollIntoView({ block: 'center' })
})
</script>
