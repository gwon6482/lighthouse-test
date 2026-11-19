// 진로백과 '분류로 찾기'(2026-11-17) — GET /api/job/browse/axes · GET /api/job/browse 응답.
// 판정 규칙·기준값은 서버에만 있다(이 레포는 공개). 앱은 이름·개수·이유 문장만 받아 그린다.

export type BrowseAxisKey = 'group' | 'interest' | 'env' | 'talent' | 'value' | 'salary'

export interface BrowseOption {
  code: string
  name: string
  /** 그것 하나만 골랐을 때 목록 줄 수(묶음 직업은 한 줄) */
  count?: number
  fullName?: string
  /** 재능 — 이유 문장에 쓰는 실제 자료 이름(예: 논리적 분석·수리력) */
  basis?: string[]
  /** 가치관 '경제적 보상' → 연봉 분류로 안내 */
  redirect?: BrowseAxisKey
  /** 연봉 — 중간값 하한(만 원) */
  min?: number
  /** 업무 환경 '빼기' — 빠지는 줄 수 */
  removes?: number
  /** 업무 환경 — 조건 칩·이유 줄에 쓰는 긴 이름(예: '고객·민원인을 자주 상대해요') */
  label?: string
  /** 가치관 — 짧은 설명(DB 글을 해요체 한 문장으로) */
  desc?: string
  children?: BrowseOption[]
}

export interface BrowseEnvSection {
  key: 'posture' | 'customer' | 'prefer' | 'exclude'
  name: string
  select: 'single' | 'multi'
  exclude?: boolean
  items: BrowseOption[]
}

export interface BrowseAxis {
  key: BrowseAxisKey
  name: string
  select?: 'single' | 'multi'
  items?: BrowseOption[]
  sections?: BrowseEnvSection[]
  basis?: 'median'
}

export interface BrowseAxes {
  axes: BrowseAxis[]
  jobs: number
  noData: Record<string, number>
  source: { name: string; surveyYear: number | null }
  maxConditions: number
}

export interface BrowseAxesResponse {
  success: boolean
  data: BrowseAxes
}

export interface BrowseCondition {
  /** group · interest · talent · value · salary · env:<코드> */
  id: string
  axis: BrowseAxisKey
  codes: string[]
  label: string
}

export interface BrowseReason {
  axis: BrowseAxisKey
  code: string
  label: string
  basis?: string[]
  /** 카드에 그대로 쓰는 문장(예: '컴퓨터와 전자공학 지식을 다른 직업보다 많이 써요') */
  text: string
}

export interface BrowseRow {
  jobCode: string
  title: string
  overview?: string
  group: { code: string; name: string } | null
  /** 고용24 통합조사 묶음 — 2개 이상이면 고르게 한다(누른 이름과 열린 제목이 달라지지 않게) */
  members?: { jobCode: string; title: string }[]
  salary: { median: number | null }
  reasons: BrowseReason[]
  /** near 에서만 — 이 조건 하나만 다르다 */
  missing?: BrowseCondition
}

export interface BrowseResult {
  success: boolean
  total: number
  applied: { conditions: BrowseCondition[]; dropped: { axis: string; code: string; reason: string }[]; sort: BrowseAxisKey | null }
  /** 그 보기를 더했을 때(같은 분류면 넓혀서, 하나만 고르는 칸이면 바꿔서) 남는 줄 수 — 0이면 흐리게 */
  next: Record<BrowseAxisKey, Record<string, number>>
  /** 결과가 5줄 미만이고 조건이 둘 이상일 때 — 조건 하나씩 뺀 줄 수 */
  relax?: (BrowseCondition & { count: number })[]
  /** 하나만 빼고 맞는 줄 — 들어온 조건은 지키고 나중에 더한 조건이 빠진 직업부터(빠진 조건마다 이어서) */
  near?: BrowseRow[]
  /** near 를 자르기 전 전체 수 */
  nearTotal?: number
  /** 빠진 조건(묶음)마다 자르기 전 수(total)와 near 에 든 수(shown) — 2026-11-19 서버부터 */
  nearGroups?: (BrowseCondition & { total: number; shown: number })[]
  /** nearMore 로 한 묶음을 더 받았을 때 그 조각 */
  nearPage?: BrowseCondition & { total: number; offset: number; limit: number; data: BrowseRow[] }
  offset: number
  limit: number
  data: BrowseRow[]
}
