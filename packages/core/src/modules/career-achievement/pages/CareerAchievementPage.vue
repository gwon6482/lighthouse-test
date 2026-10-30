<template>
  <div class="ah">
    <div v-if="loading" class="ah__loading">불러오는 중...</div>

    <div v-else-if="!plan" class="ah__empty">
      <span class="ah__empty-icon"><AppIcon name="ui-target" /></span>
      <p class="ah__empty-text">아직 진로계획이 없어요</p>
      <button class="ah__empty-btn" @click="router.push('/career-design')">진로계획 만들러 가기</button>
    </div>

    <template v-else>
      <!-- 레퍼런스 배치(2026-10-28): ①지표 띠 ②인사+오늘 요약 / ④오늘 할 일(경계에 걸친 카드) / ⑤이번 주 목표 / ③다가오는 일정 — 바로가기 타일은 뺐다(2026-10-30: 일정 조정은 마이페이지로, 내 진로계획은 삭제) -->
      <section class="ah-hero" :class="{ 'ah-hero--flat': phase !== 'running' }">
        <!-- ① 기간을 가장 길게 보는 자리 — 오늘은 ②, 이번 주는 ⑤ 가 맡는다 -->
        <div class="ah-stats">
          <button type="button" class="ah-stat" @click="router.push('/career-achievement/weekly-review')">
            <span class="ah-stat__chip ah-stat__chip--streak"><AppIcon name="ui-repeat" /></span>
            <span class="ah-stat__label">연속 달성</span>
            <strong class="ah-stat__value">{{ streak }}일</strong>
          </button>
          <button type="button" class="ah-stat" @click="goRoadmap">
            <span class="ah-stat__chip ah-stat__chip--progress"><AppIcon name="ui-target" /></span>
            <span class="ah-stat__label">전체 진행</span>
            <strong v-if="progress.done" class="ah-stat__value">{{ progress.percent }}%</strong>
            <span v-else class="ah-stat__hint">첫 항목을<br>완료해 보세요</span>
          </button>
          <button type="button" class="ah-stat" @click="goRoadmap">
            <span class="ah-stat__chip ah-stat__chip--dday"><AppIcon name="ui-calendar" /></span>
            <span class="ah-stat__label">완료까지</span>
            <strong class="ah-stat__value">{{ dDay }}</strong>
          </button>
        </div>

        <!-- ② 인사 + 오늘 요약 -->
        <div class="ah-greet">
          <div class="ah-greet__text">
            <p v-if="userName" class="ah-greet__name">{{ userName }}님,</p>
            <h1 class="ah-greet__headline">{{ headline }}</h1>
            <p class="ah-greet__message">{{ message }}</p>
          </div>
          <div v-if="phase === 'running'" class="ah-ring" :class="{ 'ah-ring--done': allDone }">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle class="ah-ring__track" cx="32" cy="32" r="27" />
              <circle
                v-if="todayTotal" class="ah-ring__fill" cx="32" cy="32" r="27"
                :stroke-dasharray="RING_LEN" :stroke-dashoffset="RING_LEN * (1 - (shown ? todayDone / todayTotal : 0))"
              />
            </svg>
            <span class="ah-ring__center">
              <AppIcon v-if="!todayTotal" name="ui-free" />
              <AppIcon v-else-if="allDone" name="ui-check" />
              <template v-else><strong>{{ todayDone }}</strong>/{{ todayTotal }}</template>
            </span>
          </div>
        </div>
      </section>

      <!-- ④ 오늘 할 일 — 경계에 걸친 카드(가장 눈에 띄는 자리, 사용자 2026-10-28).
           아직 안 한 첫 일을 크게, 나머지는 한 줄씩. 완료한 일은 '완료 N개' 아래로 모은다. 남은 일 4개 넘으면 접는다 -->
      <section v-if="phase === 'running'" class="ah-today">
        <div class="ah-today__head">
          <h2 class="ah-today__title">오늘 할 일</h2>
          <span v-if="todayTotal" class="ah-today__count"><strong>{{ todayDone }}</strong>/{{ todayTotal }}</span>
        </div>

        <p v-if="!todayTotal" class="ah-today__empty"><AppIcon name="ui-free" /> 오늘은 쉬어 가는 날이에요</p>
        <p v-else-if="!pending.length" class="ah-today__empty ah-today__empty--done"><AppIcon name="ui-celebrate" /> 오늘 할 일을 모두 마쳤어요</p>

        <ul v-if="pending.length" class="ah-list">
          <li
            v-for="(t, i) in visiblePending" :key="t.key" class="ah-task"
            :class="{ 'ah-task--next': i === 0 }"
          >
            <span class="ah-task__chip" :style="t.chipStyle"><AppIcon :name="t.icon" /></span>
            <div class="ah-task__body">
              <span v-if="i === 0" class="ah-task__eyebrow">지금 할 일</span>
              <span class="ah-task__name">{{ t.name }}</span>
              <span class="ah-task__focus">{{ t.sub }}</span>
            </div>
            <button v-if="t.type === 'project'" type="button" class="ah-task__btn" @click="startProject(t.project!)">시작</button>
            <button v-else type="button" class="ah-task__check" :aria-pressed="false" @click="toggleRoutine(t.id)">완료</button>
          </li>
        </ul>
        <button v-if="hiddenCount" type="button" class="ah-today__more" @click="showAll = true">+{{ hiddenCount }}개 더 보기</button>

        <template v-if="finished.length">
          <p class="ah-today__divider">완료 {{ finished.length }}개</p>
          <ul class="ah-list ah-list--done">
            <li v-for="t in finished" :key="t.key" class="ah-task ah-task--done">
              <span class="ah-task__chip" :style="t.chipStyle"><AppIcon :name="t.icon" /></span>
              <div class="ah-task__body"><span class="ah-task__name">{{ t.name }}</span></div>
              <button
                v-if="t.type === 'routine'" type="button" class="ah-task__check ah-task__check--on"
                :aria-pressed="true" @click="toggleRoutine(t.id)"
              ><AppIcon name="ui-check" /> 완료</button>
              <span v-else class="ah-task__state"><AppIcon name="ui-check" /> 완료</span>
            </li>
          </ul>
        </template>
      </section>

      <!-- ⑤ 이번 주 목표 — 이번 주에 배치된 프로젝트 모두. 결산일엔 버튼. 누르면 로드맵 -->
      <section v-if="weekGoals.length || review" class="ah-sec">
        <div class="ah-week" role="link" tabindex="0" @click="goRoadmap" @keydown.enter="goRoadmap">
          <div class="ah-week__head">
            <h2 class="ah-week__title">이번 주 목표<span v-if="weekNumber"> · {{ weekNumber }}주차</span></h2>
            <span v-if="review" class="ah-week__badge" :class="{ 'ah-week__badge--today': review.kind === 'today' }">
              {{ review.kind === 'today' ? '오늘 결산' : `결산 D-${review.days}` }}
            </span>
          </div>
          <ul class="ah-week__list">
            <li v-for="g in weekGoals" :key="g.project.id" class="ah-goal">
              <span class="ah-goal__name"><i class="ah-day__dot" :style="{ background: categoryColor(g.project.category) }" />{{ g.project.name }}</span>
              <span class="ah-goal__count"><strong>{{ g.done }}</strong>/{{ g.total }}</span>
              <span class="ah-goal__bar">
                <i
                  v-for="i in g.total" :key="i" class="ah-goal__seg"
                  :style="i <= g.done ? { background: categoryColor(g.project.category) } : undefined"
                />
              </span>
            </li>
          </ul>
          <p v-if="!weekGoals.length" class="ah-sec__empty">이번 주에 배치된 프로젝트가 없어요.</p>
          <button
            v-if="review?.kind === 'today'" type="button" class="ah-week__cta"
            @click.stop="router.push('/career-achievement/weekly-review')"
          >주간 결산 시작</button>
        </div>
      </section>

      <!-- ③ 다가오는 일정 — 앞으로 3일 미리 보기만(체크 없음). 누르면 일정 조정 -->
      <section v-if="previews.length" class="ah-sec ah-sec--flush">
        <h2 class="ah-sec__title">다가오는 일정</h2>
      <div class="ah-preview">
        <button
          v-for="d in previews" :key="d.key" type="button" class="ah-day"
          @click="router.push({ name: 'Career Achievement Weekly Schedule', query: { date: d.key } })"
        >
          <span class="ah-day__head" :class="{ 'ah-day__head--weekend': d.weekend }"><strong>{{ d.dow }}</strong>{{ d.md }}</span>
          <span v-if="d.rest" class="ah-day__rest">쉬는 날</span>
          <span v-for="(l, i) in d.lines" :key="i" class="ah-day__line">
            <i class="ah-day__dot" :style="{ background: l.color }" />{{ l.name }}
          </span>
          <span v-if="d.more" class="ah-day__more">+{{ d.more }}</span>
        </button>
      </div>
      </section>

    </template>
  </div>
