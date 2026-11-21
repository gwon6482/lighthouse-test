// 템플릿에서 시작하기(베타) — 목표 직업의 예시 진로설계를 내 계획의 출발점으로 쓴다.
//
// 출처: 진로계획 라이브러리(진로백과 준비과정 탭과 같은 자료, 2026-11-15~). 그전의 시범 5직업 더미(planStages.mock.ts)는 지웠다.
// 단계: 비전공 > 전공 (2026-10-22 사용자 제안. '이직'은 2026-10-27 사용자 결정으로 뺐다)
//   - 계획은 비전공자 기준으로 빈틈없이 짜여 있고, 전공 플랜은 거기서 대학에서 배우는 것(major: false)을 뺀다(전공 ⊂ 비전공)
//   - 그래서 화면에서 '전공자라서 뺀 것'과 이유를 보여 줄 수 있다
//   - 전공자에게 줄어드는 것이 없는 길은 플랜이 하나다(기본)
// 지원하는 곳에 따라 고르는 항목(optional)은 플랜에 넣지 않고 따로 보여 준다 — 다음 화면의 도우미 추천에서 담을 수 있다.
// 고르면 임시 계획(draftPlan)을 채워 프로젝트 구성으로 → 직접 설계와 같은 흐름에서 고친다(목표 설정은 맨 끝).
// 2026-11-16: 기간은 준비과정 탭과 같은 계산(차례로 더하기, 과정 중에 하는 것은 겹쳐 세지 않는다), 운전면허·어학 성적처럼
//   이미 가지고 있을 수 있는 것은 '이미 있어요'로 뺄 수 있다, 요일은 앞 프로젝트와 겹치지 않게 나눠 넣는다.
import { pathOf, sumParts, sumWeeks } from '@/modules/encyclopedia/lib/preparation'
import type { JobPreparation, PrepItem, PrepProject } from '@/modules/encyclopedia/types/encyclopedia'
import { helperExampleToProject, projectToExample } from './useHelperExamples'
import type { CareerProfile, DayOfWeek, Project, ProjectCategory } from '../types/career-design'
import { applySituation, canHave, haveTargetOf, isOwned, situationSentence, type HaveTarget, type SituationChange } from '../lib/situation'

// mine = 내 진로상황에 맞춘 플랜(2026-11-16). 내 진로상황이 있으면 이 카드 하나를 먼저 보여 주고, 나머지는 '처음부터 전부 보기'
export type StageKey = 'nonmajor' | 'major' | 'basic' | 'mine'

export interface DroppedItem { name: string; category: ProjectCategory; reason: string }
/** 이미 해 둔 것으로 뺄 수 있는 것 — 열쇠·이름으로 내 진로상황의 '이미 해 둔 것'에 저장한다 */
// 이름·비교 규칙(필기·1차·연수는 짝인 자격을 pair 로 싣는다)은 lib/situation.ts haveTargetOf
export type { HaveTarget }
/** 이미 해 둬서 뺀 것 — 다시 넣을 수 있다 */
export interface SkippedItem extends HaveTarget { name: string; category: ProjectCategory }

