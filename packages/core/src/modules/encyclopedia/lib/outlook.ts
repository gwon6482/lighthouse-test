// 진로백과 '일자리 전망' 칸 그리기 규칙(2026-11-18) — 순수 함수라 화면 없이 시험한다.
// 결정: workspace decisions/2026-11-18-job-outlook.md (정한 것 1·3·7·8)
//   - 옛 고용24 전망 글은 그리지 않는다. 전문가 칸은 API 의 outlook 으로만 그린다
//   - 공식 판정은 한 단어 + 연도 + 출처 + 링크. 판정 한 줄은 우리 말로(한국고용정보원 글을 옮기지 않는다)
//   - 묶음 판정은 주어를 묶음 이름으로. 사정이 다른 묶음·자체 조사는 "이 직업만 다룬 공식 전망은 없어요"를 먼저
//   - 공식 전망이 없으면 "아직 없어요" + 비슷한 직업, 공채 직업은 공고 안내
import type { JobOutlook, OutlookVerdict } from '../types/encyclopedia'

const MOVE: Record<OutlookVerdict, string> = {
  '증가': '늘어날',
  '다소 증가': '다소 늘어날',
  '유지': '지금과 비슷할',
  '다소 감소': '다소 줄어들',
  '감소': '줄어들',
}

export type VerdictTone = 'up' | 'down' | 'flat'
export function verdictTone(v?: string | null): VerdictTone {
  if (!v) return 'flat'
  if (v.includes('증가')) return 'up'
  if (v.includes('감소')) return 'down'
  return 'flat'
}

/** '2025~2035 전망' · '2022년 작성' */
export function verdictWhen(o?: JobOutlook['official']): string {
  if (!o) return ''
  if (o.period) return `${o.period} 전망`
  if (o.written) return `${o.written}년 작성`
  return ''
}

/** 묶음 판정인가(묶음 이름을 주어로 쓴다) */
export function isGroupVerdict(outlook?: JobOutlook | null): boolean {
  return !!outlook?.official && (outlook.official.scope === 'group' || outlook.status === 'group')
}

/** 판정 한 줄(해요체, 우리 말). 2025~2035 판은 '앞으로 10년 동안', 그 밖은 기간을 쓰지 않는다 */
export function verdictSentence(outlook?: JobOutlook | null): string {
  const o = outlook?.official
  if (!o || !MOVE[o.verdict]) return ''
  const when = o.period === '2025~2035' ? '앞으로 10년 동안 ' : '앞으로 '
  const whose = isGroupVerdict(outlook) && o.groupName ? `${o.groupName} ` : ''
  return `전문가들은 ${when}${whose}일자리가 ${MOVE[o.verdict]} 것으로 봐요.`
}

/** 출처 한 줄 — '한국고용정보원 「2025~2035 정성적 일자리 전망」(2026)'. '제공·공식·제휴'라는 말은 쓰지 않는다 */
export function sourceText(o?: JobOutlook['official']): string {
  const s = o?.source
  if (!s) return ''
  const pub = s.publisher ?? ''
  const title = s.title ? `「${s.title}」` : ''
  const year = s.year ? `(${s.year})` : ''
  return [pub, `${title}${year}`].filter(Boolean).join(' ')
}

/** 묶음 판정 안내 — '‘전문의사’로 묶인 13개 직업을 함께 다룬 전망이에요' (몇 개인지 모르면 '여러 직업') */
export function groupLine(outlook: JobOutlook | null | undefined, sharedCount?: number): string {
  const name = outlook?.official?.groupName
  if (!isGroupVerdict(outlook) || !name) return ''
  const n = sharedCount && sharedCount > 1 ? `${sharedCount}개 직업` : '여러 직업'
  return `‘${name}’로 묶인 ${n}을 함께 다룬 전망이에요.`
}

export interface OutlookView {
  /** 맨 위 "이 직업만 다룬 공식 전망은 …" 줄 — 없으면 '' */
  noneLine: string
  /** 공식 판정 칸을 그릴지, 작게 그릴지(자체 조사가 주인공일 때) */
  showOfficial: boolean
  officialSmall: boolean
  /** 라이트하우스 자체 조사 */
  showOurs: boolean
  oursBadge: string
  /** 공채 안내 */
  hiringLine: string
  /** 비슷한 직업 칩 */
  related: { jobCode: string; title: string }[]
}

export function outlookView(outlook?: JobOutlook | null): OutlookView | null {
  if (!outlook) return null
  const hasOfficial = !!outlook.official && !!MOVE[outlook.official.verdict]
  const hasOurs = !!outlook.ours?.lines?.length
  const status = outlook.status
  let noneLine = ''
  if (status === 'none') noneLine = '이 직업만 다룬 공식 전망은 아직 없어요.'
  else if (status === 'ours') noneLine = '이 직업만 다룬 공식 전망은 없어요.'
  return {
    noneLine,
    showOfficial: hasOfficial,
    officialSmall: hasOfficial && status === 'ours',
    showOurs: hasOurs,
    oursBadge: hasOurs ? `라이트하우스가 정리한 내용이에요${outlook.ours?.reviewed ? '' : ' · 검토 전'}` : '',
    hiringLine: outlook.hiring === '공채' ? '뽑는 인원은 해마다 채용 공고로 정해져요.' : '',
    related: status === 'none' || status === 'ours' ? (outlook.relatedJobs ?? []).filter((r) => r?.jobCode && r?.title) : [],
  }
}
