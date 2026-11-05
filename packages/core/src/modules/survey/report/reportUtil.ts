// PDF 결과지 계산 도우미 — 쪽 컴포넌트들이 같이 쓴다.

export const pct = (v: number | null | undefined) => Math.round((v ?? 0) * 100)

// 재능·흥미·가치관 합성 점수 — 화면 결과지(ResearchResult.vue t2Score)·앱과 같은 가중치(T21 .25 / T22 .25 / T23 .20)
// ⚠️ 가중치를 바꾸면 세 곳을 함께 바꿀 것
export const t2Score = (d: { T21: number; T22: number; T23: number }) => (d.T21 * 0.25 + d.T22 * 0.25 + d.T23 * 0.2) / 0.7

// 순위에 따른 막대 색 — 1위 노랑, 2·3위 하늘, 나머지 연하늘(화면 성격 분포 pdBar 와 같은 값)
export const rankColor = (i: number) => (i === 0 ? '#ffd100' : i < 3 ? '#5bb8f5' : '#a5d8f8')
// 상위 3개 점수 칸 class — 1위 노랑 글씨(hl) · 2~3위 파랑 글씨(hl2)
// 순위 배지 — 화면 재능·가치관 카드와 같게: 1위 노랑 · 2위 하늘 · 3위 회색
export const rankTagClass = (i: number) => (i === 0 ? 'rp-tag--y' : i === 1 ? 'rp-tag--b' : 'rp-tag--n')
export const rankScoreClass = (i: number) => (i === 0 ? 'hl' : i < 3 ? 'hl2' : '')

/** ISO 시각 → 'YYYY.MM.DD' (보는 사람의 현지 날짜). 없으면 빈 문자열 */
export function formatDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 쪽 높이를 넘친 내용 찾기 — 쪽은 A4 로 고정이라 넘친 부분은 PDF 에서 **잘린다.**
 * 꼬리말 윗선보다 아래로 내려간 구역이 있으면 [쪽 번호, 넘친 px] 를 돌려준다.
 */
export function findPageOverflow(pages: HTMLElement[]): { page: number; px: number }[] {
  const out: { page: number; px: number }[] = []
  pages.forEach((pg, i) => {
    const foot = pg.querySelector('.rp-foot')
    if (!foot) return
    const limit = foot.getBoundingClientRect().top
    let bottom = 0
    for (const el of Array.from(pg.children)) {
      if (el === foot) continue
      bottom = Math.max(bottom, el.getBoundingClientRect().bottom)
    }
    if (bottom > limit) out.push({ page: i + 1, px: Math.ceil(bottom - limit) })
  })
  return out
}

export interface ReportMeta {
  /** 'res_' 를 뗀 응답 번호 */
  id: string
  /** 검사일 'YYYY.MM.DD' — 없으면 칸을 숨긴다 */
  date: string
}
