import { describe, expect, it } from 'vitest'
import {
  MAX_CONDITIONS, canAddCondition, canUseAxis, conditionCount, emptyState, formatManwon, groupDepth, isGroupList,
  nextAxisToAdd, paramsFromState, queryFromState, stateFromQuery, withAxis, withoutCondition,
} from '../lib/browseQuery'
import { myBrowseStart } from '../lib/browseMyStart'
import type { SurveyAnalysisResponse } from '@/modules/survey/types/survey'

describe('분류로 찾기 — 주소 ↔ 상태', () => {
  it('쉼표·배열·중복을 정리하고 같은 꼴로 되돌린다', () => {
    const s = stateFromQuery({ interest: 'T22_TEC_2,T22_TEC_6', env: ['sit', 'remote,sit'], talent: '', sort: 'interest' })
    expect(s.interest).toEqual(['T22_TEC_2', 'T22_TEC_6'])
    expect(s.env).toEqual(['sit', 'remote'])
    expect(s.talent).toEqual([])
    expect(paramsFromState(s)).toEqual({ interest: 'T22_TEC_2,T22_TEC_6', env: 'sit,remote' })
    expect(queryFromState(s, { sort: 'interest' })).toEqual({ interest: 'T22_TEC_2,T22_TEC_6', env: 'sit,remote', sort: 'interest' })
  })
})

describe('조건 수 — 분류 하나가 조건 하나, 업무 환경은 보기 하나가 조건 하나', () => {
  it('3개까지', () => {
    const s = withAxis(withAxis(emptyState(), 'interest', ['T22_TEC_2', 'T22_TEC_6']), 'env', ['remote'])
    expect(conditionCount(s)).toBe(2)            // 관심 분야 둘은 '또는'이라 조건 하나
    expect(canAddCondition(s)).toBe(true)
    const full = withAxis(s, 'salary', ['5000'])
    expect(conditionCount(full)).toBe(MAX_CONDITIONS)
    expect(canAddCondition(full)).toBe(false)
    expect(canUseAxis(full, 'talent')).toBe(false)   // 새 분류는 못 더한다
    expect(canUseAxis(full, 'interest')).toBe(true)  // 이미 쓰는 분류는 고칠 수 있다
  })
  it('조건 하나 빼기 — 서버 조건 id 로', () => {
    const s = stateFromQuery({ interest: 'T22_SOC_4', env: 'remote,no-hazard', salary: '6000' })
    expect(withoutCondition(s, 'env:remote').env).toEqual(['no-hazard'])
    expect(withoutCondition(s, 'salary').salary).toEqual([])
    expect(withoutCondition(s, 'interest').interest).toEqual([])
    expect(withoutCondition(s, 'nothing')).toEqual(s)
  })
})

describe('직무 — 다른 조건과 섞을 때는 대분류까지만', () => {
  it('다른 조건이 없으면 직무까지, 있으면 대분류까지', () => {
    expect(groupDepth(emptyState())).toBe('group')
    expect(groupDepth(stateFromQuery({ group: '02' }))).toBe('group')     // 직무 칸 자기 자신은 세지 않는다
    expect(groupDepth(stateFromQuery({ interest: 'T22_TEC_2' }))).toBe('top')
  })
  it('직무(3자리) 목록은 조건을 더하지 않는다', () => {
    expect(isGroupList(stateFromQuery({ group: '024' }))).toBe(true)
    expect(isGroupList(stateFromQuery({ group: '02' }))).toBe(false)
  })
  it('다음에 더할 분류 — 안 쓴 것 가운데 입구 순서, 직무는 맨 끝', () => {
    expect(nextAxisToAdd(stateFromQuery({ interest: 'T22_TEC_2' }))).toBe('env')
    expect(nextAxisToAdd(stateFromQuery({ group: '02' }))).toBe('interest')
  })
})

it('연봉 표기', () => {
  expect(formatManwon(8100)).toBe('8,100만 원')
})

type Analysis = SurveyAnalysisResponse['analysis']
const analysis = (over: Partial<Analysis>) => ({
  interest: { total: 0, by_category: {} },
  talent: { top3: [], all: [] },
  ...over,
}) as unknown as Analysis

describe("'내 검사 결과로 찾기'", () => {
  it('관심 분야 = 고른 분야가 가장 많은 묶음의 분야들, 재능 = 점수 첫째', () => {
    const r = myBrowseStart(analysis({
      interest: {
        total: 3,
        by_category: {
          TEC: { name: '기술·공학', items: [{ field_id: 'T22_TEC_2', name: '컴퓨터와 전자공학' }, { field_id: 'T22_TEC_6', name: '디자인' }] },
          SOC: { name: '사회·인문', items: [{ field_id: 'T22_SOC_4', name: '예술' }] },
        },
      } as unknown as Analysis['interest'],
      talent: { top3: [], all: [{ code: 'M', name: '논리수학', score: 0.8 }, { code: 'L', name: '언어', score: 0.6 }] } as unknown as Analysis['talent'],
    }))
    expect(r?.state.interest).toEqual(['T22_TEC_2', 'T22_TEC_6'])
    expect(r?.interestName).toBe('기술·공학')
    expect(r?.state.talent).toEqual(['M'])
  })
  it('재능 1위가 자기성찰이면 2위를 쓴다(분류로 찾기에서 뺐다)', () => {
    const r = myBrowseStart(analysis({
      talent: { top3: [], all: [{ code: 'N', name: '자기성찰', score: 0.9 }, { code: 'I', name: '대인관계', score: 0.7 }] } as unknown as Analysis['talent'],
    }))
    expect(r?.state.talent).toEqual(['I'])
    expect(r?.state.interest).toEqual([])
  })
  it('채울 것이 없으면 null', () => {
    expect(myBrowseStart(analysis({}))).toBeNull()
    expect(myBrowseStart(null)).toBeNull()
  })
})
