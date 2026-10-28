<template>
  <div class="cd-proj-curr" :style="{ '--cat-color': currentColor }">
    <CdYellowHeader
      title="주차별 커리큘럼"
      :subtitle="`${draftProject.name || '프로젝트'} · 총 ${curriculum.length}주`"
      :color="currentColor"
      back-to="/career-design/project/new"
    />

    <div class="cd-proj-curr__body">
      <p class="cd-proj-curr__guide">
        주차 제목은 기본값이 채워져 있어요. 그 주에 할 일을 한 줄에 하나씩 적어보세요. 엔터를 누르면 다음 줄이 생겨요
      </p>

      <div class="cd-proj-curr__weeks">
        <div
          v-for="(week, wi) in curriculum"
          :key="wi"
          class="cd-proj-curr__week-card"
        >
          <!-- 주차 헤더 -->
          <div class="cd-proj-curr__week-head">
            <span class="cd-proj-curr__week-num">{{ week.week }}주차</span>
            <input
              v-model="week.title"
              class="cd-proj-curr__week-title"
              :placeholder="defaultWeekTitle(draftProject.name ?? '', week.week)"
            />
          </div>

          <!-- 그 주차의 할 일 목록 — 한 줄 = 한 항목 -->
          <ul class="cd-proj-curr__items">
            <li v-for="(_, ii) in week.items" :key="ii" class="cd-proj-curr__item">
              <span class="cd-proj-curr__item-dot" aria-hidden="true" />
              <input
                v-model="week.items[ii]"
                class="cd-proj-curr__item-input"
                :data-w="wi"
                :data-i="ii"
                :placeholder="ii === 0 ? '예: 강의 1~3강 듣고 정리하기' : '할 일'"
                enterkeyhint="next"
                @keydown.enter="onEnter($event, wi, ii)"
                @keydown.backspace="onBackspace($event, wi, ii)"
                @paste="onPaste($event, wi, ii)"
              />
              <button
                v-if="week.items.length > 1 || week.items[ii]"
                type="button"
                class="cd-proj-curr__item-del"
                aria-label="이 할 일 지우기"
                @click="removeItem(wi, ii)"
              ><AppIcon name="ui-close" /></button>
            </li>
          </ul>
          <button type="button" class="cd-proj-curr__item-add" @click="addItem(wi, week.items.length - 1)">+ 할 일 추가</button>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-proj-curr__footer">
      <button class="cd-proj-curr__cta" :disabled="saving" @click="saveProject">
        {{ editingProjectId ? '수정하기' : '추가하기' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import { DEFAULT_WEEKS, defaultWeekTitle, syncCurriculumLength, weekEntriesOf } from '../composables/useProjectCurriculum'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import type { ProjectCategory, WeekCurriculum } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftProject, editingProjectId, syncAddProject, syncUpdateProject } = useCareerDesign()

const WRITE_PATH = '/career-design/project/new'

const categoryColorMap: Record<ProjectCategory, string> = {
  qualification: '#1DB95A',
  knowledge:     '#F47820',
  skill:         '#A855F7',
  portfolio:     '#4480F5',
  experience:    '#F0507E',
}

const currentColor = computed(() => categoryColorMap[draftProject.category ?? 'knowledge'])

// 작성 내용은 draftProject.curriculum 에 직접 쓴다.
// 로컬 ref 에 들고 있으면 기간을 고치러 1단계에 다녀오는 사이 입력이 날아가고,
// useCareerDesign 의 draft 자동저장(R3)에도 실리지 않는다.
const curriculum = computed<WeekCurriculum[]>(() => draftProject.curriculum ?? [])
const saving = ref(false)
let saved = false
let baseline = ''

onMounted(() => {
  window.scrollTo(0, 0)
  // 1단계를 건너뛰고 직접 들어온 경우 — 채울 프로젝트가 없으니 되돌린다.
  if (!draftProject.name) {
    router.replace(WRITE_PATH)
    return
  }
  draftProject.curriculum = syncCurriculumLength(
    draftProject.curriculum,
    draftProject.weeks ?? DEFAULT_WEEKS,
    draftProject.name,
  )
  // 커리큘럼 표준은 '주차별 할 일 목록'(items, 2026-10-22). 옛 설명 글(description)만 있는 주차는 줄 단위로 나눠
  // 목록으로 보여 준다. 빈 주차에도 입력 줄 하나는 둔다
  draftProject.curriculum = draftProject.curriculum.map((w) => {
    const items = weekEntriesOf(w)
    return { ...w, items: items.length ? items : [''] }
  })
  baseline = JSON.stringify(draftProject.curriculum)
})

// ── 할 일 목록 편집 ──
// 키보드 흐름: 엔터 = 아래에 새 줄 / 빈 줄에서 ⌫ = 그 줄 지우고 윗줄로 / 여러 줄 붙여넣기 = 줄마다 나눔
function focusItem(wi: number, ii: number, atEnd = true) {
  nextTick(() => {
    const el = document.querySelector<HTMLInputElement>(`.cd-proj-curr__item-input[data-w="${wi}"][data-i="${ii}"]`)
    if (!el) return
    el.focus()
    if (atEnd) el.setSelectionRange(el.value.length, el.value.length)
  })
}

function addItem(wi: number, afterIdx: number, text = '') {
  const w = curriculum.value[wi]
  if (!w) return
  w.items.splice(afterIdx + 1, 0, text)
  focusItem(wi, afterIdx + 1)
}

function removeItem(wi: number, ii: number) {
  const w = curriculum.value[wi]
  if (!w) return
  if (w.items.length === 1) { w.items[0] = ''; focusItem(wi, 0); return }
  w.items.splice(ii, 1)
  focusItem(wi, Math.max(0, ii - 1))
}

function onEnter(e: KeyboardEvent, wi: number, ii: number) {
  // 한글 조합 중 엔터는 조합 확정용이라 무시한다(안 그러면 줄이 두 개 생긴다)
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  const w = curriculum.value[wi]
  if (!w) return
  // 빈 줄에서 엔터를 또 누르면 새 줄을 만들지 않는다(빈 줄이 쌓이지 않게)
  if (!w.items[ii]?.trim()) return
  addItem(wi, ii)
}

function onBackspace(e: KeyboardEvent, wi: number, ii: number) {
  const w = curriculum.value[wi]
  if (!w || w.items[ii] !== '' || w.items.length === 1) return
  e.preventDefault()
  w.items.splice(ii, 1)
  focusItem(wi, Math.max(0, ii - 1))
}

function onPaste(e: ClipboardEvent, wi: number, ii: number) {
  const text = e.clipboardData?.getData('text') ?? ''
  const lines = text.split(/\r?\n/).map((t) => t.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean)
  if (lines.length < 2) return
  e.preventDefault()
  const w = curriculum.value[wi]
  if (!w) return
  // 빈 줄이면 그 자리부터 채우고, 내용이 있는 줄이면 그 아래에 새 줄로 넣는다(기존 글 뒤에 이어 붙지 않게)
  const empty = !(w.items[ii] ?? '').trim()
  if (empty) w.items.splice(ii, 1, ...lines)
  else w.items.splice(ii + 1, 0, ...lines)
  focusItem(wi, (empty ? ii : ii + 1) + lines.length - 1)
}

// 미저장 이탈 가드 (R2). 단, 기간을 고치러 1단계로 돌아가는 건 정상 흐름이라 묻지 않는다.
onBeforeRouteLeave((to) => {
  if (saved || to.path === WRITE_PATH) return true
  if (JSON.stringify(draftProject.curriculum) === baseline) return true
  return confirm('작성 중인 커리큘럼이 저장되지 않았어요.\n정말 나가시겠어요?')
})

async function saveProject() {
  if (saving.value) return
  saving.value = true

  // 제목을 지운 주차는 기본 제목으로 되돌려 빈 값이 저장되지 않게 한다.
  const finalCurriculum = curriculum.value.map((w: WeekCurriculum) => ({
    week: w.week,
    title: w.title.trim() || defaultWeekTitle(draftProject.name ?? '', w.week),
    items: (w.items ?? []).map((t) => t.trim()).filter(Boolean),
    description: '',   // 옛 형식은 목록으로 옮겼으므로 비운다(두 형식이 함께 남지 않게)
  }))
  draftProject.curriculum = finalCurriculum

  const projectData = {
    category: draftProject.category ?? 'knowledge',
    name: draftProject.name ?? '',
    goal: draftProject.goal ?? '',
    days: [...(draftProject.days ?? [])],
    duration: draftProject.duration ?? 60,
    priority: draftProject.priority ?? 'normal',
    notification: draftProject.notification ?? false,
    missedNotification: draftProject.missedNotification ?? true,
    notificationTime: draftProject.notificationTime ?? '09:00',
    memo: draftProject.memo ?? '',
    weeks: finalCurriculum.length,
    curriculum: finalCurriculum.map(w => ({ ...w, items: [...w.items] })),
    // ⚠️ 필드를 하나씩 옮겨 담는 곳이다 — Project 에 필드를 늘리면 여기도 넣을 것(진행 방식이 한 번 빠졌었다)
    method: draftProject.method ?? null,
    methodDetail: { ...(draftProject.methodDetail ?? {}) },
  }

  if (editingProjectId.value) {
    const idx = draftPlan.projects.findIndex(p => p.id === editingProjectId.value)
    const target = idx >= 0 ? draftPlan.projects[idx] : undefined
    if (target) {
      Object.assign(target, projectData)
      await syncUpdateProject(target)
    }
    editingProjectId.value = null
  } else {
    const newProject = { id: `draft-${Date.now()}`, ...projectData }
    draftPlan.projects.push(newProject)
    await syncAddProject(newProject)
  }

  saved = true
  saving.value = false
  // safeBack 은 히스토리를 되감아 1단계(기간 설정)로 돌아가버린다. 저장을 끝냈으니 목록으로 대체 이동.
  router.replace('/career-design/plan/projects')
}
</script>

<style lang="scss">
.cd-proj-curr {
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

  &__guide {
    font-size: 13px;
    color: #888;
    line-height: 1.5;
    padding: 0 4px;
  }

  &__weeks {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__week-card {
    background: #fff;
    border-radius: 16px;
    border-left: 3px solid var(--cat-color);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__week-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__week-num {
    font-size: 12px;
    font-weight: 700;
    color: var(--cat-color);
    white-space: nowrap;
    background: color-mix(in srgb, var(--cat-color) 10%, white);
    padding: 2px 8px;
    border-radius: 20px;
  }

  /* 제목은 기본값이 채워져 나오는 데다 아래 설명란만 테두리가 있어서,
     투명하게 두면 정적 헤딩으로 읽힌다. 옅은 배경을 깔아 입력란임을 드러낸다. */
  &__week-title {
    flex: 1;
    min-width: 0;
    border: 1.5px solid transparent;
    border-radius: 8px;
    outline: none;
    font-size: 15px;
    font-weight: 700;
    color: #222;
    padding: 8px 10px;
    background: #F4F4F5;
    transition: background 0.15s, border-color 0.15s;

    &::placeholder { color: #bbb; font-weight: 400; }

    &:focus {
      background: #fff;
      border-color: var(--cat-color);
    }
  }

  &__items { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px 2px 10px;
    border: 1.5px solid #eee;
    border-radius: 8px;
    transition: border-color 0.15s;

    &:focus-within { border-color: var(--cat-color); }
  }
  &__item-dot {
    flex-shrink: 0;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--cat-color);
  }
  &__item-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
    padding: 9px 0;
    font-family: inherit;

    &::placeholder { color: #c4c4c4; }
  }
  &__item-del {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    border-radius: 6px;
    font-size: 16px;
    color: #c4c4c4;
    cursor: pointer;

    &:active { background: #f2f2f2; color: #888; }
  }
  &__item-add {
    align-self: flex-start;
    border: none;
    background: none;
    padding: 4px 2px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cat-color);
    cursor: pointer;
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
    &:disabled { opacity: 0.6; cursor: default; }
  }
}
</style>
