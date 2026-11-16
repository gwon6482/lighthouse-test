<template>
  <div class="cd-proj-write" :style="{ '--cat-color': currentColor }">
    <CdYellowHeader
      title="새로운 프로젝트 추가"
      :subtitle="`${draftPlan.targetJob || '목표 직업'}을 위한 프로젝트를 만들어 보세요`"
      :color="currentColor"
      back-to="/career-design/plan/projects"
    />

    <div class="cd-proj-write__body">
      <!-- 프로젝트 종류(2026-11-16, 등록 화면 시안 정할 것 1) — 기본은 진도. 과정이면 아래 칸 이름이 다니는 것에 맞게 바뀌고,
           '다음'이 주차별 할 일 대신 '다니는 방식'(오늘 할 일 이름·점검)으로 간다 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">프로젝트 종류</h3>
        <div class="cd-proj-write__kinds" role="radiogroup" aria-label="프로젝트 종류">
          <button
            type="button" class="cd-proj-write__kind" :class="{ 'cd-proj-write__kind--on': !isPeriodDraft }"
            role="radio" :aria-checked="!isPeriodDraft" @click="setKind(false)"
          >
            <span class="cd-proj-write__kind-title"><AppIcon name="kind-progress" /> 진도<i class="cd-proj-write__kind-dot" /></span>
            <span class="cd-proj-write__kind-desc">할 일을 주차별로 해 나가요</span>
            <small>강의·시험 공부·포트폴리오</small>
          </button>
          <button
            type="button" class="cd-proj-write__kind cd-proj-write__kind--period" :class="{ 'cd-proj-write__kind--on': isPeriodDraft }"
            role="radio" :aria-checked="isPeriodDraft" @click="setKind(true)"
          >
            <span class="cd-proj-write__kind-title"><AppIcon name="kind-period" /> 과정<i class="cd-proj-write__kind-dot" /></span>
            <span class="cd-proj-write__kind-desc">정해진 곳에 다녀요</span>
            <small>학교·실습·인턴·아르바이트</small>
          </button>
        </div>
      </div>

      <!-- 카테고리 선택 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">카테고리</h3>
        <div class="cd-proj-write__categories">
          <div
            v-for="cat in categories"
            :key="cat.value"
            class="cd-proj-write__cat-item"
            :class="{ 'cd-proj-write__cat-item--active': draftProject.category === cat.value }"
            :style="draftProject.category === cat.value ? { borderColor: categoryColorMap[cat.value] } : {}"
            @click="draftProject.category = cat.value"
          >
            <img
              class="cd-proj-write__cat-icon"
              :src="`/career-design/icon-${cat.value}.svg`"
              :alt="cat.label"
            />
            <span
              class="cd-proj-write__cat-label"
              :style="draftProject.category === cat.value ? { color: categoryColorMap[cat.value], fontWeight: '700' } : {}"
            >{{ cat.label }}</span>
          </div>
        </div>
      </div>

      <!-- 진행 방식 (필수, 🧪 시안 2026-10-26) — 어떻게 해 나갈지·언제 끝났다고 할지를 정한다(projectMethods.ts) -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">진행 방식</h3>
        <p class="cd-proj-write__sub-label">이 프로젝트를 어떻게 해 나갈지 골라주세요</p>
        <div class="cd-proj-write__methods">
          <button
            v-for="m in methods"
            :key="m.value"
            type="button"
            class="cd-proj-write__method"
            :class="{ 'cd-proj-write__method--active': draftProject.method === m.value }"
            @click="pickMethod(m.value)"
          ><AppIcon :name="methodIcon(m.value)" /> {{ m.label }}</button>
        </div>
        <template v-if="currentMethod">
          <div v-for="f in methodFields" :key="f.key" class="cd-proj-write__method-field">
            <label class="cd-proj-write__method-label" :for="`m-${f.key}`">{{ f.label }}</label>
            <input
              :id="`m-${f.key}`"
              class="cd-proj-write__input"
              :type="f.type ?? 'text'"
              :value="draftProject.methodDetail?.[f.key] ?? ''"
              :placeholder="f.placeholder"
              @input="setDetail(f.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="cd-proj-write__done"><AppIcon name="ui-done" /> 완료 기준 · {{ isPeriodDraft ? '다니는 기간을 채우면 완료' : doneLabel(draftProject.category, draftProject.method) }}</div>
        </template>
      </div>

      <!-- 프로젝트 이름 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">프로젝트 이름</h3>
        <input
          v-model="draftProject.name"
          class="cd-proj-write__input"
          :placeholder="currentMethod?.namePlaceholder ?? '예 : OO강의 듣기'"
        />
      </div>

      <!-- 계획 목표 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">계획 목표</h3>
        <input
          v-model="draftProject.goal"
          class="cd-proj-write__input"
          placeholder="예 : OO강의의 완강, OO자격 취득, OO 완성하기"
        />
      </div>

      <!-- 실행 주기(과정이면 다니는 요일) -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">{{ isPeriodDraft ? '다니는 요일' : '실행 주기' }}</h3>
        <div class="cd-proj-write__days">
          <button
            v-for="day in allDays"
            :key="day"
            class="cd-proj-write__day-btn"
            :class="{ 'cd-proj-write__day-btn--active': draftProject.days?.includes(day) }"
            @click="toggleDay(day)"
          >
            {{ day }}
          </button>
        </div>
      </div>

      <!-- 실행 시간(과정이면 하루 다니는 시간 1~10시간 — 근무·수업을 담는다, 속도에는 넣지 않는다) -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">{{ isPeriodDraft ? '하루 다니는 시간' : '실행 시간' }}</h3>
        <p v-if="!isPeriodDraft" class="cd-proj-write__sub-label">1회 당 실행 시간</p>
        <div class="cd-proj-write__slider-row">
          <input
            v-model.number="draftProject.duration"
            type="range"
            :min="timeRange.min"
            :max="timeRange.max"
            :step="timeRange.step"
            class="cd-proj-write__slider"
            :aria-label="isPeriodDraft ? '하루 다니는 시간' : '1회 당 실행 시간'"
          />
          <span class="cd-proj-write__duration-badge">{{ isPeriodDraft ? formatMinutes(draftProject.duration ?? 0) : `${draftProject.duration}분` }}</span>
        </div>
        <div class="cd-proj-write__slider-labels">
          <span>{{ timeRange.minLabel }}</span><span>{{ timeRange.maxLabel }}</span>
        </div>
        <div class="cd-proj-write__tip">
          <AppIcon name="ui-tip" />
          <template v-if="isPeriodDraft">과정 시간은 속도(한 주에 낼 수 있는 시간)에 넣지 않아요</template>
          <template v-else>추천: 처음 시작할 때는 30-60분이 적당해요. 너무 긴 시간을 설정하면 부담스러울 수 있어요</template>
        </div>
      </div>

      <!-- 우선순위 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">우선순위</h3>
        <div class="cd-proj-write__priorities">
          <button
            v-for="p in priorities"
            :key="p.value"
            class="cd-proj-write__priority-btn"
            :class="[`cd-proj-write__priority-btn--${p.value}`, { 'cd-proj-write__priority-btn--active': draftProject.priority === p.value }]"
            @click="draftProject.priority = p.value"
          >
            <AppIcon :name="p.icon" /> {{ p.label }}
          </button>
        </div>
      </div>

      <!-- 알림 설정 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">알림설정</h3>
        <div class="cd-proj-write__notify-row">
          <div class="cd-proj-write__notify-text">
            <span class="cd-proj-write__notify-title">요일 알림</span>
            <span class="cd-proj-write__notify-desc">계획 실행 예정 요일에 아침에 알림을 받아요</span>
          </div>
          <input type="checkbox" v-model="draftProject.notification" class="cd-proj-write__checkbox" />
        </div>
        <div class="cd-proj-write__divider" />
        <div class="cd-proj-write__notify-row">
          <div class="cd-proj-write__notify-text">
            <span class="cd-proj-write__notify-title">놓친 계획 다시 알림</span>
            <span class="cd-proj-write__notify-desc">계획을 실행하지 못했다면, 다음날 다시 알림이 가요</span>
          </div>
          <input type="checkbox" v-model="draftProject.missedNotification" class="cd-proj-write__checkbox" />
        </div>
        <div v-if="draftProject.notification || draftProject.missedNotification" class="cd-proj-write__time-field">
          <label class="cd-proj-write__time-label">알림 시간</label>
          <div class="cd-proj-write__time-input">
            <input v-model="draftProject.notificationTime" type="time" class="cd-proj-write__time-raw" />
            <span class="cd-proj-write__time-display">오전 {{ draftProject.notificationTime }}</span>
            <span><AppIcon name="ui-time-input" /></span>
          </div>
        </div>
      </div>

      <!-- 메모 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">메모 (선택)</h3>
        <textarea
          v-model="draftProject.memo"
          class="cd-proj-write__textarea"
          placeholder="추가로 기억하고 싶은 내용이나 세부 계획을 작성하세요"
          rows="4"
        />
      </div>

      <!-- 프로젝트 기간(과정이면 다니는 기간 + 빠른 선택 — 4년을 +로 208번 누를 수는 없다) -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">{{ isPeriodDraft ? '다니는 기간' : '프로젝트 기간' }}</h3>
        <p class="cd-proj-write__sub-label">{{ isPeriodDraft ? '몇 주 다니나요?' : '몇 주차 계획으로 만들까요?' }}</p>
        <div class="cd-proj-write__stepper">
          <button
            class="cd-proj-write__step-btn"
            :disabled="weeks <= MIN_WEEKS"
            @click="setWeeks(weeks - 1)"
          >−</button>
          <span class="cd-proj-write__step-value">{{ weeks }}<em>주</em></span>
          <button
            class="cd-proj-write__step-btn"
            @click="setWeeks(weeks + 1)"
          >+</button>
        </div>
        <div v-if="isPeriodDraft" class="cd-proj-write__quick" role="group" aria-label="다니는 기간 빠른 선택">
          <button
            v-for="q in PERIOD_QUICK_WEEKS" :key="q.weeks" type="button"
            class="cd-proj-write__quick-btn" :class="{ 'cd-proj-write__quick-btn--on': weeks === q.weeks }"
            :aria-pressed="weeks === q.weeks" @click="setWeeks(q.weeks)"
          >{{ q.label }}</button>
        </div>
        <div class="cd-proj-write__tip">
          <AppIcon name="ui-tip" />
          <template v-if="isPeriodDraft">주차별 할 일은 없어요. 다음 화면에서 다니는 날의 이름과 점검을 정해요</template>
          <template v-else>다음 화면에서 {{ weeks }}개 주차의 커리큘럼을 채워요. 기간은 언제든 다시 바꿀 수 있어요</template>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-proj-write__footer">
      <p v-if="blocker && tried" class="cd-proj-write__error">{{ blocker }}</p>
      <button class="cd-proj-write__cta" @click="goNext">다음</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUnsavedGuard } from '@/shared/composables/useUnsavedGuard'