export interface PlanTemplate {
  id: string
  stage: StageKey
  jobCode: string          // 목표 직업(계획의 대표 직업이 아니라 사용자가 정한 직업)
  jobTitle: string
  track: string | null     // 고른 갈래
  name: string
  stageLabel: string       // 비전공 / 전공 / 기본
  who: string              // 누구를 위한 단계인지
  // 차례로 하면 걸리는 주 수 — 진로백과 준비과정 탭과 같은 계산이다(2026-11-16).
  // 그전에는 '둘씩 나란히 한다'고 보고 반으로 어림해, 같은 계획이 탭에서는 11개월·여기서는 5개월로 보였다
  weeks: number
  courseWeeks: number      // 그 가운데 학교·수련 과정
  // 두 칸(2026-11-17) — 준비과정 탭 맨 위와 같은 계산(sumParts). weeks = selfWeeks + periodWeeks
  selfWeeks: number        // 스스로 준비
  periodWeeks: number      // 과정('과정' 꼬리표 걸음 전부)
  examHours: number        // 큰 시험 분량 합(0 = 없음)
  selfWeeksPart: number    // 큰 시험을 하루 3시간으로 할 때의 스스로 준비
  note?: string            // 꼭 거쳐야 하는 것(관문)
  projects: Project[]      // 해 나갈 순서대로(이미 있어서 뺀 것은 들어 있지 않다)
  skipRefs: Record<string, HaveTarget>   // 템플릿 프로젝트 id → '이미 있어요'로 뺄 때 저장할 열쇠·이름(자격·면허·어학·근무 경험만)
  skipped: SkippedItem[]   // 이미 있어서 뺀 것
  dropped: DroppedItem[]   // 전공자라서 뺀 것
  optional: DroppedItem[]  // 지원하는 곳에 따라 고르는 것(플랜에는 없다)
  changes?: SituationChange[]   // 내 진로상황이라 뺀 것·줄인 것과 이유(mine 플랜만)
}

interface Row { item: PrepItem; project: PrepProject }

/** 템플릿 프로젝트 하나 — 과정·과정 중 표시를 싣고, 요일은 앞 프로젝트와 겹치지 않게 */
function toProject(prep: JobPreparation, item: PrepItem, project: PrepProject, during: boolean, recent: DayOfWeek[][]): Project {
  const p = helperExampleToProject(projectToExample(prep, item, project), project.category, recent)
  if (project.course) p.course = true
  if (during) p.during = true
  // 루틴 제안(2026-11-21) — ④ 루틴 단계의 '넣기' 카드. 프로젝트 분량은 그대로 두고, 넣을 때만 줄인다
  if (project.routine) p.routine = JSON.parse(JSON.stringify(project.routine))
  recent.push(p.days)
  return p
}

/** 나란히 걸음(item.alongside = 라이브러리 ref)을 계획 프로젝트 id 로 잇는다(2026-11-17). 대상이 빠졌으면(이미 있어요 등) 혼자 둔다 */
function linkAlongside(rows: { item: PrepItem }[], projects: Project[]): Project[] {
  const idOfRef = new Map<string, string>()
  rows.forEach((r, i) => { if (!idOfRef.has(r.item.ref) && projects[i]) idOfRef.set(r.item.ref, projects[i]!.id) })
  return projects.map((p, i) => {
    const target = rows[i]?.item.alongside
    const id = target ? idOfRef.get(target) : undefined
    return id ? { ...p, alongside: id } : p
  })
}

/**
 * @param has 내 진로상황의 '이미 해 둔 것'(템플릿에서 '이미 있어요'를 누른 것 포함) — 플랜과 기간 계산에서 뺀다
 */
