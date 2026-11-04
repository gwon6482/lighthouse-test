<template>
  <!-- 진로계획 삭제 직후(2026-11-04) — 그냥 끝나지 않게 다음 길을 안내한다.
       목표 진로를 바꿀지 물어서: 바꾼다 → 목표 진로 다시 정하기(진로설계 시작 화면의 변경 팝업) → 설계 / 그대로 → 설계.
       삭제는 30일 보관이라 여기서 바로 되돌릴 수도 있다(planTrash.api) -->
  <div class="pdel">
    <div v-if="loading" class="pdel__loading">불러오는 중...</div>

    <template v-else>
      <section class="pdel__head">
        <span class="pdel__icon"><AppIcon name="ui-done" /></span>
        <h1>진로계획을 삭제했어요</h1>
        <p v-if="plan" class="pdel__name">{{ plan.name || plan.targetJob || '내 진로계획' }}</p>
        <p v-if="plan">
          삭제한 계획은 {{ trashDays }}일 동안 보관돼요.<br>
          {{ dateLabel(plan.purgeAt) }}까지는 마이페이지에서 되돌릴 수 있어요.
        </p>
        <button v-if="plan" type="button" class="pdel__undo" :disabled="restoring" @click="undo">
          <AppIcon name="ui-repeat" /> {{ restoring ? '되돌리는 중...' : '삭제 되돌리기' }}
        </button>
      </section>

      <section class="pdel__card">
        <p class="pdel__step">다음 단계</p>
        <h2 v-if="targetName">목표 진로는 그대로인가요?</h2>
        <h2 v-else>목표 진로부터 정해 볼까요?</h2>
        <div v-if="targetName" class="pdel__target">
          <AppIcon name="ui-target" /><span>{{ targetName }}</span>
        </div>
        <p class="pdel__desc">
          {{ targetName ? '목표가 그대로면 같은 목표로 새 계획을, 바뀌었다면 목표 진로부터 다시 정해요.' : '목표 진로를 정하면 그 목표까지 가는 계획을 세울 수 있어요.' }}
        </p>
        <div class="pdel__btns">
          <template v-if="targetName">
            <button type="button" class="pdel__btn pdel__btn--primary" @click="redesign">네, 그대로 다시 설계할래요</button>
            <button type="button" class="pdel__btn" @click="changeTarget">목표 진로를 바꿀래요</button>
          </template>
          <button v-else type="button" class="pdel__btn pdel__btn--primary" @click="changeTarget">목표 진로 정하기</button>
        </div>
      </section>

      <button type="button" class="pdel__later" @click="router.replace('/')">나중에 할게요</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAchievementStore } from '@/shared/stores/achievement'
import { fetchTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'
import { fetchDeletedPlans, restoreWithConfirm, dateLabel, type DeletedPlan } from '../planTrash.api'

const route = useRoute()
const router = useRouter()
const achievement = useAchievementStore()
const planId = computed(() => String(route.params.planId ?? ''))

const loading = ref(true)
const plan = ref<DeletedPlan | null>(null)
const trashDays = ref(30)
const targetName = ref('')
const restoring = ref(false)

// 진로설계 시작 화면 — 목표 진로가 표시되고 [변경]이 있다. changeTarget=1 이면 변경 팝업부터(진로백과에서 고르기·직접 입력)
const redesign = () => router.replace('/career-design')
const changeTarget = () => router.replace({ path: '/career-design', query: { changeTarget: '1' } })

async function undo() {
  if (!plan.value || restoring.value) return
  restoring.value = true
  try {
    const status = await restoreWithConfirm(plan.value.planId)
    if (status === null) return
    await achievement.loadActivePlan(true)
    router.replace(`/career-design/plan/${plan.value.planId}`)
  } catch {
    alert('되돌리지 못했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    restoring.value = false
  }
}

onMounted(async () => {
  try {
    const [trash, tc] = await Promise.all([
      fetchDeletedPlans().catch(() => null),
      fetchTargetCareer().catch(() => null),
    ])
    if (trash) {
      trashDays.value = trash.trashDays
      plan.value = trash.plans.find((p) => p.planId === planId.value) ?? null
    }
    const t = tc?.data.targetCareer
    targetName.value = t ? (t.title ?? t.ref ?? '') : ''
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
@use 'variables' as *;

.pdel {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex; flex-direction: column;
  padding: calc(env(safe-area-inset-top) + 56px) 20px calc(env(safe-area-inset-bottom) + 24px);
  background: #F5F5F3;

  &__loading { margin: auto; color: $color-text-tertiary; }

  &__head {
    text-align: center;
    h1 { margin-top: 16px; font-size: 22px; font-weight: $tw-title; letter-spacing: -0.03em; }
    p { margin-top: 8px; font-size: 14px; line-height: 1.6; color: $color-text-secondary; }
    .pdel__name { margin-top: 6px; font-size: 15px; font-weight: $tw-strong; color: #141414; }
  }
  &__icon {
    display: inline-grid; place-items: center; width: 64px; height: 64px; border-radius: 50%;
    background: #fff; font-size: 30px; color: #141414; box-shadow: 0 6px 18px rgba(0, 0, 0, .06);
  }
  &__undo {
    margin-top: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 0; border-radius: 999px;
    background: transparent; font: inherit; font-size: 13px; font-weight: $tw-strong; color: #555; text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
    &:disabled { opacity: .5; }
  }

  &__card {
    margin-top: 28px; padding: 22px 20px; border-radius: 20px; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .05), 0 6px 18px rgba(0, 0, 0, .04);
    h2 { margin-top: 6px; font-size: 19px; font-weight: $tw-title; letter-spacing: -0.03em; }
  }
  &__step { font-size: 12px; font-weight: $tw-strong; color: $color-text-tertiary; }
  &__target {
    margin-top: 14px; display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-radius: 14px;
    background: $color-primary-tint; font-size: 16px; font-weight: $tw-strong;
  }
  &__desc { margin-top: 12px; font-size: 13px; line-height: 1.6; color: $color-text-secondary; }
  &__btns { margin-top: 18px; display: grid; gap: 8px; }
  &__btn {
    height: 52px; border: 0; border-radius: 14px; background: #F2F1EC; font: inherit; font-size: 15px; font-weight: $tw-strong; color: #141414; cursor: pointer;
    &--primary { background: $color-primary; }
    &:active { transform: scale(.98); }
  }

  &__later {
    margin: auto auto 0; padding: 14px 20px; border: 0; background: none; font: inherit; font-size: 14px; color: $color-text-tertiary; cursor: pointer;
  }
}
</style>
