<template>
  <!-- 집중모드(2026-11-04 개편, C안 '채움') — 목표 시간 설정 → 3·2·1 → 화면 전체 타이머(노랑이 바닥부터 차오름) → 완료.
       다른 시안(A 등대·B 다이얼)은 레포 docs/design/focus-mode-mockup.html — 팀 의견으로 바꿀 수 있다.
       계산은 lib/focusTimer.ts, 스타일은 appearance/modules/career-achievement/AchievementFocus.scss -->
  <div class="fm">
    <div v-if="loading" class="fm-loading">불러오는 중...</div>

    <div v-else-if="!item" class="fm-empty">
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
        <h2>{{ item.name }}</h2>
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
        <div class="fm-run__meta"><span>{{ paused ? '잠시 멈춤' : '집중 중' }}</span><span>목표 {{ goalMin }}분</span></div>
        <div class="fm-run__name">{{ item.name }}</div>
        <div class="fm-run__big fm-num" :class="{ long: digits.min.length > 2 }"><span class="m">{{ digits.min }}</span><span class="s">{{ digits.sec }}</span></div>
        <div class="fm-run__cap">{{ digits.over ? '목표 시간 지남 · 계속 집중 중' : '남은 시간' }}</div>
        <div class="fm-run__foot"><span>끝날 예정 {{ hm(endAt) }}</span><b class="fm-num">{{ percent }}%</b></div>
      </div>
      <p class="fm-run__hint">화면을 누르면 잠시 멈춰요</p>
      <div class="fm-run__sheet" @click.stop>
        <h4>잠시 멈췄어요</h4>
        <p>지금까지 {{ clockLabel(elapsed) }} 집중했어요</p>
        <div class="fm-run__row">
          <button type="button" @click="finish">다 했어요</button>
          <button type="button" class="p" @click="resume">이어서 집중</button>
        </div>
      </div>
    </section>

    <!-- ④ 완료 — 판정하지 않는다(일찍 끝낸 건 일이 빨리 끝난 것일 수 있다) -->
    <section v-else class="fm-done">
      <div class="fm-done__huge fm-num">{{ Math.floor(elapsed / 60) }}<small>분</small></div>
      <h3>집중을 마쳤어요</h3>
      <p>{{ gap.line }}</p>
      <div class="fm-done__stats">
        <div><b class="fm-num">{{ clockLabel(elapsed) }}</b><small>집중한 시간</small></div>
        <div><b class="fm-num">{{ gap.diff }}</b><small>목표 {{ goalMin }}분보다</small></div>
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
  clampGoal, focusGap, focusDigits, clockLabel,
} from '../lib/focusTimer'
import { applyThemeColor, THEME_COLOR } from '@/shared/router/themeColor'

const route = useRoute()
const router = useRouter()
const { draftPlan, fetchMyPlans, loadPlanFromApi } = useCareerDesign()

const itemType = computed<'project' | 'routine'>(() => (route.params.type === 'routine' ? 'routine' : 'project'))
const itemId = computed(() => String(route.params.id ?? ''))
const dateKey = computed(() => String(route.query.date ?? toTodayKey()))

function toTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loading = ref(true)

const item = computed<Project | Routine | null>(() => {
  if (!itemId.value) return null
  if (itemType.value === 'project') return draftPlan.projects.find(p => p.id === itemId.value) ?? null
  return draftPlan.routines.find(r => r.id === itemId.value) ?? null
})
const category = computed(() => {
  const c = itemType.value === 'project' ? (item.value as Project | null)?.category : undefined
  return c ? CATEGORY_META[c] : null
})
const chipLabel = computed(() => category.value?.label ?? '루틴')
const chipStyle = computed(() => {
  const color = category.value?.color ?? '#FFD100'
  return { color, background: `color-mix(in srgb, ${color} 18%, transparent)` }
})
const projectGoal = computed(() => (itemType.value === 'project' ? (item.value as Project | null)?.goal ?? '' : ''))

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
  accSec.value = 0
  reachedNotified = false
  resume()
}
function resume() {
  segStart = Date.now()
  now.value = segStart
  paused.value = false
  phase.value = 'run'
  startTicker()
  void lockScreen()
}
function pause() {
  if (paused.value) return
  accSec.value = elapsed.value
  paused.value = true
  void unlockScreen()
}
function finish() {
  if (!paused.value) accSec.value = elapsed.value
  paused.value = true
  phase.value = 'done'
  stopTicker()
  void unlockScreen()
}
function toRecord() {
  bypassLeaveGuard = true
  router.replace({
    path: `/career-achievement/complete/${itemType.value}/${itemId.value}`,
    query: { date: dateKey.value, elapsed: String(Math.floor(elapsed.value)) },
  })
}

// 목표 시간 도달 — 진동 한 번(지원하는 기기만. iOS 사파리는 진동 API 가 없다)
let reachedNotified = false
watch(() => digits.value.over, (over) => {
  if (!over || reachedNotified || phase.value !== 'run') return
  reachedNotified = true
  if (notify.value) navigator.vibrate?.([200, 100, 200])
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

// 상단(노치) 색 — 어두운 화면, 노랑이 다 차오르면·완료 화면은 노랑
watch([phase, fill], () => {
  applyThemeColor(phase.value === 'done' || (phase.value === 'run' && fill.value > 93) ? THEME_COLOR.primary : THEME_COLOR.focus)
}, { immediate: true })

// ── 나가기 ──
let bypassLeaveGuard = false
const hasProgress = () => started.value && elapsed.value >= 1
function exit() {
  bypassLeaveGuard = true
  router.back()
}
onBeforeRouteLeave((_to, _from, next) => {
  if (!bypassLeaveGuard && hasProgress()) {
    if (!confirm('집중한 기록이 사라져요. 정말 나가시겠어요?')) return next(false)
  }
  stopTicker()
  void unlockScreen()
  next()
})

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisible)
  try {
    if (!draftPlan.planId) {
      const plans = await fetchMyPlans()
      const target = plans.find((p: any) => p.status === 'active') ?? plans[0]
      if (target?.planId) await loadPlanFromApi(target.planId)
    }
  } finally {
    loading.value = false
    goalMin.value = clampGoal(item.value?.duration)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisible)
  stopTicker()
  void unlockScreen()
})
</script>
