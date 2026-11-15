// 진로백과 준비과정 탭의 계산(2026-11-15) — 화면과 무관한 순수 함수만 둔다.
// 자료는 서버(진로계획 라이브러리)가 갈래별로 순서까지 풀어서 준다. 여기서는 고르고 글자로 바꾸기만 한다.
import type { JobPreparation, PrepChecked, PrepItem, PrepPath, PrepProject } from '../types/encyclopedia'

export interface PrepStep {
  key: string            // 펼침 상태를 기억하는 열쇠 — 프로젝트 id + 순서. 갈래를 바꿔도 공통 항목은 같은 열쇠라 열린 채로 남는다
  no: number             // 화면에 보이는 순서(1부터)
  item: PrepItem
  project: PrepProject
}

/** 고른 갈래의 길. 갈래가 없는 계획은 하나뿐인 길을 준다 */
export function pathOf(prep: JobPreparation, track: string | null): PrepPath | null {
  return prep.paths.find((p) => p.track === track) ?? prep.paths[0] ?? null
}

/** 길을 화면용 걸음으로 — 프로젝트를 붙이고 1부터 번호를 매긴다(서버의 step 은 건너뛰는 번호가 있다) */
export function stepsOf(prep: JobPreparation, path: PrepPath | null): PrepStep[] {
  if (!path) return []
  const out: PrepStep[] = []
  for (const item of path.items) {
    const project = prep.projects[item.ref]
    if (!project) continue
    // 같은 프로젝트가 한 길에 두 번 나올 수 있다(예: 대외활동 — 공통 하나, 갈래 하나) → 순서까지 붙여 구분한다
    out.push({ key: `${item.ref}@${item.step}`, no: out.length + 1, item, project })
  }
  return out
}

const WEEKS_PER_MONTH = 4.345

/**
 * 주 수를 읽기 쉬운 기간으로. 짧으면 주, 길면 달·해로 바꾼다.
 *   8 → '8주' · 24 → '약 6개월' · 108 → '약 2년 1개월'
 */
export function formatWeeks(weeks: number): string {
  const w = Math.max(0, Math.round(weeks))
  if (w <= 12) return `${w}주`
  const months = Math.round(w / WEEKS_PER_MONTH)
  if (months < 24) return `약 ${months}개월`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest ? `약 ${years}년 ${rest}개월` : `약 ${years}년`
}

/** 한 번에 하는 시간 — 60 → '1시간' · 90 → '1시간 30분' · 45 → '45분' */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min}분`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

const CHECK_LEVEL: Record<NonNullable<PrepChecked['level']>, string> = {
  law: '법령 원문과 대조',
  official: '기관 공고와 대조',
  secondary: '안내 자료와 대조',
}
export const checkLevelLabel = (c?: PrepChecked | null) => (c?.level && CHECK_LEVEL[c.level]) || '출처와 대조'

/** 전공자에게 줄어드는 것이 있는 길인가(없으면 전공자 줄을 보여 주지 않는다) */
export const hasMajorSkip = (path: PrepPath | null) =>
  !!path && path.totals.major.count < path.totals.nonMajor.count