import { useCareerDesign } from '../composables/useCareerDesign'
import { MIN_WEEKS, DEFAULT_WEEKS, clampWeeks, weekEntriesOf } from '../composables/useProjectCurriculum'
import { PERIOD_MINUTES, PERIOD_QUICK_WEEKS, periodActiveWeeks } from '../lib/period'
import { formatMinutes } from '@/modules/encyclopedia/lib/preparation'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import type { DayOfWeek, Priority, ProjectCategory } from '../types/career-design'
import AppIcon from '@/shared/components/AppIcon.vue'
import {
  methodsOf, methodDef, methodFits, methodIcon, doneLabel, missingMethodField, QUALIFICATION_EXTRA,
  type ProjectMethod, type MethodField,
} from '../composables/projectMethods'

const router = useRouter()
const { draftPlan, draftProject, editingProjectId } = useCareerDesign()

onMounted(() => {
  window.scrollTo(0, 0)
  // 서버는 weeks 를 저장하지 않는다(curriculum 만 왕복) → 수정 진입 시 커리큘럼 길이에서 되살린다.
  // 과정은 다니는 주만 센다 — 쉬는 주(주간결산 '잠시 쉬어요')는 '다니는 방식' 저장 때 같은 자리에 다시 끼운다
  draftProject.weeks = draftProject.period && draftProject.curriculum?.length
    ? clampWeeks(periodActiveWeeks(draftProject))
    : clampWeeks(draftProject.weeks ?? draftProject.curriculum?.length ?? DEFAULT_WEEKS)
})

