import { describe, it, expect } from 'vitest'
import {
  digitsOnly, countdown, newPasswordError, readCodeCheck, sendErrorMessage,
  passwordChecks, passwordError, passwordTooLong, showMismatch, PASSWORD_CHECK_LABELS,
} from '../lib/emailCode'

describe('메일 확인 코드', () => {
  it('숫자만 6자리', () => {
    expect(digitsOnly('48 29-13 7')).toBe('482913')
    expect(digitsOnly('ab')).toBe('')
  })
  it('남은 시간', () => {
    expect(countdown(42)).toBe('0:42')
    expect(countdown(60)).toBe('1:00')
    expect(countdown(-3)).toBe('0:00')
  })
  it('새 비밀번호 — 8자·영문·숫자, 두 칸 같게', () => {
    expect(newPasswordError('abc1234', 'abc1234')).toMatch(/8자 이상/)
    expect(newPasswordError('12345678', '12345678')).toMatch(/영문과 숫자/)   // 숫자만 — 예전엔 통과
    expect(newPasswordError('abcd1234', 'abcd1235')).toBe('두 비밀번호가 같지 않아요.')
    expect(newPasswordError('abcd1234', 'abcd1234')).toBeNull()
  })
  it('조건 줄 — 세 조건이 따로 채워진다', () => {
    expect(PASSWORD_CHECK_LABELS.map(([, l]) => l)).toEqual(['8자 이상', '영문 포함', '숫자 포함'])
    expect(passwordChecks('')).toEqual({ length: false, letter: false, digit: false })
    expect(passwordChecks('a')).toEqual({ length: false, letter: true, digit: false })
    expect(passwordChecks('12345678')).toEqual({ length: true, letter: false, digit: true })
    expect(passwordChecks('Abcdefgh')).toEqual({ length: true, letter: true, digit: false })
    expect(passwordChecks('한글한글한글한글1')).toEqual({ length: true, letter: false, digit: true })   // 한글은 영문이 아니다
    expect(passwordChecks('abcdefg１')).toMatchObject({ digit: false })   // 전각 숫자는 숫자가 아니다(서버와 같게)
  })
  it('규칙 판정은 서버(emailFlow.passwordError)와 같다 — 통과/막힘 표', () => {
    const pass = ['abcd1234', 'ABCD1234', 'a1!!!!!!', 'ab cd 12', 'a'.repeat(63) + '1']
    const fail = ['abc1234', '12345678', 'abcdefgh', '한글비밀번호1234', 'abcdefg１', 'a'.repeat(64) + '1', '가'.repeat(30) + 'a1', '']
    for (const p of pass) expect(passwordError(p), p).toBeNull()
    for (const p of fail) expect(passwordError(p), p).not.toBeNull()
    expect(passwordTooLong('a'.repeat(64))).toBe(false)
    expect(passwordTooLong('가'.repeat(25))).toBe(true)   // 75바이트
  })
  it('경계 — 공백·이모지·72바이트(서버와 같은 판정)', () => {
    expect(passwordError('        a1')).toBeNull()                 // 공백도 글자로 센다
    expect(passwordError('ab cd 12')).toBeNull()
    expect(passwordChecks('       1').length).toBe(true)            // 공백 7 + 숫자 = 8자(영문은 없음)
    expect(passwordError('😀😀😀a1')).toBeNull()                    // 이모지는 2글자(UTF-16)로 센다 — 서버(JS length)와 같다
    expect(passwordChecks('😀😀😀1').length).toBe(false)              // 7글자
    expect(passwordError('a1' + 'x'.repeat(70))).toBe('비밀번호는 64자 이하로 적어 주세요.')   // 72자 — 글자 수에서 걸림
    expect(passwordError('a1' + '가'.repeat(23))).toBeNull()         // 2 + 69 = 71바이트
    expect(passwordError('a1' + '가'.repeat(23) + 'b')).toBeNull()   // 72바이트 — 딱 맞음
    expect(passwordError('a1' + '가'.repeat(24))).toBe('비밀번호는 64자 이하로 적어 주세요.')   // 74바이트(26자) — 한계: 글은 '64자'로 같다
    expect(passwordTooLong('😀'.repeat(18))).toBe(false)             // 72바이트
    expect(passwordTooLong('😀'.repeat(18) + 'a')).toBe(true)        // 73바이트
  })
  it('확인 칸 — 둘 다 적었고 다를 때만, 적는 중(앞부분이 같음)에는 기다린다', () => {
    expect(showMismatch('', 'a')).toBe(false)
    expect(showMismatch('abcd1234', '')).toBe(false)
    expect(showMismatch('abcd1234', 'abcd1234')).toBe(false)
    expect(showMismatch('abcd1234', 'abcd')).toBe(false)        // 아직 적는 중
    expect(showMismatch('abcd1234', 'abcd', true)).toBe(true)   // 칸을 떠났다
    expect(showMismatch('abcd1234', 'abce')).toBe(true)         // 이미 다르다
    expect(showMismatch('abcd1234', 'abcd12345')).toBe(true)    // 더 길다
  })
  it('코드 확인 응답', () => {
    expect(readCodeCheck(200, { ticket: 't' })).toEqual({ ok: true, ticket: 't' })
    expect(readCodeCheck(400, { code: 'wrong', left: 4 })).toMatchObject({ kind: 'wrong', message: '코드가 맞지 않아요. 4번 더 적을 수 있어요.' })
    expect(readCodeCheck(410, { code: 'expired' })).toMatchObject({ kind: 'expired' })
  })
  it('보내기 실패 글', () => {
    expect(sendErrorMessage(502, {})).toBe('메일을 보내지 못했어요. 잠시 뒤 다시 보내 주세요.')
    expect(sendErrorMessage(undefined, undefined)).toBe('메일을 보내지 못했어요. 잠시 뒤 다시 보내 주세요.')
    expect(sendErrorMessage(400, { error: '이 메일 주소로는 보낼 수 없어요. 다른 주소를 적어 주세요.' })).toMatch(/보낼 수 없어요/)
  })
})
