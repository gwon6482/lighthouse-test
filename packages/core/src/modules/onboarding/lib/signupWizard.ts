// 가입 위저드(SignupWizardPage)의 순수 로직 — 질문 보기, 단계 완료 판정, 입력 임시 보관(2026-11-17).
//
// 임시 보관: 브라우저 뒤로·앞으로·새로고침 때 위저드가 처음부터 다시 시작하고 입력이 사라졌다(가입 흐름 시험 E3·E4, 2026-11-17).
//   - 이 탭의 sessionStorage 에만 둔다. 탭을 닫으면 브라우저가 지우고, 서버로는 보내지 않는다.
//   - ⚠️ 비밀번호(두 칸)는 넣지 않는다. 그래서 이메일 가입은 계정 단계(0)부터 다시 시작한다 — 나머지 칸은 채워 둔다.
//     (따로 고르지 않아도 resumeStep 이 비밀번호가 빈 0단계에서 멈춘다)
//   - ⚠️ 동의(약관·처리방침·만 14세 체크)도 넣지 않는다(총괄 검토 2026-11-17). 동의는 본인이 그 자리에서 직접 체크해야 한다 —
//     미리 체크된 동의는 적법한 동의로 보기 어렵고, 이메일 가입은 계정에 묶을 수 없어 공용 기기에서 남의 체크가 보일 수 있다.
//     그래서 소셜도 동의 단계(2) 뒤에서 이어가려 해도 resumeStep 이 동의가 빈 2단계에서 멈춘다.
//   - 소셜 가입은 **같은 계정(uid)일 때만** 되살린다. 같은 탭에서 다른 계정으로 들어와도 앞사람 입력이 보이지 않게.
//   - 가입을 마치거나 첫 단계 '뒤로'로 그만두면 지운다. 1시간이 지난 것은 쓰지 않는다.
// 저장소는 인자로 받는다(테스트). 실제 연결은 SignupWizardPage 가 한다.

import { passwordError } from './emailCode'

// ── 질문 보기 ─────────────────────────────────────────────
// 값은 서버 User.onboarding(status·concerns·selfAwareness)에 그대로 저장된다 — 바꾸면 어드민 '가입 설문' 화면도 함께 본다.
export const Q1 = [
  { value: 1, label: '중·고등학생이에요.' },
  { value: 2, label: '대학생(휴학 포함)이에요.' },
  { value: 3, label: '취업을 준비하고 있어요.' },
  { value: 4, label: '일하고 있지만 진로를 다시 고민 중이에요.' },
]

export const Q2 = [
  { value: 1, label: '내가 무엇을 좋아하고 잘하는지 모르겠어요.' },
  { value: 2, label: '내가 선택할 수 있는 진로 분야에 어떤 것들이 있는지 잘 모르겠어요.' },
  { value: 3, label: '관심 있는 분야는 있지만, 진로로 정해도 될지 모르겠어요.' },
  { value: 4, label: '목표하는 진로는 있지만, 무엇부터 준비해야 할지 모르겠어요.' },
  { value: 5, label: '목표를 향해 노력 중이지만, 맞는 방법인지 확신이 없어요.' },
  { value: 6, label: '아직 잘 모르겠어요.' },
]
export const Q2_NONE = 6 // "아직 잘 모르겠어요" — 단독 선택

export const Q3 = [
  { value: 1, label: '내가 무엇을 잘하고 좋아하는지 잘 알고 있어요.' },
  { value: 2, label: '조금 알고 있어요.' },
  { value: 3, label: '거의 모르는 것 같아요.' },
]

// ── 입력 ─────────────────────────────────────────────────
// 단계: 0 계정(이메일·비밀번호) · 1 이름 · 2 나이·성별·동의 · 3 Q1 · 4 Q2 · 5 Q3
export const SIGNUP_STEPS = 6

export interface SignupForm {
  email: string
  password: string
  passwordConfirm: string
  name: string
  age: number | null
  agreed: boolean // 약관·처리방침 동의 + 만 14세 이상 확인(필수)
  gender: '' | 'M' | 'F'
  q1: number | null
  q2: number[]
  q3: number | null
}

export function emptySignupForm(): SignupForm {
  return { email: '', password: '', passwordConfirm: '', name: '', age: null, agreed: false, gender: '', q1: null, q2: [], q3: null }
}

/** 이 단계를 다 채웠는가('다음'을 켤 수 있는가) */
export function isStepComplete(step: number, f: SignupForm): boolean {
  switch (step) {
    case 0: return !!f.email && passwordError(f.password) === null && f.password === f.passwordConfirm   // 새 비밀번호 규칙 하나(2026-11-23)
    case 1: return f.name.trim().length > 0
    case 2: return !!f.age && f.age >= 14 && !!f.gender && f.agreed
    case 3: return f.q1 !== null
    case 4: return f.q2.length > 0
    case 5: return f.q3 !== null
    default: return false
  }
}

/**
 * 되살린 입력으로 어느 단계에서 이어갈지 — 보관된 단계까지 가되, 그 앞에 못 채운 단계가 있으면 거기서 멈춘다.
 * 이메일 가입은 비밀번호를 보관하지 않으므로 늘 0단계, 소셜은 동의를 보관하지 않으므로 동의 단계(2)를 넘지 않는다.
 */
export function resumeStep(saved: number, first: number, f: SignupForm): number {
  const target = Number.isInteger(saved) ? Math.min(Math.max(saved, first), SIGNUP_STEPS - 1) : first
  let s = first
  while (s < target && isStepComplete(s, f)) s++
  return s
}