// ── 프로젝트 종류(2026-11-16) — 진도(기본)·과정 ──
const isPeriodDraft = computed(() => !!draftProject.period)
const timeRange = computed(() => (isPeriodDraft.value
  ? { min: PERIOD_MINUTES.min, max: PERIOD_MINUTES.max, step: PERIOD_MINUTES.step, minLabel: '1시간', maxLabel: '10시간' }
  : { min: 15, max: 180, step: 15, minLabel: '15분', maxLabel: '3시간' }))
function setKind(period: boolean) {
  if (period === isPeriodDraft.value) return
  if (period) {
    // 진도 → 과정: 과정에는 주차별 할 일이 없다 — 적어 둔 것이 있으면 한 번 묻는다(정할 것 7)
    const filled = (draftProject.curriculum ?? []).reduce((n, w) => n + weekEntriesOf(w).filter((t) => t.trim()).length, 0)
    if (filled > 0 && !confirm(`주차별 할 일 ${filled}개가 사라져요. 과정은 할 일 없이 다니는 날 '완료'를 한 번 눌러요.\n과정으로 바꿀까요?`)) return
    draftProject.period = true
    draftProject.curriculum = []
    // 진도 범위(3시간 이하)의 값 — 새 프로젝트의 기본 1시간 포함 — 은 근무·수업에 맞지 않아 기본 4시간으로
    const d = draftProject.duration ?? 0
    draftProject.duration = d > 180 ? Math.min(PERIOD_MINUTES.max, d) : PERIOD_MINUTES.fallback
    return
  }
  // 과정 → 진도: 빈 주차별 할 일로. 원래 과정이던 프로젝트를 고치는 중이면 '끔'을 남겨야 서버도 끈다
  const was = editingProjectId.value ? draftPlan.projects.find((p) => p.id === editingProjectId.value)?.period : false
  if (was) draftProject.period = false
  else delete draftProject.period
  delete draftProject.stoppedAt
  draftProject.curriculum = []
  if ((draftProject.duration ?? 0) > 180) draftProject.duration = 60
}

