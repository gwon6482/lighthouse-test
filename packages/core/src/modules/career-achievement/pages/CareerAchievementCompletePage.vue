<template>
  <div class="cac">
    <header class="cac__header">
      <button type="button" class="cac__back" aria-label="뒤로" @click="goBack"><AppIcon name="ui-back" /></button>
      <span class="cac__header-title">{{ isFree ? '집중 기록' : '기록 작성' }}</span>
      <span class="cac__header-spacer" />
    </header>

    <div v-if="loading" class="cac__loading">불러오는 중...</div>

    <!-- 바로 집중(2026-11-26 #96) — 무엇을 했나요 한 줄(40자, 비워도 저장) + 이어지는 프로젝트 하나(선택). 사진·별점·긴 글은 없다 -->
    <template v-else-if="isFree && canSaveFree">
      <div class="cac__item">
        <span class="cac__item-cat cac__item-cat--free">{{ FREE_LABEL }}</span>
        <div class="cac__item-meta">
          <span>소요시간 · <strong>{{ elapsedLabel }}</strong></span>
          <span v-if="focusGoalMin">목표 · {{ focusGoalMin }}분</span>
        </div>
      </div>
      <section class="cac__section">
        <label class="cac__label" for="cac-free-text">무엇을 했나요</label>
        <input id="cac-free-text" v-model="freeText" class="cac__line" maxlength="40" placeholder="예: 포트폴리오 README 정리" />
        <div class="cac__counter">{{ freeText.length }} / 40</div>
      </section>
      <section v-if="freeProjects.length" class="cac__section">
        <span class="cac__label">이어지는 프로젝트 <span class="cac__label-opt">(선택)</span></span>
        <div class="cac__chips" role="radiogroup" aria-label="이어지는 프로젝트">
          <button
            v-for="p in freeProjects" :key="p.id" type="button" role="radio" class="cac__chip"
            :class="{ 'cac__chip--on': freeProject === p.id }" :aria-checked="freeProject === p.id"
            @click="freeProject = freeProject === p.id ? '' : p.id"
          >{{ p.name }}</button>
        </div>
      </section>
      <div class="cac__actions">
        <button class="cac__btn cac__btn--ghost" @click="goBack">취소</button>
        <button class="cac__btn cac__btn--primary" :disabled="saving" @click="saveFree">
          {{ saving ? '저장 중...' : '저장' }}
        </button>
      </div>
    </template>

    <template v-else-if="!isFree && item">
      <!-- 항목 요약 -->
      <div class="cac__item">
        <span
          v-if="categoryInfo"
          class="cac__item-cat"
          :style="{ color: categoryInfo.color, background: `color-mix(in srgb, ${categoryInfo.color} 12%, white)` }"
        >{{ categoryInfo.label }}</span>
        <span v-else class="cac__item-cat cac__item-cat--routine">루틴</span>
        <h2 class="cac__item-name">{{ item.name }}</h2>
        <div class="cac__item-meta">
          <span>소요시간 · <strong>{{ elapsedLabel }}</strong></span>
          <!-- 집중을 거쳐 왔으면 그때 고른 목표, 아니면 계획의 1회 시간(2026-11-21 A2) -->
          <span v-if="focusGoalMin">목표 · {{ focusGoalMin }}분</span>
          <span v-else>계획 · {{ item.duration }}분</span>
        </div>
      </div>

      <!-- 인증사진 -->
      <section class="cac__section">
        <label class="cac__label">인증사진 <span class="cac__label-opt">(선택)</span></label>
        <div v-if="!photo" class="cac__photo-empty" @click="pickPhoto">
          <span class="cac__photo-icon"><AppIcon name="ui-photo" /></span>
          <span class="cac__photo-text">사진 추가</span>
        </div>
        <div v-else class="cac__photo">
          <img :src="photo" class="cac__photo-img" alt="인증사진" />
          <button class="cac__photo-remove" @click="photo = ''"><AppIcon name="ui-close" /></button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="cac__file"
          @change="onPhotoChange"
        />
      </section>

      <!-- 체감난이도 -->
      <section class="cac__section">
        <label class="cac__label">체감난이도</label>
        <div class="cac__difficulty">
          <button
            v-for="n in 5"
            :key="n"
            class="cac__diff-btn"
            :class="{ 'cac__diff-btn--active': difficulty >= n }"
            @click="difficulty = n as 1|2|3|4|5"
          >
            <AppIcon name="ui-star" />
          </button>
        </div>
        <div class="cac__difficulty-label">{{ difficultyLabel }}</div>
      </section>

      <!-- 내용 -->
      <section class="cac__section">
        <label class="cac__label">기록</label>
        <textarea
          v-model="note"
          class="cac__note"
          placeholder="오늘 어떻게 진행했나요? 어떤 점이 어려웠나요?"
          rows="6"
          maxlength="2000"
        />
        <div class="cac__counter">{{ note.length }} / 2000</div>
      </section>

      <!-- 저장 -->
      <div class="cac__actions">
        <button class="cac__btn cac__btn--ghost" @click="goBack">취소</button>
        <button class="cac__btn cac__btn--primary" :disabled="saving" @click="save">
          {{ saving ? '저장 중...' : '저장' }}
        </button>
      </div>
    </template>

    <div v-else-if="!loading" class="cac__empty">
      <p>항목을 찾을 수 없어요.</p>
      <button class="cac__btn cac__btn--ghost" @click="router.replace('/career-achievement')">돌아가기</button>
    </div>

    <!-- 취소·뒤로 — 적은 메모·사진이 있을 때만 같은 화면 안에서 묻는다(2026-11-19 사용성 QA). 집중한 시간은 멈춘 집중으로 남는다 -->
    <ConfirmSheet
      v-model="leaveOpen" title="기록 작성을 그만둘까요?" :message="leaveMessage"
      confirm-label="그만두기" cancel-label="계속 쓰기" @confirm="leaveNow"
    />
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { getTodayKey } from '@/shared/utils/dev-date'
import { ref, computed, onMounted, useTemplateRef } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import ConfirmSheet from '@/shared/components/ConfirmSheet.vue'
import { useActivePlanSource } from '@/modules/career-achievement/composables/useActivePlanSource'
import { projectWeekIndexOn } from '@/modules/career-design/composables/usePlanTimeline'
import { weekEntriesOf } from '@/modules/career-design/composables/useProjectCurriculum'
import { useAchievement } from '../composables/useAchievement'
import { useCurriculumCompletion } from '../composables/useCurriculumCompletion'
import { useAchievementEntries, type AchievementEntry } from '../composables/useAchievementEntries'
import { uploadPhoto } from '../achievement.api'
import { CATEGORY_META } from '../lib/planBoard'
import { useFocusSessions } from '../composables/useFocusSessions'
import { useWeeklySchedule, queueAhead, computeWeekRangeContaining, parseDateKey } from '../composables/useWeeklySchedule'
import { aheadFromForSave } from '../lib/pullAhead'
import { sessionKey, combinedElapsed, recordTimeLabel, asFocusItemType, FREE_ID_RE } from '../lib/focusSession'
import { FREE_LABEL } from '../lib/focusLog'
import { projectsActiveInWeek, weekOfDate } from '@/modules/career-design/composables/usePlanTimeline'
import { useAchievementStore } from '@/shared/stores/achievement'
import { showToast } from '@/shared/composables/useAppToast'
import type { DayOfWeek, Project, Routine } from '@/modules/career-design/types/career-design'

const route = useRoute()
const router = useRouter()
// 홈과 같은 '진행 중인 계획'을 읽는다 — 편집 사본(draftPlan)이 다른 계획이면 항목을 못 찾았다(2026-11-27 핫픽스)
const { plan: activePlan, timeline: activeTimeline, load: loadActivePlanSource } = useActivePlanSource()
const { isProjectDone, isRoutineDone, toggleProject, toggleRoutine } = useAchievement()
const { isItemDone, toggleItem } = useCurriculumCompletion()
const { saveEntry, getEntry } = useAchievementEntries()
const focusSessions = useFocusSessions()
const { moveAheadOnSave } = useWeeklySchedule()
const achStore = useAchievementStore()

const itemType = computed(() => asFocusItemType(route.params.type))
const isFree = computed(() => itemType.value === 'free')   // 바로 집중(2026-11-26 #96)
const itemId = computed(() => String(route.params.id ?? ''))
const dateKey = computed(() => String(route.query.date ?? toTodayKey()))
// 멈춘 집중(2026-11-19) — 저장하면 지우고, 취소·뒤로는 지우지 않아 홈에 '잠시 멈춤'으로 남는다(정할 것 7)
const focusKey = computed(() => sessionKey(dateKey.value, itemType.value, itemId.value))
const elapsedSec = computed(() => {
  const n = Number(route.query.elapsed)
  if (Number.isFinite(n) && n >= 0 && route.query.elapsed != null && route.query.elapsed !== '') return Math.floor(n)
  // 주소에 시간이 없으면(새로 고침 등) 기기에 적어 둔 멈춘 집중의 시간
  const s = focusSessions.get(focusKey.value)
  return s ? Math.floor(s.accSec) : 0
})

// 집중 화면에서 고른 목표(분) — 주소의 goal, 없으면(새로 고침 등) 기기에 적어 둔 멈춘 집중의 목표
const focusGoalMin = computed<number | null>(() => {
  const n = Number(route.query.goal)
  if (route.query.goal != null && route.query.goal !== '' && Number.isFinite(n) && n > 0) return Math.round(n)
  return focusSessions.get(focusKey.value)?.goalMin ?? null
})

function toTodayKey(): string {
  return getTodayKey() // 앱의 하루(하루 시작 시각 기준) — 홈이 ?date= 로 넘기는 날짜와 같은 규칙
}

const loading = ref(true)
const saving = ref(false)

const item = computed<Project | Routine | null>(() => {
  if (!itemId.value || isFree.value) return null
  if (itemType.value === 'project') {
    return activePlan.projects.find(p => p.id === itemId.value) ?? null
  }
  return activePlan.routines.find(r => r.id === itemId.value) ?? null
})

// 분류 색·라벨은 planBoard 의 CATEGORY_META(정본) — 이 화면에 있던 복제 표는 2026-11-19 지움
const categoryInfo = computed(() => {
  if (itemType.value !== 'project') return null
  const cat = (item.value as Project | null)?.category
  return cat ? CATEGORY_META[cat] : null
})

// 이미 완료한 일을 다시 집중했으면 앞 기록 시간에 더한다(2026-11-19 오너 결정). 메모·사진·난이도는 앞 기록에서 채운 그대로
const combined = computed(() => {
  if (isFree.value) return combinedElapsed(0, false, elapsedSec.value) // 바로 집중은 한 번마다 한 건(열쇠가 시작 시각)
  const existing = getEntry(dateKey.value, itemType.value, itemId.value)
  const done = itemType.value === 'project' ? isProjectDone(itemId.value, dateKey.value) : isRoutineDone(itemId.value, dateKey.value)
  return combinedElapsed(existing?.elapsedSec, done, elapsedSec.value)
})

// ── 바로 집중(2026-11-26 #96) ──
// 진행 중인 계획이 있어야 저장한다(계획 아래 기록 — 오너 결정 7). 열쇠는 'f' + 시작 시각
const freeText = ref('')
const freeProject = ref('')
const canSaveFree = computed(() => FREE_ID_RE.test(itemId.value) && !!(achStore.plan?.planId ?? activePlan.planId))
// 고를 프로젝트 — 그 날짜가 든 주에 놓인 프로젝트(과정 빼고). 없으면 계획의 프로젝트 모두
const freeProjects = computed(() => {
  const pl = achStore.plan
  const projects = (pl?.projects ?? activePlan.projects).filter((p) => !p.period)
  const d = parseDateKey(dateKey.value)
  const wk = pl && d ? weekOfDate(pl.startDate, d, pl.reviewDay) : null
  if (pl && wk) {
    const ids = new Set(projectsActiveInWeek(pl.timeline, wk, pl.projects).map((p) => p.id))
    const inWeek = projects.filter((p) => ids.has(p.id))
    if (inWeek.length) return inWeek
  }
  return projects
})
async function saveFree() {
  if (!canSaveFree.value) return
  saving.value = true
  try {
    const entry: AchievementEntry = {
      date: dateKey.value,
      itemType: 'free',
      itemId: itemId.value,
      itemName: freeText.value.replace(/\s+/g, ' ').trim().slice(0, 40),
      duration: focusGoalMin.value ?? 0, // 고른 목표(분) — 쌓은 시간에는 쓰지 않는다(집중한 시간만)
      elapsedSec: combined.value.total,
      doneAt: new Date().toISOString(),
      difficulty: 3,                       // 칸 모양만 — 서버로 보내지 않는다
      note: '',
      planId: achStore.plan?.planId ?? activePlan.planId ?? undefined,
      ...(freeProject.value ? { projectId: freeProject.value } : {}),
    }
    saveEntry(entry)
    focusSessions.remove(focusKey.value) // 저장했으니 멈춘 집중은 끝. 완료로 치지 않는다(오너 결정 5·6)
    leaving = true
    showToast('기록을 저장했어요')
    router.replace('/career-achievement')
  } finally {
    saving.value = false
  }
}
const elapsedLabel = computed(() => recordTimeLabel(combined.value.total, combined.value.prev))

// ── form state ───────────────────────────────────
const photo = ref('')
const difficulty = ref<1 | 2 | 3 | 4 | 5>(3)
const note = ref('')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const difficultyLabel = computed(() => {
  return ['', '아주 쉬움', '쉬움', '보통', '어려움', '아주 어려움'][difficulty.value] ?? ''
})

function pickPhoto() {
  fileInput.value?.click()
}

async function onPhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    photo.value = await resizeToDataUrl(file, 1280)
  } catch {
    alert('사진을 불러오지 못했어요.')
  } finally {
    input.value = ''
  }
}

