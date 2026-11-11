// 회원 가입 전(비회원) 자기이해 검사 — 이 기기에 두는 정보(2026-11-09).
//
// 서버는 비회원 검사에 무작위 열람 키를 주고 해시만 둔다. 키가 있어야 결과를 보고·지우고·계정에 연결한다
// (survey_id 는 시각 형식이라 추측할 수 있다). 처리방침 제9조: 가입하면 계정에 연결한 뒤 지운다.
// 가입하지 않으면 서버가 24시간 뒤 지운다(나가면 그 자리에서 지운다 — deleteGuestSurvey).
import { req } from '@/shared/api'

const KEY = 'lh_guest_survey'

export interface GuestSurvey {
  surveyId: string
  key: string
  at: string
}

export function saveGuestSurvey(surveyId: string, key: string) {
  try { localStorage.setItem(KEY, JSON.stringify({ surveyId, key, at: new Date().toISOString() })) } catch { /* 저장 불가 — 결과는 이번 화면에서만 */ }
}

export function getGuestSurvey(): GuestSurvey | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    return v?.surveyId && v?.key ? v : null
  } catch {
    return null
  }
}

export function clearGuestSurvey() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}

export const fetchGuestAnalysis = (surveyId: string, key: string) =>
  req.get(`/api/survey/guest/${encodeURIComponent(surveyId)}/analysis`, { headers: { 'x-guest-key': key } })

// 결과지 잠금 화면의 '직무 맛보기'(2026-11-11) — 1위 직무 이름과 개수만 온다(2·3위·이유·직업 목록은 가입 뒤)
export interface GuestJobTeaser {
  top: { code: string; name: string } | null
  groupCount: number
  jobCount: number
}
export const fetchGuestJobTeaser = (surveyId: string, key: string) =>
  req.get<GuestJobTeaser>(`/api/survey/guest/${encodeURIComponent(surveyId)}/job-groups`, { headers: { 'x-guest-key': key } })

export const deleteGuestSurvey = (surveyId: string, key: string) =>
  req.delete(`/api/survey/guest/${encodeURIComponent(surveyId)}`, { headers: { 'x-guest-key': key } })

// 소셜 로그인으로 잠깐 나갈 때는 '나가면 삭제' 경고를 띄우지 않는다(같은 탭으로 돌아온다)
let loginRedirect = false
export const markLoginRedirect = () => { loginRedirect = true }
export const isLoginRedirect = () => loginRedirect

/**
 * 로그인·가입 직후 — 이 기기의 비회원 검사를 계정에 연결한다.
 * 연결했으면 그 결과지 주소를, 연결할 검사가 없거나 실패(24시간이 지나 지워짐 등)면 null.
 */
export async function linkPendingGuestSurvey(): Promise<string | null> {
  const g = getGuestSurvey()
  if (!g) return null
  try {
    await req.post('/api/user/survey-results', { survey_id: g.surveyId, guestKey: g.key })
  } catch (e: any) {
    // 409 = 이미 내 계정(다시 시도한 경우) — 연결된 것으로 본다
    if (e?.response?.status !== 409) {
      clearGuestSurvey()
      return null
    }
  }
  clearGuestSurvey()
  return `/self-understanding/result/${g.surveyId}`
}
