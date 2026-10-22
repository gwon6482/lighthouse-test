// 진로 설계 도우미(베타) — 목표 직업의 프로젝트 예시를 찾고, 내 계획에 담을 Project 로 바꾼다.
//
// 지금 출처는 프로토타입 더미(data/helperExamples.mock.ts). API 가 생기면 findHelperExamples 만 바꾼다.
// 목표 직업 찾기: 진로계획의 목표 직업은 자유 입력 글자다(draftPlan.targetJob) → 이름으로 맞춘다.
//   (최종에는 진로백과에서 정한 목표 진로의 jobCode 를 먼저 쓰고, 없을 때 이름으로)
import { HELPER_EXAMPLES_MOCK } from '../data/helperExamples.mock'
import type { DayOfWeek, HelperExample, HelperJobExamples, Project, ProjectCategory } from '../types/career-design'

const norm = (s: string) => s.replace(/[\s·‧,]/g, '')

/** 프로토타입: 예시가 있는 직업 목록(목표 직업이 여기 없을 때 골라 보기용) */
export const HELPER_EXAMPLE_JOBS = HELPER_EXAMPLES_MOCK.map((j) => ({ jobCode: j.jobCode, title: j.title }))

export function findHelperExamplesByCode(jobCode: string): HelperJobExamples | null {
  return HELPER_EXAMPLES_MOCK.find((j) => j.jobCode === jobCode) ?? null
}

export function findHelperExamples(targetJob: string): HelperJobExamples | null {
  const q = norm(targetJob ?? '')
  if (!q) return null
  return HELPER_EXAMPLES_MOCK.find((j) => norm(j.title) === q)
    ?? HELPER_EXAMPLES_MOCK.find((j) => norm(j.title).includes(q) || q.includes(norm(j.title)))
    ?? null
}

// 주 N회 → 기본 요일(담은 뒤 사용자가 고친다)
const DAYS_BY_COUNT: Record<number, DayOfWeek[]> = {
  1: ['토'],
  2: ['화', '목'],
  3: ['월', '수', '금'],
  4: ['월', '화', '목', '금'],
  5: ['월', '화', '수', '목', '금'],
  6: ['월', '화', '수', '목', '금', '토'],
}

export function helperExampleToProject(ex: HelperExample, category: ProjectCategory): Project {
  return {
    id: `helper-${ex.id}-${Date.now()}`,
    category,
    name: ex.name,
    goal: ex.goal,
    days: [...(DAYS_BY_COUNT[Math.min(6, Math.max(1, ex.daysPerWeek))] ?? ['월', '수', '금'])],
    duration: ex.minutesPerSession,
    priority: 'normal',
    notification: false,
    missedNotification: false,
    notificationTime: '09:00',
    memo: '',
    source: '진로 설계 도우미',
    level: ex.level,
    weeks: ex.curriculum.length,
    description: ex.basis,
    // 커리큘럼 표준(주차별 설명 글)으로 담는다 — 예시 데이터의 항목 목록은 줄바꿈한 글로
    curriculum: ex.curriculum.map((w) => ({ week: w.week, title: w.title, description: w.items.join('\n'), items: [] })),
  }
}
