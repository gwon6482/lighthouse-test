<!-- 소개 화면 가운데 그림(2026-11-22 시안 4판) — 실제 앱 화면을 닮게 단순하게 그린 것(캡처 아님).
     이야기: '중·고등학교 교사'를 꿈꾸는 한 사람. 날짜·주차·%·메모는 예시(부모가 '예시 화면이에요'를 단다).
       result  = 결과지 '나에게 맞는 직무 3가지'(직무·이유 이름은 앱의 실제 이름, 막대 숫자는 예시)
       job     = 진로백과 직업 상세 212101 머리 + 개요 탭(운영 값: 배지·'나의 추천 진로에 있어요'·주요업무·업무수행능력·흥미 '중요도·직업내' 상위 3개).
                 연봉은 넣지 않는다(11-22 오너 — 직무 정보와 적합도가 주인공)
       plan    = 진로계획 라이브러리 212101 국공립 임용 갈래(요약·꼭 거쳐야 하는 것·걸음 이름과 분류)
       today   = 진로달성 홈(CareerAchievementPage) — 오늘 할 일(방법·루틴 아이콘, 시작/완료, '완료 N개')과 이번 주 목표
       review  = 주간결산 — 1단계 성과(머리·%·요일) + 2단계 '이번 주에 끝낸 항목' + 3단계 '한 줄 메모'를 한 장에 모은 것
       roadmap = 로드맵(AchievementRoadmap) — 노란 머리 + 정거장(완료 · 진행 중 · 지금 여기 · 다음)
     4·5·6쪽의 할 일·항목·정거장은 서로 맞는다(전공 교과 내용학 공부 2/3 · 교직이수 1/3 = 끝낸 항목 3개).
     분류 색은 CATEGORY_META(정본), 아이콘은 자체 아이콘 키. 화면 읽기에는 부모가 짧은 설명(role=img)만 준다 — 여기는 모두 aria-hidden -->
