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
              <li v-for="d in post.duties" :key="d" class="recruit-block__item">{{ d }}</li>
            </ul>
          </div>

          <!-- 자격요건 -->
          <div class="recruit-block">
            <span class="recruit-block__label">자격요건</span>
            <ul class="recruit-block__list">
              <li v-for="r in post.requirements" :key="r" class="recruit-block__item">{{ r }}</li>
            </ul>
          </div>

          <!-- 우대사항 -->
          <div class="recruit-block">
            <span class="recruit-block__label recruit-block__label--pref">우대사항</span>
            <ul class="recruit-block__list">
              <li v-for="p in post.preferred" :key="p" class="recruit-block__item">{{ p }}</li>
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

<style scoped lang="scss">
.recruit-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 50px 40px;
  background-color: #f9fafb;
}

.recruit-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #fff;
  padding: 30px;
  border-radius: 20px;

  &__head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid #eee;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: #333;
  }

  &__desc {
    font-size: 13px;
    color: #999;
  }
}

.recruit-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: #bbb;
}

.recruit-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.recruit-card {
  background-color: #f8f9fa;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__company {
    font-size: 13px;
    font-weight: 600;
    color: #888;
  }

  &__dday {
    font-size: 12px;
    font-weight: 700;
    color: #4a7fc1;
    background-color: #e8edf8;
    border-radius: 20px;
    padding: 3px 10px;
    flex-shrink: 0;

    &--urgent { color: #e0603a; background-color: #fdece7; }
    &--closed { color: #aaa; background-color: #ececec; }
    &--always { color: #3a9a3a; background-color: #e8f4e8; }
  }

  &__position {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    line-height: 1.4;
  }

  &__type {
    align-self: flex-start;
    font-size: 11px;
    font-weight: 600;
    color: #666;
    background-color: #ececec;
    border-radius: 20px;
    padding: 3px 10px;
  }

  &__bottom {
    display: flex;
    justify-content: flex-end;
    margin-top: 2px;
  }

  &__deadline {
    font-size: 12px;
    color: #aaa;
    font-weight: 500;
  }
}

.recruit-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid #eee;

  &__label {
    font-size: 12px;
    font-weight: 700;
    color: #4a7fc1;

    &--pref { color: #3a9a3a; }
  }

  &__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__item {
    position: relative;
    font-size: 13px;
    color: #555;
    line-height: 1.55;
    padding-left: 12px;

    &::before {
      content: '·';
      position: absolute;
      left: 2px;
      color: #bbb;
    }
  }
}
</style>