export function buildPlanTemplates(prep: JobPreparation, track: string | null | undefined, has: CareerProfile['has'] = []): PlanTemplate[] {
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
  const majorSkipped = must.filter((r) => !r.item.major)
  // 갈래 이름은 고를 갈래가 여럿일 때만 붙인다 — 하나뿐이면(판사의 '판사', 한식조리사의 '한식') 직업 이름으로 충분하다
  const trackName = prep.tracks.length > 1 ? (prep.tracks.find((t) => t.id === path.track)?.name ?? '') : ''

  const stages: { key: StageKey; label: string; who: string; inStage: (r: Row) => boolean }[] = majorSkipped.length
    ? [
        { key: 'nonmajor', label: '비전공', who: '관련 학과·경력이 없어요', inStage: () => true },
        { key: 'major', label: '전공', who: '관련 학과를 졸업했거나 졸업 예정이에요', inStage: (r) => r.item.major },
      ]
    : [{ key: 'basic', label: '기본', who: '전공과 상관없이 같은 길이에요', inStage: () => true }]

  const target = (r: Row): HaveTarget => haveTargetOf(prep, r.item, r.project)
  const owned = (r: Row) => isOwned(prep, has, r.item, r.project)   // 자격을 해 뒀으면 짝인 필기·1차·연수도(2026-11-17)

  return stages.map((st) => {
    // 이 단계가 하는 것 — 이미 해 둔 것은 뺀다(뺄 수 있는 것은 자격·면허·어학·근무 경험)
    const include = (r: Row) => st.inStage(r) && !owned(r)
    const sum = sumWeeks(rows, include)
    const parts = sumParts(rows, include)
    const skipRefs: Record<string, HaveTarget> = {}
    const recent: DayOfWeek[][] = []        // 앞에 놓인 프로젝트들의 요일 — 겹치지 않게 나눠 넣는다
    const chosen = must.filter(include)
    const projects = linkAlongside(chosen, chosen.map((r) => {
      // 자동 배치가 쓰는 표시 — 과정 중에 하는 프로젝트는 과정 끝에 맞춰 겹쳐 놓는다
      const p = toProject(prep, r.item, r.project, !!r.item.during, recent)
      if (canHave(r.project)) skipRefs[p.id] = target(r)
      return p
    }))
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
      weeks: sum.weeks,
      courseWeeks: sum.courseWeeks,
      selfWeeks: parts.selfWeeks,
      periodWeeks: parts.periodWeeks,
      examHours: parts.examHours,
      selfWeeksPart: parts.selfWeeksPart,
      note: prep.plan.gate ?? undefined,
      projects,
      skipRefs,
      skipped: must.filter((r) => st.inStage(r) && owned(r)).map((r) => ({ ...target(r), name: r.project.name, category: r.project.category })),
      dropped: st.key === 'major'
        ? majorSkipped.map((r) => ({ name: r.project.name, category: r.project.category, reason: r.item.skip ?? '' }))
        : [],
      optional,
    }
  })
}

/**
 * 내 진로상황에 맞춘 플랜 하나(2026-11-16) — 학교·관련 학과·이미 해 둔 것으로 걸음을 빼고 남은 학교 과정을 줄인다.
 * 계산 규칙은 lib/situation.ts. 뺀 것·줄인 것은 이유와 함께 changes 로 준다(카드 맨 위 '내 상황이라 바뀐 것')
 */
export function buildSituationTemplate(prep: JobPreparation, track: string | null | undefined, profile: CareerProfile): PlanTemplate | null {
  const path = pathOf(prep, track ?? prep.defaultTrack)
  if (!path) return null
  const res = applySituation(prep, path, profile)
  if (!res.rows.length) return null
  const trackName = prep.tracks.length > 1 ? (prep.tracks.find((t) => t.id === path.track)?.name ?? '') : ''
  const skipRefs: Record<string, HaveTarget> = {}
  const recent: DayOfWeek[][] = []
  const projects = linkAlongside(res.rows, res.rows.map((r) => {
    const p = toProject(prep, r.item, r.project, r.during, recent)
    if (canHave(r.project)) skipRefs[p.id] = haveTargetOf(prep, r.item, r.project)
    return p
  }))
  // 두 칸 — 내 진로상황으로 줄인 길 그대로(과정 중 표시는 applySituation 이 정한 것을 쓴다)
  const parts = sumParts(res.rows.map((r) => ({ item: { ...r.item, optional: false, during: r.during }, project: r.project })))
  return {
    id: `${prep.plan.jobCode}-${path.track ?? 'all'}-mine`,
    stage: 'mine',
    jobCode: prep.jobCode,
    jobTitle: prep.title,
    track: path.track,
    name: `${prep.displayName} 플랜${trackName ? ` · ${trackName}` : ''}`,
    stageLabel: '내 상황',
    who: situationSentence(prep, profile),
    weeks: res.weeks,
    courseWeeks: res.courseWeeks,
    selfWeeks: parts.selfWeeks,
    periodWeeks: parts.periodWeeks,
    examHours: parts.examHours,
    selfWeeksPart: parts.selfWeeksPart,
    note: prep.plan.gate ?? undefined,
    projects,
    skipRefs,
    skipped: [],
    dropped: [],
    optional: res.optional.map((r) => ({ name: r.project.name, category: r.project.category, reason: r.item.note ?? '' })),
    changes: res.changes,
  }
}