// 'data:image/...;base64,...' dataURL → Blob (S3 업로드용)
function dataUrlToBlob(dataUrl: string): Blob {
  const [head = '', body = ''] = dataUrl.split(',')
  const mime = head.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function resizeToDataUrl(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = String(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 미리 하기(2026-11-23) — 옮길 칸. 홈과 같은 '진행 중인 계획'(achievement store)으로 주를 정하고,
// from 이 같은 주의 뒤 날짜이고 그날 완료 기록이 없을 때만(aheadFromForSave). 아니면 null — 평소 저장 그대로
function aheadTarget() {
  const pl = achStore.plan
  if (itemType.value !== 'project' || !pl?.planId) return null
  const to = parseDateKey(dateKey.value)
  const range = to ? computeWeekRangeContaining(to, pl.startDate, (pl.reviewDay || '월') as DayOfWeek) : null
  if (!range) return null
  const from = aheadFromForSave({
    queryFrom: route.query.from, sessionFrom: focusSessions.get(focusKey.value)?.from, to: dateKey.value,
    weekStart: range.weekStart, weekEnd: range.weekEnd, doneOnFrom: (d) => isProjectDone(itemId.value, d),
  })
  return from ? { plan: pl, range, move: { itemId: itemId.value, from, to: dateKey.value } } : null
}

// dateKey가 속한 프로젝트의 curriculum 주차에서 첫 미완료 item 1개를 done 처리.
// 진로달성 메인의 스플릿 progress bar를 1칸 전진시키는 트리거.
function advanceProjectCurriculum(project: Project, dateKey: string) {
  if (!project.curriculum?.length) return

  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return
  const target = new Date(y, m - 1, d)

  // 커리큘럼 N주차 = 계획주차 - 타임라인 시작주차 + 1
  const wIdx = projectWeekIndexOn(activeTimeline.value, activePlan.startDate, project.id, target, activePlan.reviewDay)
  if (wIdx === null) return


  const cw = project.curriculum.find(c => c.week === wIdx)
  const entries = weekEntriesOf(cw)
  if (!cw || !entries.length) return

  const undoneIdx = entries.findIndex((_, k) => !isItemDone(project.id, cw.week, k))
  if (undoneIdx !== -1) toggleItem(project.id, cw.week, undoneIdx)
}

async function save() {
  if (!item.value) return
  saving.value = true
  try {
    // 사진이 새로 선택된 dataURL 이면 S3 업로드 후 URL 로 교체. 기존 http URL 이면 그대로.
    let photoUrl: string | undefined = photo.value || undefined
    if (photoUrl?.startsWith('data:')) {
      try {
        photoUrl = await uploadPhoto(dataUrlToBlob(photoUrl), 'image/jpeg')
      } catch {
        alert('사진 업로드에 실패했어요. 사진 없이 저장합니다.')
        photoUrl = undefined
      }
    }

    const entry: AchievementEntry = {
      date: dateKey.value,
      itemType: itemType.value,
      itemId: itemId.value,
      itemName: item.value.name,
      itemCategory: itemType.value === 'project' ? (item.value as Project).category : undefined,
      duration: item.value.duration,
      elapsedSec: combined.value.total, // 다시 집중이면 앞 기록 + 이번
      doneAt: new Date().toISOString(),
      photoUrl,
      difficulty: difficulty.value,
      note: note.value.trim(),
      planId: activePlan.planId ?? undefined,
    }
    // 미리 하기(2026-11-23) — 옮겨 올 칸의 원래 날짜. 멈춘 집중을 지우기 전에 읽는다(이어 하기로 왔으면 주소에 없을 수 있다)
    const ahead = aheadTarget()
    saveEntry(entry)
    focusSessions.remove(focusKey.value) // 저장했으니 멈춘 집중은 끝

    // 완료 상태 토글 — 아직 미완료면 완료로
    const alreadyDone = itemType.value === 'project'
      ? isProjectDone(itemId.value, dateKey.value)
      : isRoutineDone(itemId.value, dateKey.value)
    if (!alreadyDone) {
      if (itemType.value === 'project') {
        toggleProject(itemId.value, dateKey.value)
        advanceProjectCurriculum(item.value as Project, dateKey.value)
        // 미리 하기 — 이번 주 뒤 요일의 그 칸을 이 날짜로 옮긴다(저장할 때만. 시작만 하고 그만두면 원래 요일 그대로)
        if (ahead) {
          const ok = await moveAheadOnSave(ahead.plan.planId, ahead.plan, ahead.plan.timeline, ahead.move)
          // 실패하면 기기에 적어 두고 홈을 불러올 때 다시 시도한다(기록·완료는 이미 남았다)
          if (!ok) queueAhead({ planId: ahead.plan.planId, ...ahead.range, ...ahead.move })
        }
      } else {
        toggleRoutine(itemId.value, dateKey.value)
      }
    }

    leaving = true
    showToast('기록을 저장했어요') // 홈 아래 2초(2026-11-21 A4) — 앱 종료 안내와 같은 모양·자리
    router.replace('/career-achievement')
  } finally {
    saving.value = false
  }
}

// ── 나가기 — 멈춘 집중이 있으면 시간은 남고 이 화면에 적은 것(메모·사진)만 사라진다(정할 것 7) ──
// 처음 연 값(이미 쓴 기록을 고치는 경우의 저장된 메모·사진)과 같으면 잃는 것이 없어 묻지 않는다
const initialNote = ref('')
const initialPhoto = ref('')
const leaveOpen = ref(false)
let leaving = false
const lost = computed(() => (isFree.value
  ? { note: !!freeText.value.trim() || !!freeProject.value, photo: false }
  : {
    note: !!note.value.trim() && note.value.trim() !== initialNote.value.trim(),
    photo: !!photo.value && photo.value !== initialPhoto.value,
  }))
const leaveMessage = computed(() => {
  if (isFree.value) return '적은 내용은 사라져요. 집중한 시간은 남아요.'
  const what = lost.value.note && lost.value.photo ? '적은 메모와 사진은' : lost.value.note ? '적은 메모는' : '고른 사진은'
  return `${what} 사라져요. 집중한 시간은 남아요.`
})
// 묻기로 했으면 true — 멈춘 집중이 있고(시간이 남는다는 말이 참일 때) 잃을 것이 있을 때만
function askLeave(): boolean {
  if (!focusSessions.get(focusKey.value)) return false
  if (!lost.value.note && !lost.value.photo) return false
  leaveOpen.value = true
  return true
}
function leaveNow() {
  leaving = true
  router.replace('/career-achievement')
}
function goBack() {
  if (askLeave()) return
  leaveNow()
}
// 브라우저·안드로이드 뒤로(R4)도 같은 확인을 거친다
onBeforeRouteLeave(() => {
  if (leaving || saving.value) return true
  return !askLeave()
})

onMounted(async () => {
  try {
    // 완료 표시·앞 기록을 서버 기준으로(이미 읽었으면 바로 끝난다) — 다시 집중한 시간을 앞 기록에 더하려고
    await useAchievementStore().loadActivePlan().catch(() => {})
    await loadActivePlanSource()
    // 이미 작성한 entry가 있으면 prefill (수정용) — 바로 집중은 고치는 화면이 없다(시안 '하지 않는 것')
    const existing = isFree.value ? null : getEntry(dateKey.value, itemType.value, itemId.value)
    if (existing) {
      photo.value = existing.photoUrl ?? ''
      difficulty.value = existing.difficulty
      note.value = existing.note
    }
    initialNote.value = note.value
    initialPhoto.value = photo.value
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss">
.cac {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 24px;

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    height: 52px;
    padding: 0 8px;
    background: #fff;
    border-bottom: 1px solid #EEEEE8;
  }

  &__back {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: #444;
    cursor: pointer;
  }

  &__header-title {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #222;
  }

  &__header-spacer { width: 44px; }

  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
  }

  &__item {
    margin: 16px 16px 0;
    background: #fff;
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  &__item-cat {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 8px;

    // 루틴은 홈과 같은 파랑(2026-11-26 — 예전엔 노랑), 바로 집중은 회색
    &--routine {
      background: #E6F0FF;
      color: #3B6FD8;
    }
    &--free {
      background: #EEEEEE;
      color: #555;
    }
  }

  &__item-name {
    font-size: 17px;
    font-weight: 800;
    color: #222;
    margin: 0;
  }

  &__item-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #888;

    strong {
      color: #222;
      font-weight: 700;
    }
  }

  &__section {
    margin: 12px 16px 0;
    background: #fff;
    border-radius: 16px;
    padding: 16px 20px;
  }

  &__label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #444;
    margin-bottom: 12px;
  }

  &__label-opt {
    font-weight: 500;
    color: #aaa;
    margin-left: 6px;
  }

  &__photo-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 140px;
    border: 2px dashed #ddd;
    border-radius: 12px;
    color: #aaa;
    cursor: pointer;

    &:hover {
      border-color: #FFC700;
      color: #FFC700;
    }
  }

  &__photo-icon { font-size: 28px; }
  &__photo-text { font-size: 13px; font-weight: 600; }

  &__photo {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
  }

  &__photo-img {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    display: block;
  }

  &__photo-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    border: none;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  &__file { display: none; }

  &__difficulty {
    display: flex;
    gap: 8px;
  }

  &__diff-btn {
    flex: 1;
    height: 44px;
    border: 1px solid #eee;
    background: #fafafa;
    border-radius: 10px;
    font-size: 22px;
    color: #ddd;
    cursor: pointer;

    &--active {
      background: #FFFBEC;
      border-color: #FFE99A;
      color: #FFC700;
    }
  }

  &__difficulty-label {
    text-align: center;
    margin-top: 10px;
    font-size: 12px;
    color: #888;
    font-weight: 600;
  }

  &__note {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
    resize: vertical;
    font-family: inherit;
    background: #fafafa;

    &:focus {
      outline: none;
      border-color: #FFC700;
      background: #fff;
    }
  }

  // 바로 집중(2026-11-26) — 한 줄 칸과 프로젝트 칩(하나만, 다시 누르면 풀림)
  &__line {
    width: 100%; box-sizing: border-box; border: 1px solid #eee; border-radius: 10px; padding: 12px;
    font-size: 15px; font-family: inherit; background: #fafafa; color: #222;
    &:focus { outline: none; border-color: #FFD100; background: #fff; }
  }
  &__chips { display: flex; flex-wrap: wrap; gap: 8px; }
  &__chip {
    padding: 8px 12px; border: 1px solid #E2E2E2; border-radius: 999px; background: #fff;
    font: inherit; font-size: 13px; font-weight: 600; color: #444; cursor: pointer; word-break: keep-all;
    &--on { border-color: #222; background: #222; color: #fff; }
  }

  &__counter {
    text-align: right;
    font-size: 11px;
    color: #aaa;
    margin-top: 4px;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin: 20px 16px 0;
  }

  &__btn {
    flex: 1;
    height: 52px;
    border-radius: 14px;
    border: none;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;

    &--primary {
      background: #FFC700;
      color: #fff;

      &:disabled {
        background: #ddd;
        cursor: not-allowed;
      }
    }

    &--ghost {
      background: #fff;
      color: #444;
      border: 1px solid #ddd;
    }
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #888;
  }
}
</style>
