// '되는 길'을 라이트하우스가 직접 쓴 직업의 표시(2026-11-14, 2026-11-19 진로상담 1차 검토 반영)
// - 근거 문구: 법령 근거 글이라도 전부를 원문으로 확인한 것은 아니라서 '일부'라고 쓴다.
// - 검토 표시: 직업마다 서버가 정한다(reviewed). 켜진 직업만 '라이트하우스 검토', 나머지는 '검토 전 초안이에요'.
//   현직자 검토라고 쓰지 않는다. 내용 아래(상자 맨 아래)에 둔다(design-copy: 예시·검토 전 단서는 내용 아래).
// - 검토 줄·caution 은 직업별 검토 칸(reviewedAt)이 오는 응답에서만 그린다 — 그 전 API 의 글은 '-다' 꼴이라 섞지 않는다.
import type { WaySource } from '../types/encyclopedia'

export interface WaySourceView {
  basisLine: string
  caution: string | null
  sources: string[]
  review: { kind: 'reviewed' | 'draft'; text: string } | null
}

export function basisLine(basis: WaySource['basis']): string {
  return basis === 'law' ? '자격 기준 일부는 법령 원문으로 확인했어요.' : '일반적인 경로를 정리했어요.'
}

function dotDate(d: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d ?? '')
  return m ? `${m[1]}.${m[2]}.${m[3]}` : ''
}

export function waySourceView(ws: WaySource): WaySourceView {
  const perJob = Object.prototype.hasOwnProperty.call(ws, 'reviewedAt')
  let review: WaySourceView['review'] = null
  if (perJob) {
    if (ws.reviewed === true) {
      const d = dotDate(ws.reviewedAt)
      review = { kind: 'reviewed', text: d ? `라이트하우스 검토 · ${d}` : '라이트하우스 검토' }
    } else {
      review = { kind: 'draft', text: '검토 전 초안이에요' }
    }
  }
  return {
    basisLine: basisLine(ws.basis),
    caution: perJob && ws.caution ? ws.caution : null,
    sources: Array.isArray(ws.sources) ? ws.sources : [],
    review,
  }
}
