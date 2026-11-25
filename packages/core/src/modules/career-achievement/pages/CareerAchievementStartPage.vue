<template>
  <!-- 집중모드(2026-11-04 개편, C안 '채움' · L1 크림) — 목표 시간 설정 → 3·2·1 → 화면 전체 타이머(노랑이 바닥부터 차오름) → 완료.
       다른 시안(A 등대·B 다이얼)은 레포 docs/design/focus-mode-mockup.html — 팀 의견으로 바꿀 수 있다.
       계산은 lib/focusTimer.ts, 스타일은 appearance/modules/career-achievement/AchievementFocus.scss -->
  <div class="fm">
    <div v-if="loading" class="fm-loading">불러오는 중...</div>

    <div v-else-if="!itemName" class="fm-empty">
      <p>항목을 찾을 수 없어요.</p>
      <button type="button" @click="router.replace('/career-achievement')">돌아가기</button>
    </div>

    <!-- ① 목표 시간 설정 -->
    <section v-else-if="phase === 'setup'" class="fm-setup">
      <header class="fm-setup__bar">
        <button type="button" class="fm-setup__x" aria-label="닫기" @click="exit"><AppIcon name="ui-close" /></button>
        <b>집중 모드</b>
        <span />
      </header>
      <div class="fm-setup__item">
        <span class="fm-setup__chip" :style="chipStyle">{{ chipLabel }}</span>
        <h2>{{ itemName }}</h2>
        <p v-if="projectGoal">{{ projectGoal }}</p>
      </div>

      <p class="fm-setup__label">목표 집중 시간</p>
      <div class="fm-setup__goal">
        <button type="button" class="fm-setup__step" aria-label="5분 줄이기" :disabled="goalMin <= FOCUS_MIN" @click="setGoal(goalMin - FOCUS_STEP)">−</button>
        <div class="fm-setup__value fm-num">{{ goalMin }}<small>분</small></div>
        <button type="button" class="fm-setup__step" aria-label="5분 늘리기" :disabled="goalMin >= FOCUS_MAX" @click="setGoal(goalMin + FOCUS_STEP)">+</button>
      </div>
      <p class="fm-setup__end">지금 시작하면 <b>{{ endAtLabel }}</b>에 끝나요</p>
      <div class="fm-setup__presets">
        <button v-for="m in FOCUS_PRESETS" :key="m" type="button" :class="{ on: goalMin === m }" @click="setGoal(m)">{{ m }}분</button>
        <!-- 루틴(2026-11-26) — 1회 시간과 바쁜 날 최소를 칩으로 더(이미 있는 값이면 빼고) -->
        <button v-for="c in extraPresets" :key="c.min" type="button" :class="{ on: goalMin === c.min }" @click="setGoal(c.min)">{{ c.label }}</button>
      </div>

      <div class="fm-setup__opts">
        <button type="button" class="fm-setup__opt" @click="keepAwake = !keepAwake">
          화면 켜짐 유지 <span class="fm-tgl" :class="{ on: keepAwake }" />
        </button>
        <button type="button" class="fm-setup__opt" @click="notify = !notify">
          목표 시간이 되면 진동 <span class="fm-tgl" :class="{ on: notify }" />
        </button>
      </div>
      <button type="button" class="fm-setup__go" @click="countdown">집중 시작</button>
    </section>

    <!-- ② 3·2·1 -->
    <section v-else-if="phase === 'count'" class="fm-count"><span :key="countN">{{ countN }}</span></section>

    <!-- ③ 타이머 — 화면 어디든 누르면 잠시 멈춤 -->
    <section v-else-if="phase === 'run'" class="fm-run" :class="{ paused, over: digits.over, filled: fill > 6 }" @click="pause">
      <div class="fm-run__liquid" :style="{ height: `${fill}%` }">
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20 Q 75 0 150 20 T 300 20 T 450 20 T 600 20 T 750 20 T 900 20 T 1050 20 T 1200 20 V40 H0 Z" /></svg>
      </div>
      <!-- 같은 글자를 두 겹 — 노랑에 잠긴 부분만 검정으로 보이게 위 겹을 잘라 낸다 -->
      <div v-for="layer in ['light', 'dark']" :key="layer" class="fm-run__layer" :class="`fm-run__layer--${layer}`"
        :style="layer === 'dark' ? { clipPath: `inset(${100 - fill}% 0 0 0)` } : undefined">
        <div class="fm-run__meta"><span>{{ paused ? '잠시 멈춤' : '집중 중' }}</span></div>
        <div class="fm-run__name">{{ itemName }}</div>
        <!-- 분이 주인공, 초는 오른쪽 위에 작게(V3, 2026-11-04) — '남은 시간' 라벨 대신 아래 한 줄 -->
        <div class="fm-run__big fm-num" :class="{ long: digits.min.length > 2 }"><span class="m">{{ digits.min }}</span><span class="s">{{ digits.sec }}</span></div>
        <div class="fm-run__cap">{{ digits.over ? '목표를 넘겼어요 · 계속 집중 중' : `남았어요 · 끝날 예정 ${hm(endAt)}` }}</div>
        <div class="fm-run__foot"><span>목표 {{ goalMin }}분</span><b class="fm-num">{{ percent }}%</b></div>
      </div>
      <p class="fm-run__hint">화면을 누르면 잠시 멈춰요</p>
      <div class="fm-run__sheet" @click.stop>
        <!-- 집중 취소는 같은 시트에서 한 번 더 묻는다(2026-11-19 정할 것 2 — 브라우저 확인 창 쓰지 않음) -->
        <template v-if="sheetStep === 'confirm'">
          <h4>집중을 취소할까요?</h4>
          <p>집중한 {{ cancelLoss }} 사라져요</p>
          <div class="fm-run__row">
            <button type="button" @click="sheetStep = 'menu'">그대로 두기</button>
            <button type="button" class="danger" @click="confirmCancel">취소하고 홈으로</button>
          </div>
        </template>
        <template v-else>
          <h4>잠시 멈췄어요</h4>
          <p>지금까지 {{ clockLabel(elapsed) }} 집중했어요</p>
          <div class="fm-run__row">
            <button type="button" @click="finish">다 했어요</button>
            <button type="button" class="p" @click="resume">이어서 집중</button>
          </div>
          <!-- 2026-11-19 정할 것 1 — 원래 두 버튼은 그대로, 아래에 작은 글자 둘 -->
          <div v-if="keepable" class="fm-run__quiet">
            <button type="button" @click="later">나중에 이어 하기</button>
            <i aria-hidden="true" />
            <button type="button" class="danger" @click="askCancel">집중 취소</button>
          </div>
        </template>
      </div>
    </section>

    <!-- ④ 완료 — 판정하지 않는다(일찍 끝낸 건 일이 빨리 끝난 것일 수 있다) -->
    <section v-else class="fm-done">
      <!-- 1분이 안 되면 초로(2026-11-21 A1 — 14초가 '0분'으로 보였다) -->
      <div class="fm-done__badge"><div class="fm-done__huge fm-num">{{ badge.num }}<small>{{ badge.unit }}</small></div></div>
      <h3>집중을 마쳤어요</h3>
      <p>{{ gap.line }}</p>
      <div class="fm-done__stats">
        <div><b class="fm-num">{{ clockLabel(elapsed) }}</b><small>집중한 시간</small></div>
        <div><b class="fm-num">{{ gap.diff }}</b><small>{{ gap.sub }}</small></div>
      </div>
      <div class="fm-done__btns">
        <button type="button" class="p" @click="toRecord">기록 남기기</button>
        <button type="button" @click="resume">이어서 집중하기</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import type { Project, Routine } from '@/modules/career-design/types/career-design'
