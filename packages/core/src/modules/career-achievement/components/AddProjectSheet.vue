<template>
  <!-- 새 프로젝트 시작하기 — 고르기(#99, 2026-11-26 시안 ②). 목표 직업 예시 계획에서 내 계획에 없는 걸음 + 직접 만들기.
       하나만 골라 들어가는 줄 목록이라 동그라미·체크박스는 쓰지 않는다 -->
  <Teleport to="body">
    <div v-if="open" class="aps" @click.self="emit('close')" @keydown.esc="emit('close')">
      <div class="aps__sheet" role="dialog" aria-modal="true" aria-labelledby="aps-title">
        <p id="aps-title" class="aps__title">새 프로젝트 시작하기</p>
        <template v-if="loading">
          <p class="aps__loading">예시를 불러오는 중...</p>
        </template>
        <template v-else-if="examples.length">
          <p class="aps__from">{{ jobTitle }} 예시 계획에서</p>
          <ul class="aps__list">
            <li v-for="p in shown" :key="p.id">
              <button type="button" class="aps__row" @click="pick(p)">
                <span class="aps__chip" :style="{ color: categoryColor(p.category), background: tint(categoryColor(p.category)) }"><AppIcon :name="methodIcon(p.method) || 'ui-target'" /></span>
                <span class="aps__body">
                  <span class="aps__name">{{ p.name }}</span>
                  <small>{{ metaOf(p) }}</small>
                </span>
                <AppIcon name="ui-chevron-right" class="aps__go" />
              </button>
            </li>
          </ul>
          <button v-if="!showAll && examples.length > EXAMPLES_SHOWN" type="button" class="aps__more" @click="showAll = true">{{ examples.length - EXAMPLES_SHOWN }}개 더 보기</button>
          <p class="aps__note">예시 · 현직자 검토 전</p>
        </template>
        <button type="button" class="aps__manual" @click="pick(null)"><span aria-hidden="true">+</span> 직접 만들기</button>
        <button type="button" class="aps__close" @click="emit('close')">닫기</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAchievementStore } from '@/shared/stores/achievement'
import { fetchTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'
import { loadLibraryPlan } from '@/modules/career-design/composables/useHelperExamples'
import { methodIcon } from '@/modules/career-design/composables/projectMethods'
import { formatMinutes } from '@/modules/encyclopedia/lib/preparation'
import { projectWeeks } from '@/modules/career-design/composables/usePlanTimeline'
import type { Project } from '@/modules/career-design/types/career-design'
import { categoryColor, categoryLabel } from '../lib/planBoard'
import { EXAMPLES_SHOWN, exampleCandidates } from '../lib/addProject'
import { useAddProject } from '../composables/useAddProject'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const store = useAchievementStore()
const add = useAddProject()

const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`
const metaOf = (p: Project) => `${categoryLabel(p.category)} · ${projectWeeks(p)}주 · 주 ${p.days.length}회 ${formatMinutes(p.duration)}`

// 목표 직업의 예시 계획 — 직업 코드로만 찾는다(계획에는 직업 이름만 있어서, 진로백과에서 정한 목표 진로의 이름이 같을 때 그 코드 — 진로설계 도우미와 같은 규칙)
const norm = (v?: string | null) => (v ?? '').replace(/[\s·‧,]/g, '')
const loading = ref(false)
const examples = ref<Project[]>([])
const jobTitle = ref('')
const showAll = ref(false)
const shown = computed(() => (showAll.value ? examples.value : examples.value.slice(0, EXAMPLES_SHOWN)))
let seq = 0
async function loadExamples() {
  const pl = store.plan
  const my = ++seq
  examples.value = []
  showAll.value = false
  if (!pl?.targetJob) return
  loading.value = true
  try {
    const target = (await fetchTargetCareer()).data.targetCareer
    const code = target?.refType === 'jobCode' && norm(target.title) === norm(pl.targetJob) ? target.ref : null
    const prep = await loadLibraryPlan(code)
    if (my !== seq) return
    jobTitle.value = prep?.displayName ?? pl.targetJob
    examples.value = prep ? exampleCandidates(prep, pl) : []
  } catch {
    examples.value = []
  } finally {
    if (my === seq) loading.value = false
  }
}
watch(() => props.open, (v) => { if (v) loadExamples() }, { immediate: true })

function pick(p: Project | null) {
  const pl = store.plan
  if (!pl) return
  add.begin(pl.planId, p ?? undefined)
  emit('close')
  router.push({ path: '/career-design/project/new', query: { add: '1' } })
}
</script>

<style lang="scss" scoped>
.aps {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  &__sheet {
    width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto;
    padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0; background: #fff;
  }
  &__title { margin: 0; font-size: 17px; font-weight: 700; color: #111; }
  &__loading { margin: 18px 0 6px; font-size: 13.5px; color: #888; }
  &__from { margin: 14px 0 6px; font-size: 13px; font-weight: 600; color: #888; }
  &__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  &__row {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 12px; border: 1px solid #EEE; border-radius: 14px; background: #fff;
    font: inherit; text-align: left; cursor: pointer;
    &:active { background: #FAFAFA; }
  }
  &__chip { flex: 0 0 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; font-size: 18px; }
  &__body { flex: 1; min-width: 0; display: grid; gap: 2px; }
  &__name { font-size: 15px; font-weight: 700; color: #222; }
  small { font-size: 12.5px; color: #888; }
  &__go { flex: 0 0 auto; color: #BBB; }
  &__more { margin-top: 8px; padding: 6px 2px; border: 0; background: none; font: inherit; font-size: 13.5px; font-weight: 600; color: #555; cursor: pointer; }
  &__note { margin: 8px 0 0; font-size: 12px; color: #AAA; }
  &__manual {
    width: 100%; margin-top: 16px; padding: 13px; border: 1.5px dashed #CFCFCF; border-radius: 14px; background: #fff;
    font: inherit; font-size: 15px; font-weight: 700; color: #333; cursor: pointer;
  }
  &__close { width: 100%; margin-top: 8px; padding: 13px; border: 0; border-radius: 12px; background: #f1f2f4; font: inherit; font-size: 14px; color: #555; cursor: pointer; }
}
</style>
