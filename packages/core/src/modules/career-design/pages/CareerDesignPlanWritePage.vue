<template>
  <div class="cd-plan-write">
    <!-- 헤더 -->
    <CdYellowHeader
      title="목표 설정"
      subtitle="마지막으로 목표 직업·계획 이름·기간을 정해요"
      back-to="/career-design/plan/review-day"
    />

    <div class="cd-plan-write__body">

      <!-- 목표 설정 -->
      <div class="cd-plan-write__section">
        <h3 class="cd-plan-write__section-title">목표 설정</h3>

        <div class="cd-plan-write__preview">
          <!-- 목표 직업 -->
          <div class="cd-plan-write__prow">
            <span class="cd-plan-write__plabel">직업</span>
            <input
              v-model="draftPlan.targetJob"
              class="cd-plan-write__pinput"
              placeholder="예: 마케팅 기획자"
            />
          </div>

          <!-- 계획명 -->
          <div class="cd-plan-write__prow">
            <span class="cd-plan-write__plabel">계획명</span>
            <input
              v-model="draftPlan.name"
              class="cd-plan-write__pinput"
              placeholder="예: OOO의 마케팅 기획자 되기 프로젝트"
            />
          </div>

          <!-- 준비 기간 — 시작일은 오늘로 고정 -->
          <div class="cd-plan-write__prow">
            <span class="cd-plan-write__plabel">기간</span>
            <div class="cd-plan-write__date-row">
              <div class="cd-plan-write__date-fixed" aria-readonly="true">
                <span class="cd-plan-write__date-fixed-label">오늘</span>
                <span class="cd-plan-write__date-fixed-value">{{ todayLabel }}</span>
              </div>
              <span class="cd-plan-write__date-tilde">~</span>
              <CdDatePicker v-model="draftPlan.endDate" :min="endMin" placeholder="종료일" />
            </div>
          </div>
        </div>

        <!-- 타임라인 기준 추천 종료일 — 배치한 프로젝트가 모두 끝나는 날 -->
        <p v-if="suggestedEnd" class="cd-plan-write__suggest">
          <template v-if="draftPlan.endDate === suggestedEnd">
            타임라인에 배치한 프로젝트가 모두 끝나는 날({{ fmtDate(suggestedEnd) }})로 정했어요.
          </template>
          <template v-else>
            타임라인 기준으로는 {{ fmtDate(suggestedEnd) }}에 모두 끝나요.
            <button type="button" class="cd-plan-write__suggest-btn" @click="draftPlan.endDate = suggestedEnd">이 날짜로</button>
          </template>
        </p>

        <button class="cd-plan-write__duty-link" @click="router.push('/career-encyclopedia')">
          진로백과에서 진로정보 확인하기 <AppIcon name="ui-arrow-right" />
        </button>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-plan-write__footer">
      <button class="cd-plan-write__btn-secondary" @click="goPrev">이전으로</button>
      <button class="cd-plan-write__btn-primary" :disabled="!canProceed || saving" @click="goNext">{{ saving ? '저장 중…' : '계획 완성하기' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import { useUnsavedGuard } from '@/shared/composables/useUnsavedGuard'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdDatePicker from '../components/CdDatePicker.vue'
import { getToday } from '@/shared/utils/dev-date'
import { suggestedEndDate } from '../composables/usePlanTimeline'

const router = useRouter()
const { draftPlan, draftTimeline, finalizePlan } = useCareerDesign()

// ⚠️ 2026-10-20 순서 변경: 목표 설정은 진로설계의 **맨 마지막** 단계다
//   (진로계획 세우기 → 프로젝트 구성 → 타임라인 → 루틴 → 주간 리뷰 요일 → 목표 설정 → 계획 완성).
//   사용자: "프로젝트를 배치하지도 않았는데 종료일을 설정하는 게 큰 의미가 없다"
//   → 종료일은 타임라인에서 가장 늦게 끝나는 프로젝트 기준으로 추천하고, 완성하면서 서버에 한 번에 올린다(finalizePlan)

// 시작일은 사용자 기준 "오늘"로 고정 (미래 시작일로 인한 빈 주간일정 방지).
function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const todayKey = computed(() => toDateKey(getToday()))
const suggestedEnd = computed(() => suggestedEndDate(todayKey.value, draftTimeline.value, draftPlan.projects))
const fmtDate = (k: string) => k.replace(/-/g, '.')
const saving = ref(false)
const endMin   = computed(() => draftPlan.startDate || todayKey.value)

// 완료(종료)날짜를 지정해야 다음 단계로 진행 가능
const canProceed = computed(() => !!draftPlan.endDate)

const todayLabel = computed(() => {
  const d = getToday()
  const DOW = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${DOW[d.getDay()]})`
})

// 시작일은 오늘로 고정. 타임라인 슬롯은 '몇 주차'로 저장돼 있어, 시작일이 바뀌어도 배치 순서·간격은 그대로다
onMounted(() => {
  draftPlan.startDate = todayKey.value
  // 종료일을 아직 안 정했으면 타임라인 기준 추천값으로 채운다(바꿀 수 있다)
  if (!draftPlan.endDate && suggestedEnd.value) draftPlan.endDate = suggestedEnd.value
})

// 미저장 이탈 가드 (R2) — 개요 입력(이름/목표직업/기간) 변경 시 이탈 경고.
// 시작일 자동 고정 이후에 기준선을 잡도록 onMounted 등록 뒤에 호출.
const { bypass } = useUnsavedGuard(() => JSON.stringify({
  name: draftPlan.name,
  targetJob: draftPlan.targetJob,
  startDate: draftPlan.startDate,
  endDate: draftPlan.endDate,
}))

function goPrev() {
  router.push('/career-design/plan/review-day')
}

async function goNext() {
  if (!canProceed.value || saving.value) return
  saving.value = true
  bypass()
  await finalizePlan() // 비로그인이면 실패해도 로컬 임시 계획으로 결과 화면은 보인다(기존과 같음)
  saving.value = false
  router.push('/career-design/result')
}
</script>

<style lang="scss">
.cd-plan-write {
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

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__duty-link {
    background: none;
    border: none;
    font-size: 12px;
    color: #FFC700;
    font-weight: 600;
    cursor: pointer;
    padding: 12px 0 0;
    display: block;
    text-align: right;
    white-space: nowrap;

    &:hover { text-decoration: underline; }
  }

  /* 미리보기 영역 */
  &__preview {
    background: #F8F8F8;
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__prow {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__plabel {
    font-size: 11px;
    font-weight: 600;
    color: #aaa;
    min-width: 34px;
    padding-top: 1px;
  }

  &__pinput {
    flex: 1;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 500;
    color: #222;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: #bbb; font-weight: 400; }
    &:focus { border-color: #FFC700; }
  }

  /* 날짜 row */
  &__date-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &__date-box {
    position: relative;
    flex: 1;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: border-color 0.15s;

    &:focus-within { border-color: #FFC700; }
  }

  &__date-tilde {
    font-size: 13px;
    color: #bbb;
    flex-shrink: 0;
  }

  /* 시작일 고정(오늘) 표시 — 읽기전용 */
  &__date-fixed {
    flex: 1;
    min-width: 0;
    background: #FFF9E0;
    border: 1px solid #FFE99A;
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;

    &-label {
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 800;
      color: #B07800;
      background: #FFE99A;
      border-radius: 6px;
      padding: 2px 7px;
    }

    &-value {
      font-size: 13px;
      font-weight: 600;
      color: #222;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__categories {
    display: flex;
    justify-content: space-around;
    margin-bottom: 16px;
  }

  &__cat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  // 아이콘 그림은 모서리가 이미 둥글다(42px 기준 반경 10 → 52px 에서 약 12.4px).
  // 예전에는 선택 테두리를 그림 '안쪽'에 2.5px 로 그려 둥글기가 어긋나 흰 틈이 보였다(2026-10-23 사용자 제보)
  // → 테두리 없이, 그림과 같은 둥글기로 바깥에 딱 붙는 링(box-shadow)
  &__cat-icon {
    width: 52px;
    height: 52px;
    border-radius: 12.4px;
    transition: box-shadow 0.15s;
  }

  &__cat-item--active &__cat-icon {
    box-shadow: 0 0 0 3px #222;
  }

  &__cat-label {
    font-size: 12px;
    color: #555;
  }

  &__plan-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__plan-chip {
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    &-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    &-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
  }

  &__plan-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1;
    transition: background 0.12s;

    &--edit   { color: #888; &:hover { background: rgba(0,0,0,0.08); } }
    &--delete { color: rgba(0,0,0,0.2); &:hover { background: #FFE8E8; color: #FF5555; } }
  }

  &__add-btn {
    width: 100%;
    padding: 14px;
    background: #2D7A4F;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    margin-top: 4px;

    &:active { opacity: 0.85; }
  }

  &__footer {
    padding: 16px 20px 32px;
    display: flex;
    gap: 10px;
  }

  &__btn-secondary {
    flex: 1;
    padding: 18px;
    background: #fff;
    border: 1.5px solid #ddd;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 700;
    color: #666;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }

  &__btn-primary {
    flex: 2;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }

    &:disabled {
      background: #e8e8e8;
      color: #aaa;
      cursor: not-allowed;
    }
  }
}

.cd-plan-write__suggest {
  margin-top: 10px;
  font-size: 12px;
  color: #777;
  line-height: 1.5;
}
.cd-plan-write__suggest-btn {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #B07D00;
  background: #FFF6D6;
  border: none;
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
}
</style>
