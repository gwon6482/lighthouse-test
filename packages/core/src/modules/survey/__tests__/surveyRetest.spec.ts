import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { SURVEY_ERROR, isSurveyIdTaken, submittedIdOf } from '../lib/surveySubmit'

// 시험 환경(node)에는 저장소가 없다 — 메모리로 대신한다(모듈을 불러오기 전에)
function memStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, String(v)) },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size },
  }
}
Object.assign(globalThis, { localStorage: memStorage(), sessionStorage: memStorage() })

// 가짜 API — 폼은 부를 때마다 새 번호, 제출은 넘겨준 함수로 정한다
let formN = 0
let submitImpl: (body: { survey_id: string }) => Promise<unknown> = async () => ({ data: { success: true } })
const submitted: { survey_id: string; T1: Record<string, string> }[] = []
vi.mock('../survey.api', () => ({
  fetchSurveyForm: vi.fn(async () => {
    formN += 1
    return { status: 200, data: { survey_id: `SURV_F${formN}`, '2_values': [], '5_values': [], survey: [
      { survey_part: 'T1', page_1: [{ question_num: '1', question_id: 'T1_01', question_text: 'q' }] },
      { survey_part: 'T3', items: [] },
    ] } }
  }),
  submitSurveyResponse: vi.fn(async (body: { survey_id: string; answers: { T1: Record<string, string> } }) => {
    submitted.push({ survey_id: body.survey_id, T1: { ...body.answers.T1 } })
    return submitImpl(body)
  }),
}))
vi.mock('@/shared/guest/guestSurvey', () => ({ saveGuestSurvey: vi.fn() }))

const taken = () => Object.assign(new Error('Request failed with status code 409'), { response: { status: 409, data: { code: 'survey_id_taken' } } })

describe('surveySubmit — 작은 규칙', () => {
  it('409 survey_id_taken 만 이미 쓴 번호로 본다', () => {
    expect(isSurveyIdTaken(taken())).toBe(true)
    expect(isSurveyIdTaken({ response: { status: 409, data: { code: 'other' } } })).toBe(false)
    expect(isSurveyIdTaken({ response: { status: 500 } })).toBe(false)
    expect(isSurveyIdTaken(new Error('x'))).toBe(false)
    expect(isSurveyIdTaken(null)).toBe(false)
  })
  it('결과로 갈 번호 — 이번 탭에서 낸 것 먼저, 없으면 탭에 둔 것', () => {
    expect(submittedIdOf('A', 'B')).toBe('A')
    expect(submittedIdOf('', 'B')).toBe('B')
    expect(submittedIdOf('', null)).toBe('')
  })
  it('오류 문구는 해요체 한 줄(영어 기본 문구가 아니다)', () => {
    expect(SURVEY_ERROR.submit).toMatch(/요\.$/)
    expect(SURVEY_ERROR.load).toMatch(/요\.$/)
  })
})

