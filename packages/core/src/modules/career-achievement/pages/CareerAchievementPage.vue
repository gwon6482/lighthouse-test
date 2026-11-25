<template>
  <div class="ah">
    <div v-if="loading || leaving" class="ah__loading">불러오는 중...</div>

    <!-- 진행 중인 계획이 없으면 계획 전 홈(/main/before)으로 보낸다(아래 afterLoad). 여기 남는 것은 '못 읽었을 때'뿐 —
         계획 전에는 하단 메뉴가 없어서 '내 계정'(로그아웃·탈퇴)을 꼭 둔다(2026-11-25 핫픽스) -->
    <div v-else-if="!plan" class="ah__empty">
      <span class="ah__empty-icon"><AppIcon name="ui-target" /></span>
      <p class="ah__empty-text">진로계획을 불러오지 못했어요</p>
      <button type="button" class="ah__empty-btn" @click="retry">다시 불러오기</button>
      <button type="button" class="ah__empty-link" @click="router.push('/mypage')"><AppIcon name="ui-avatar" />내 계정</button>
    </div>

    <template v-else>
      <!-- 레퍼런스 배치(2026-10-28): ①지표 띠 ②인사+오늘 요약 / ④오늘 할 일(경계에 걸친 카드) / ⑤이번 주 목표 / ③다가오는 일정 — 바로가기 타일은 뺐다(2026-10-30: 일정 조정은 마이페이지로, 내 진로계획은 삭제) -->
      <section class="ah-hero" :class="{ 'ah-hero--flat': phase !== 'running' }">
        <!-- ① 기간을 가장 길게 보는 자리 — 오늘은 ②, 이번 주는 ⑤ 가 맡는다. 누르는 곳이 아니라 정보만(2026-10-30 사용자) -->
        <div class="ah-stats">
          <div class="ah-stat">
            <span class="ah-stat__chip ah-stat__chip--streak"><AppIcon name="ui-repeat" /></span>
            <span class="ah-stat__label">연속 달성</span>
            <strong class="ah-stat__value">{{ streak }}일</strong>
          </div>
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
        <!-- 가장 가까운 시험 하나(2026-11-22 시험일 역산 정할 것 8) — 시험 날엔 '오늘 ○○ 시험이에요' -->
        <div v-if="nextExam" class="ah-exam">
          <span class="ah-exam__d">{{ COPY.ddayBadge(nextExam.days) }}</span>
          <span class="ah-exam__body">
            <strong>{{ nextExam.days === 0 ? COPY.ddayToday(nextExam.name) : COPY.ddayTitle(nextExam.name) }}</strong>
            <small>{{ mdLabel(nextExam.date) }}</small>
          </span>
        </div>
      </section>

      <!-- 멈춘 집중 중 오늘 목록에 없는 것(어제 것·일정을 옮긴 것) — '오늘 할 일' 위에 따로 한 장(2026-11-19 정할 것 5) -->
      <section v-if="held.length" class="ah-held" aria-label="멈춘 집중">
        <ul class="ah-list">
          <li v-for="h in held" :key="h.key" class="ah-task ah-task--next">
            <span class="ah-task__chip" :style="h.chipStyle"><AppIcon :name="h.icon" /></span>
            <div class="ah-task__body">
              <span class="ah-task__eyebrow">{{ h.eyebrow }}</span>
              <span class="ah-task__name">{{ h.name }}</span>
              <span class="ah-task__focus">{{ h.sub }}</span>
            </div>
            <button type="button" class="ah-task__btn" @click="resumeFocus(h.session)">이어 하기</button>
          </li>
        </ul>
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
              <span v-if="t.session" class="ah-task__eyebrow">잠시 멈춤</span>
              <span v-else-if="i === 0" class="ah-task__eyebrow">지금 할 일</span>
              <span class="ah-task__name"><PeriodTag v-if="t.type === 'period'" /> {{ t.name }}</span>
              <span class="ah-task__focus">{{ t.sub }}</span>
            </div>
            <button v-if="t.session" type="button" class="ah-task__btn" @click="resumeFocus(t.session)">이어 하기</button>
            <button v-else-if="t.type === 'project'" type="button" class="ah-task__btn" @click="startProject(t.project!)">시작</button>
            <!-- 루틴·과정(2026-11-16)은 집중모드 없이 '완료' 한 번 -->
            <button v-else type="button" class="ah-task__check" :aria-pressed="false" @click="toggleRow(t)">완료</button>
          </li>
        </ul>
        <button v-if="hiddenCount" type="button" class="ah-today__more" @click="showAll = true">+{{ hiddenCount }}개 더 보기</button>

        <template v-if="finished.length">
          <p class="ah-today__divider">완료 {{ finished.length }}개</p>
          <!-- 끝낸 줄을 누르면(#101, 2026-11-26) — 기록이 있는 줄은 작은 메뉴, '완료'만 누른 루틴·과정은 바로 취소 + 알림(lib/undoDone.ts) -->
          <ul class="ah-list ah-list--done">
            <li v-for="t in finished" :key="t.key" class="ah-task ah-task--done ah-task--tap" @click="tapFinished(t)">
              <span class="ah-task__chip" :style="t.chipStyle"><AppIcon :name="t.icon" /></span>
              <div class="ah-task__body"><span class="ah-task__name">{{ t.name }}</span></div>
              <button
                v-if="t.type !== 'project'" type="button" class="ah-task__check ah-task__check--on"
                :aria-pressed="true" @click.stop="tapFinished(t)"
              ><AppIcon name="ui-check" /> 완료</button>
              <button v-else type="button" class="ah-task__state" aria-haspopup="dialog" @click.stop="tapFinished(t)"><AppIcon name="ui-check" /> 완료</button>
            </li>
          </ul>
        </template>

        <!-- 미리 하기(2026-11-23 오너 승인, 시안 reviews/2026-11-23-pull-ahead) — 원래 쉬어 가는 날에만. 이번 주 뒤 요일 칸을 오늘로 옮겨서 한다(저장할 때 옮김) -->
        <template v-if="pullAhead.length">
          <p class="ah-today__divider">미리 해 둘 수 있어요</p>
          <ul class="ah-list">
            <li v-for="c in pullAhead" :key="'a' + c.projectId" class="ah-task">
              <span class="ah-task__chip" :style="{ color: categoryColor(c.project.category), background: tint(categoryColor(c.project.category)) }"><AppIcon :name="methodIcon(c.project.method) || 'ui-target'" /></span>
              <div class="ah-task__body">
                <span class="ah-task__name">{{ c.project.name }}</span>
                <span class="ah-task__focus">{{ c.dow }} 할 일 · {{ c.text }}</span>
              </div>
              <button type="button" class="ah-task__ahead" @click="startAhead(c)">미리 하기</button>
            </li>
          </ul>
        </template>
      </section>

      <!-- 이번 주 기록 재기(2026-11-21 루틴 리뉴얼) — 기준 넘기·실력 올리기 루틴의 주 1회 기록. 매일 분량은 루틴, 재기는 여기 -->
      <section v-if="phase === 'running' && measureDue.length" class="ah-sec ah-measure" aria-label="이번 주 기록 재기">
        <RoutineMeasureCard
          v-for="m in measureDue" :key="m.routine.id"
          :title="m.project?.name ?? m.routine.name" :measure="m.measure" :record="m.record" :prev="m.prev"
          :caution="m.routine.kind === 'target' ? '기준은 응시하는 해 공고에서 확인해요' : null"
          :on-save="(v, t) => saveRecord(m.routine.id, v, t)"
        />
      </section>

      <!-- 주간 결산 — 결산일에만, 오늘 할 일 바로 아래(2026-10-30 사용자). 평소엔 안 보인다.
           추후: 앱 진입 때 결산 팝업 + 앱 푸시 예정 -->
      <div v-if="showReviewButton" class="ah-review">
        <button type="button" class="ah-review__btn" @click="router.push({ name: 'Career Achievement Review', params: { step: '1' } })">
          <AppIcon name="ui-weekly-review" /> 주간 결산 시작하기
        </button>
      </div>

      <!-- ⑤ 이번 주 목표 — 이번 주에 배치된 프로젝트 모두. 누르면 로드맵. 결산 버튼은 결산일에만 오늘 할 일 아래(.ah-review) -->
      <section v-if="weekGoals.length || review" class="ah-sec">
        <div class="ah-week" role="link" tabindex="0" @click="goRoadmap" @keydown.enter="goRoadmap">
          <div class="ah-week__head">
            <h2 class="ah-week__title">이번 주 목표<span v-if="weekNumber"> · {{ weekNumber }}주차</span></h2>
            <span v-if="review && !reviewDone" class="ah-week__badge" :class="{ 'ah-week__badge--today': review.kind !== 'left' }">
              {{ review.kind === 'today' ? '오늘 결산' : review.kind === 'last' ? '결산 오늘까지' : `결산 D-${review.days}` }}
            </span>
          </div>
          <ul class="ah-week__list">
            <li v-for="g in weekGoals" :key="g.project.id" class="ah-goal">
              <span class="ah-goal__name"><i class="ah-day__dot" :style="{ background: categoryColor(g.project.category) }" /><PeriodTag v-if="g.period" /> {{ g.project.name }}</span>
              <!-- '할 일' — 주간 일정의 칸(하는 날)과 세는 단위가 달라 단위를 붙인다(2026-11-21 A3). 과정은 '일' -->
              <span class="ah-goal__count"><template v-if="!g.period">할 일 </template><strong>{{ g.done }}</strong>/{{ g.total }}{{ g.period ? '일' : '' }}</span>
              <span class="ah-goal__bar">
                <i
                  v-for="i in g.total" :key="i" class="ah-goal__seg"
                  :style="i <= g.done ? { background: categoryColor(g.project.category) } : undefined"
                />
              </span>
            </li>
          </ul>
          <p v-if="!weekGoals.length" class="ah-sec__empty">이번 주에 배치된 프로젝트가 없어요.</p>
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

    <!-- 붙은 프로젝트가 끝난 루틴 — '감 유지로 바꾸기 / 끝내기'를 한 번 묻는다(2026-11-21). 결산 팝업이 떠 있으면 기다린다 -->
    <RoutineEndSheet
      v-if="endSheet && !promptOpen"
      :routine="endSheet.routine" :project="endSheet.project"
      :on-decide="(c) => decideEnded(endSheet!.routine.id, c)"
      @close="markAsked(endSheet.routine.id)"
    />

    <!-- 끝낸 줄 메뉴·완료 취소 확인 판(#101) -->
    <DoneMenuSheet
      :open="!!menuRow" :name="menuRow?.name ?? ''" :sub="menuSub"
      @view="viewRecord" @refocus="refocus" @undo="askUndo" @close="menuRow = null"
    />
    <ConfirmSheet
      v-model="undoOpen" title="완료를 취소할까요?" :message="undoInfo?.summary ?? ''"
      confirm-label="완료 취소" cancel-label="그대로 두기" @confirm="confirmUndo"
    >
      <ul v-if="undoInfo" class="ah-undo">
        <li><span>오늘 할 일</span><b>{{ undoInfo.p.today.before }}/{{ undoInfo.p.today.total }} → {{ undoInfo.p.today.after }}/{{ undoInfo.p.today.total }}</b></li>
        <li v-if="undoInfo.p.streak.before !== undoInfo.p.streak.after"><span>연속 달성</span><b>{{ undoInfo.p.streak.before }}일 → {{ undoInfo.p.streak.after }}일</b></li>
        <li v-if="undoInfo.p.goal"><span>이번 주 목표 · {{ undoInfo.p.goal.name }}</span><b>할 일 {{ undoInfo.p.goal.before }}/{{ undoInfo.p.goal.total }} → {{ undoInfo.p.goal.after }}/{{ undoInfo.p.goal.total }}</b></li>
        <li v-if="undoInfo.p.progress.shown && undoInfo.p.progress.before !== undoInfo.p.progress.after"><span>전체 진행</span><b>{{ undoInfo.p.progress.before }}% → {{ undoInfo.p.progress.after }}%</b></li>
        <li v-if="undoInfo.loss" class="ah-undo__loss">{{ undoInfo.loss }}</li>
      </ul>
    </ConfirmSheet>

    <!-- 주간결산 팝업 — 한 주에 한 번(전날 다 했을 때 / 못 했으면 시작일 첫 접속) -->
    <div v-if="promptOpen" class="ah-pop" role="dialog" aria-modal="true" aria-labelledby="ah-pop-title">
      <div class="ah-pop__panel">
        <span class="ah-pop__icon"><AppIcon name="ui-weekly-review" /></span>
        <h2 id="ah-pop-title" class="ah-pop__title">한 주를 마무리할 시간이에요</h2>
        <p class="ah-pop__desc">이번 주를 돌아보고, 다음 주 속도를 정해 봐요.<br>5단계 · 약 2분</p>
        <button type="button" class="ah-pop__go" @click="startReview">주간결산 시작하기</button>
        <button type="button" class="ah-pop__later" @click="promptOpen = false">나중에 하기</button>
        <p class="ah-pop__note">{{ moment?.day === 'eve' ? '내일 하루 동안 홈에서 다시 시작할 수 있어요' : '오늘이 지나면 이번 주 결산은 건너뛰어요' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 진로달성 메인 — 설계를 마친 뒤의 홈(2026-10-28 개편, 사용자와 항목별로 정함 → tasks/career-achievement-redesign.md)
// 예전 실데이터 화면은 CareerAchievementPage copy.vue, 팀원 더미 시안 컴포넌트는 components/(TaskCard 등)
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { usePlanBoard } from '../composables/usePlanBoard'
import { categoryColor, noPlanView, reviewMoment, shouldPromptReview } from '../lib/planBoard'
import { useAchievementStore } from '@/shared/stores/achievement'
import { reviewState } from '../composables/useReviewState'
import { methodIcon } from '@/modules/career-design/composables/projectMethods'
import PeriodTag from '@/modules/career-design/components/PeriodTag.vue'
import RoutineMeasureCard from '../components/RoutineMeasureCard.vue'
import RoutineEndSheet from '../components/RoutineEndSheet.vue'
import { ROUTINE_COLOR, ROUTINE_TINT } from '../composables/usePlanBoard'
import type { Project } from '@/modules/career-design/types/career-design'
import { daysUntil, examDateOf, mdLabel } from '@/modules/career-design/lib/examDate'
import { COPY } from '@/modules/career-design/lib/examDateRules'
import { elapsedOf, elapsedText, pausedEyebrow, type FocusSession } from '../lib/focusSession'
import DoneMenuSheet from '../components/DoneMenuSheet.vue'
import ConfirmSheet from '@/shared/components/ConfirmSheet.vue'
import { showToast } from '@/shared/composables/useAppToast'
import { formatMinutes } from '@/modules/encyclopedia/lib/preparation'
import { lossLine, opensDoneMenu, recordSummary } from '../lib/undoDone'

const router = useRouter()
const goRoadmap = () => router.push({ name: 'Career Achievement Roadmap' })
const RING_LEN = 2 * Math.PI * 27

const {
  loading, plan, phase, load, today,
  streak, progress, dDay,
  userName, headline, message, todayTotal, todayDone,
  previews,
  todayProjects, todayRoutines, todayFocus, startProject, toggleRoutine, toggleProject, periodToday, isProjectDone, isRoutineDone,
  weekGoals, weekNumber, review,
  pausedFor, heldSessions, resumeFocus, projectOf, todayKey,
  pullAhead, startAhead,
  routineWeekCount, measureDue, saveRecord, endedRoutines, markAsked, decideEnded,
  recordOf, undoPreview, undoProject,
} = usePlanBoard()
const endSheet = computed(() => (loading.value ? null : endedRoutines.value[0] ?? null))

// 가장 가까운 시험(오늘 포함) — 시험일 역산(2026-11-22)
const nextExam = computed(() => {
  const pl = plan.value
  if (!pl) return null
  const list = pl.projects
    .map((p) => ({ name: p.name, date: examDateOf(p) }))
    .filter((x) => !!x.date)
    .map((x) => ({ ...x, days: daysUntil(x.date, today.value) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)
  return list[0] ?? null
})

// 분류 색의 옅은 바탕(아이콘 칩)
const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`

const allDone = computed(() => todayTotal.value > 0 && todayDone.value >= todayTotal.value)

// 오늘 할 일 한 줄 — 프로젝트·루틴을 한 목록으로(구분은 칩 색: 프로젝트=분류 색, 루틴=파랑)
// 과정(2026-11-16)은 루틴처럼 '완료' 한 번 — 칩은 과정 그림, 아래 줄은 '근무 · 6/12주'
interface TodayRow { key: string; type: 'project' | 'routine' | 'period'; id: string; name: string; sub: string; icon: string; chipStyle?: Record<string, string>; project?: Project; session?: FocusSession }
// 멈춘 집중 한 줄 — 홈에서는 '23분 40초'(시트의 '23:40'은 시각처럼 읽혀서)
const pausedSub = (s: FocusSession) => `${elapsedText(elapsedOf(s, Date.now()))} 집중했어요`
const PERIOD_CHIP = { color: '#8A5A00', background: '#FFF4D6' }
function toggleRow(t: TodayRow) {
  if (t.type === 'period') toggleProject(t.id)
  else toggleRoutine(t.id)
}
const rows = computed(() => {
  const pending: TodayRow[] = []
  const finished: TodayRow[] = []
  const pausedRows: TodayRow[] = [] // 멈춘 집중은 '지금 할 일' 자리로(2026-11-19 정할 것 4)
  for (const p of todayProjects.value) {
    if (p.period) {
      const info = periodToday(p)
      const row: TodayRow = {
        key: 'p' + p.id, type: 'period', id: p.id, name: p.name, project: p,
        sub: info ? `${info.label} · ${info.nth}/${info.of}주` : '과정', icon: 'kind-period', chipStyle: PERIOD_CHIP,
      }
      ;(isProjectDone(p.id) ? finished : pending).push(row)
      continue
    }
    const c = categoryColor(p.category)
    const s = isProjectDone(p.id) ? null : pausedFor(p.id)
    if (s) {
      pausedRows.push({
        key: 'p' + p.id, type: 'project', id: p.id, name: p.name, project: p, session: s,
        sub: pausedSub(s), icon: methodIcon(p.method) || 'ui-target', chipStyle: { color: c, background: tint(c) },
      })
      continue
    }
    const f = todayFocus(p)
    const row: TodayRow = {
      key: 'p' + p.id, type: 'project', id: p.id, name: p.name, project: p,
      sub: (f.weekIdx ? `${f.weekIdx}주차 · ` : '') + f.text,
      icon: methodIcon(p.method) || 'ui-target', chipStyle: { color: c, background: tint(c) },
    }
    ;(isProjectDone(p.id) ? finished : pending).push(row)
  }
  for (const r of todayRoutines.value) {
    // '이번 주 1/3번'(2026-11-21 루틴 리뉴얼 정할 것 6) — 연속 기록이 아니라 그 주에 나온 날 중 한 날
    const wc = routineWeekCount(r.id, weekNumber.value)
    const row: TodayRow = {
      key: 'r' + r.id, type: 'routine', id: r.id, name: r.name,
      sub: `루틴 · ${r.duration}분` + (wc.planned > 1 ? ` · 이번 주 ${wc.done}/${wc.planned}번` : ''),
      icon: 'ui-repeat', chipStyle: { color: ROUTINE_COLOR, background: ROUTINE_TINT },
    }
    ;(isRoutineDone(r.id) ? finished : pending).push(row)
  }
  return { pending: [...pausedRows, ...pending], finished }
})
// ── 끝낸 줄을 누르면(#101, 2026-11-26 오너 '(다) 작은 메뉴' — lib/undoDone.ts) ──
const itemTypeOf = (t: TodayRow): 'project' | 'routine' => (t.type === 'routine' ? 'routine' : 'project')
const menuRow = ref<TodayRow | null>(null)
const recMeta = (t: TodayRow) => {
  const e = recordOf(itemTypeOf(t), t.id)
  return { minutes: e?.elapsedSec ? Math.round(e.elapsedSec / 60) : 0, photo: !!e?.photoUrl, note: !!e?.note?.trim() }
}
const menuSub = computed(() => {
  const t = menuRow.value
  if (!t) return ''
  const m = recMeta(t)
  return m.minutes > 0 ? `오늘 완료 · ${formatMinutes(m.minutes)}` : '오늘 완료'
})
function tapFinished(t: TodayRow) {
  if (opensDoneMenu(t, !!recordOf(itemTypeOf(t), t.id))) { menuRow.value = t; return }
  // 기록 없이 '완료'만 누른 루틴·과정 — 지금처럼 바로 취소하고 3초 동안 다시 완료할 수 있게
  toggleRow(t)
  showToast('되돌렸어요', 3000, { label: '다시 완료', run: () => { if (!rowDone(t)) toggleRow(t) } })
}
const rowDone = (t: TodayRow) => (t.type === 'routine' ? isRoutineDone(t.id) : isProjectDone(t.id))
// 기록 보기 — 로그 상세(#98)가 생기기 전까지는 로그 탭의 그 카드로 내려 준다
function viewRecord() {
  const t = menuRow.value
  menuRow.value = null
  if (t) router.push({ name: 'Career Achievement Records', query: { focus: `${todayKey.value}:${itemTypeOf(t)}:${t.id}` } })
}
// 다시 집중하기 — 이미 있는 '끝낸 일 다시 집중'(v0.1.33, 시간 더하기)의 입구
function refocus() {
  const t = menuRow.value
  menuRow.value = null
  if (t) router.push({ path: `/career-achievement/start/${itemTypeOf(t)}/${t.id}`, query: { date: todayKey.value } })
}
const undoOpen = ref(false)
const undoRow = ref<TodayRow | null>(null)
const undoInfo = computed(() => {
  const t = undoRow.value
  if (!t) return null
  const m = recMeta(t)
  const p = undoPreview(t.id)
  return { p, summary: `${t.name}\n${recordSummary(m, formatMinutes)}`, loss: lossLine(m, formatMinutes) }
})
function askUndo() {
  undoRow.value = menuRow.value
  menuRow.value = null
  undoOpen.value = true
}
async function confirmUndo() {
  const t = undoRow.value
  if (!t) return
  if (t.type === 'project') await undoProject(t.id)
  else if (rowDone(t)) toggleRow(t)
  undoRow.value = null
}

const held = computed(() => heldSessions.value.map((s) => {
  const p = projectOf(s.itemId)
  const c = categoryColor(p?.category ?? s.itemCategory)
  return {
    key: s.date + s.itemId, session: s, name: p?.name ?? s.itemName, sub: pausedSub(s),
    eyebrow: pausedEyebrow(s.date, todayKey.value, !!s.afterDone),
    icon: (p && methodIcon(p.method)) || 'ui-target', chipStyle: { color: c, background: tint(c) },
  }
}))
const pending = computed(() => rows.value.pending)
const finished = computed(() => rows.value.finished)
const MAX_PENDING = 4
const showAll = ref(false)
const visiblePending = computed(() => showAll.value ? pending.value : pending.value.slice(0, MAX_PENDING))
const hiddenCount = computed(() => pending.value.length - visiblePending.value.length)

// 링은 0에서 차오르게 — 첫 그림을 0으로 그린 뒤 한 프레임 뒤에 값을 준다
// ── 주간결산 시점 ──
const moment = computed(() => plan.value ? reviewMoment(today.value, plan.value.startDate, plan.value.reviewDay, phase.value) : null)
const rs = computed(() => (plan.value && moment.value ? reviewState(plan.value.planId, moment.value.weekStart) : null))
const reviewDone = computed(() => !!rs.value?.done.value)
// 버튼은 시작일 하루만(미뤘을 때), 결산을 마쳤으면 없다
const showReviewButton = computed(() => moment.value?.day === 'start' && !reviewDone.value)
const promptOpen = ref(false)
watch([moment, todayTotal, todayDone, loading, () => rs.value?.loaded.value], () => {
  if (loading.value || !rs.value || !rs.value.loaded.value) return
  if (shouldPromptReview(moment.value, { todayTotal: todayTotal.value, todayDone: todayDone.value, prompted: rs.value.prompted.value, done: rs.value.done.value })) {
    promptOpen.value = true
    rs.value.markPrompted()
  }
}, { immediate: true })
function startReview() {
  promptOpen.value = false
  router.push({ name: 'Career Achievement Review', params: { step: '1' } })
}

// 진행 중인 계획이 없으면 계획 전 홈으로(2026-11-25 핫픽스 — lib/planBoard noPlanView). 못 읽었으면 여기 남아 다시 불러오게 한다
const achievementStore = useAchievementStore()
const leaving = ref(false)
function afterLoad(): boolean {
  if (noPlanView(!!plan.value, achievementStore.loadFailed) !== 'before') return false
  leaving.value = true
  router.replace('/main/before')
  return true
}
async function retry() {
  loading.value = true
  await achievementStore.loadActivePlan(true)
  await load()
  afterLoad()
}

const shown = ref(false)
onMounted(async () => {
  await load()
  if (afterLoad()) return
  requestAnimationFrame(() => requestAnimationFrame(() => { shown.value = true }))
})
</script>
