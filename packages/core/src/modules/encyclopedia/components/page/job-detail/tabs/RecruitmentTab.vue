<template>
  <div class="recruit-tab">
    <section class="recruit-section">
      <div class="recruit-section__head">
        <h3 class="recruit-section__title">채용공고 ({{ postings.length }})</h3>
        <p class="recruit-section__desc">이 직업으로 현재 채용 중인 공고예요.</p>
      </div>

      <div v-if="postings.length === 0" class="recruit-empty">
        아직 등록된 채용공고가 없습니다.
      </div>

      <ul v-else class="recruit-list">
        <li v-for="post in postings" :key="post.id" class="recruit-card">
          <!-- 헤더: 회사 + 마감 -->
          <div class="recruit-card__head">
            <span class="recruit-card__company">{{ post.companyName }}</span>
            <span class="recruit-card__dday" :class="ddayClass(post.deadline)">
              {{ ddayLabel(post.deadline) }}
            </span>
          </div>

          <!-- 모집포지션 + 고용형태 -->
          <h4 class="recruit-card__position">{{ post.position }}</h4>
          <span class="recruit-card__type">{{ post.employmentType }}</span>

          <!-- 주요업무 -->
          <div class="recruit-block">
            <span class="recruit-block__label">주요업무</span>
            <ul class="recruit-block__list">
              <li v-for="d in post.duties" :key="d" class="recruit-block__item">
                <span class="list-dot" />
                {{ d }}
              </li>
            </ul>
          </div>

          <!-- 자격요건 -->
          <div class="recruit-block">
            <span class="recruit-block__label">자격요건</span>
            <ul class="recruit-block__list">
              <li v-for="r in post.requirements" :key="r" class="recruit-block__item">
                <span class="list-dot" />
                {{ r }}
              </li>
            </ul>
          </div>

          <!-- 우대사항 -->
          <div class="recruit-block">
            <span class="recruit-block__label recruit-block__label--pref">우대사항</span>
            <ul class="recruit-block__list">
              <li v-for="p in post.preferred" :key="p" class="recruit-block__item">
                <span class="list-dot" />
                {{ p }}
              </li>
            </ul>
          </div>

          <div class="recruit-card__bottom">
            <span class="recruit-card__deadline">{{ deadlineText(post.deadline) }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ jobCode: string }>()

/** 채용공고 카드용 샘플 (백엔드 준비 전 하드코딩). jobCode 별로 분리 */
interface SamplePosting {
  id: string
  companyName: string
  position: string        // 모집포지션
  employmentType: string  // 고용형태
  deadline: string        // ISO 날짜 또는 '상시채용'
  duties: string[]        // 주요업무
  requirements: string[]  // 자격요건
  preferred: string[]     // 우대사항
}

// 예술·디자인·방송관리자(013601): 문화·예술·방송 기관 운영 관리직 채용
const SAMPLE_POSTINGS_BY_JOB: Record<string, SamplePosting[]> = {
  '013601': [
    {
      id: 'r1',
      companyName: '국립현대미술관',
      position: '전시운영팀 관리자 (공연·전시 기획)',
      employmentType: '정규직',
      deadline: '2026-07-18',
      duties: [
        '전시 기획·운영 총괄 및 일정 관리',
        '전시 예산 수립과 집행 관리',
        '참여 작가·외부 기관과의 협력 조율',
      ],
      requirements: [
        '예술경영·미술사 관련 학사 이상',
        '전시 기획·운영 경력 5년 이상',
        '프로젝트 관리(PM) 경험',
      ],
      preferred: [
        '예술경영지원센터 교육 이수자',
        '대형 기획전 총괄 경험',
        '영어 커뮤니케이션 가능자',
      ],
    },
    {
      id: 'r2',
      companyName: 'CJ ENM',
      position: '방송제작 운영 매니저',
      employmentType: '정규직',
      deadline: '2026-07-25',
      duties: [
        '방송 콘텐츠 제작 일정·예산 운영',
        '제작팀 리소스 배분 및 조율',
        '외주 제작사 계약·정산 관리',
      ],
      requirements: [
        '방송·미디어 분야 경력 7년 이상',
        '제작 예산 관리 경험',
        '다부서 협업 커뮤니케이션 역량',
      ],
      preferred: [
        '콘텐츠 제작 PD 경험',
        '저작권·계약 실무 이해',
        '신규 포맷 기획 경험',
      ],
    },
    {
      id: 'r3',
      companyName: '세종문화회관',
      position: '공연사업본부 운영 관리자',
      employmentType: '계약직 (정규직 전환형)',
      deadline: '상시채용',
      duties: [
        '공연 시즌 프로그램 편성·운영',
        '공연장 대관 및 스태프 관리',
        '관객 개발·홍보 전략 실행',
      ],
      requirements: [
        '공연 기획·운영 경력 3년 이상',
        '예산 및 정산 실무 경험',
        '주말·야간 공연 운영 가능자',
      ],
      preferred: [
        '공연예술 관련 자격 또는 학위',
        '티켓팅·CRM 시스템 운영 경험',
        '외국어 가능자',
      ],
    },
  ],
}

const postings = computed<SamplePosting[]>(() => SAMPLE_POSTINGS_BY_JOB[props.jobCode] ?? [])

function daysLeft(deadline: string): number | null {
  if (deadline === '상시채용') return null
  const end = new Date(deadline + 'T23:59:59')
  const now = new Date()
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
}

function ddayLabel(deadline: string): string {
  const d = daysLeft(deadline)
  if (d === null) return '상시채용'
  if (d < 0) return '마감'
  if (d === 0) return 'D-DAY'
  return `D-${d}`
}

function ddayClass(deadline: string): string {
  const d = daysLeft(deadline)
  if (d === null) return 'recruit-card__dday--always'
  if (d < 0) return 'recruit-card__dday--closed'
  if (d <= 7) return 'recruit-card__dday--urgent'
  return ''
}

function deadlineText(deadline: string): string {
  if (deadline === '상시채용') return '채용시 마감'
  return `~ ${deadline.replace(/-/g, '.')} 까지`
}
</script>