describe('useSurvey — 이어 하기와 새로 하기', async () => {
  const { useSurvey } = await import('../composables/useSurvey')
  const { clearAccountScope } = await import('@/shared/auth/accountScope')
  const s = useSurvey()

  beforeEach(async () => {
    submitImpl = async () => ({ data: { success: true } })
    submitted.length = 0
    clearAccountScope()          // 깨끗한 상태에서 — 계정이 바뀐 것과 같다
    await s.loadSurvey()
  })

  it('쓰다 만 검사는 다시 들어와도 그대로 이어 한다(같은 번호·답·쪽)', async () => {
    const id = s.surveyId.value
    s.setScaleAnswer('T1', 'T1_01', '4')
    s.currentPageIndex.value = 1
    expect(s.startNewIfFinished()).toBe(false)
    expect(s.surveyId.value).toBe(id)
    expect(s.answers.T1.T1_01).toBe('4')
    expect(s.currentPageIndex.value).toBe(1)
    await nextTick()   // 저장은 watch 로 — 다음 틱
    expect(JSON.parse(localStorage.getItem('lh_survey_progress_v1')!).currentPageIndex).toBe(1)
  })

  it('낸 뒤 다시 검사하면 새 번호·빈 답·첫 쪽', async () => {
    const first = s.surveyId.value
    s.setScaleAnswer('T1', 'T1_01', '4')
    s.currentPageIndex.value = 2
    await s.submitSurvey('r')
    expect(s.submittedSurveyId.value).toBe(first)
    expect(localStorage.getItem('lh_survey_progress_v1')).toBeNull()

    expect(s.startNewIfFinished()).toBe(true)
    expect(s.surveyData.value).toBeNull()        // 다음 화면이 폼을 새로 받는다
    expect(s.answers.T1).toEqual({})
    expect(s.currentPageIndex.value).toBe(0)
    await s.loadSurvey()
    expect(s.surveyId.value).not.toBe(first)
    expect(s.startNewIfFinished()).toBe(false)    // 한 번만
    s.setScaleAnswer('T1', 'T1_01', '2')
    await s.submitSurvey('r')
    expect(submitted.map((x) => x.survey_id)).toEqual([first, s.surveyId.value])
    expect(submitted[1]!.T1).toEqual({ T1_01: '2' })
  })

  it('계정이 바뀌면 쓰다 만 검사(메모리·기기 저장본)를 비운다', async () => {
    s.setScaleAnswer('T1', 'T1_01', '5')
    s.currentPageIndex.value = 1
    await nextTick()
    expect(localStorage.getItem('lh_survey_progress_v1')).not.toBeNull()
    clearAccountScope()
    expect(s.answers.T1).toEqual({})
    expect(s.currentPageIndex.value).toBe(0)
    expect(s.surveyData.value).toBeNull()
    expect(localStorage.getItem('lh_survey_progress_v1')).toBeNull()
    expect(localStorage.getItem('lh_survey_form_v1')).toBeNull()
  })

  it('계정이 바뀌어도 비회원 검사의 열람 키(lh_guest_survey)는 남긴다 — 가입 뒤 연결에 쓴다', () => {
    localStorage.setItem('lh_guest_survey', '{"surveyId":"g","key":"k"}')
    clearAccountScope()
    expect(localStorage.getItem('lh_guest_survey')).not.toBeNull()
    localStorage.removeItem('lh_guest_survey')
  })

  it('409 survey_id_taken 이면 새 번호로 한 번만 다시 낸다(답은 그대로)', async () => {
    const first = s.surveyId.value
    s.setScaleAnswer('T1', 'T1_01', '3')
    let n = 0
    submitImpl = async () => { n += 1; if (n === 1) throw taken(); return { data: { success: true } } }
    await s.submitSurvey('r')
    expect(submitted).toHaveLength(2)
    expect(submitted[0]!.survey_id).toBe(first)
    expect(submitted[1]!.survey_id).not.toBe(first)
    expect(submitted[1]!.T1).toEqual({ T1_01: '3' })
    expect(s.submittedSurveyId.value).toBe(submitted[1]!.survey_id)
  })

  it('다시 내도 409 면 오류 화면 — 해요체 한 줄', async () => {
    submitImpl = async () => { throw taken() }
    await expect(s.submitSurvey('r')).rejects.toBeTruthy()
    expect(submitted).toHaveLength(2)                  // 두 번까지만
    expect(s.error.value).toBe(SURVEY_ERROR.submit)
    expect(s.startNewIfFinished()).toBe(false)         // 못 냈으니 이어 한다
  })

  it('다른 오류(500 등)는 다시 내지 않고 오류 화면', async () => {
    submitImpl = async () => { throw Object.assign(new Error('Request failed with status code 500'), { response: { status: 500 } }) }
    await expect(s.submitSurvey('r')).rejects.toBeTruthy()
    expect(submitted).toHaveLength(1)
    expect(s.error.value).toBe(SURVEY_ERROR.submit)
  })
})
