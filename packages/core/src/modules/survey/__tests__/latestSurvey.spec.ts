import { describe, it, expect } from 'vitest'
import { pickLatestSurveyId } from '../lib/latestSurvey'

describe('pickLatestSurveyId — 내 최근 검사', () => {
  it('제출이 가장 늦은 검사', () => {
    expect(pickLatestSurveyId([
      { survey_id: 'old', submitted_at: '2026-05-19T10:00:00Z' },
      { survey_id: 'new', submitted_at: '2026-05-27T10:00:00Z' },
      { survey_id: 'mid', submitted_at: '2026-05-20T10:00:00Z' },
    ])).toBe('new')
  })
  it('없거나 비면 빈 문자열', () => {
    expect(pickLatestSurveyId([])).toBe('')
    expect(pickLatestSurveyId(null)).toBe('')
    expect(pickLatestSurveyId(undefined)).toBe('')
  })
  it('날짜가 깨진 것·id 없는 것은 건너뛴다', () => {
    expect(pickLatestSurveyId([
      { survey_id: 'bad', submitted_at: 'nope' },
      { survey_id: '', submitted_at: '2026-12-01T00:00:00Z' },
      { survey_id: 'ok', submitted_at: '2026-01-01T00:00:00Z' },
    ])).toBe('ok')
  })
})

import { chooseSurveyId } from '../lib/latestSurvey'

describe('chooseSurveyId — 탭에 둔 검사 id 는 내 목록에 있을 때만', () => {
  const mine = [
    { survey_id: 'mine-old', submitted_at: '2026-05-19T10:00:00Z' },
    { survey_id: 'mine-new', submitted_at: '2026-05-27T10:00:00Z' },
  ]
  it('내 목록에 있으면 그 검사', () => {
    expect(chooseSurveyId('mine-old', mine)).toBe('mine-old')
  })
  it('다른 계정(또는 없는) 검사 id 면 내 목록의 최신', () => {
    expect(chooseSurveyId('someone-else', mine)).toBe('mine-new')
  })
  it('탭에 둔 것이 없으면 최신, 목록이 비면 빈 문자열', () => {
    expect(chooseSurveyId('', mine)).toBe('mine-new')
    expect(chooseSurveyId('someone-else', [])).toBe('')
  })
})
