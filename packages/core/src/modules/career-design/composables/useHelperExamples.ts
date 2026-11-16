// 진로 설계 도우미(베타) — 목표 직업의 예시 진로설계에서 프로젝트 예시를 꺼내고, 내 계획에 담을 Project 로 바꾼다.
//
// 출처: 진로계획 라이브러리(GET /api/job/:jobCode/preparation — 진로백과 준비과정 탭과 같은 자료, 2026-11-15~).
//   진로백과의 직업 537개 전부에 계획이 있다. 그전의 시범 5직업 더미(helperExamples.mock.ts)는 지웠다.
// 목표 직업 찾기: **직업 코드로만** 찾는다 — 진로백과에서 정한 목표 진로(refType 'jobCode')의 코드가 draftPlan.targetJobCode 로 들어온다.
//   직접 적은 목표(custom)는 어느 계획인지 알 수 없어 예시를 보여 주지 않는다(이름으로 어림잡지 않는다 — 엉뚱한 직업의 계획이 붙는다).
import { fetchJobPreparation } from '@/modules/encyclopedia/encyclopedia.api'
import { checkLevelLabel, pathOf } from '@/modules/encyclopedia/lib/preparation'
import type { JobPreparation, PrepItem, PrepPhase, PrepProject } from '@/modules/encyclopedia/types/encyclopedia'
import type { DayOfWeek, HelperExample, HelperJobExamples, Project, ProjectCategory, WeekCurriculum } from '../types/career-design'
import { methodFits } from './projectMethods'
import { periodCurriculum } from '../lib/period'

// 같은 직업은 한 번만 부른다(템플릿 화면 → 프로젝트 구성 화면이 이어서 쓴다). 실패는 담아 두지 않아 다음에 다시 시도한다
const cache = new Map<string, Promise<JobPreparation | null>>()

/** 직업의 예시 진로설계. 계획이 없거나 불러오지 못하면 null */
export function loadLibraryPlan(jobCode?: string | null): Promise<JobPreparation | null> {
  if (!jobCode || !/^\d{6}$/.test(jobCode)) return Promise.resolve(null)
  let hit = cache.get(jobCode)
  if (!hit) {
    hit = fetchJobPreparation(jobCode)
      .then((res) => res.data.data)
      .catch(() => { cache.delete(jobCode); return null })
    cache.set(jobCode, hit)
  }
  return hit
}

/**
 * 단계(phases)를 주차별 커리큘럼으로 편다 — 단계의 주 수만큼 같은 할 일을 되풀이한다(그 단계 동안 매주 해 나가는 것).
 * 길이는 자르지 않는다 — 로스쿨(108주)처럼 1년이 넘는 과정도 그대로 담는다(2026-11-15 사용자 결정: 프로젝트 길이를 제한하지 않는다).
 */
export function phasesToCurriculum(phases: PrepPhase[]): WeekCurriculum[] {
  const out: WeekCurriculum[] = []
  for (const ph of phases) {
    const n = Math.max(1, Math.trunc(ph.weeks))
    for (let k = 1; k <= n; k += 1) {
      out.push({ week: out.length + 1, title: n > 1 ? `${ph.title} (${k}/${n})` : ph.title, items: [...ph.items] })
    }
  }
  return out
}

// 왜 권하는지 한 줄 — 대조한 사실이 있으면 그것을, 없으면 붙어 있는 안내를 쓴다
function basisOf(prep: JobPreparation, item: PrepItem, project: PrepProject): string {
  const lines: string[] = []
  if (item.optional) lines.push(item.note ? `지원하는 곳에 따라 골라요 — ${item.note}.` : '지원하는 곳에 따라 골라요.')
  else if (item.note) lines.push(`${item.note}.`)
  if (project.checked) lines.push(`${checkLevelLabel(project.checked)}: ${project.checked.note ?? project.checked.source}.`)
  if (project.caution) lines.push(`${project.caution}.`)
  if (item.during) lines.push('학교·수련 과정을 다니면서 해요.')
  if (project.mayHave) lines.push('이미 가지고 있으면 건너뛰어도 돼요.')
  if (!lines.length) lines.push(`${prep.displayName} 준비과정 예시에 들어 있는 프로젝트예요.`)
  return lines.join(' ').replace(/\.\./g, '.')
}

/** 라이브러리의 프로젝트 하나 → 도우미 예시 */
export function projectToExample(prep: JobPreparation, item: PrepItem, project: PrepProject): HelperExample {
  return {
    id: `${prep.plan.jobCode}-${project.id}`,
    name: project.name,
    goal: project.goal,
    level: (['입문', '중급', '심화'].includes(project.level) ? project.level : '입문') as HelperExample['level'],
    daysPerWeek: project.daysPerWeek,
    minutesPerSession: project.minutesPerSession,
    basis: basisOf(prep, item, project),
    // 과정(정해진 곳에 다니는 기간)은 주간 할 일 없이 단계 제목 = 오늘 할 일 이름, 단계 할 일 = 주간결산 점검(2026-11-16)
    curriculum: project.period ? periodCurriculum(project.phases) : phasesToCurriculum(project.phases),
    method: project.method,
    methodDetail: {},
    ...(project.period ? { period: true } : {}),
  }
}

