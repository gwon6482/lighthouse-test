// 템플릿에서 시작하기(베타) — 목표 직업의 예시 진로설계를 내 계획의 출발점으로 쓴다.
//
// 출처: 진로계획 라이브러리(진로백과 준비과정 탭과 같은 자료, 2026-11-15~). 그전의 시범 5직업 더미(planStages.mock.ts)는 지웠다.
// 단계: 비전공 > 전공 (2026-10-22 사용자 제안. '이직'은 2026-10-27 사용자 결정으로 뺐다)
//   - 계획은 비전공자 기준으로 빈틈없이 짜여 있고, 전공 플랜은 거기서 대학에서 배우는 것(major: false)을 뺀다(전공 ⊂ 비전공)
//   - 그래서 화면에서 '전공자라서 뺀 것'과 이유를 보여 줄 수 있다
//   - 전공자에게 줄어드는 것이 없는 길은 플랜이 하나다(기본)
// 지원하는 곳에 따라 고르는 항목(optional)은 플랜에 넣지 않고 따로 보여 준다 — 다음 화면의 도우미 추천에서 담을 수 있다.
// 고르면 임시 계획(draftPlan)을 채워 프로젝트 구성으로 → 직접 설계와 같은 흐름에서 고친다(목표 설정은 맨 끝).
import { pathOf } from '@/modules/encyclopedia/lib/preparation'
import type { JobPreparation, PrepItem, PrepProject } from '@/modules/encyclopedia/types/encyclopedia'
import { helperExampleToProject, projectToExample } from './useHelperExamples'
import type { Project, ProjectCategory } from '../types/career-design'

export type StageKey = 'nonmajor' | 'major' | 'basic'

export interface DroppedItem { name: string; category: ProjectCategory; reason: string }

export interface PlanTemplate {
  id: string
  stage: StageKey
  jobCode: string          // 목표 직업(계획의 대표 직업이 아니라 사용자가 정한 직업)
  jobTitle: string
  track: string | null     // 고른 갈래
  name: string
  stageLabel: string       // 비전공 / 전공 / 기본
  who: string              // 누구를 위한 단계인지
  months: number           // 약 N개월(두 프로젝트를 나란히 한다고 보고 계산)
  note?: string            // 꼭 거쳐야 하는 것(관문)
  projects: Project[]      // 해 나갈 순서대로
  dropped: DroppedItem[]   // 전공자라서 뺀 것
  optional: DroppedItem[]  // 지원하는 곳에 따라 고르는 것(플랜에는 없다)
}

// 프로젝트 두 개를 나란히 진행한다고 보고 대략의 기간을 낸다(실제 배치는 사용자가 타임라인에서 정한다)
const PARALLEL = 2
const WEEKS_PER_MONTH = 4.33
const monthsOf = (projects: Project[]) =>
  Math.max(1, Math.round(projects.reduce((n, p) => n + (p.curriculum?.length || p.weeks || 4), 0) / PARALLEL / WEEKS_PER_MONTH))

interface Row { item: PrepItem; project: PrepProject }

export function buildPlanTemplates(prep: JobPreparation, track: string | null | undefined): PlanTemplate[] {
  const path = pathOf(prep, track ?? prep.defaultTrack)
  if (!path) return []
  const rows: Row[] = path.items.flatMap((item) => {
    const project = prep.projects[item.ref]
    return project ? [{ item, project }] : []
  })
  const must = rows.filter((r) => !r.item.optional)
  if (!must.length) return []

  const optional: DroppedItem[] = rows
    .filter((r) => r.item.optional)
    .map((r) => ({ name: r.project.name, category: r.project.category, reason: r.item.note ?? '' }))
  const skipped = must.filter((r) => !r.item.major)
  // 갈래 이름은 고를 갈래가 여럿일 때만 붙인다 — 하나뿐이면(판사의 '판사', 한식조리사의 '한식') 직업 이름으로 충분하다
  const trackName = prep.tracks.length > 1 ? (prep.tracks.find((t) => t.id === path.track)?.name ?? '') : ''

  const stages: { key: StageKey; label: string; who: string; rows: Row[] }[] = skipped.length
    ? [
        { key: 'nonmajor', label: '비전공', who: '관련 학과·경력이 없어요', rows: must },
        { key: 'major', label: '전공', who: '관련 학과를 졸업했거나 졸업 예정이에요', rows: must.filter((r) => r.item.major) },
      ]
    : [{ key: 'basic', label: '기본', who: '전공과 상관없이 같은 길이에요', rows: must }]

  return stages.map((st) => {
    const projects = st.rows.map((r) => helperExampleToProject(projectToExample(prep, r.item, r.project), r.project.category))
    const stageWord = st.key === 'basic' ? '' : ` ${st.label}`
    return {
      id: `${prep.plan.jobCode}-${path.track ?? 'all'}-${st.key}`,
      stage: st.key,
      jobCode: prep.jobCode,
      jobTitle: prep.title,
      track: path.track,
      name: `${prep.displayName}${stageWord} 플랜${trackName ? ` · ${trackName}` : ''}`,
      stageLabel: st.label,
      who: st.who,
      months: monthsOf(projects),
      note: prep.plan.gate ?? undefined,
      projects,
      dropped: st.key === 'major'
        ? skipped.map((r) => ({ name: r.project.name, category: r.project.category, reason: r.item.skip ?? '' }))
        : [],
      optional,
    }
  })
}
