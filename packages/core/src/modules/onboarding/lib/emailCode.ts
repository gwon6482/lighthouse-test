// 메일 확인 코드(가입 확인·비밀번호 찾기)의 순수 로직 — 2026-11-22 시안 2판(정할 것 1~9 권장대로).
// 규칙(10분·5번·1분 뒤 다시 보내기)의 정본은 서버다. 앱은 서버 응답(resendAfter·left)을 그대로 보여 준다.

/**
 * 새로 정하는 비밀번호 규칙(가입·비밀번호 다시 정하기) — 8~64자 + 영문(A~Z·a~z) 1자 + 숫자(0~9) 1자 이상(2026-11-23 핫픽스, 오너).
 * 정본은 서버(lighthouse-api services/emailFlow.js passwordError)다 — 앱은 칸 아래 조건 줄과 버튼에만 쓰고, 서버가 다시 본다.
 * 이미 쓰는 비밀번호(6~7자·숫자만 등)로 하는 로그인은 이 규칙과 관계없이 그대로 된다.
 */
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

export interface PasswordChecks {
  /** 8자 이상 */
  length: boolean
  /** 영문(A~Z·a~z) 포함 */
  letter: boolean
  /** 숫자(0~9) 포함 */
  digit: boolean
}

/** 칸 아래 조건 줄 — 세 조건이 각각 채워졌는지 */
export function passwordChecks(pw: string): PasswordChecks {
  const s = String(pw ?? '')
  return { length: s.length >= NEW_PASSWORD_MIN, letter: /[A-Za-z]/.test(s), digit: /[0-9]/.test(s) }
}

/** 조건 줄에 보일 이름(순서대로) */
export const PASSWORD_CHECK_LABELS: ReadonlyArray<[keyof PasswordChecks, string]> = [
  ['length', `${NEW_PASSWORD_MIN}자 이상`],
  ['letter', '영문 포함'],
  ['digit', '숫자 포함'],
]

/** 너무 긴가 — 서버와 같이 64자 또는 72바이트(bcrypt 가 뒤를 버리는 길이)를 넘으면 */
export function passwordTooLong(pw: string): boolean {
  const s = String(pw ?? '')
  return s.length > NEW_PASSWORD_MAX || new TextEncoder().encode(s).length > 72
}

/** 새 비밀번호 한 칸 확인. 문제가 없으면 null(서버 passwordError 와 같은 판정) */
export function passwordError(pw: string): string | null {
  if (passwordTooLong(pw)) return `비밀번호는 ${NEW_PASSWORD_MAX}자 이하로 적어 주세요.`
  const c = passwordChecks(pw)
  if (!c.length || !c.letter || !c.digit) return `비밀번호는 ${NEW_PASSWORD_MIN}자 이상, 영문과 숫자를 함께 써야 해요.`
  return null
}

/** 비밀번호 확인 칸 아래 '두 비밀번호가 같지 않아요'를 보일 때 — 둘 다 적었고 다를 때.
 *  확인 칸을 아직 적는 중(처음 칸의 앞부분과 같음)이면 기다린다 — 한 글자마다 경고가 깜빡이지 않게. 칸을 떠났으면(blurred) 바로 */
export function showMismatch(pw: string, confirm: string, blurred = false): boolean {
  if (!pw || !confirm || pw === confirm) return false
  if (!blurred && confirm.length < pw.length && pw.startsWith(confirm)) return false
  return true
}

/** 새 비밀번호 두 칸 확인. 문제가 없으면 null */
export function newPasswordError(pw: string, confirm: string): string | null {
  const e = passwordError(pw)
  if (e) return e
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
