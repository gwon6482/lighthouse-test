<template>
  <!-- 최근 삭제한 진로계획(2026-11-04) — 마이페이지 '진로 관리'에서. 30일 보관, 지나면 서버가 기록까지 영구 삭제 -->
  <div class="ptr">
    <header class="ptr-bar">
      <button type="button" class="ptr-bar__back" aria-label="뒤로" @click="safeBack(router, '/mypage')"><AppIcon name="ui-back" /></button>
      <h1>최근 삭제한 계획</h1>
      <span />
    </header>
    <p class="ptr-note">삭제한 계획은 {{ trashDays }}일 동안 보관돼요. 그 뒤에는 실천 기록·인증사진까지 완전히 지워져요.</p>

    <div v-if="loading" class="ptr-empty">불러오는 중...</div>
    <p v-else-if="!plans.length" class="ptr-empty">최근 삭제한 계획이 없어요.</p>

    <ul v-else class="ptr-list">
      <li v-for="p in plans" :key="p.planId" class="ptr-card">
        <div class="ptr-card__main">
          <strong>{{ p.name || p.targetJob || '내 진로계획' }}</strong>
          <span>
            <template v-if="p.targetJob">{{ p.targetJob }} · </template>프로젝트 {{ p.projectCount }}개
          </span>
          <small :class="{ soon: daysLeft(p.purgeAt) <= 3 }">{{ dateLabel(p.deletedAt) }} 삭제 · {{ daysLeft(p.purgeAt) }}일 뒤 완전히 삭제</small>
        </div>
        <button type="button" class="ptr-card__btn" :disabled="busy === p.planId" @click="undo(p)">
          {{ busy === p.planId ? '되돌리는 중' : '되돌리기' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { safeBack } from '@/shared/utils/navigation'
import { useAchievementStore } from '@/shared/stores/achievement'
import { fetchDeletedPlans, restoreWithConfirm, dateLabel, daysLeft, type DeletedPlan } from '../planTrash.api'

const router = useRouter()
const achievement = useAchievementStore()
const loading = ref(true)
const plans = ref<DeletedPlan[]>([])
const trashDays = ref(30)
const busy = ref('')

async function undo(p: DeletedPlan) {
  if (busy.value) return
  busy.value = p.planId
  try {
    const status = await restoreWithConfirm(p.planId)
    if (status === null) return
    await achievement.loadActivePlan(true)
    router.replace(`/career-design/plan/${p.planId}`)
  } catch {
    alert('되돌리지 못했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    busy.value = ''
  }
}

onMounted(async () => {
  try {
    const r = await fetchDeletedPlans()
    plans.value = r.plans
    trashDays.value = r.trashDays
  } catch { /* 빈 목록 */ } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
@use 'variables' as *;

.ptr { min-height: 100vh; background: #F5F5F3; padding-bottom: calc(env(safe-area-inset-bottom) + 24px); }
.ptr-bar {
  position: sticky; top: 0; z-index: 5; display: grid; grid-template-columns: 44px 1fr 44px; align-items: center;
  height: 52px; padding: env(safe-area-inset-top) 6px 0; background: #fff; box-sizing: content-box;
  h1 { text-align: center; font-size: 16px; font-weight: $tw-title; }
  &__back { width: 40px; height: 40px; display: grid; place-items: center; border: 0; background: none; font-size: 20px; color: #333; cursor: pointer; }
}
.ptr-note { margin: 14px 20px 0; font-size: 13px; line-height: 1.6; color: $color-text-secondary; }
.ptr-empty { margin: 60px 20px; text-align: center; font-size: 14px; color: $color-text-tertiary; }
.ptr-list { list-style: none; margin: 14px 16px 0; padding: 0; display: grid; gap: 10px; }
.ptr-card {
  display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 16px; background: #fff;
  &__main {
    flex: 1; min-width: 0; display: grid; gap: 3px;
    strong { font-size: 15px; font-weight: $tw-strong; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    span { font-size: 13px; color: $color-text-secondary; }
    small { font-size: 12px; color: $color-text-tertiary; &.soon { color: #E5484D; } }
  }
  &__btn {
    flex: none; padding: 9px 14px; border: 0; border-radius: 999px; background: $color-primary; font: inherit; font-size: 13px; font-weight: $tw-strong; color: #141414; cursor: pointer;
    &:disabled { opacity: .5; }
  }
}
</style>
