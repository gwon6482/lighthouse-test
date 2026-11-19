import { describe, expect, it } from 'vitest'
import {
  MAX_CONDITIONS, axisName, canAddCondition, canUseAxis, chipAriaLabel, chipPieces, conditionCount, emptyState, formatManwon,
  groupNear, listQuery, missLine, nextAxisToAdd, nextOrder, orderFromQuery, paramsFromState, stateFromQuery, withAxis, withoutCondition,
} from '../lib/browseQuery'
import { myBrowseStart } from '../lib/browseMyStart'
import type { SurveyAnalysisResponse } from '@/modules/survey/types/survey'
import type { BrowseCondition, BrowseRow } from '../types/browse'

describe('분류로 찾기 — 주소 ↔ 상태', () => {
  it('쉼표·배열·중복을 정리하고 같은 꼴로 되돌린다', () => {
    const s = stateFromQuery({ interest: 'T22_TEC_2,T22_TEC_6', env: ['sit', 'remote,sit'], talent: '', sort: 'interest' })
    expect(s.interest).toEqual(['T22_TEC_2', 'T22_TEC_6'])
    expect(s.env).toEqual(['sit', 'remote'])
    expect(s.talent).toEqual([])
    expect(paramsFromState(s)).toEqual({ interest: 'T22_TEC_2,T22_TEC_6', env: 'sit,remote' })
  })
  it('목록 주소 — 탭 순서(order)와 정렬 기준(sort = 들어온 탭)을 함께 싣는다', () => {
    const s = stateFromQuery({ salary: '5000', interest: 'T22_TEC_2' })
    expect(listQuery(s, ['interest'])).toEqual({ interest: 'T22_TEC_2', salary: '5000', order: 'interest,salary', sort: 'interest' })
    expect(listQuery(s, ['interest'], { mine: '1' }).mine).toBe('1')
  })
  it('탭 순서 — 빠진 탭은 지우고 새로 쓴 탭은 끝에', () => {
    const s = stateFromQuery({ interest: 'T22_TEC_2', env: 'remote' })
    expect(nextOrder(['salary', 'interest'], s, ['env'])).toEqual(['interest', 'env'])
    expect(orderFromQuery({ order: 'env,bogus,interest,env' })).toEqual(['env', 'interest'])
  })
})

describe('조건 수 — 탭 하나가 조건 하나(업무 환경도 탭 전체가 하나)', () => {
  it('3개까지', () => {
    const s = withAxis(withAxis(emptyState(), 'interest', ['T22_TEC_2', 'T22_TEC_6']), 'env', ['sit', 'remote', 'no-hazard'])
    expect(conditionCount(s)).toBe(2)            // 관심 분야 둘은 '또는', 업무 환경 셋도 한 탭이라 조건 하나
    expect(canAddCondition(s)).toBe(true)
    const full = withAxis(s, 'salary', ['5000'])
    expect(conditionCount(full)).toBe(MAX_CONDITIONS)
    expect(canAddCondition(full)).toBe(false)
    expect(canUseAxis(full, 'talent')).toBe(false)   // 새 탭은 못 더한다
    expect(canUseAxis(full, 'env')).toBe(true)       // 이미 쓰는 탭은 고칠 수 있다
  })
  it('조건 하나 빼기 — 서버 조건 id(탭 이름). 예전 꼴 env:<코드>도 받는다', () => {
    const s = stateFromQuery({ interest: 'T22_SOC_4', env: 'remote,no-hazard', salary: '6000' })
    expect(withoutCondition(s, 'env').env).toEqual([])
    expect(withoutCondition(s, 'env:remote').env).toEqual(['no-hazard'])
    expect(withoutCondition(s, 'salary').salary).toEqual([])
    expect(withoutCondition(s, 'nothing')).toEqual(s)
  })
  it("'조건 더하기'는 아직 안 쓴 첫 탭(탭 순서 — 직무부터)", () => {
    expect(nextAxisToAdd(stateFromQuery({ group: '024' }))).toBe('interest')
    expect(nextAxisToAdd(stateFromQuery({ interest: 'T22_TEC_2' }))).toBe('group')
    expect(nextAxisToAdd(stateFromQuery({ group: '02', interest: 'T22_TEC_2', env: 'sit' }))).toBe('talent')
  })
})

it('연봉 표기 — 1억이 넘으면 억으로', () => {
  expect(formatManwon(8100)).toBe('8,100만 원')
  expect(formatManwon(11500)).toBe('1억 1,500만 원')
  expect(formatManwon(10000)).toBe('1억 원')
  expect(formatManwon(19000)).toBe('1억 9,000만 원')
})

type Analysis = SurveyAnalysisResponse['analysis']
const analysis = (over: Partial<Analysis>) => ({
  interest: { total: 0, by_category: {} },
  talent: { top3: [], all: [] },
  ...over,
}) as unknown as Analysis

