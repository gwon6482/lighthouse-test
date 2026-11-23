// 메일 확인 코드(가입 확인·비밀번호 찾기)의 순수 로직 — 2026-11-22 시안 2판(정할 것 1~9 권장대로).
// 규칙(10분·5번·1분 뒤 다시 보내기)의 정본은 서버다. 앱은 서버 응답(resendAfter·left)을 그대로 보여 준다.

/** 새로 정하는 비밀번호의 최소 길이(서버와 같다). 이미 쓰는 6~7자 비밀번호로는 로그인이 그대로 된다 */
export const NEW_PASSWORD_MIN = 8
export const NEW_PASSWORD_MAX = 64
export const CODE_LENGTH = 6

/** 붙여넣기·자동 채우기에서 숫자만 6자리까지 */
export function digitsOnly(s: string): string {
  return String(s ?? '').replace(/\D/g, '').slice(0, CODE_LENGTH)
}

/** 다시 보내기까지 남은 시간 '0:42' */
export function countdown(sec: number): string {
  const s = Math.max(0, Math.ceil(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** 새 비밀번호 두 칸 확인. 문제가 없으면 null */
export function newPasswordError(pw: string, confirm: string): string | null {
  if (pw.length < NEW_PASSWORD_MIN) return `비밀번호는 ${NEW_PASSWORD_MIN}자 이상이어야 해요.`
  if (pw.length > NEW_PASSWORD_MAX) return `비밀번호는 ${NEW_PASSWORD_MAX}자 이하로 적어 주세요.`
  if (pw !== confirm) return '두 비밀번호가 같지 않아요.'
  return null
}

export type CodeCheckResult =
  | { ok: true; ticket: string }
  | { ok: false; kind: 'wrong'; message: string }
  | { ok: false; kind: 'expired'; message: string }
  | { ok: false; kind: 'other'; message: string }

/** 코드 확인 응답(성공·실패)을 화면에 쓸 꼴로 */
export function readCodeCheck(status: number, body: any): CodeCheckResult {
  if (status === 200 && typeof body?.ticket === 'string') return { ok: true, ticket: body.ticket }
  if (body?.code === 'wrong') {
    const left = Number(body.left)
    return { ok: false, kind: 'wrong', message: Number.isFinite(left) ? `코드가 맞지 않아요. ${left}번 더 적을 수 있어요.` : '코드가 맞지 않아요.' }
  }
  if (body?.code === 'expired' || status === 410) return { ok: false, kind: 'expired', message: '이 코드는 더 쓸 수 없어요. 새 코드를 받아 주세요.' }
  if (status === 429) return { ok: false, kind: 'other', message: '요청이 너무 많아요. 잠시 뒤 다시 해 주세요.' }
  return { ok: false, kind: 'other', message: body?.error ?? '확인하지 못했어요. 잠시 뒤 다시 해 주세요.' }
}

/** 코드 보내기 실패 글(가입). 응답이 없으면 연결 문제 */
export function sendErrorMessage(status: number | undefined, body: any): string {
  if (status === 429 && body?.code === 'too_soon') return '잠시 뒤 다시 보내 주세요.'
  if (status === 429) return body?.error ?? '이 메일로 너무 많이 보냈어요. 한 시간 뒤 다시 해 주세요.'
  if (status === 502 || status === undefined) return '메일을 보내지 못했어요. 잠시 뒤 다시 보내 주세요.'
  return body?.error ?? '메일을 보내지 못했어요. 잠시 뒤 다시 보내 주세요.'
}