// 미저장 이탈 가드 (R2)
const { bypass } = useUnsavedGuard(() => JSON.stringify(draftProject))

const categories: { value: ProjectCategory; label: string }[] = [
  { value: 'qualification', label: '자격요건' },
  { value: 'knowledge',     label: '분야지식' },
  { value: 'skill',         label: '직무기술' },
  { value: 'portfolio',     label: '포트폴리오' },
  { value: 'experience',    label: '실무경험' },
]

const categoryColorMap: Record<ProjectCategory, string> = {
  qualification: '#1DB95A',
  knowledge:     '#F47820',
  skill:         '#A855F7',
  portfolio:     '#4480F5',
  experience:    '#F0507E',
}

const currentColor = computed(() => categoryColorMap[draftProject.category ?? 'knowledge'])

const allDays: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']

const weeks = computed(() => draftProject.weeks ?? DEFAULT_WEEKS)

function setWeeks(n: number) {
  const next = clampWeeks(n)
  // 기간을 줄이면 잘려나가는 뒤쪽 주차의 작성 내용이 사라진다 → 실제로 채운 게 있을 때만 확인.
  const dropped = (draftProject.curriculum ?? []).slice(next).filter(w => w.items.length > 0).length
  if (dropped > 0 && !confirm(`${next + 1}주차부터 작성한 내용 ${dropped}개가 삭제돼요.\n계속할까요?`)) return
  if (dropped > 0) draftProject.curriculum = (draftProject.curriculum ?? []).slice(0, next)
  draftProject.weeks = next
}

const priorities: { value: Priority; icon: string; label: string }[] = [
  { value: 'high', icon: 'priority-high', label: '높음' },
  { value: 'normal', icon: 'priority-normal', label: '보통' },
  { value: 'low', icon: 'priority-low', label: '낮음' },
]

function toggleDay(day: DayOfWeek) {
  if (!draftProject.days) draftProject.days = []
  const idx = draftProject.days.indexOf(day)
  if (idx >= 0) draftProject.days.splice(idx, 1)
  else draftProject.days.push(day)
}