<template>
  <div :class="['iart', `iart--${kind}`]" aria-hidden="true">
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
        <span class="iart__rec"><AppIcon name="ui-sparkle" />나의 추천 진로에 있어요</span>
      </div>
      <div class="iart__tabs"><b>개요</b><span>후기</span><span>준비과정</span><span>채용</span></div>
      <div class="iart__sec">
        <b>주요업무</b>
        <p>{{ OVERVIEW }}</p>
      </div>
      <div class="iart__pf">
        <div class="iart__pfhead"><b>업무수행능력</b><span>중요도</span></div>
        <p class="iart__pflab"><AppIcon name="ui-target" />이 직업에서 특히 중요해요</p>
        <div class="iart__pfchips"><span v-for="a in ABILITIES" :key="a">{{ a }}</span></div>
      </div>
      <div class="iart__pf iart__pf--mini">
        <div class="iart__pfhead"><b>흥미</b><span>중요도</span></div>
        <div class="iart__pfchips"><span v-for="a in INTERESTS" :key="a">{{ a }}</span></div>
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
          <i class="iart__no">{{ i + 1 }}</i>{{ s.name }}<em :style="catStyle(s.cat, 16)">{{ CATEGORY_META[s.cat].label }}</em>
        </span>
      </div>
    </template>

    <template v-else-if="kind === 'today'">
      <div class="iart__todayhead"><span class="iart__title">오늘 할 일</span><span><b>1</b>/3</span></div>
      <ul class="iart__list">
        <li class="iart__task iart__task--next">
          <span class="iart__chip" :style="catStyle('knowledge')"><AppIcon :name="methodIcon('school')" /></span>
          <span class="iart__tbody"><span class="iart__eye">지금 할 일</span><span class="iart__tname">전공 교과 내용학 공부</span><span class="iart__tsub">1주차 · 기출과 연결</span></span>
          <span class="iart__start">시작</span>
        </li>
        <li class="iart__task">
          <span class="iart__chip" :style="ROUTINE_STYLE"><AppIcon name="ui-repeat" /></span>
          <span class="iart__tbody"><span class="iart__tname">전공 기본서 한 단원 읽기</span><span class="iart__tsub">루틴 · 30분 · 이번 주 1/3번</span></span>
          <span class="iart__done-btn">완료</span>
        </li>
      </ul>
      <p class="iart__divider">완료 1개</p>
      <ul class="iart__list">
        <li class="iart__task iart__task--done">
          <span class="iart__chip" :style="catStyle('knowledge')"><AppIcon :name="methodIcon('school')" /></span>
          <span class="iart__tbody"><span class="iart__tname">교직이수</span></span>
          <span class="iart__state"><AppIcon name="ui-check" /> 완료</span>
        </li>
      </ul>
      <div class="iart__week">
        <div class="iart__whead"><b>이번 주 목표<span> · 3주차</span></b><span class="iart__badge-d">결산 D-3</span></div>
        <div v-for="g in WEEK_GOALS" :key="g.name" class="iart__goal">
          <span class="iart__gname"><i :style="{ background: CATEGORY_META[g.cat].color }" />{{ g.name }}</span>
          <span class="iart__gcount">할 일 <b>{{ g.done }}</b>/{{ g.total }}</span>
          <span class="iart__gbar"><i v-for="n in g.total" :key="n" :style="n <= g.done ? { background: CATEGORY_META[g.cat].color } : undefined" /></span>
        </div>
      </div>
    </template>

    <template v-else-if="kind === 'review'">
      <!-- 위 노란 바(주간결산 · 1 / 5)는 REVIEW_BAR 한 곳으로 켜고 끈다(11-22 시안 4판: 권장 = 있음, 변형 = 없음) -->
      <div v-if="REVIEW_BAR" class="iart__rbar">
        <div class="iart__rrow"><AppIcon name="ui-close" /><b>주간결산</b><span>1 / 5</span></div>
        <div class="iart__rdots"><i v-for="n in 5" :key="n" :class="{ on: n === 1 }" /></div>
      </div>
      <div class="iart__rbody">
        <span class="iart__rtitle">꾸준히 잘 해냈어요</span>
        <div class="iart__hero"><strong>75<small>%</small></strong><span>계획한 8개 중 6개 완료</span></div>
        <ul class="iart__days">
          <li v-for="d in DAYS" :key="d.dow" :class="`iart__day iart__day--${d.state}`">
            <small>{{ d.dow }}</small>
            <span><AppIcon v-if="d.state === 'all'" name="ui-check" /><template v-else>{{ d.mark }}</template></span>
          </li>
        </ul>
        <span class="iart__rsub">이번 주에 끝낸 항목 {{ GAINS.length }}개</span>
        <ul class="iart__gain">
          <li v-for="g in GAINS" :key="g.text"><i :style="{ background: CATEGORY_META.knowledge.color }" /><span>{{ g.text }}</span><small>{{ g.project }}</small></li>
        </ul>
        <div class="iart__memo"><small>한 줄 메모</small><span>개념 정리 노트를 처음으로 끝까지 썼다</span></div>
      </div>
    </template>

    <template v-else>
      <div class="iart__rmbar">
        <div class="iart__rmrow"><b>중·고등학교교사까지의 여정</b><strong>3<small>%</small></strong></div>
        <span class="iart__rmtrack"><i style="width: 3%" /></span>
        <p class="iart__rmmeta">지금 <b>3주차</b> / 160주 · 남은 약 158주</p>
      </div>
      <ol class="iart__path">
        <template v-for="s in STOPS" :key="s.name">
          <li v-if="s.status === 'next'" class="iart__here"><span>지금 여기 · 3주차</span></li>
          <li :class="['iart__node', `iart__node--${s.status}`]">
            <span class="iart__dot"><AppIcon v-if="s.status === 'done'" name="ui-check" /><i v-else /></span>
            <div class="iart__stop">
              <span class="iart__stop-top">
                <span class="iart__stop-chip" :style="catStyle(s.cat)"><AppIcon :name="methodIcon(s.method)" /></span>
                <span class="iart__stop-when">{{ s.when }}</span>
                <span class="iart__stop-status">{{ s.label }}</span>
              </span>
              <span class="iart__stop-name">{{ s.name }}</span>
              <span class="iart__stop-cat">{{ CATEGORY_META[s.cat].label }}</span>
              <span class="iart__stop-bar"><i :style="{ width: `${(s.done / s.total) * 100}%`, background: CATEGORY_META[s.cat].color }" /></span>
              <span class="iart__stop-count">{{ s.done }} / {{ s.total }}</span>
            </div>
          </li>
        </template>
      </ol>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { CATEGORY_META } from '@/modules/career-achievement/lib/planBoard'
import { methodIcon, type ProjectMethod } from '@/modules/career-design/composables/projectMethods'
import type { IntroArtKey } from '../lib/introSlides'

