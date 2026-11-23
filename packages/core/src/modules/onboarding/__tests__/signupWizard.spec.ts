import { describe, expect, it } from 'vitest'
import {
  SIGNUP_DRAFT_KEY, SIGNUP_DRAFT_TTL_MS,
  clearSignupDraft, emptySignupForm, isStepComplete, loadSignupDraft, mergeSignupDraft, resumeStep, saveSignupDraft,
  type SignupForm,
} from '../lib/signupWizard'

// 가입 위저드 입력 임시 보관(2026-11-17) — 브라우저 뒤로·앞으로·새로고침에 입력이 사라지던 문제(가입 흐름 시험 E3·E4)

function memStorage(init: Record<string, string> = {}) {
  const data: Record<string, string> = { ...init }
  return {
    data,
    getItem: (k: string) => (k in data ? data[k]! : null),
    setItem: (k: string, v: string) => { data[k] = v },
    removeItem: (k: string) => { delete data[k] },
  }
}
const brokenStorage = {
  getItem: () => { throw new Error('SecurityError') },
  setItem: () => { throw new Error('QuotaExceededError') },
  removeItem: () => { throw new Error('SecurityError') },
}

const filled = (over: Partial<SignupForm> = {}): SignupForm => ({
  email: 'a@example.com', password: 'secret12', passwordConfirm: 'secret12',
  name: '홍길동', age: 21, agreed: true, gender: 'F', q1: 2, q2: [3, 4], q3: 2, ...over,
})
const NOW = 1_800_000_000_000

describe('isStepComplete — 단계별 다음 버튼', () => {
  it('다 채우면 모든 단계가 통과', () => {
    for (let s = 0; s <= 5; s++) expect(isStepComplete(s, filled())).toBe(true)
  })
  it('비밀번호가 새 규칙(8자·영문·숫자)에 못 미치거나 확인과 다르면 0단계가 막힌다', () => {
    expect(isStepComplete(0, filled({ password: '12345', passwordConfirm: '12345' }))).toBe(false)
    expect(isStepComplete(0, filled({ password: 'secret1', passwordConfirm: 'secret1' }))).toBe(false)     // 7자
    expect(isStepComplete(0, filled({ password: '12345678', passwordConfirm: '12345678' }))).toBe(false)   // 숫자만(예전엔 통과)
    expect(isStepComplete(0, filled({ password: 'secretpw', passwordConfirm: 'secretpw' }))).toBe(false)   // 영문만
    expect(isStepComplete(0, filled({ passwordConfirm: 'secret13' }))).toBe(false)
    expect(isStepComplete(0, filled({ password: '', passwordConfirm: '' }))).toBe(false)
  })
  it('만 14세 미만·성별 없음·동의 안 함이면 2단계가 막힌다', () => {
    expect(isStepComplete(2, filled({ age: 13 }))).toBe(false)
    expect(isStepComplete(2, filled({ age: null }))).toBe(false)
    expect(isStepComplete(2, filled({ gender: '' }))).toBe(false)
    expect(isStepComplete(2, filled({ agreed: false }))).toBe(false)
  })
  it('이름은 공백만이면 안 된다', () => {
    expect(isStepComplete(1, filled({ name: '   ' }))).toBe(false)
  })
  it('질문 단계는 고른 것이 있어야', () => {
    expect(isStepComplete(3, filled({ q1: null }))).toBe(false)
    expect(isStepComplete(4, filled({ q2: [] }))).toBe(false)
    expect(isStepComplete(5, filled({ q3: null }))).toBe(false)
  })
})

describe('resumeStep — 어디서 이어갈지', () => {
  it('이메일 가입은 비밀번호가 없으니 보관한 단계와 상관없이 0단계', () => {
    const f = filled({ password: '', passwordConfirm: '' })
    for (const saved of [0, 3, 5]) expect(resumeStep(saved, 0, f)).toBe(0)
  })
  it('소셜은 보관한 단계에서 이어간다', () => {
    expect(resumeStep(4, 1, filled({ q2: [] }))).toBe(4)
    expect(resumeStep(1, 1, filled())).toBe(1)
  })
  it('앞 단계에 빈 칸이 있으면 거기서 멈춘다', () => {
    expect(resumeStep(5, 1, filled({ q1: null }))).toBe(3)
    expect(resumeStep(5, 1, filled({ agreed: false }))).toBe(2)
  })
  it('범위를 벗어난 단계는 맞춘다', () => {
    expect(resumeStep(0, 1, filled())).toBe(1) // 소셜엔 0단계가 없다
    expect(resumeStep(99, 1, filled())).toBe(5)
    expect(resumeStep(Number.NaN, 1, filled())).toBe(1)
    expect(resumeStep(2.5, 1, filled())).toBe(1)
  })
})