// ── 진행 방식 ──
const methods = computed(() => methodsOf(draftProject.category))
const currentMethod = computed(() => methodDef(draftProject.method))
// 자격요건은 방식과 상관없이 시험일을 함께 받는다(필수 교육 이수는 시험이 아니라 제외)
const methodFields = computed(() => {
  const base = currentMethod.value?.fields ?? []
  return draftProject.category === 'qualification' && draftProject.method !== 'required_course'
    ? [...base, { ...QUALIFICATION_EXTRA, placeholder: '' }]
    : base
})
function pickMethod(m: ProjectMethod) {
  if (draftProject.method !== m) draftProject.methodDetail = {}
  draftProject.method = m
}
function setDetail(k: MethodField, v: string) {
  draftProject.methodDetail = { ...(draftProject.methodDetail ?? {}), [k]: v }
}
// 영역을 바꾸면 그 영역에 없는 방식은 풀린다(공용 방식 — 책·인강 등 — 은 유지)
watch(() => draftProject.category, (c) => {
  if (draftProject.method && !methodFits(c, draftProject.method)) { draftProject.method = null; draftProject.methodDetail = {} }
})

// 을/를 — 마지막 글자 받침으로. 라벨 끝의 '(선택)' 같은 괄호는 필수 칸엔 없다
const objectJosa = (w: string) => { const c = w.trim().slice(-1).charCodeAt(0) - 0xac00; return c < 0 || c > 11171 ? '을(를)' : c % 28 ? '을' : '를' }

const tried = ref(false)
const blocker = computed(() => {
  if (!draftProject.method) return '진행 방식을 골라주세요'
  const miss = missingMethodField(draftProject.method, draftProject.methodDetail)
  if (miss) return `${miss}${objectJosa(miss)} 적어주세요`
  if (!draftProject.name?.trim()) return '프로젝트 이름을 적어주세요'
  return null
})

function goNext() {
  tried.value = true
  if (blocker.value) return
  bypass()
  // 과정은 주차별 할 일 대신 '다니는 방식'(오늘 할 일 이름·점검·단계)으로
  router.push(isPeriodDraft.value ? '/career-design/project/period' : '/career-design/project/curriculum')
}
</script>

