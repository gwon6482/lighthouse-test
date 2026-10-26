// 템플릿에서 수정하기(베타) — 라이트하우스가 미리 설계한 진로계획.
//
// 단계: 비전공 > 전공 (2026-10-22 사용자 제안. '이직'은 2026-10-27 사용자 결정으로 뺐다 — 서비스 단계상 시기상조)
//   - 기존 전문성이 낮을수록 준비가 길다. 비전공 플랜을 가장 빈틈없이 설계하고,
//     전공 플랜은 거기서 대학에서 배우는 것을 뺀다(누적: 전공 ⊂ 비전공)
//   - 그래서 같은 프로젝트는 단계가 달라도 이름·커리큘럼이 같고, 화면에서 '이 단계에서 뺀 것'과 이유를 보여줄 수 있다
//   (이전 '입문 3개월 / 취업 준비 6개월'은 덜 준비된 사람이 더 짧은 계획을 받는 거꾸로 된 구조라 바꿨다)
// 🧪 프로토타입: 프로젝트는 도우미 예시 더미(helperExamples.mock.ts), 단계 표시는 planStages.mock.ts.
//   실제 템플릿(API·운영자 편집)이 생기면 buildPlanTemplates 의 출처만 바꾼다.
// 고르면 임시 계획(draftPlan)을 채워 프로젝트 구성으로 → 직접 설계와 같은 흐름에서 고친다(목표 설정은 맨 끝).
import { helperExampleToProject } from './useHelperExamples'
import { PLAN_STAGES_MOCK, type StageKey, type UpTo } from '../data/planStages.mock'
import type { HelperExample, HelperJobExamples, Project, ProjectCategory } from '../types/career-design'

export interface DroppedItem { name: string; category: ProjectCategory; reason: string }

export interface PlanTemplate {
  id: string
  stage: StageKey
  jobCode: string
  jobTitle: string
  name: string
  stageLabel: string       // 비전공 / 전공
  who: string              // 누구를 위한 단계인지
  months: number           // 약 N개월(두 프로젝트를 나란히 한다고 보고 계산)
  note?: string            // 자격 요건 등 꼭 알아야 할 안내
  posts: number
  projects: Project[]      // 해 나갈 순서대로
  dropped: DroppedItem[]   // 바로 앞 단계에서 이 단계로 오며 뺀 것
}

const STAGES: { key: StageKey; label: string; who: string; keep: UpTo[] }[] = [
  { key: 'nonmajor', label: '비전공', who: '관련 학과·경력이 없어요', keep: ['N', 'M', 'C'] },
  { key: 'major', label: '전공', who: '관련 학과를 졸업했거나 졸업 예정이에요', keep: ['M', 'C'] },
]

// 프로젝트 두 개를 나란히 진행한다고 보고 대략의 기간을 낸다(실제 배치는 사용자가 타임라인에서 정한다)
const PARALLEL = 2
const WEEKS_PER_MONTH = 4.33
const monthsOf = (projects: Project[]) =>
  Math.max(1, Math.round(projects.reduce((n, p) => n + (p.curriculum?.length || p.weeks || 4), 0) / PARALLEL / WEEKS_PER_MONTH))

function exampleById(job: HelperJobExamples): Map<string, { ex: HelperExample; category: ProjectCategory }> {
  const m = new Map<string, { ex: HelperExample; category: ProjectCategory }>()
  for (const [category, list] of Object.entries(job.examples) as [ProjectCategory, HelperExample[]][]) {
    for (const ex of list) m.set(ex.id, { ex, category })
  }
  return m
}

export function buildPlanTemplates(job: HelperJobExamples): PlanTemplate[] {
  const plan = PLAN_STAGES_MOCK[job.jobCode]
  if (!plan) return []
  const byId = exampleById(job)
  const items = plan.order.flatMap((it) => {
    const found = byId.get(it.id)
    return found ? [{ ...it, ...found }] : []
  })

  return STAGES.map((st, i) => {
    const prev = i > 0 ? STAGES[i - 1] : undefined
    const kept = items.filter((it) => st.keep.includes(it.upTo))
    const dropped = prev
      ? items.filter((it) => prev.keep.includes(it.upTo) && !st.keep.includes(it.upTo))
          .map((it) => ({ name: it.ex.name, category: it.category, reason: it.skip ?? '' }))
      : []
    const projects = kept.map((it) => helperExampleToProject(it.ex, it.category))
    return {
      id: `${job.jobCode}-${st.key}`,
      stage: st.key,
      jobCode: job.jobCode,
      jobTitle: job.title,
      name: `${job.title} ${st.label} 플랜`,
      stageLabel: st.label,
      who: st.who,
      months: monthsOf(projects),
      note: plan.notes?.[st.key],
      posts: job.posts,
      projects,
      dropped,
    }
  })
}
