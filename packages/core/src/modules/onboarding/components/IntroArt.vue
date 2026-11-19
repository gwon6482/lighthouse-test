<!-- 소개 화면 가운데 그림(2026-11-20 시안 2판) — 실제 앱 화면을 닮게 단순하게 그린 것(캡처 아님).
     이야기: '중·고등학교 교사'를 꿈꾸는 한 사람.
       result = 결과지 '나에게 맞는 직무 3가지'(직무·이유 이름은 앱의 실제 이름, 막대 숫자는 예시)
       job    = 진로백과 직업 상세 212101(운영 값: 배지·되려면·연봉·만족도·전문가 전망, 2026-11-20)
       plan   = 진로계획 라이브러리 212101 국공립 임용 갈래(요약·꼭 거쳐야 하는 것·걸음 이름과 분류)
       today  = 같은 계획의 오늘 할 일·이번 주 목표(순서·개수는 예시)
     분류 색·라벨은 CATEGORY_META(정본). 화면 읽기에는 부모가 짧은 설명(role=img)만 준다 — 여기는 모두 aria-hidden -->
<template>
  <div class="iart" aria-hidden="true">
    <template v-if="kind === 'result'">
      <span class="iart__eyebrow">종합 추천</span>
      <span class="iart__title">나에게 맞는 직무 3가지</span>
      <div class="iart__grp">
        <div class="iart__head"><span class="iart__rank">1</span>교수·학교·유치원 교사</div>
        <div class="iart__bars">
          <template v-for="b in BARS" :key="b.name">
            <span>{{ b.name }}</span>
            <i><b :style="{ width: b.v + '%', background: b.color }" /></i>
            <em>{{ b.v }}</em>
          </template>
        </div>
        <p class="iart__why">특히 <b>교육 및 상담 분야</b><small>(관심)</small>와 <b>대인 관계 지능</b><small>(재능)</small>이 잘 맞아요</p>
        <div class="iart__jobs"><span>중·고등학교교사<b>›</b></span><span>초등학교교사<b>›</b></span></div>
      </div>
    </template>

    <template v-else-if="kind === 'job'">
      <div class="iart__stack">
        <span class="iart__title">중·고등학교교사</span>
        <span class="iart__badges">
          <span class="iart__badge iart__badge--deg">학위 필수</span>
          <span class="iart__badge iart__badge--sel">선발 시험</span>
        </span>
      </div>
      <div class="iart__gate">
        <b>이 직업이 되려면</b>
        <div class="iart__gchips"><span>관련 학과 졸업</span><span>선발 시험 합격</span></div>
      </div>
      <div class="iart__row">
        <div class="iart__sal">
          <span>하위 25%<br>4,000</span>
          <span class="iart__sal-mid">중위<br><b>4,950</b></span>
          <span class="iart__sal-end">상위 25%<br>7,250</span>
        </div>
        <div class="iart__line" />
        <small>연봉(만 원) · 만족도 73.5%</small>
      </div>
      <div class="iart__row">
        <span class="iart__chip">유지</span>
        <span class="iart__txt">전문가들은 앞으로 일자리가 지금과 비슷할 것으로 봐요.</span>
        <span class="iart__src">출처: 한국고용정보원 「2021~2023 한국직업전망」(2023)</span>
      </div>
    </template>

    <template v-else-if="kind === 'plan'">
      <span class="iart__txt iart__txt--strong">교과 교원자격증(정교사 2급)이 있어야 해요. 사범대, 일반 학과의 교직이수, 교육대학원 가운데 한 경로로 자격을 받고 임용시험이나 사립 채용에 지원해요.</span>
      <div class="iart__gate iart__gate--must">
        <small>꼭 거쳐야 하는 것</small>
        <span class="iart__txt">중등 정교사 2급(사범대·교직이수·교육대학원) + 국공립은 임용시험 합격</span>
      </div>
      <div class="iart__steps">
        <span v-for="(s, i) in STEPS" :key="s.name">
          <i class="iart__no">{{ i + 1 }}</i>{{ s.name }}<em :style="catStyle(s.cat)">{{ CATEGORY_META[s.cat].label }}</em>
        </span>
      </div>
    </template>

    <template v-else>
      <div class="iart__todayhead"><span class="iart__title">오늘 할 일</span><span>0/2</span></div>
      <div class="iart__today">
        <div v-for="t in TODAY" :key="t" class="iart__task">
          <i :style="{ background: tint('knowledge') }" /><span>{{ t }}</span><b>시작</b>
        </div>
      </div>
      <div class="iart__week">
        <div><b>이번 주 목표 · 1주차</b><span class="iart__dday">결산 D-6</span></div>
        <div><span>교원자격 취득 경로 정하기</span><span><b>0</b>/3</span></div>
        <div class="iart__wbar"><i /><i /><i /></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CATEGORY_META } from '@/modules/career-achievement/lib/planBoard'
import type { IntroArtKey } from '../lib/introSlides'

defineProps<{ kind: IntroArtKey }>()

type Cat = keyof typeof CATEGORY_META

// 결과지 막대 — 숫자는 예시(시안 그대로), 색은 결과지(SurveyResultBody)의 세 영역 색
const BARS = [
  { name: '성격/기질', v: 81, color: '#EF8A5B' },
  { name: '재능/흥미/가치관', v: 84, color: '#43AEF2' },
  { name: '업무환경', v: 72, color: '#2EC28E' },
]
// 212101 국공립 임용 갈래의 앞 걸음
const STEPS: { name: string; cat: Cat }[] = [
  { name: '교원자격 취득 경로 정하기', cat: 'knowledge' },
  { name: '교직이수', cat: 'knowledge' },
  { name: '교육봉사', cat: 'experience' },
  { name: '임용시험 1차(교육학·전공)', cat: 'qualification' },
]
const TODAY = ['교원자격 취득 경로 정하기', '전공 교과 내용학 공부']

const tint = (c: Cat) => `color-mix(in srgb, ${CATEGORY_META[c].color} 16%, #fff)`
const catStyle = (c: Cat) => ({ color: CATEGORY_META[c].color, background: tint(c) })
</script>