describe('saveSignupDraft · loadSignupDraft — 임시 보관', () => {
  it('비밀번호는 저장하지 않고, 나머지는 되살린다', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'email', uid: null, step: 3, form: filled() }, NOW)
    const raw = s.data[SIGNUP_DRAFT_KEY]!
    expect(raw).not.toContain('secret12')
    expect(raw).not.toMatch(/password/i)
    const d = loadSignupDraft(s, { mode: 'email', uid: null }, NOW + 1000)
    expect(d).toEqual({
      step: 3,
      fields: { email: 'a@example.com', name: '홍길동', age: 21, gender: 'F', q1: 2, q2: [3, 4], q3: 2 },
    })
  })

  it('이메일 가입 되살리기 → 0단계, 나머지 칸은 채워짐(동의는 빈 칸)', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'email', uid: null, step: 4, form: filled() }, NOW)
    const d = loadSignupDraft(s, { mode: 'email', uid: null }, NOW)!
    const form = mergeSignupDraft(emptySignupForm(), d.fields)
    expect(form.password).toBe('')
    expect(form.passwordConfirm).toBe('')
    expect(form.agreed).toBe(false)
    expect(form.email).toBe('a@example.com')
    expect(form.q2).toEqual([3, 4])
    expect(resumeStep(d.step, 0, form)).toBe(0)
  })

  it('동의는 보관하지 않는다', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'email', uid: null, step: 3, form: filled({ agreed: true }) }, NOW)
    saveSignupDraft(s, { mode: 'social', uid: 'u1', step: 3, form: filled({ agreed: true }) }, NOW)
    expect(s.data[SIGNUP_DRAFT_KEY]).not.toMatch(/agreed/)
  })

  it('보관분에 동의가 들어 있어도(예전 모양·손댄 값) 되살리지 않는다', () => {
    const fields = { email: '', name: '홍길동', age: 21, agreed: true, gender: 'F', q1: 2, q2: [3], q3: 2 }
    const s = memStorage({ [SIGNUP_DRAFT_KEY]: JSON.stringify({ v: 1, mode: 'social', uid: 'u1', step: 5, at: NOW, fields }) })
    const d = loadSignupDraft(s, { mode: 'social', uid: 'u1' }, NOW)!
    expect(d.fields).not.toHaveProperty('agreed')
    expect(mergeSignupDraft(emptySignupForm(), { ...d.fields, agreed: true } as never).agreed).toBe(false)
  })

  it('소셜이 동의 단계(2) 뒤에서 이어가려 해도 동의가 비어 있으면 동의 단계에서 멈춘다', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'social', uid: 'u1', step: 5, form: filled({ email: '', agreed: true }) }, NOW)
    const d = loadSignupDraft(s, { mode: 'social', uid: 'u1' }, NOW)!
    const form = mergeSignupDraft({ ...emptySignupForm(), name: '구글사용자' }, d.fields)
    expect(form.agreed).toBe(false)
    expect(resumeStep(d.step, 1, form)).toBe(2)
    // 다시 직접 체크하면 그 뒤 단계는 채워져 있다
    expect(resumeStep(d.step, 1, { ...form, agreed: true })).toBe(5)
  })

  it('소셜은 같은 계정일 때만 되살리고, 다른 계정의 것은 지운다', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'social', uid: 'u1', step: 4, form: filled({ email: '' }) }, NOW)
    expect(loadSignupDraft(s, { mode: 'social', uid: 'u1' }, NOW)?.step).toBe(4)
    expect(loadSignupDraft(s, { mode: 'social', uid: 'u2' }, NOW)).toBeNull()
    expect(s.data[SIGNUP_DRAFT_KEY]).toBeUndefined()
  })

  it('소셜인데 계정을 모르면 저장하지 않고, 읽을 때도 판단하지 않는다(지우지 않음)', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'social', uid: null, step: 3, form: filled() }, NOW)
    expect(s.data[SIGNUP_DRAFT_KEY]).toBeUndefined()
    saveSignupDraft(s, { mode: 'social', uid: 'u1', step: 3, form: filled() }, NOW)
    expect(loadSignupDraft(s, { mode: 'social', uid: null }, NOW)).toBeNull()
    expect(s.data[SIGNUP_DRAFT_KEY]).toBeDefined()
  })

  it('이메일 가입과 소셜 가입은 서로의 보관분을 쓰지 않는다(지우지도 않음)', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'email', uid: null, step: 2, form: filled() }, NOW)
    expect(loadSignupDraft(s, { mode: 'social', uid: 'u1' }, NOW)).toBeNull()
    expect(loadSignupDraft(s, { mode: 'email', uid: null }, NOW)).not.toBeNull()
  })

  it('1시간이 지난 것·시계가 크게 앞선 것은 쓰지 않고 지운다', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'email', uid: null, step: 2, form: filled() }, NOW)
    expect(loadSignupDraft(s, { mode: 'email', uid: null }, NOW + SIGNUP_DRAFT_TTL_MS)).not.toBeNull()
    expect(loadSignupDraft(s, { mode: 'email', uid: null }, NOW + SIGNUP_DRAFT_TTL_MS + 1)).toBeNull()
    expect(s.data[SIGNUP_DRAFT_KEY]).toBeUndefined()

    saveSignupDraft(s, { mode: 'email', uid: null, step: 2, form: filled() }, NOW + 10 * 60_000)
    expect(loadSignupDraft(s, { mode: 'email', uid: null }, NOW)).toBeNull()
  })

  it('깨진 값·다른 판·모양이 틀린 값은 무시한다', () => {
    for (const raw of ['{', 'null', '"x"', '{"v":2,"mode":"email","uid":null,"step":1,"at":0,"fields":{}}',
      JSON.stringify({ v: 1, mode: 'kakao', uid: null, step: 1, at: NOW, fields: {} }),
      JSON.stringify({ v: 1, mode: 'email', uid: null, step: '1', at: NOW, fields: {} }),
      JSON.stringify({ v: 1, mode: 'email', uid: null, step: 1, at: NOW })]) {
      expect(loadSignupDraft(memStorage({ [SIGNUP_DRAFT_KEY]: raw }), { mode: 'email', uid: null }, NOW)).toBeNull()
    }
  })

  it('칸마다 허용된 값만 되살린다(보기에 없는 답·숫자가 아닌 나이 등)', () => {
    const fields = { email: 3, name: null, age: 'abc', agreed: 'yes', gender: 'X', q1: 99, q2: [1, 99, 1, '2'], q3: 0 }
    const s = memStorage({ [SIGNUP_DRAFT_KEY]: JSON.stringify({ v: 1, mode: 'email', uid: null, step: 5, at: NOW, fields }) })
    expect(loadSignupDraft(s, { mode: 'email', uid: null }, NOW)!.fields).toEqual({
      email: '', name: '', age: null, gender: '', q1: null, q2: [1], q3: null,
    })
  })

  it("'아직 잘 모르겠어요'(6)는 다른 답과 같이 되살리지 않는다", () => {
    const at = (q2: unknown) => memStorage({ [SIGNUP_DRAFT_KEY]: JSON.stringify({ v: 1, mode: 'email', uid: null, step: 4, at: NOW, fields: { q2 } }) })
    expect(loadSignupDraft(at([6]), { mode: 'email', uid: null }, NOW)!.fields.q2).toEqual([6])
    expect(loadSignupDraft(at([2, 6]), { mode: 'email', uid: null }, NOW)!.fields.q2).toEqual([2])
  })

  it('나이 칸을 비우면(v-model.number 가 빈 글자를 줌) null 로 저장', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'email', uid: null, step: 2, form: filled({ age: '' as unknown as number }) }, NOW)
    expect(loadSignupDraft(s, { mode: 'email', uid: null }, NOW)!.fields.age).toBeNull()
  })

  it('저장소를 못 쓰는 환경에서도 멈추지 않는다', () => {
    expect(() => saveSignupDraft(brokenStorage, { mode: 'email', uid: null, step: 1, form: filled() }, NOW)).not.toThrow()
    expect(() => clearSignupDraft(brokenStorage)).not.toThrow()
    expect(() => loadSignupDraft(brokenStorage, { mode: 'email', uid: null }, NOW)).not.toThrow()
    expect(loadSignupDraft(brokenStorage, { mode: 'email', uid: null }, NOW)).toBeNull()
  })

  it('지우면 다시 들어와도 빈 위저드', () => {
    const s = memStorage()
    saveSignupDraft(s, { mode: 'email', uid: null, step: 2, form: filled() }, NOW)
    clearSignupDraft(s)
    expect(loadSignupDraft(s, { mode: 'email', uid: null }, NOW)).toBeNull()
  })
})

