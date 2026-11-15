// 진로 설계 도우미(베타) — 목표 직업의 예시 진로설계에서 프로젝트 예시를 꺼내고, 내 계획에 담을 Project 로 바꾼다.
//
// 출처: 진로계획 라이브러리(GET /api/job/:jobCode/preparation — 진로백과 준비과정 탭과 같은 자료, 2026-11-15~).
//   진로백과의 직업 537개 전부에 계획이 있다. 그전의 시범 5직업 더미(helperExamples.mock.ts)는 지웠다.
// 목표 직업 찾기: **직업 코드로만** 찾는다 — 진로백과에서 정한 목표 진로(refType 'jobCode')의 코드가 draftPlan.targetJobCode 로 들어온다.
//   직접 적은 목표(custom)는 어느 계획인지 알 수 없어 예시를 보여 주지 않는다(이름으로 어림잡지 않는다 — 엉뚱한 직업의 계획이 붙는다).
import { fetchJobPreparation } from '@/modules/encyclopedia/encyclopedia.api'
import { checkLevelLabel, formatWeeks, pathOf } from '@/modules/encyclopedia/lib/preparation'
import type { JobPreparation, PrepItem, PrepPhase, PrepProject } from '@/modules/encyclopedia/types/encyclopedia'
import type { DayOfWeek, HelperExample, HelperJobExamples, Project, ProjectCategory, WeekCurriculum } from '../types/career-design'
import { methodFits } from './projectMethods'
import { MAX_WEEKS } from './useProjectCurriculum'

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
 * 앱의 한 프로젝트는 최대 52주라, 넘치면 단계마다 비례해 줄인다(로스쿨 108주 → 52주). 줄였다는 사실은 예시의 fullWeeks 로 남긴다.
 */
export function phasesToCurriculum(phases: PrepPhase[]): WeekCurriculum[] {
  const total = phases.reduce((n, ph) => n + ph.weeks, 0)
  const weeks = phases.map((ph) => Math.max(1, ph.weeks))
  if (total > MAX_WEEKS) {
    const scale = MAX_WEEKS / total
    weeks.forEach((w, i) => { weeks[i] = Math.max(1, Math.round(w * scale)) })
    // 반올림으로 넘친 만큼은 가장 긴 단계에서 뺀다
    for (let over = weeks.reduce((a, b) => a + b, 0) - MAX_WEEKS; over > 0; over -= 1) {
      weeks[weeks.indexOf(Math.max(...weeks))]! -= 1
    }
  }
  const out: WeekCurriculum[] = []
  phases.forEach((ph, i) => {
    const n = weeks[i]!
    for (let k = 1; k <= n; k += 1) {
      out.push({ week: out.length + 1, title: n > 1 ? `${ph.title} (${k}/${n})` : ph.title, items: [...ph.items] })
    }
  })
  return out
}

// 왜 권하는지 한 줄 — 대조한 사실이 있으면 그것을, 없으면 붙어 있는 안내를 쓴다
function basisOf(prep: JobPreparation, item: PrepItem, project: PrepProject): string {
  const lines: string[] = []
  if (item.optional) lines.push(item.note ? `지원하는 곳에 따라 골라요 — ${item.note}.` : '지원하는 곳에 따라 골라요.')
  else if (item.note) lines.push(`${item.note}.`)
  if (project.checked) lines.push(`${checkLevelLabel(project.checked)}: ${project.checked.note ?? project.checked.source}.`)
  if (project.caution) lines.push(`${project.caution}.`)
  if (project.weeks > MAX_WEEKS) lines.push(`실제로는 ${formatWeeks(project.weeks)} 걸리는 과정이에요. 한 프로젝트는 최대 ${MAX_WEEKS}주라 줄여 담았어요.`)
  if (!lines.length) lines.push(`${prep.plan.displayName} 준비과정 예시에 들어 있는 프로젝트예요.`)
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
    curriculum: phasesToCurriculum(project.phases),
    method: project.method,
    methodDetail: {},
    ...(project.weeks > MAX_WEEKS ? { fullWeeks: project.weeks } : {}),
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
  return { jobCode: prep.jobCode, title: prep.plan.displayName, examples }
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
    // 커리큘럼 표준(주차별 할 일 목록) 그대로 담는다
    curriculum: ex.curriculum.map((w) => ({ week: w.week, title: w.title, items: [...w.items] })),
    // 진행 방식 — 영역에 맞지 않으면 버린다(사용자가 고르게 '방식 미정'으로)
    method: methodFits(category, ex.method) ? ex.method : null,
    methodDetail: methodFits(category, ex.method) ? { ...(ex.methodDetail ?? {}) } : {},
  }
}
