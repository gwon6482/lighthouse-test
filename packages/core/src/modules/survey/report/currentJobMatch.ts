/**
 * '현재 직업과의 매칭도' — 연구 설문 실무자에게만 나온다(결과 API 의 currentJob).
 * 화면 결과지(ResearchResult.vue)와 PDF(report/sections/SecCurrentJob.vue)가 **같은 해석**을 쓰도록 여기 모은다.
 *
 * ⚠️ 매칭도(%)는 좁게 몰려 있다(추천 1위도 70%대) — % 만 보면 낮아 보이므로 **순위를 함께** 보여준다.
 * ⚠️ 해석 구간은 % 가 아니라 **순위 백분위**로 나눈다. 낮게 나와도 '적성이 없다' 로 읽히지 않게 문구를 고른다.
 */

export interface CurrentJob {
  jobCode: string
  title: string                       // 순위 항목 이름(공유 그룹이면 그룹 대표명)
  match_score: number
  match_detail: { T1: number; T21: number; T22: number; T23: number; T3: number }
  members?: { jobCode: string; title: string }[]
  rank: number                        // 1 = 가장 잘 맞음
  total: number                       // 비교한 직업 자리 수(공유 그룹을 접은 뒤)
  percentile: number                  // '상위 x%'
  inTop: boolean                      // 추천 Top N 안에 들었나
  rankable: boolean                   // false = 매칭 데이터가 없어 순위를 믿을 수 없다(순위·해석 숨김)
  selected: { jobCode: string; title: string } // 응답자가 고른 바로 그 직업
  /** 같은 분야(직업코드 앞 2자리 = 고용직업분류 중분류) 안에서의 순위와 더 잘 맞는 직업. 구버전 서버는 없다 */
  field?: {
    prefix: string
    rank: number
    total: number
    better: { jobCode: string; title: string; rank: number; match_score: number; members?: { jobCode: string; title: string }[] }[]
  }
}

// ── A. 영역 요약 한 줄 ──
// 다섯 영역 중 가장 잘 맞는 곳과 가장 차이 나는 곳. 차이가 작으면 '고르게' 로 말한다
// (그래프의 '재능/흥미/가치관' 은 세 영역을 합친 값이라, 여기서 다섯으로 풀어 주면 정보가 늘어난다)
const AREAS = [
  { key: 'T1', name: '성격', end: '이에요' },
  { key: 'T21', name: '재능', end: '이에요' },
  { key: 'T22', name: '흥미', end: '예요' },
  { key: 'T23', name: '가치관', end: '이에요' },
  { key: 'T3', name: '업무환경', end: '이에요' },
] as const
const EVEN_GAP = 0.08 // 최고·최저 차이가 이보다 작으면 '고르게 맞아요'

export function currentJobAreaSummary(cj: CurrentJob): string {
  const vals = AREAS.map((a) => ({ ...a, v: cj.match_detail?.[a.key] ?? 0 })).sort((x, y) => y.v - x.v)
  const best = vals[0]!
  const worst = vals[vals.length - 1]!
  if (best.v - worst.v < EVEN_GAP) return '다섯 영역이 고르게 맞아요'
  return `가장 잘 맞는 영역은 ${best.name}, 가장 차이 나는 영역은 ${worst.name}${worst.end}`
}

// ── B. 같은 분야 ──
export const currentJobFieldRankText = (cj: CurrentJob) =>
  cj.field && cj.field.total > 1 ? `같은 분야 직업 ${cj.field.total}개 중 지금 직업은 ${cj.field.rank}위` : null
// '더 잘 맞는' 은 지금 직업을 깎아내리는 비교로 읽혀서 뺐다(사용자 확정 문구 2026-10-16)
export const FIELD_HEADING = '같은 분야에서 잘 맞는 다른 직업'
export const FIELD_TOP_NOTE = '같은 분야에서는 지금 직업이 가장 잘 맞아요'

// 해석 구간 — 사용자 확정 문구(2026-10-16). 구간을 바꾸면 화면·PDF 가 같이 바뀐다
export const CURRENT_JOB_BANDS = [
  { max: 10, key: 'high', text: '검사 결과와 잘 맞는 직업이에요' },
  { max: 30, key: 'mid', text: '어느 정도 맞는 직업이에요' },
  { max: 100, key: 'low', text: '다른 면이 더 두드러져요' },
] as const

// 매칭도 링은 화면·PDF 모두 브랜드 노랑(2026-10-20 화면 리뉴얼 → 2026-11-02 PDF). 해석 구간별 색은 쓰지 않는다

export function currentJobBand(cj: CurrentJob) {
  if (!cj.rankable) return null
  return CURRENT_JOB_BANDS.find((b) => cj.percentile <= b.max) ?? CURRENT_JOB_BANDS[CURRENT_JOB_BANDS.length - 1]
}

/** '직업 481개 중 131위 · 상위 27.2%' */
export const currentJobRankText = (cj: CurrentJob) =>
  `직업 ${cj.total}개 중 ${cj.rank}위 · 상위 ${cj.percentile}%`

/** 응답자가 고른 직업이 공유 그룹이라 순위 항목 이름과 다를 때의 안내 */
export function currentJobGroupNote(cj: CurrentJob) {
  const picked = cj.selected?.title?.trim()
  const ranked = cj.title?.trim()
  return picked && ranked && picked !== ranked ? `비슷한 직업 묶음 '${ranked}' 기준` : null
}

/** 추천 목록의 이 항목이 현재 직업인가 (공유 그룹 구성원 포함) */
export function isCurrentJob(job: { jobCode: string; members?: { jobCode: string }[] }, cj: CurrentJob | null) {
  if (!cj) return false
  const code = cj.selected?.jobCode ?? cj.jobCode
  return job.jobCode === code || (job.members ?? []).some((m) => m.jobCode === code)
}

export const RANKLESS_NOTE = '이 직업은 비교할 직업 정보가 부족해 순위는 내지 않았어요'
