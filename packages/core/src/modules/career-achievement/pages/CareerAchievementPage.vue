<template>
  <div class="ah">
    <div v-if="loading" class="ah__loading">불러오는 중...</div>

    <div v-else-if="!plan" class="ah__empty">
      <span class="ah__empty-icon"><AppIcon name="ui-target" /></span>
      <p class="ah__empty-text">아직 진로계획이 없어요</p>
      <button class="ah__empty-btn" @click="router.push('/career-design')">진로계획 만들러 가기</button>
    </div>

    <template v-else>
      <!-- 레퍼런스 배치(2026-10-28): ①지표 띠 ②인사+오늘 요약 ③내일~글피 카드(경계에 걸침) ④오늘 할 일 ⑤이번 주 목표 ⑥바로가기 -->
      <section class="ah-hero">
        <!-- ① 기간을 가장 길게 보는 자리 — 오늘은 ②, 이번 주는 ⑤ 가 맡는다 -->
        <div class="ah-stats">
          <button type="button" class="ah-stat" @click="router.push('/career-achievement/weekly-review')">
            <span class="ah-stat__chip ah-stat__chip--streak"><AppIcon name="ui-repeat" /></span>
            <span class="ah-stat__label">연속 달성</span>
            <strong class="ah-stat__value">{{ streak }}일</strong>
          </button>
          <div class="ah-stat">
            <span class="ah-stat__chip ah-stat__chip--progress"><AppIcon name="ui-target" /></span>
            <span class="ah-stat__label">전체 진행</span>
            <strong v-if="progress.done" class="ah-stat__value">{{ progress.percent }}%</strong>
            <span v-else class="ah-stat__hint">첫 항목을<br>완료해 보세요</span>
          </div>
          <div class="ah-stat">
            <span class="ah-stat__chip ah-stat__chip--dday"><AppIcon name="ui-calendar" /></span>
            <span class="ah-stat__label">완료까지</span>
            <strong class="ah-stat__value">{{ dDay }}</strong>
          </div>
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

      <!-- ③ 앞으로 3일(요일·날짜) — 미리 보기만(체크 없음). 누르면 일정 조정 -->
      <div v-if="previews.length" class="ah-preview">
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

      <!-- ④ 오늘 할 일 — 프로젝트 / 루틴 나눔, 완료 항목은 그 자리에서 흐리게 -->
      <section v-if="phase === 'running'" class="ah-sec">
        <h2 class="ah-sec__title">오늘 할 일</h2>
        <p v-if="!todayTotal" class="ah-sec__empty">오늘은 예정된 일이 없어요.</p>

        <template v-if="todayProjects.length">
          <h3 class="ah-sec__sub">프로젝트</h3>
          <ul class="ah-list">
            <li
              v-for="p in todayProjects" :key="p.id" class="ah-task"
              :class="{ 'ah-task--done': isProjectDone(p.id) }"
            >
              <span class="ah-task__chip" :style="{ color: categoryColor(p.category), background: tint(categoryColor(p.category)) }">
                <AppIcon :name="methodIcon(p.method) || 'ui-target'" />
              </span>
              <div class="ah-task__body">
                <span class="ah-task__name">{{ p.name }}</span>
                <span class="ah-task__focus">
                  <template v-if="todayFocus(p).weekIdx">{{ todayFocus(p).weekIdx }}주차 · </template>{{ todayFocus(p).text }}
                </span>
              </div>
              <span v-if="isProjectDone(p.id)" class="ah-task__state"><AppIcon name="ui-check" /> 완료</span>
              <button v-else type="button" class="ah-task__btn" @click="startProject(p)">시작</button>
            </li>
          </ul>
        </template>

        <template v-if="todayRoutines.length">
          <h3 class="ah-sec__sub">루틴</h3>
          <ul class="ah-list">
            <li
              v-for="r in todayRoutines" :key="r.id" class="ah-task ah-task--routine"
              :class="{ 'ah-task--done': isRoutineDone(r.id) }"
            >
              <span class="ah-task__chip ah-task__chip--routine"><AppIcon name="ui-repeat" /></span>
              <div class="ah-task__body">
                <span class="ah-task__name">{{ r.name }}</span>
                <span class="ah-task__focus">{{ r.duration }}분</span>
              </div>
              <button
                type="button" class="ah-task__check" :class="{ 'ah-task__check--on': isRoutineDone(r.id) }"
                :aria-pressed="isRoutineDone(r.id)" @click="toggleRoutine(r.id)"
              >
                <AppIcon v-if="isRoutineDone(r.id)" name="ui-check" /> 완료
              </button>
            </li>
          </ul>
        </template>
      </section>

      <!-- ⑤ 이번 주 목표 — 이번 주에 배치된 프로젝트 모두. 결산일엔 버튼 -->
      <section v-if="weekGoals.length || review" class="ah-sec">
        <div class="ah-week">
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
            @click="router.push('/career-achievement/weekly-review')"
          >주간 결산 시작</button>
        </div>
      </section>

      <!-- ⑥ 바로가기 — 구성은 시안 본 뒤 다시 정한다(임시) -->
      <nav class="ah-tiles" aria-label="바로가기">
        <button type="button" class="ah-tile ah-tile--blue" @click="router.push({ name: 'Career Achievement Weekly Schedule' })">
          <AppIcon name="ui-calendar" class="ah-tile__icon" /><span>일정 조정</span>
        </button>
        <button type="button" class="ah-tile ah-tile--green" @click="router.push('/career-achievement/weekly-review')">
          <AppIcon name="ui-weekly-review" class="ah-tile__icon" /><span>주간 결산</span>
        </button>
        <button type="button" class="ah-tile ah-tile--purple" @click="router.push('/career-design')">
          <AppIcon name="ui-template" class="ah-tile__icon" /><span>내 진로계획</span>
        </button>
      </nav>
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

const router = useRouter()
const RING_LEN = 2 * Math.PI * 27

const {
  loading, plan, phase, load,
  streak, progress, dDay,
  userName, headline, message, todayTotal, todayDone,
  previews,
  todayProjects, todayRoutines, todayFocus, startProject, toggleRoutine, isProjectDone, isRoutineDone,
  weekGoals, weekNumber, review,
} = usePlanBoard()

const allDone = computed(() => todayTotal.value > 0 && todayDone.value >= todayTotal.value)

// 분류 색의 옅은 바탕(아이콘 칩)
const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`

// 링은 0에서 차오르게 — 첫 그림을 0으로 그린 뒤 한 프레임 뒤에 값을 준다
const shown = ref(false)
onMounted(async () => {
  await load()
  requestAnimationFrame(() => requestAnimationFrame(() => { shown.value = true }))
})
</script>