import { CATEGORY_META } from '../lib/planBoard'
import {
  FOCUS_PRESETS, FOCUS_MIN, FOCUS_MAX, FOCUS_STEP,
  clampGoal, focusGap, focusDigits, clockLabel, focusBadge,
} from '../lib/focusTimer'
import { applyThemeColor, THEME_COLOR } from '@/shared/router/themeColor'
import { safeBack } from '@/shared/utils/navigation'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useFocusSessions } from '../composables/useFocusSessions'
import { useAchievement } from '../composables/useAchievement'
import { validDateKey } from '../lib/pullAhead'
import { sessionKey, elapsedOf, elapsedText, subjectJosa, asFocusItemType, freeSessionOf, newFreeId, FREE_ID_RE, type FocusSession } from '../lib/focusSession'
import { FREE_LABEL } from '../lib/focusLog'
import { ROUTINE_COLOR } from '../composables/usePlanBoard'

const route = useRoute()
const router = useRouter()
const { draftPlan, fetchMyPlans, loadPlanFromApi } = useCareerDesign()
const achStore = useAchievementStore()
const focusSessions = useFocusSessions()
const ach = useAchievement()
const HOME = '/career-achievement'

// 종류 — 프로젝트 · 루틴(2026-11-26 #95) · 바로 집중(#96, 항목 없이). 바로 집중의 항목 열쇠는 'f' + 시작 시각으로
// 시작할 때 정한다(주소는 /start/free/new). 이어 하기·새로 고침은 주소의 열쇠, 없으면 기기에 멈춰 둔 바로 집중(한 번에 하나)
const itemType = computed(() => asFocusItemType(route.params.type))
const isFree = computed(() => itemType.value === 'free')
const freeId = ref(FREE_ID_RE.test(String(route.params.id ?? '')) ? String(route.params.id) : '')
const itemId = computed(() => (isFree.value ? freeId.value : String(route.params.id ?? '')))
const dateKey = computed(() => String(route.query.date ?? toTodayKey()))

function toTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loading = ref(true)

const item = computed<Project | Routine | null>(() => {
  if (!itemId.value || isFree.value) return null
  if (itemType.value === 'project') return draftPlan.projects.find(p => p.id === itemId.value) ?? null
  return draftPlan.routines.find(r => r.id === itemId.value) ?? null
})
// 멈춘 집중(2026-11-19) — 계획을 못 불러와도(오프라인) 기기에 적어 둔 이름으로 그린다.
// 2026-11-26부터 루틴·바로 집중도 멈춤·나중에 이어 하기·집중 취소가 프로젝트와 같다(내가 정한 것 2) — 아래 confirm() 길은 이제 쓰지 않는다
const keepable: boolean = true
const focusKey = computed(() => sessionKey(dateKey.value, itemType.value, itemId.value))
const saved = ref<FocusSession | null>(null)
// 미리 하기(2026-11-23) — 옮겨 올 칸의 원래 날짜. 주소에 없으면(이어 하기·새로 고침) 기기에 적어 둔 멈춘 집중의 것
const aheadFrom = computed(() => validDateKey(route.query.from) ?? saved.value?.from ?? null)
const itemName = computed(() => (isFree.value ? FREE_LABEL : item.value?.name ?? saved.value?.itemName ?? ''))
const category = computed(() => {
  const c = itemType.value === 'project' ? ((item.value as Project | null)?.category ?? saved.value?.itemCategory) : undefined
  return c ? CATEGORY_META[c] : null
})
const chipLabel = computed(() => category.value?.label ?? (isFree.value ? FREE_LABEL : '루틴'))
// 칩 색 — 프로젝트는 분류 색, 루틴은 홈과 같은 파랑, 바로 집중은 회색(2026-11-26 내가 정한 것 5)
const chipColor = computed(() => category.value?.color ?? (isFree.value ? '#6B6B6B' : itemType.value === 'routine' ? ROUTINE_COLOR : '#FFD100'))
const chipStyle = computed(() => ({ color: chipColor.value, background: `color-mix(in srgb, ${chipColor.value} 18%, transparent)` }))
// 이름 아래 한 줄 — 프로젝트는 목표, 루틴은 함께 하는 프로젝트, 바로 집중은 끝나고 적는다는 안내
const projectGoal = computed(() => {
  if (isFree.value) return '무엇을 했는지는 끝나고 적어요'
  if (itemType.value === 'routine') {
    const pid = (item.value as Routine | null)?.projectId
    return (pid && draftPlan.projects.find((p) => p.id === pid)?.name) || ''
  }
  return (item.value as Project | null)?.goal ?? ''
})
// 루틴 목표 칩(2026-11-26 내가 정한 것 5) — 1회 시간, 바쁜 날 최소가 있으면 하나 더. 기본 칩과 같은 값이면 더하지 않는다
const extraPresets = computed(() => {
  if (itemType.value !== 'routine') return []
  const r = item.value as Routine | null
  const base = FOCUS_PRESETS as readonly number[]
  const out: { min: number; label: string }[] = []
  const d = r ? clampGoal(r.duration) : 0
  if (d && !base.includes(d)) out.push({ min: d, label: `${d}분` })
  const m = r?.minMinutes ? clampGoal(r.minMinutes) : 0
  if (m && m !== d && !base.includes(m)) out.push({ min: m, label: `바쁜 날 ${m}분` })
  return out
})