describe('mergeSignupDraft — 서버가 채운 값 위에 보관분 덮기', () => {
  it('보관분에 값이 있는 칸만 덮는다(소셜: 서버 이름 위에 사용자가 고친 이름)', () => {
    const base = { ...emptySignupForm(), name: '구글사용자' }
    const merged = mergeSignupDraft(base, { email: '', name: '서지', age: 22, gender: 'M', q1: 1, q2: [6], q3: 3 })
    expect(merged).toMatchObject({ name: '서지', age: 22, agreed: false, gender: 'M', q1: 1, q2: [6], q3: 3, password: '', passwordConfirm: '' })
  })
  it('보관분이 비어 있으면 서버 값을 둔다', () => {
    const base = { ...emptySignupForm(), name: '구글사용자', age: 30 }
    const merged = mergeSignupDraft(base, { email: '', name: '  ', age: null, gender: '', q1: null, q2: [], q3: null })
    expect(merged.name).toBe('구글사용자')
    expect(merged.age).toBe(30)
  })
  it('q2 는 새 배열이다(보관분 배열을 그대로 물지 않는다)', () => {
    const fields = { email: '', name: '', age: null, gender: '' as const, q1: null, q2: [1, 2], q3: null }
    const merged = mergeSignupDraft(emptySignupForm(), fields)
    expect(merged.q2).toEqual([1, 2])
    expect(merged.q2).not.toBe(fields.q2)
  })
})