<style lang="scss">
.cd-proj-write {
  --cat-color: #F47820;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__section {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
  }

  &__label {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__sub-label {
    font-size: 12px;
    color: #aaa;
    margin-bottom: 10px;
  }

  /* 카테고리 선택 */
  &__categories {
    display: flex;
    justify-content: space-around;
  }

  /* 프로젝트 종류(2026-11-16) — 하나만 고르니 동그라미(라디오) */
  &__kinds { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  &__kind {
    display: grid; gap: 3px; padding: 12px; border: 1.5px solid #eee; border-radius: 14px; background: #fff;
    font-family: inherit; text-align: left; cursor: pointer;
    small { font-size: 11px; color: #aaa; }
    &:focus-visible { outline: 2px solid var(--cat-color); outline-offset: 2px; }
  }
  &__kind-title { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 800; color: #333; }
  &__kind-desc { font-size: 12px; color: #666; line-height: 1.4; }
  &__kind-dot {
    margin-left: auto; width: 17px; height: 17px; border-radius: 50%; border: 1.8px solid #cfd3d9; background: #fff; box-sizing: border-box;
  }
  &__kind--on { border-color: #222; }
  &__kind--on &__kind-dot { border-color: #222; background: #222; box-shadow: inset 0 0 0 3.5px #fff; }
  &__kind--period.cd-proj-write__kind--on { border-color: #8a5a00; background: #fffaf0; }
  &__kind--period.cd-proj-write__kind--on .cd-proj-write__kind-title { color: #8a5a00; }
  &__kind--period.cd-proj-write__kind--on .cd-proj-write__kind-dot { border-color: #8a5a00; background: #8a5a00; }

  /* 다니는 기간 빠른 선택 */
  &__quick { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  &__quick-btn {
    padding: 7px 12px; border: 0; border-radius: 999px; background: #f3f3f5; color: #666;
    font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer;
    &--on { background: #222; color: #fff; }
  }

  &__cat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 8px;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: border-color 0.15s;
  }

  &__cat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
  }

  &__cat-label {
    font-size: 12px;
    color: #888;
    transition: color 0.15s, font-weight 0.15s;
  }

  &__input {
    width: 100%;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    color: #333;
    transition: border-color 0.15s;

    &::placeholder { color: #bbb; }
    &:focus { border-color: var(--cat-color); }
  }

  &__days {
    display: flex;
    gap: 8px;
  }

  &__day-btn {
    flex: 1;
    padding: 10px 0;
    border: 1.5px solid #eee;
    border-radius: 10px;
    background: #fff;
    font-size: 14px;
    font-weight: 600;
    color: #aaa;
    cursor: pointer;
    transition: all 0.15s;

    &--active {
      background: var(--cat-color);
      border-color: var(--cat-color);
      color: #fff;
    }
  }

  &__slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__slider {
    flex: 1;
    accent-color: var(--cat-color);
    height: 4px;
  }

  &__duration-badge {
    background: #F0F0F0;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }

  &__slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #aaa;
    margin-bottom: 12px;
  }

  /* 진행 방식 */
  &__methods {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__method {
    padding: 9px 13px;
    border: 1.5px solid #eee;
    border-radius: 999px;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: #666;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s;

    &--active {
      background: var(--cat-color);
      border-color: var(--cat-color);
      color: #fff;
    }
  }

  &__method-field { margin-top: 14px; }

  &__method-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #555;
  }

  &__done {
    margin-top: 14px;
    padding: 10px 12px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--cat-color) 10%, white);
    font-size: 13px;
    font-weight: 600;
    color: var(--cat-color);
  }

  &__error {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #E53E3E;
    text-align: center;
  }

  &__tip {
    background: #EEF4FF;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: #4A6FA5;
    line-height: 1.5;
  }

  &__priorities {
    display: flex;
    gap: 10px;
  }

  &__priority-btn {
    flex: 1;
    padding: 12px 0;
    border: 1.5px solid #eee;
    border-radius: 12px;
    background: #fff;
    font-size: 14px;
    font-weight: 600;
    color: #aaa;
    cursor: pointer;
    transition: all 0.15s;

    &--high.cd-proj-write__priority-btn--active {
      background: #FFF0F0;
      border-color: #FF6B6B;
      color: #FF6B6B;
    }

    &--normal.cd-proj-write__priority-btn--active {
      background: #FFFBEC;
      border-color: #FFC700;
      color: #CC9D00;
    }

    &--low.cd-proj-write__priority-btn--active {
      background: #F0F8FF;
      border-color: #4A8CF7;
      color: #4A8CF7;
    }
  }

  &__notify-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }

  &__notify-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__notify-title {
    font-size: 14px;
    font-weight: 600;
    color: #222;
  }

  &__notify-desc {
    font-size: 12px;
    color: #aaa;
    line-height: 1.4;
  }

  &__checkbox {
    width: 20px;
    height: 20px;
    accent-color: var(--cat-color);
    flex-shrink: 0;
  }

  &__divider {
    height: 1px;
    background: #f0f0f0;
    margin: 12px 0;
  }

  &__time-field {
    margin-top: 12px;
  }

  &__time-label {
    font-size: 12px;
    color: #aaa;
    display: block;
    margin-bottom: 6px;
  }

  &__time-input {
    position: relative;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__time-raw {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }

  &__time-display {
    font-size: 14px;
    color: #333;
  }

  &__textarea {
    width: 100%;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    color: #333;
    resize: none;
    font-family: inherit;
    transition: border-color 0.15s;

    &::placeholder { color: #bbb; }
    &:focus { border-color: var(--cat-color); }
  }

  /* 프로젝트 기간 스테퍼 */
  &__stepper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1.5px solid #eee;
    border-radius: 12px;
    padding: 10px 14px;
    margin-bottom: 12px;
  }

  &__step-btn {
    width: 40px;
    height: 40px;
    border: 1.5px solid var(--cat-color);
    border-radius: 10px;
    background: #fff;
    font-size: 22px;
    font-weight: 600;
    line-height: 1;
    color: var(--cat-color);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s, opacity 0.12s;

    &:hover:not(:disabled) { background: color-mix(in srgb, var(--cat-color) 8%, transparent); }

    &:disabled {
      border-color: #eee;
      color: #ddd;
      cursor: default;
    }
  }

  &__step-value {
    font-size: 24px;
    font-weight: 700;
    color: #222;

    em {
      font-size: 15px;
      font-weight: 600;
      font-style: normal;
      color: #888;
      margin-left: 3px;
    }
  }

  &__footer {
    padding: 16px 20px 32px;
  }

  &__cta {
    width: 100%;
    padding: 18px;
    background: var(--cat-color);
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s;

    &:active { opacity: 0.85; }
  }
}
</style>