// ── 설정 ──
type Phase = 'setup' | 'count' | 'run' | 'done'
const phase = ref<Phase>('setup')
const goalMin = ref(25)
const keepAwake = ref(true)
const notify = ref(true)
const setGoal = (m: number) => { goalMin.value = Math.min(FOCUS_MAX, Math.max(FOCUS_MIN, m)) }

// ── 시간 — 시작 시각 기준으로 센다(앱을 잠깐 나갔다 와도 이어진다) ──
const now = ref(Date.now())
let ticker: number | null = null
const accSec = ref(0)              // 멈추기 전까지 쌓인 시간
let segStart = 0                    // 지금 구간 시작 시각
const paused = ref(false)
const started = computed(() => phase.value === 'run' || phase.value === 'done')
const elapsed = computed(() => accSec.value + (phase.value === 'run' && !paused.value ? (now.value - segStart) / 1000 : 0))
const goalSec = computed(() => goalMin.value * 60)
const digits = computed(() => focusDigits(elapsed.value, goalSec.value))
const percent = computed(() => Math.floor((elapsed.value / goalSec.value) * 100))
const fill = computed(() => Math.min(100, (elapsed.value / goalSec.value) * 100))
const gap = computed(() => focusGap(elapsed.value, goalSec.value))
const badge = computed(() => focusBadge(elapsed.value))
// 지금 페이스면 끝날 시각(멈춘 동안은 그만큼 밀린다)
const endAt = computed(() => new Date(now.value + Math.max(0, goalSec.value - elapsed.value) * 1000))
const endAtLabel = computed(() => {
  const d = new Date(now.value + goalSec.value * 1000)
  return `${d.getHours() < 12 ? '오전' : '오후'} ${((d.getHours() + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, '0')}`
})
const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

function startTicker() {
  if (ticker === null) ticker = window.setInterval(() => { now.value = Date.now() }, 250)
}
function stopTicker() {
  if (ticker !== null) { clearInterval(ticker); ticker = null }
}

// 3·2·1
const countN = ref(3)
function countdown() {
  phase.value = 'count'
  countN.value = 3
  const step = () => {
    if (phase.value !== 'count') return
    if (countN.value <= 1) return begin()
    countN.value--
    window.setTimeout(step, 800)
  }
  window.setTimeout(step, 800)
}
function begin() {
  if (isFree.value && !freeId.value) freeId.value = newFreeId(Date.now()) // 바로 집중의 열쇠는 시작할 때
  accSec.value = 0
  reachedNotified = false
  resume()
}
function resume() {
  segStart = Date.now()
  now.value = segStart
  paused.value = false
  phase.value = 'run'
  sheetStep.value = 'menu'
  startTicker()
  void lockScreen()
  persist()
}
function pause() {
  if (paused.value) return
  accSec.value = elapsed.value
  paused.value = true
  sheetStep.value = 'menu'
  void unlockScreen()
  persist()
}
function finish() {
  if (!paused.value) accSec.value = elapsed.value
  paused.value = true
  phase.value = 'done'
  stopTicker()
  void unlockScreen()
  persist() // 마침 화면에서 뒤로 가도 멈춘 집중으로 남는다
}

