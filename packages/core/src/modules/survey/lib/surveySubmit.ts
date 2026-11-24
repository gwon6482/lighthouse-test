// 검사 제출·다시 검사의 작은 규칙(2026-11-25) — 화면과 무관한 것만. 상태는 composables/useSurvey.ts.
//
// '이어 하기'와 '새로 하기'
//   - 이어 하기: 아직 내지 않은 검사. 새로고침·앱 다시 열기 뒤에는 기기 저장본(lh_survey_progress_v1·lh_survey_form_v1)에서,
//     같은 탭 안에서는 메모리에서 같은 번호·같은 답·같은 쪽으로 돌아온다.
//   - 새로 하기: 검사를 낸 뒤 다시 검사 화면(답변방식 고르기·검사)에 들어올 때. 예전엔 낸 뒤 기기 저장본만 지우고
//     메모리는 남겨서, 같은 탭에서 다시 검사하면 **같은 번호로, 앞의 답이 채워진 채, 마지막 쪽에서** 시작했다
//     (서버는 같은 번호의 첫 문서를 돌려줘 다시 한 결과가 반영되지 않았다).
//   - 계정이 바뀌면(로그인·로그아웃·가입) 쓰다 만 검사도 비운다 — 앞 사람의 답이 다음 사람에게 보였다.
//
// 같은 번호로 다시 내면 서버(fix/orphan-survey-attach)는 같은 계정이면 옛 검사를 201로, 비회원·다른 계정이면 409 survey_id_taken 을 준다.
// 409 면 폼을 새로 받아 새 번호로 한 번만 다시 낸다(답은 그대로 — 답은 문항 id 로 묶여 있어 문항 순서가 바뀌어도 맞다).

export const SURVEY_ID_TAKEN = 'survey_id_taken'

/** 서버가 '이미 쓴 검사 번호'라고 돌려준 오류인가 */
export function isSurveyIdTaken(e: unknown): boolean {
  const r = (e as { response?: { status?: number; data?: { code?: string } } } | null)?.response
  return r?.status === 409 && r.data?.code === SURVEY_ID_TAKEN
}

/** 화면에 보일 오류 한 줄 — axios 기본 영어 문구('Request failed with status code …')를 그대로 보이지 않는다 */
export const SURVEY_ERROR = {
  load: '검사를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.',
  submit: '검사를 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.',
} as const

/** 결과로 갈 검사 번호 — 이번 탭에서 낸 번호가 먼저, 새로고침 뒤에는 탭에 둔 번호(sessionStorage 'lh_survey_id') */
export function submittedIdOf(memory: string, tabStored: string | null | undefined): string {
  return memory || tabStored || ''
}