/** 고른 갈래의 길을 영역별 예시로 — 프로젝트 구성 화면의 '도우미 추천'이 쓴다. 선택 항목도 들어 있다 */
export function libraryToHelperJob(prep: JobPreparation, track: string | null | undefined): HelperJobExamples {
  const examples: Partial<Record<ProjectCategory, HelperExample[]>> = {}
  const seen = new Set<string>()
  for (const item of pathOf(prep, track ?? prep.defaultTrack)?.items ?? []) {
    const project = prep.projects[item.ref]
    if (!project || seen.has(project.id)) continue      // 같은 프로젝트가 한 길에 두 번 나오면 한 번만
    seen.add(project.id)
    const list = examples[project.category] ?? (examples[project.category] = [])
    list.push(projectToExample(prep, item, project))
  }
  return { jobCode: prep.jobCode, title: prep.displayName, examples }
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
const SPREAD_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토']     // 일요일은 쉬는 날로 비워 둔다(주 7회일 때만 쓴다)
const DAY_INDEX: Record<DayOfWeek, number> = { 월: 0, 화: 1, 수: 2, 목: 3, 금: 4, 토: 5, 일: 6 }

function combos(n: number, from = 0): DayOfWeek[][] {
  if (n === 0) return [[]]
  const out: DayOfWeek[][] = []
  for (let i = from; i <= SPREAD_DAYS.length - n; i += 1) for (const rest of combos(n - 1, i + 1)) out.push([SPREAD_DAYS[i]!, ...rest])
  return out
}

/**
 * 주 N회를 어느 요일에 놓을지 — 앞의 프로젝트들과 겹치지 않게 나눈다(2026-11-16).
 * 그전에는 주 3회는 늘 월·수·금, 주 2회는 늘 화·목이라 템플릿으로 만든 계획의 할 일이 같은 날에 몰렸다.
 *   · recent = 앞에 있는 프로젝트들의 요일(맨 뒤가 가장 가까운 것). 가까운 두 개와 겹치는 날을 피한다(가장 가까운 것을 더)
 *   · 고르게 띄운 조합을 먼저 고르고(월·목 > 월·화), 겹침이 같으면 기본 요일을 쓴다. 앞에 아무것도 없으면 기본 요일 그대로다
 *   · 주 5회 이상은 나눌 여지가 없어 기본 요일 그대로 두고(학교 과정이 월~목·토가 되면 이상하다), 앞에 있어도 피할 대상으로 보지 않는다
 */
export function pickDays(count: number, recent: DayOfWeek[][] = []): DayOfWeek[] {
  const n = Math.min(7, Math.max(1, Math.round(count) || 1))
  if (n >= 7) return [...SPREAD_DAYS, '일']
  if (n >= 5) return [...DAYS_BY_COUNT[n]!]
  const base = DAYS_BY_COUNT[n]!
  const light = recent.filter((d) => d.length <= 4)
  const last = light[light.length - 1] ?? []
  const before = light[light.length - 2] ?? []
  const ideal = Math.floor(7 / n)
  let best = base
  let bestScore = Infinity
  for (const c of combos(n)) {
    const overlap = c.filter((d) => last.includes(d)).length * 3 + c.filter((d) => before.includes(d)).length
    const idx = c.map((d) => DAY_INDEX[d])
    const minGap = Math.min(...idx.map((v, k) => ((idx[(k + 1) % n]! - v + 7) % 7) || 7))
    // 기본 요일은 간격·토요일 감점을 받지 않는다 — 겹치는 것이 없으면 늘 기본 요일이 뽑힌다
    // 붙어 있는 요일(월·화·목)은 크게 깎는다 — 바로 앞 프로젝트와 겹칠 때가 아니면 고르게 띄운 조합이 이긴다
    const score = c.join() === base.join() ? overlap - 0.01 : overlap + Math.max(0, ideal - minGap) * 2.5 + (c.includes('토') ? 0.25 : 0)
    if (score < bestScore) { bestScore = score; best = c }
  }
  return [...best]
}

/** recentDays = 계획에서 앞에 있는 프로젝트들의 요일(순서대로) — 넘기면 겹치지 않게 요일을 나눈다 */
export function helperExampleToProject(ex: HelperExample, category: ProjectCategory, recentDays: DayOfWeek[][] = []): Project {
  return {
    id: `helper-${ex.id}-${Date.now()}`,
    category,
    name: ex.name,
    goal: ex.goal,
    days: pickDays(ex.daysPerWeek, recentDays),
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
    // 커리큘럼 표준(주차별 할 일 목록) 그대로 담는다. 과정의 점검·쉬는 주 표시도 함께
    curriculum: ex.curriculum.map((w) => ({
      week: w.week, title: w.title, items: [...w.items],
      ...(w.checks?.length ? { checks: [...w.checks] } : {}), ...(w.pause ? { pause: true } : {}),
    })),
    // 진행 방식 — 영역에 맞지 않으면 버린다(사용자가 고르게 '방식 미정'으로)
    method: methodFits(category, ex.method) ? ex.method : null,
    methodDetail: methodFits(category, ex.method) ? { ...(ex.methodDetail ?? {}) } : {},
    ...(ex.period ? { period: true } : {}),
  }
}
