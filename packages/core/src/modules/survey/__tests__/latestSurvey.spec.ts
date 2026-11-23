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