</template>

<script setup lang="ts">
// 진로달성 메인 — 설계를 마친 뒤의 홈(2026-10-28 개편, 사용자와 항목별로 정함 → tasks/career-achievement-redesign.md)
// 예전 실데이터 화면은 CareerAchievementPage copy.vue, 팀원 더미 시안 컴포넌트는 components/(TaskCard 등)
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { usePlanBoard } from '../composables/usePlanBoard'
import { categoryColor } from '../lib/planBoard'
import { methodIcon } from '@/modules/career-design/composables/projectMethods'
import type { Project } from '@/modules/career-design/types/career-design'

const router = useRouter()
const goRoadmap = () => router.push({ name: 'Career Achievement Roadmap' })
const RING_LEN = 2 * Math.PI * 27

const {
  loading, plan, phase, load,
  streak, progress, dDay,
  userName, headline, message, todayTotal, todayDone,
  previews,
  todayProjects, todayRoutines, todayFocus, startProject, toggleRoutine, isProjectDone, isRoutineDone,
  weekGoals, weekNumber, review,
} = usePlanBoard()

// 분류 색의 옅은 바탕(아이콘 칩)
const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`

const allDone = computed(() => todayTotal.value > 0 && todayDone.value >= todayTotal.value)

// 오늘 할 일 한 줄 — 프로젝트·루틴을 한 목록으로(구분은 칩 색: 프로젝트=분류 색, 루틴=파랑)
interface TodayRow { key: string; type: 'project' | 'routine'; id: string; name: string; sub: string; icon: string; chipStyle?: Record<string, string>; project?: Project }
const rows = computed(() => {
  const pending: TodayRow[] = []
  const finished: TodayRow[] = []
  for (const p of todayProjects.value) {
    const f = todayFocus(p)
    const c = categoryColor(p.category)
    const row: TodayRow = {
      key: 'p' + p.id, type: 'project', id: p.id, name: p.name, project: p,
      sub: (f.weekIdx ? `${f.weekIdx}주차 · ` : '') + f.text,
      icon: methodIcon(p.method) || 'ui-target', chipStyle: { color: c, background: tint(c) },
    }
    ;(isProjectDone(p.id) ? finished : pending).push(row)
  }
  for (const r of todayRoutines.value) {
    const row: TodayRow = { key: 'r' + r.id, type: 'routine', id: r.id, name: r.name, sub: `루틴 · ${r.duration}분`, icon: 'ui-repeat', chipStyle: { color: '#3B6FD8', background: '#E6F0FF' } }
    ;(isRoutineDone(r.id) ? finished : pending).push(row)
  }
  return { pending, finished }
})
const pending = computed(() => rows.value.pending)
const finished = computed(() => rows.value.finished)
const MAX_PENDING = 4
const showAll = ref(false)
const visiblePending = computed(() => showAll.value ? pending.value : pending.value.slice(0, MAX_PENDING))
const hiddenCount = computed(() => pending.value.length - visiblePending.value.length)

// 링은 0에서 차오르게 — 첫 그림을 0으로 그린 뒤 한 프레임 뒤에 값을 준다
const shown = ref(false)
onMounted(async () => {
  await load()
  requestAnimationFrame(() => requestAnimationFrame(() => { shown.value = true }))
})
</script>