// ── 멈춘 집중을 기기에 적어 두기(2026-11-19 정할 것 6 — 집중하는 동안 늘. 꺼진 동안도 벽시계로 센다) ──
const sheetStep = ref<'menu' | 'confirm'>('menu')
function persist() {
  if (!keepable || !itemName.value || !itemId.value) return
  const running = phase.value === 'run' && !paused.value
  const s: FocusSession = {
    v: 1,
    // 홈이 정리할 때 맞춰 보는 계획 — 홈과 같은 '진행 중인 계획'(achievement store) 기준
    planId: achStore.plan?.planId ?? saved.value?.planId ?? draftPlan.planId ?? '',
    date: dateKey.value,
    itemType: itemType.value,
    itemId: itemId.value,
    itemName: itemName.value,
    itemCategory: itemType.value === 'project' ? ((item.value as Project | null)?.category ?? saved.value?.itemCategory) : undefined,
    goalMin: goalMin.value,
    accSec: accSec.value,
    state: running ? 'running' : 'paused',
    segStart: running ? segStart : null,
    reached: reachedNotified,
    // 시작할 때 이미 완료였나 — 한 번 정하면 그대로(이어 하는 동안 바뀌지 않게)
    afterDone: saved.value ? !!saved.value.afterDone
      : itemType.value === 'routine' ? ach.isRoutineDone(itemId.value, dateKey.value)
      : itemType.value === 'project' ? ach.isProjectDone(itemId.value, dateKey.value) : false,
    ...(aheadFrom.value ? { from: aheadFrom.value } : {}),
    keepAwake: keepAwake.value,
    notify: notify.value,
    updatedAt: Date.now(),
  }
  focusSessions.put(focusKey.value, s)
  saved.value = s
}
// 홈에서 '이어 하기'·새로 고침으로 다시 열 때 — 멈춤이면 시트가 열린 채, 흐르던 것(새로 고침)은 그대로 흐른다
function restore(s: FocusSession) {
  saved.value = s
  goalMin.value = s.goalMin
  keepAwake.value = s.keepAwake
  notify.value = s.notify
  accSec.value = s.accSec
  const t = Date.now()
  // 꺼진 동안 목표를 넘겼으면 다시 열 때 진동하지 않는다
  reachedNotified = s.reached || elapsedOf(s, t) >= s.goalMin * 60
  now.value = t
  phase.value = 'run'
  sheetStep.value = 'menu'
  if (s.state === 'running' && s.segStart != null) {
    segStart = s.segStart
    paused.value = false
    startTicker()
    void lockScreen()
  } else {
    paused.value = true
  }
}
const cancelLoss = computed(() => { const t = elapsedText(elapsed.value); return t + subjectJosa(t) })
// 나중에 이어 하기 — 멈춘 채 홈으로
function later() {
  persist()
  bypassLeaveGuard = true
  safeBack(router, HOME)
}
function askCancel() { sheetStep.value = 'confirm' }
// 취소하고 홈으로 — 기기에 남긴 시간만 지운다(저장 전이라 서버에 간 것이 없다)
function confirmCancel() {
  focusSessions.remove(focusKey.value)
  saved.value = null
  bypassLeaveGuard = true
  safeBack(router, HOME)
}
function toRecord() {
  bypassLeaveGuard = true
  router.replace({
    path: `/career-achievement/complete/${itemType.value}/${itemId.value}`,
    // goal — 기록 작성 화면이 '계획 · 60분' 대신 이때 고른 '목표 · 15분'을 보이게(2026-11-21 A2)
    query: { date: dateKey.value, elapsed: String(Math.floor(elapsed.value)), goal: String(goalMin.value), ...(aheadFrom.value ? { from: aheadFrom.value } : {}) },
  })
}

