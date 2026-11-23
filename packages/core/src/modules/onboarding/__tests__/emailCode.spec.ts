import { describe, it, expect } from 'vitest'
import { digitsOnly, countdown, newPasswordError, readCodeCheck, sendErrorMessage } from '../lib/emailCode'

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
  it('새 비밀번호 — 8자 이상, 두 칸 같게', () => {
    expect(newPasswordError('1234567', '1234567')).toMatch(/8자 이상/)
    expect(newPasswordError('12345678', '12345679')).toMatch(/같지 않아요/)
    expect(newPasswordError('12345678', '12345678')).toBeNull()
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
