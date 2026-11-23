// 내 추천 직무 3가지(결과지 '나에게 맞는 직무 3가지'와 같은 응답) — 판정 함수(2026-11-24).
// 직업 상세의 배지 "내 추천 직무 '○○'의 직업이에요"는 저장해 둔 직업 목록(User.recommendedJobs — 결과지를 열 때 덮어써서 낡았다)
// 대신, 볼 때 최신 검사의 직무 3가지에 이 직업이 들었는지로 정한다. 묶음 직업(고용24가 한 직업으로 조사한 여러 직업)은 풀어서 본다.
import type { JobGroupRecommend, JobGroupJob } from '@/modules/survey/types/survey'

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