defineProps<{ kind: IntroArtKey }>()

type Cat = keyof typeof CATEGORY_META

// 5쪽 주간결산 그림의 노란 바 — 오너가 '변형(바 없음)'을 고르면 여기만 false 로
const REVIEW_BAR = true

// 결과지 막대 — 숫자는 예시, 색은 결과지(SurveyResultBody)의 세 영역 색
const BARS = [
  { name: '성격/기질', v: 81, color: '#EF8A5B' },
  { name: '재능/흥미/가치관', v: 84, color: '#43AEF2' },
  { name: '업무환경', v: 72, color: '#2EC28E' },
]
// 212101 운영 값(2026-11-22 GET /api/job/212101) — 주요업무 원문은 화면처럼 두 줄로 자른다
const OVERVIEW = '국·공·사립의 중·고등학교에서 교육과정의 학습내용을 가르치기 위하여 교과서, 시청각 자료, 실험 장치와 적절한 방법을 적용하여 중·고등학생들에게 교과목을 가르치고 평가하며 생활을 지도하는 업무를 수행한다.'
const ABILITIES = ['가르치기', '듣고 이해하기', '읽고 이해하기']
const INTERESTS = ['사회형', '현실형', '진취형']
// 212101 국공립 임용 갈래의 앞 걸음
const STEPS: { name: string; cat: Cat }[] = [
  { name: '교원자격 취득 경로 정하기', cat: 'knowledge' },
  { name: '교직이수', cat: 'knowledge' },
  { name: '교육봉사', cat: 'experience' },
  { name: '임용시험 1차(교육학·전공)', cat: 'qualification' },
]
// 4쪽 이번 주 목표 — 5쪽 '끝낸 항목 3개'와 같은 칸
const WEEK_GOALS: { name: string; cat: Cat; done: number; total: number }[] = [
  { name: '전공 교과 내용학 공부', cat: 'knowledge', done: 2, total: 3 },
  { name: '교직이수', cat: 'knowledge', done: 1, total: 3 },
]
// 5쪽 — 월 2/2 · 화 1/1 · 수 1/2 · 목 1/1 · 금 1/2 = 8개 중 6개(75% → '꾸준히 잘 해냈어요', 앱 규칙 70% 이상)
const DAYS = [
  { dow: '월', state: 'all', mark: '' }, { dow: '화', state: 'all', mark: '' }, { dow: '수', state: 'part', mark: '1/2' },
  { dow: '목', state: 'all', mark: '' }, { dow: '금', state: 'part', mark: '1/2' }, { dow: '토', state: 'rest', mark: '–' },
  { dow: '일', state: 'rest', mark: '–' },
]
const GAINS = [
  { text: '전공 과목 수업', project: '전공 교과 내용학 공부' },
  { text: '개념 정리 노트', project: '전공 교과 내용학 공부' },
  { text: '학과 교직이수 선발 기준 확인', project: '교직이수' },
]
// 6쪽 정거장 — 이름·분류·방법은 라이브러리 212101 실제 걸음, 주차·날짜·개수는 예시(전공 공부 46 = 15주 × 3 + 1)
const STOPS: { name: string; cat: Cat; method: ProjectMethod; status: 'done' | 'now' | 'next'; when: string; label: string; done: number; total: number }[] = [
  { name: '교원자격 취득 경로 정하기', cat: 'knowledge', method: 'etc', status: 'done', when: '1~2주차 · 11/2~11/15', label: '완료', done: 6, total: 6 },
  { name: '전공 교과 내용학 공부', cat: 'knowledge', method: 'school', status: 'now', when: '3~18주차 · 11/16~3/7', label: '진행 중', done: 2, total: 46 },
  { name: '교육봉사', cat: 'experience', method: 'activity', status: 'next', when: '5~16주차 · 11/30~2/21', label: '2주 뒤 시작', done: 0, total: 30 },
]

// 루틴 칩 색 — 진로달성 홈과 같은 값(usePlanBoard ROUTINE_COLOR · ROUTINE_TINT). 홈 컴포저블을 끌어오지 않으려고 값만 둔다
const ROUTINE_STYLE = { color: '#3B6FD8', background: '#E6F0FF' }
const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, #fff)`
const catStyle = (c: Cat, pct = 14) => ({ color: CATEGORY_META[c].color, background: tint(CATEGORY_META[c].color, pct) })
</script>