// 목표 시간 도달 — 진동 한 번(지원하는 기기만. iOS 사파리는 진동 API 가 없다)
let reachedNotified = false
watch(() => digits.value.over, (over) => {
  if (!over || reachedNotified || phase.value !== 'run') return
  reachedNotified = true
  if (notify.value) navigator.vibrate?.([200, 100, 200])
  persist()
})

// ── 화면 켜짐 유지(Wake Lock) — 지원 안 하는 브라우저는 조용히 넘어간다 ──
type Sentinel = { release: () => Promise<void> }
let wakeLock: Sentinel | null = null
async function lockScreen() {
  if (!keepAwake.value || wakeLock) return
  try { wakeLock = await (navigator as any).wakeLock?.request('screen') ?? null } catch { wakeLock = null }
}
async function unlockScreen() {
  const w = wakeLock
  wakeLock = null
  try { await w?.release() } catch { /* 이미 풀림 */ }
}
// 다른 앱에 다녀오면 잠금이 풀린다 — 돌아왔을 때 다시
function onVisible() {
  if (document.visibilityState !== 'visible') return
  now.value = Date.now()
  if (phase.value === 'run' && !paused.value) { wakeLock = null; void lockScreen() }
}

// 상단(노치) 색 — 크림 바탕, 노랑이 화면 끝까지 차오르면 노랑
watch([phase, fill], () => {
  applyThemeColor(phase.value === 'run' && fill.value > 93 ? THEME_COLOR.primary : THEME_COLOR.focus)
}, { immediate: true })

// ── 나가기 ──
let bypassLeaveGuard = false
const hasProgress = () => started.value && elapsed.value >= 1
// 설정 화면 X — 뒤로 갈 곳이 없으면 홈으로(R1. 바로 연 화면에서 앱을 벗어나지 않게)
function exit() {
  bypassLeaveGuard = true
  safeBack(router, HOME)
}
onBeforeRouteLeave((to, _from, next) => {
  if (!bypassLeaveGuard && keepable) {
    // 2026-11-19 정할 것 3 — 집중 중 뒤로 가기(브라우저·안드로이드 R4) = 멈추고 시트를 연다. 멈춘 상태면 멈춘 채 홈으로.
    // 확인 창은 없다. 로그인이 풀려 /onboarding 으로 가는 이동은 막지 않고 적어만 둔다
    if (phase.value === 'run' && !paused.value && !to.path.startsWith('/onboarding')) {
      pause()
      return next(false)
    }
    if (started.value) persist()
  } else if (!bypassLeaveGuard && hasProgress()) {
    if (!confirm('집중한 기록이 사라져요. 정말 나가시겠어요?')) return next(false)
  }
  stopTicker()
  void unlockScreen()
  next()
})

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisible)
  try {
    await Promise.all([
      (async () => {
        if (!draftPlan.planId) {
          const plans = await fetchMyPlans()
          const target = plans.find((p: any) => p.status === 'active') ?? plans[0]
          if (target?.planId) await loadPlanFromApi(target.planId)
        }
      })(),
      // 멈춘 집중의 계획 번호를 홈과 같은 기준으로 적으려고(이미 읽었으면 바로 끝난다)
      keepable ? achStore.loadActivePlan() : null,
    ])
  } catch {
    // 연결이 안 되면 계획 없이 — 기기에 적어 둔 멈춘 집중은 그대로 연다
  } finally {
    // 바로 집중을 새로 열었는데 멈춰 둔 것이 있으면 그것을 이어 한다(한 번에 하나 — 내가 정한 것 2)
    if (isFree.value && !freeId.value) {
      const planId = achStore.plan?.planId ?? draftPlan.planId ?? ''
      const f = freeSessionOf(focusSessions.sessions.value, planId, dateKey.value)
      if (f) freeId.value = f.itemId
    }
    const s = keepable && itemId.value ? focusSessions.get(focusKey.value) : null
    if (s) restore(s)
    else goalMin.value = clampGoal(item.value?.duration)
    loading.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisible)
  stopTicker()
  void unlockScreen()
})
</script>
