// 템플릿에서 수정하기(베타) — 라이트하우스가 미리 설계한 진로계획.
//
// 🧪 프로토타입: 템플릿은 도우미 예시 더미(data/helperExamples.mock.ts)를 묶어서 만든다.
//   - 입문 3개월: 카테고리마다 가장 쉬운 예시 1개
//   - 취업 준비 6개월: 카테고리마다 가장 쉬운 것 1개 + 가장 높은 단계 1개
//     (쉬운 것 2개로 채우면 응용SW 에서 공고 24%가 요구하는 정보처리기사가 빠지고 기능사·리눅스마스터만 남았다)
//   실제 템플릿(API·운영자 편집)이 생기면 buildPlanTemplates 의 출처만 바꾼다.
// 고르면 임시 계획(draftPlan)을 채워 '목표 설정' 화면으로 보낸다 → 그 뒤는 직접 설계와 같은 흐름에서 고친다.
//   (목표 설정을 마칠 때 담긴 프로젝트를 서버에 한꺼번에 저장한다 — syncPlanStep1 의 projects/bulk)
import { helperExampleToProject } from './useHelperExamples'
import type { HelperExample, HelperJobExamples, Project, ProjectCategory } from '../types/career-design'

export interface PlanTemplate {
  id: string
  jobCode: string
  jobTitle: string
  name: string
  months: number
  level: '입문' | '취업 준비'
  summary: string
  posts: number            // 근거로 쓴 채용공고 수
  projects: Project[]
}

const CATS: ProjectCategory[] = ['qualification', 'knowledge', 'skill', 'portfolio']

// 쉬운 것부터: 입문 → 중급, 같은 난이도면 원래 순서
const easyFirst = (a: HelperExample, b: HelperExample) => (a.level === b.level ? 0 : a.level === '입문' ? -1 : 1)

// 예시는 생성 단계에서 쉬운 것 → 어려운 것 순으로 만들었다. 같은 난이도 안에서는 뒤쪽이 더 높은 단계
function pick(job: HelperJobExamples, mode: 'starter' | 'jobready'): Project[] {
  return CATS.flatMap((c) => {
    const list = [...(job.examples[c] ?? [])].sort(easyFirst)
    const first = list[0]
    const last = list[list.length - 1]
    if (!first || !last) return []
    const chosen = mode === 'starter' || first === last ? [first] : [first, last]
    return chosen.map((ex) => helperExampleToProject(ex, c))
  })
}

export function buildPlanTemplates(job: HelperJobExamples): PlanTemplate[] {
  return [
    {
      id: `${job.jobCode}-starter`,
      jobCode: job.jobCode,
      jobTitle: job.title,
      name: `${job.title} 입문 3개월 플랜`,
      months: 3,
      level: '입문',
      summary: `처음 준비를 시작하는 분을 위해, 카테고리마다 가장 기본이 되는 프로젝트를 하나씩 담았어요.`,
      posts: job.posts,
      projects: pick(job, 'starter'),
    },
    {
      id: `${job.jobCode}-jobready`,
      jobCode: job.jobCode,
      jobTitle: job.title,
      name: `${job.title} 취업 준비 6개월 플랜`,
      months: 6,
      level: '취업 준비',
      summary: `기초부터 시작해 채용공고에서 요구하는 수준의 자격·지식·기술·포트폴리오까지 6개월 동안 쌓아요.`,
      posts: job.posts,
      projects: pick(job, 'jobready'),
    },
  ]
}

/** 오늘부터 N개월 뒤 날짜(YYYY-MM-DD) */
export function addMonthsKey(from: Date, months: number): string {
  const d = new Date(from)
  d.setMonth(d.getMonth() + months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
