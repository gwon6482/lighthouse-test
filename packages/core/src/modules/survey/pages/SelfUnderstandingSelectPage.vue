<template>
  <div class="self-understanding-select">
    <AppHeader />

    <div class="select-header">
      <p class="select-eyebrow">검사 방식 선택</p>
      <h2 class="select-title">검사 방식을<br>골라주세요</h2>
    </div>

    <div class="select-button-group">
      <!-- 심플: O / X -->
      <button class="select-button" @click="handleScaleSelect(2)">
        <div class="select-button__top">
          <span class="select-button__title">심플</span>
        </div>
        <div class="select-button__preview">
          <p class="sq-sample-text">나는 새로운 환경에 잘 적응한다.</p>
          <div class="sq2-options">
            <span class="sq2-btn sq2-btn--x">X</span>
            <span class="sq2-btn sq2-btn--o">O</span>
          </div>
        </div>
        <p class="select-button__description">O·X로 빠르게 답해요.</p>
      </button>

      <!-- 베이직: 5단계 원형 -->
      <button class="select-button" @click="handleScaleSelect(5)">
        <div class="select-button__top">
          <span class="select-button__title">베이직</span>
        </div>
        <div class="select-button__preview">
          <p class="sq-sample-text">나는 계획적으로 행동하는 편이다.</p>
          <div class="sq5-options">
            <span class="sq5-dot sq5-dot--1" />
            <span class="sq5-dot sq5-dot--2" />
            <span class="sq5-dot sq5-dot--3" />
            <span class="sq5-dot sq5-dot--4" />
            <span class="sq5-dot sq5-dot--5" />
          </div>
          <div class="sq5-labels">
            <span>전혀 그렇지 않다</span>
            <span>매우 그렇다</span>
          </div>
        </div>
        <p class="select-button__description">5단계로 답하는 가장 일반적인 방식이에요.</p>
      </button>

      <!-- 디테일: 1~10 한 줄 (검사 화면과 같은 모양·색) -->
      <button class="select-button" @click="handleScaleSelect(10)">
        <div class="select-button__top">
          <span class="select-button__title">디테일</span>
        </div>
        <div class="select-button__preview">
          <p class="sq-sample-text">나는 창의적인 방식으로 문제를 푼다.</p>
          <div class="sq10-options">
            <span v-for="n in 10" :key="n" class="sq10-btn" :style="scale10Style(n - 1)">{{ n }}</span>
          </div>
          <div class="sq5-labels">
            <span>전혀 그렇지 않다</span>
            <span>매우 그렇다</span>
          </div>
        </div>
        <p class="select-button__description">10단계로 세밀하게 답해요.<br>결과를 가장 자세히 볼 수 있어요.</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'
import { useSurvey } from '../composables/useSurvey'
import { scale10Style } from '../scaleColors'

const router = useRouter()
const { setScaleType } = useSurvey()

function handleScaleSelect(type: 2 | 5 | 10) {
  setScaleType(type)
  router.push('/self-understanding/test')
}

</script>