// ── 임시 보관 ─────────────────────────────────────────────
export const SIGNUP_DRAFT_KEY = 'lh_signup_draft'
export const SIGNUP_DRAFT_TTL_MS = 60 * 60 * 1000
const CLOCK_SKEW_MS = 60 * 1000

export type SignupMode = 'email' | 'social'

/** 보관하는 칸 — 비밀번호 두 칸과 동의는 뺀다 */
export type SignupDraftFields = Omit<SignupForm, 'password' | 'passwordConfirm' | 'agreed'>

export interface SignupDraft {
  step: number
  fields: SignupDraftFields
}

interface StoredDraft extends SignupDraft {
  v: 1
  mode: SignupMode
  uid: string | null
  at: number
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const Q1_VALUES = Q1.map((o) => o.value)
const Q2_VALUES = Q2.map((o) => o.value)
const Q3_VALUES = Q3.map((o) => o.value)

const pickOne = (v: unknown, allowed: number[]): number | null =>
  typeof v === 'number' && allowed.includes(v) ? v : null

function pickMany(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  const valid = [...new Set(v.filter((x): x is number => typeof x === 'number' && Q2_VALUES.includes(x)))]
  // '아직 잘 모르겠어요'는 혼자만 고를 수 있다(화면의 toggleQ2 와 같은 규칙)
  return valid.includes(Q2_NONE) && valid.length > 1 ? valid.filter((x) => x !== Q2_NONE) : valid
}

/** 보관할 칸만 골라 정리한다(비밀번호·동의는 넣지도 꺼내지도 않는다). 나이 칸을 비우면 v-model.number 가 '' 를 주므로 숫자가 아니면 null */
function toFields(f: SignupForm | SignupDraftFields | Record<string, unknown>): SignupDraftFields {
  const r = f as Record<string, unknown>
  return {
    email: typeof r.email === 'string' ? r.email : '',
    name: typeof r.name === 'string' ? r.name : '',
    age: typeof r.age === 'number' && Number.isFinite(r.age) ? r.age : null,
    gender: r.gender === 'M' || r.gender === 'F' ? r.gender : '',
    q1: pickOne(r.q1, Q1_VALUES),
    q2: pickMany(r.q2),
    q3: pickOne(r.q3, Q3_VALUES),
  }
}

/** 지금 입력을 보관한다. 소셜인데 계정을 모르면(연결 끊김) 남기지 않는다 — 누구의 입력인지 모르는 것으로 같은 계정의 보관분을 덮지 않게 */
export function saveSignupDraft(
  storage: DraftStorage,
  d: { mode: SignupMode; uid: string | null; step: number; form: SignupForm },
  now: number,
): void {
  if (d.mode === 'social' && !d.uid) return
  const body: StoredDraft = {
    v: 1,
    mode: d.mode,
    uid: d.mode === 'social' ? d.uid : null,
    step: d.step,
    at: now,
    fields: toFields(d.form),
  }
  try {
    storage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(body))
  } catch { /* 저장 불가(용량·개인정보 보호 모드) — 보관 없이 진행 */ }
}

export function clearSignupDraft(storage: DraftStorage): void {
  try {
    storage.removeItem(SIGNUP_DRAFT_KEY)
  } catch { /* noop */ }
}

/**
 * 이 위저드가 이어 쓸 보관분 — 없거나, 다른 방식(이메일↔소셜)이거나, 다른 계정이거나, 오래됐으면 null.
 * 다른 계정의 것과 오래된 것은 그 자리에서 지운다.
 */
export function loadSignupDraft(
  storage: DraftStorage,
  want: { mode: SignupMode; uid: string | null },
  now: number,
): SignupDraft | null {
  let raw: unknown
  try {
    raw = JSON.parse(storage.getItem(SIGNUP_DRAFT_KEY) ?? 'null')
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Partial<StoredDraft>
  if (d.v !== 1 || (d.mode !== 'email' && d.mode !== 'social')) return null
  if (typeof d.at !== 'number' || !Number.isInteger(d.step) || !d.fields || typeof d.fields !== 'object') return null
  if (d.mode !== want.mode) return null
  if (d.mode === 'social') {
    if (!want.uid) return null // 계정을 모르면 판단하지 않는다(지우지도 않는다)
    if (d.uid !== want.uid) {
      clearSignupDraft(storage)
      return null
    }
  }
  if (now - d.at > SIGNUP_DRAFT_TTL_MS || d.at - now > CLOCK_SKEW_MS) {
    clearSignupDraft(storage)
    return null
  }
  return { step: d.step as number, fields: toFields(d.fields) }
}

/**
 * 보관분을 지금 입력 위에 덮는다 — 보관분에 값이 있는 칸만. 소셜은 서버가 먼저 채운 이름·나이가 base 에 있다.
 * 비밀번호·동의는 base 그대로(빈 칸·체크 안 됨) — 다시 직접 넣는다.
 */
export function mergeSignupDraft(base: SignupForm, draft: SignupDraftFields): SignupForm {
  return {
    ...base,
    email: draft.email || base.email,
    name: draft.name.trim() ? draft.name : base.name,
    age: draft.age ?? base.age,
    gender: draft.gender || base.gender,
    q1: draft.q1 ?? base.q1,
    q2: draft.q2.length ? [...draft.q2] : [...base.q2],
    q3: draft.q3 ?? base.q3,
  }
}
