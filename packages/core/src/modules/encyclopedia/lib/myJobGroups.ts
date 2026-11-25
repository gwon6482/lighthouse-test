// 내 추천 직무 3가지(결과지 '나에게 맞는 직무 3가지'와 같은 응답) — 판정 함수(2026-11-24).
// 직업 상세의 배지 "내 추천 직무 '○○'의 직업이에요"는 저장해 둔 직업 목록(User.recommendedJobs — 결과지를 열 때 덮어써서 낡았다)
// 대신, 볼 때 최신 검사의 직무 3가지에 이 직업이 들었는지로 정한다. 묶음 직업(고용24가 한 직업으로 조사한 여러 직업)은 풀어서 본다.
import type { JobGroupRecommend, JobGroupJob } from '@/modules/survey/types/survey'
import type { TargetCareer } from '../encyclopedia.api'

/** 한 자리의 직업 코드들 — 묶음이면 구성원 전부, 아니면 자기 코드 */
export function unfoldJob(job: JobGroupJob): string[] {
  return job.members?.length ? [...new Set([job.jobCode, ...job.members.map((m) => m.jobCode)])] : [job.jobCode]
}

/** 이 직업이 든 내 추천 직무(처음 만난 것). 없으면 null */
export function groupForJob(groups: JobGroupRecommend[] | null | undefined, jobCode: string | null | undefined): JobGroupRecommend | null {
  if (!jobCode) return null
  for (const g of groups ?? []) {
    if (g.jobs.some((j) => unfoldJob(j).includes(jobCode))) return g
  }
  return null
}

/** 직무 3가지에 든 직업 코드 전부(묶음은 풀어서, 겹치면 한 번) */
export function jobCodesOfGroups(groups: JobGroupRecommend[] | null | undefined): string[] {
  return [...new Set((groups ?? []).flatMap((g) => g.jobs.flatMap(unfoldJob)))]
}

/** 카드에 펼쳐 보여 줄 대표 직업 수 — 결과지 '대표 직업'과 같다 */
export const REP_JOBS = 3

/** 펼친 직무에 '이 직무의 직업 N개 모두 보기'를 둘까 — 풀어 센 직업 수가 보여 준 대표 직업보다 많으면(묶음 하나가 여러 직업인 직무 포함) */
export function hasMoreJobs(g: Pick<JobGroupRecommend, 'jobs' | 'jobCount'>): boolean {
  const shown = g.jobs.slice(0, REP_JOBS).reduce((n, j) => n + unfoldJob(j).length, 0)
  return (g.jobCount ?? 0) > shown
}

export interface TargetLine { title: string; jobCode: string | null }

/**
 * 카드 맨 위 '내 목표 직업' 한 줄. 보일 이름이 없으면 null(줄을 감춘다).
 * 직업 목표인데 직업 자료가 없어져 서버가 이름 대신 코드를 주면(title === ref, 숫자) 코드를 이름처럼 보이지 않게 감춘다(검토 5번).
 */
export function targetLine(t: TargetCareer | null | undefined): TargetLine | null {
  if (!t?.ref) return null
  const title = (t.title ?? (t.refType === 'custom' ? t.ref : '') ?? '').trim()
  if (!title) return null
  if (t.refType === 'jobCode') {
    if (title === t.ref || /^\d+$/.test(title)) return null
    return { title, jobCode: t.ref }
  }
  return { title, jobCode: null }
}

/**
 * 검사 날짜 글 'M월 D일'(기기 시각 기준). 올해가 아니면 연도를 붙인다. 읽을 수 없으면 ''.
 * '나의 추천 진로' 화면 머리 — 다시 검사할 수 있어 어느 검사의 추천인지 밝힌다(2026-11-26 오너 결정 6).
 */
export function surveyDateLabel(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const md = `${d.getMonth() + 1}월 ${d.getDate()}일`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}년 ${md}`
}

/**
 * 추천 화면·카드의 제목 — 목표를 정했고 추천 직무가 보이면 '다른 길도 살펴보기', 아니면 '나의 추천 진로'.
 * 진로백과 메인 카드와 '나의 추천 진로' 화면이 같은 규칙을 쓴다(2026-11-26 오너 결정 7).
 */
export function recHeading(hasTarget: boolean, groupsShown: boolean): string {
  return hasTarget && groupsShown ? '다른 길도 살펴보기' : '나의 추천 진로'
}
