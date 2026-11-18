// 진로백과 '일자리 전망' 칸 그리기 규칙(2026-11-18) — status 별로 무엇을 그리는지
import { describe, it, expect } from 'vitest'
import { outlookView, verdictSentence, verdictWhen, verdictTone, sourceText, groupLine, isGroupVerdict } from '../lib/outlook'
import type { JobOutlook } from '../types/encyclopedia'

const SRC = { title: '2025~2035 정성적 일자리 전망', publisher: '한국고용정보원', year: 2026, url: 'https://www.wagework.go.kr/x' }

const official: JobOutlook = {
  status: 'official',
  official: { verdict: '다소 감소', period: '2025~2035', scope: 'job', source: SRC, checkedAt: '2026-11-18' },
}
const group: JobOutlook = {
  status: 'group',
  official: { verdict: '다소 증가', period: '2025~2035', scope: 'group', groupName: '전문의사', source: SRC },
}
const ours: JobOutlook = {
  status: 'ours',
  official: { verdict: '다소 증가', period: '2025~2035', scope: 'group', groupName: '전문의사', source: SRC },
  ours: { lines: ['소아청소년과 전공의 지원이 줄고 있어요.'], facts: [{ text: '전공의 정원', source: { title: '전공의 정원', publisher: '보건복지부', year: 2026 } }], reviewed: false },
}
const none: JobOutlook = {
  status: 'none', hiring: '공채',
  related: ['240101', '240201'],
  relatedJobs: [{ jobCode: '240101', title: '경찰관' }, { jobCode: '240201', title: '소방관' }],
}

describe('outlookView — status 별로 그릴 것', () => {
  it('outlook 이 없으면(옛 API·자료 없음) 전문가 칸을 그리지 않는다', () => {
    expect(outlookView(null)).toBeNull()
    expect(outlookView(undefined)).toBeNull()
  })

  it('official — 판정·문장·출처, "없어요" 줄 없음', () => {
    const v = outlookView(official)!
    expect(v.noneLine).toBe('')
    expect(v.showOfficial).toBe(true)
    expect(v.officialSmall).toBe(false)
    expect(v.showOurs).toBe(false)
    expect(v.related).toEqual([])
  })

  it('group — 공식 판정을 묶음 이름 주어로', () => {
    const v = outlookView(group)!
    expect(v.showOfficial).toBe(true)
    expect(isGroupVerdict(group)).toBe(true)
    expect(verdictSentence(group)).toBe('전문가들은 앞으로 10년 동안 전문의사 일자리가 다소 늘어날 것으로 봐요.')
    expect(groupLine(group, 13)).toBe('‘전문의사’로 묶인 13개 직업을 함께 다룬 전망이에요.')
    expect(groupLine(group)).toBe('‘전문의사’로 묶인 여러 직업을 함께 다룬 전망이에요.')
  })

  it('ours — "이 직업만 다룬 공식 전망은 없어요" 먼저, 자체 조사 + 검토 전 표시, 묶음 판정은 작게', () => {
    const v = outlookView(ours)!
    expect(v.noneLine).toBe('이 직업만 다룬 공식 전망은 없어요.')
    expect(v.showOurs).toBe(true)
    expect(v.oursBadge).toBe('라이트하우스가 정리한 내용이에요 · 검토 전')
    expect(v.showOfficial).toBe(true)
    expect(v.officialSmall).toBe(true)
    expect(outlookView({ ...ours, ours: { ...ours.ours!, reviewed: true } })!.oursBadge).toBe('라이트하우스가 정리한 내용이에요')
  })

  it('none — "아직 없어요" + 비슷한 직업 + 공채 안내', () => {
    const v = outlookView(none)!
    expect(v.noneLine).toBe('이 직업만 다룬 공식 전망은 아직 없어요.')
    expect(v.showOfficial).toBe(false)
    expect(v.hiringLine).toBe('뽑는 인원은 해마다 채용 공고로 정해져요.')
    expect(v.related.map((r) => r.title)).toEqual(['경찰관', '소방관'])
  })

  it('비슷한 직업은 이름이 붙은 것만(API relatedJobs), official 에는 싣지 않는다', () => {
    expect(outlookView({ ...none, relatedJobs: [{ jobCode: '240101', title: '' }] })!.related).toEqual([])
    expect(outlookView({ ...official, relatedJobs: none.relatedJobs })!.related).toEqual([])
  })

  it('모르는 판정 낱말은 공식 칸을 그리지 않는다', () => {
    const v = outlookView({ status: 'official', official: { verdict: '알수없음' as never, source: SRC } })!
    expect(v.showOfficial).toBe(false)
  })
})

describe('판정 한 줄·연도·출처 — 우리 말로, 단정하지 않게', () => {
  it('판정 낱말마다 문장', () => {
    const s = (verdict: JobOutlook['official'] extends infer O ? O extends { verdict: infer V } ? V : never : never) =>
      verdictSentence({ status: 'official', official: { verdict, period: '2025~2035', source: SRC } })
    expect(s('증가')).toBe('전문가들은 앞으로 10년 동안 일자리가 늘어날 것으로 봐요.')
    expect(s('유지')).toBe('전문가들은 앞으로 10년 동안 일자리가 지금과 비슷할 것으로 봐요.')
    expect(s('감소')).toBe('전문가들은 앞으로 10년 동안 일자리가 줄어들 것으로 봐요.')
  })

  it('2020~2023 글은 기간을 쓰지 않고 작성 연도를 붙인다', () => {
    const o: JobOutlook = { status: 'official', official: { verdict: '유지', written: '2022', source: { publisher: '한국고용정보원', title: '워크피디아' } } }
    expect(verdictSentence(o)).toBe('전문가들은 앞으로 일자리가 지금과 비슷할 것으로 봐요.')
    expect(verdictWhen(o.official)).toBe('2022년 작성')
    expect(verdictWhen(official.official)).toBe('2025~2035 전망')
  })

  it('출처 글 — 기관 「제목」(연도). "제공·공식·제휴"라는 말은 넣지 않는다', () => {
    const t = sourceText(official.official)
    expect(t).toBe('한국고용정보원 「2025~2035 정성적 일자리 전망」(2026)')
    expect(t).not.toMatch(/제공|공식|제휴/)
    expect(sourceText(undefined)).toBe('')
  })

  it('색 — 증가·감소·그 밖', () => {
    expect(verdictTone('다소 증가')).toBe('up')
    expect(verdictTone('감소')).toBe('down')
    expect(verdictTone('유지')).toBe('flat')
    expect(verdictTone(null)).toBe('flat')
  })
})
