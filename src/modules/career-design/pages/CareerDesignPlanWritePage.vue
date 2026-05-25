<template>
  <div class="cd-plan-write">
    <!-- 헤더 -->
    <CdYellowHeader
      title="진로계획 세우기"
      :subtitle="`${draftPlan.targetJob || '목표 직업'}을 위한 프로젝트를 만들어 보세요`"
      back-to="/career-design"
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

          <!-- 준비 기간 -->
          <div class="cd-plan-write__prow">
            <span class="cd-plan-write__plabel">기간</span>
            <div class="cd-plan-write__date-row">
              <CdDatePicker v-model="draftPlan.startDate" placeholder="시작일" />
              <span class="cd-plan-write__date-tilde">~</span>
              <CdDatePicker v-model="draftPlan.endDate" placeholder="종료일" />
            </div>
          </div>
        </div>

        <button class="cd-plan-write__duty-link" @click="router.push('/career-encyclopedia')">
          진로백과에서 채용공고 확인하기 →
        </button>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-plan-write__footer">
      <button class="cd-plan-write__cta" @click="goNext">다음으로</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdDatePicker from '../components/CdDatePicker.vue'

const router = useRouter()
const { draftPlan, syncPlanStep1 } = useCareerDesign()

async function goNext() {
  await syncPlanStep1()
  router.push('/career-design/plan/projects')
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

  &__cat-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    border: 2.5px solid transparent;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  &__cat-item--active &__cat-icon {
    border-color: #222;
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
  }

  &__cta {
    width: 100%;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }
}
</style>