describe("'내 검사 결과로 찾기'", () => {
  it('관심 분야 = 고른 분야가 가장 많은 묶음의 분야들, 재능 = 점수 첫째 — 홈 띠에는 채우는 이름 그대로', () => {
    const r = myBrowseStart(analysis({
      interest: {
        total: 3,
        by_category: {
          BUS: { name: '경영·사무', items: [{ field_id: 'T22_BUS_1', name: '경영과 행정' }, { field_id: 'T22_BUS_5', name: '영업과 마케팅' }] },
          SOC: { name: '사회·인문', items: [{ field_id: 'T22_SOC_4', name: '예술' }] },
        },
      } as unknown as Analysis['interest'],
      talent: { top3: [], all: [{ code: 'S', name: '공간 지능', score: 0.8 }, { code: 'L', name: '언어 지능', score: 0.6 }] } as unknown as Analysis['talent'],
    }))
    expect(r?.state.interest).toEqual(['T22_BUS_1', 'T22_BUS_5'])
    expect(r?.state.talent).toEqual(['S'])
    expect(r?.labels).toEqual(['경영과 행정', '영업과 마케팅', '공간 지능'])
  })
  it('재능 1위가 자기성찰이면 2위를 쓴다(분류로 찾기에서 뺐다)', () => {
    const r = myBrowseStart(analysis({
      talent: { top3: [], all: [{ code: 'N', name: '자기성찰 지능', score: 0.9 }, { code: 'I', name: '대인관계 지능', score: 0.7 }] } as unknown as Analysis['talent'],
    }))
    expect(r?.state.talent).toEqual(['I'])
    expect(r?.labels).toEqual(['대인관계 지능'])
  })
  it('채울 것이 없으면 null', () => {
    expect(myBrowseStart(analysis({}))).toBeNull()
    expect(myBrowseStart(null)).toBeNull()
  })
})

describe("분류로 찾기 — '하나만 빼고 맞아요' 묶기(2026-11-19)", () => {
  const cond = (id: string, label: string): BrowseCondition => ({ id, axis: id as BrowseCondition['axis'], codes: [], label })
  const row = (code: string, m: BrowseCondition): BrowseRow => ({ jobCode: code, title: code, group: null, salary: { median: null }, reasons: [], missing: m })
  const sp = cond('talent', '공간 지능')
  const biz = cond('interest', '경영 및 행정 · 영업과 마케팅')
  const near = [row('a', sp), row('b', sp), row('c', biz)]
  it('묶음 수는 자르기 전 전체 수 · 묶음마다 더 볼 수 있다', () => {
    const g = groupNear(near, [{ ...sp, total: 91, shown: 2 }, { ...biz, total: 67, shown: 1 }])
    expect(g.map((x) => [x.id, x.rows.length, x.total, x.canMore])).toEqual([['talent', 2, 91, true], ['interest', 1, 67, true]])
  })
  it('옛 서버(nearGroups 없음)면 받은 줄 수 · 더 보기 없음', () => {
    const g = groupNear(near, undefined)
    expect(g.map((x) => [x.id, x.total, x.canMore])).toEqual([['talent', 2, false], ['interest', 1, false]])
  })
  it('없으면 빈 목록', () => {
    expect(groupNear(undefined, undefined)).toEqual([])
  })
})

describe('분류로 찾기 다듬기 2차(2026-11-19) — 칩 탭 이름 · 또는 · 안 맞아요 한 줄', () => {
  it('탭 이름은 고르기 화면의 탭 이름 그대로 · 칩 버튼 읽는 이름', () => {
    expect(['group', 'interest', 'env', 'talent', 'value', 'salary'].map(axisName)).toEqual(['직무', '관심 분야', '업무 환경', '재능', '가치관', '연봉'])
    expect(axisName('bogus')).toBe('')
    expect(chipAriaLabel({ axis: 'talent', label: '언어 지능' }, '고치기')).toBe('재능: 언어 지능 고치기')
    expect(chipAriaLabel({ axis: 'bogus', label: '언어 지능' }, '지우기')).toBe('언어 지능 지우기')
  })
  it("칩 글 조각 — '또는'·'· 빼기'만 옅게, 글은 서버 그대로", () => {
    const label = '할 일을 스스로 정할 수 있어요 또는 재택근무가 되는 편이에요 · 빼기 주말·공휴일 근무가 잦은 일'
    const p = chipPieces(label)
    expect(p.map((x) => x.text).join('')).toBe(label)
    expect(p.filter((x) => x.faint).map((x) => x.text)).toEqual([' 또는 ', ' · 빼기 '])
    // 옛 서버 글은 한 조각
    expect(chipPieces('재택근무가 되는 편이에요 · 빼기: 주말·공휴일 근무가 잦은 일')).toEqual([{ text: '재택근무가 되는 편이에요 · 빼기: 주말·공휴일 근무가 잦은 일', faint: false }])
  })
  it("'안 맞아요' 한 줄 — 서버 parts 가 있을 때만(옛 서버면 그리지 않는다) · 자료 없음", () => {
    const base = { id: 'env', axis: 'env' as const, codes: ['sit', 'autonomy'], label: '주로 앉아서 일해요 · 할 일을 스스로 정할 수 있어요' }
    expect(missLine(undefined)).toBeNull()
    expect(missLine(base)).toBeNull()
    expect(missLine({ ...base, parts: ['주로 앉아서 일해요', '할 일을 스스로 정할 수 있어요'] })).toEqual({ kind: 'miss', text: '주로 앉아서 일해요 · 할 일을 스스로 정할 수 있어요' })
    expect(missLine({ ...base, parts: [], noData: true })).toEqual({ kind: 'noData', axis: '업무 환경' })
  })
  it('묶음에 탭(axis)을 싣는다 — 제목·다음 묶음 바로가기가 쓴다', () => {
    const r = (code: string, axis: 'env' | 'group'): BrowseRow => ({ jobCode: code, title: code, group: null, salary: { median: null }, reasons: [], missing: { id: axis, axis, codes: [], label: axis } })
    expect(groupNear([r('a', 'env'), r('b', 'group')], undefined).map((g) => g.axis)).toEqual(['env', 'group'])
  })
})
