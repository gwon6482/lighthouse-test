<template>
  <!-- 새 프로젝트 시작하기 — 확인(#99, 2026-11-26 시안 ④). 어디에 놓이나 · 무엇이 바뀌나. 속도를 넘어도 막지 않고 한 줄로(정할 것 4) -->
  <div class="aac">
    <header class="aac__bar">
      <button type="button" class="aac__back" aria-label="이전" @click="goBack"><AppIcon name="ui-back" /></button>
      <div class="aac__head">
        <h1 class="aac__title">이렇게 시작해요</h1>
        <p v-if="place" class="aac__sub">{{ project.name }} · {{ mdDow(place.startKey) }} ~ {{ mdDow(place.endKey) }} · {{ weeks }}주</p>
      </div>
    </header>

    <div v-if="place" class="aac__body">
      <section class="aac__card">
        <div class="aac__card-head">
          <h2>주마다 쓰는 시간</h2>
          <span v-if="pace">속도 주 {{ fmtH(pace) }}시간</span>
        </div>
        <ul class="aac__rows">
          <li v-for="r in shownRows" :key="r.week" class="aac__row">
            <span class="aac__wk">{{ r.week }}주차<small v-if="tagOf(r.week)">{{ tagOf(r.week) }}</small></span>
            <span class="aac__bar-track">
              <i
                v-for="p in r.parts" :key="p.id" class="aac__seg" :class="{ 'aac__seg--new': p.added }"
                :style="{ width: `${(p.hours / scale) * 100}%`, background: p.added ? tint(categoryColor(p.category)) : categoryColor(p.category), borderColor: categoryColor(p.category) }"
              />
              <b v-if="pace" class="aac__pace" :style="{ left: `${(pace / scale) * 100}%` }" />
            </span>
            <span class="aac__h" :class="{ 'aac__h--over': pace && r.hours > pace }">{{ fmtH(r.hours) }}시간</span>
          </li>
        </ul>
        <p v-if="rows.length > shownRows.length" class="aac__more">뒤 {{ rows.length - shownRows.length }}주도 같은 걸음이 이어져요</p>
        <div class="aac__legend">
          <span><i class="aac__dot aac__dot--new" :style="{ borderColor: categoryColor(project.category), background: tint(categoryColor(project.category)) }" />{{ project.name }}</span>
          <span v-if="pace"><i class="aac__dash" />주 {{ fmtH(pace) }}시간</span>
        </div>
      </section>

      <p v-if="over" class="aac__over">{{ over }}</p>
      <p class="aac__keep">다른 프로젝트는 그대로예요 · {{ endText }}</p>
    </div>

    <div class="aac__foot">
      <p v-if="error" class="aac__error">{{ error }}</p>
      <button type="button" class="aac__go" :disabled="saving || !place" @click="start">{{ ctaLabel }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAchievementStore } from '@/shared/stores/achievement'
import { getToday } from '@/shared/utils/dev-date'
import { safeBack } from '@/shared/utils/navigation'
import { showToast } from '@/shared/composables/useAppToast'
import { josaEulReul } from '@/modules/encyclopedia/lib/preparation'
import { projectWeeks, weekOfDate } from '@/modules/career-design/composables/usePlanTimeline'
import type { Project } from '@/modules/career-design/types/career-design'
import { categoryColor } from '../lib/planBoard'
import { endChange, endLine, mdDow, overLine, placementOf, weekLoad } from '../lib/addProject'
import { useAddProject } from '../composables/useAddProject'

const router = useRouter()
const store = useAchievementStore()
const add = useAddProject()
const NEW_ID = '__new'
const project = computed<Project>(() => ({ ...(add.draftProject as Project), id: NEW_ID, name: add.draftProject.name ?? '', days: add.draftProject.days ?? [] }))
const weeks = computed(() => projectWeeks(project.value))
const plan = computed(() => store.plan)
const today = computed(() => getToday())
const place = computed(() => (plan.value ? placementOf(plan.value, project.value, today.value, add.state.when) : null))
const pace = computed(() => plan.value?.paceHours ?? null)
const rows = computed(() => (plan.value && place.value ? weekLoad(plan.value, project.value, place.value.week) : []))
const MAX_ROWS = 6
const shownRows = computed(() => rows.value.slice(0, MAX_ROWS))
const scale = computed(() => Math.max(1, pace.value ?? 0, ...rows.value.map((r) => r.hours)) * 1.08)
const thisWeek = computed(() => (plan.value ? weekOfDate(plan.value.startDate, today.value, plan.value.reviewDay) : null))
const tagOf = (w: number) => (w === thisWeek.value ? '이번 주' : thisWeek.value && w === thisWeek.value + 1 ? '다음 주' : '')
const labelOf = (w: number) => tagOf(w) || `${w}주차`
const over = computed(() => overLine(rows.value, pace.value, labelOf))
const change = computed(() => (plan.value && place.value ? endChange(plan.value, project.value, place.value.week) : { before: '', after: '' }))
const endText = computed(() => endLine(change.value))
const fmtH = (h: number) => `${Math.round(h * 10) / 10}`
const tint = (c: string) => `color-mix(in srgb, ${c} 22%, white)`
const dated = computed(() => !!(project.value.dateStart && project.value.dateEnd))
const ctaLabel = computed(() => (dated.value && place.value ? `${mdDow(place.value.startKey)}부터 시작하기` : add.state.when === 'next' ? '다음 주부터 시작하기' : '오늘부터 시작하기'))

const saving = ref(false)
const error = ref('')
async function start() {
  const pl = plan.value
  const pc = place.value
  if (!pl || !pc || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const name = project.value.name
    await add.save({ planId: pl.planId, project: project.value, week: pc.week, startOn: pc.startOn, endDate: change.value.after, endBefore: change.value.before })
    await store.loadActivePlan(true)
    const obj = `${name}${josaEulReul(name)}`
    const msg = dated.value || add.state.when === 'next'
      ? `${dated.value ? mdDow(pc.startKey) : '다음 주'}부터 ${obj} 시작해요`
      : `${obj} 시작했어요`
    add.end()
    showToast(msg, 2500)
    router.replace('/career-achievement')
  } catch {
    error.value = '저장하지 못했어요. 다시 눌러 주세요.'
  } finally {
    saving.value = false
  }
}
function goBack() {
  safeBack(router, '/career-achievement')
}
onMounted(async () => {
  await store.loadActivePlan()
  // 고르기를 거치지 않고 들어왔으면(새로 고침으로 상태가 사라짐 등) 홈으로
  if (!add.state.active || !store.plan || !add.draftProject.name) router.replace('/career-achievement')
})
</script>

<style lang="scss" scoped>
.aac {
  min-height: 100vh; display: flex; flex-direction: column; background: #F5F5F5;
  &__bar { display: flex; align-items: flex-start; gap: 6px; padding: 14px 12px 18px; background: #FFC700; }
  &__back { flex: 0 0 auto; width: 36px; height: 36px; display: grid; place-items: center; border: 0; background: none; font-size: 22px; color: #222; cursor: pointer; }
  &__head { min-width: 0; padding-top: 4px; }
  &__title { margin: 0; font-size: 19px; font-weight: 800; color: #222; }
  &__sub { margin: 4px 0 0; font-size: 13px; color: #555; }
  &__body { flex: 1; padding: 16px; display: grid; gap: 12px; align-content: start; }
  &__card { padding: 18px 16px; border-radius: 16px; background: #fff; }
  &__card-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;
    h2 { margin: 0; font-size: 15px; font-weight: 700; color: #222; }
    span { font-size: 12.5px; color: #888; } }
  &__rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  &__row { display: grid; grid-template-columns: 64px 1fr 58px; align-items: center; gap: 8px; }
  &__wk { display: grid; font-size: 13px; font-weight: 600; color: #444; small { font-size: 11px; font-weight: 700; color: #B07A00; } }
  &__bar-track { position: relative; display: flex; height: 16px; border-radius: 5px; background: #F2F2F4; overflow: visible; }
  &__seg { height: 100%; border: 0 solid; box-sizing: border-box; &:first-child { border-radius: 5px 0 0 5px; } &:last-of-type { border-radius: 0 5px 5px 0; } & + & { margin-left: 1px; } }
  &__seg--new { border-width: 1.5px; border-style: dashed; }
  &__pace { position: absolute; top: -3px; bottom: -3px; width: 0; border-left: 1.5px dashed #555; }
  &__h { text-align: right; font-size: 13px; font-weight: 700; color: #333; font-variant-numeric: tabular-nums; &--over { color: #D93636; } }
  &__more { margin: 10px 0 0; font-size: 12.5px; color: #888; }
  &__legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 14px; font-size: 12px; color: #666;
    span { display: inline-flex; align-items: center; gap: 5px; } }
  &__dot { width: 12px; height: 10px; border-radius: 3px; background: #BFC3CA; &--new { border: 1.5px dashed; } }
  &__dash { width: 0; height: 12px; border-left: 1.5px dashed #555; }
  &__over { margin: 0; padding: 12px 14px; border-radius: 12px; background: #FFF1F1; font-size: 13.5px; line-height: 1.5; color: #B42323; }
  &__keep { margin: 0; padding: 0 4px; font-size: 13px; color: #666; }
  &__foot { position: sticky; bottom: 0; padding: 12px 16px calc(16px + env(safe-area-inset-bottom)); background: #F5F5F5; }
  &__error { margin: 0 0 8px; font-size: 13px; color: #D93636; text-align: center; }
  &__go { width: 100%; padding: 15px; border: 0; border-radius: 14px; background: #FFC700; font: inherit; font-size: 16px; font-weight: 800; color: #222; cursor: pointer; &:disabled { opacity: 0.5; } }
}
</style>
