import { describe, it, expect } from 'vitest'
import { groupForJob, jobCodesOfGroups, unfoldJob } from '../lib/myJobGroups'
import type { JobGroupRecommend } from '@/modules/survey/types/survey'

const detail = { T1: 0, T21: 0, T22: 0, T23: 0, T3: 0 }
const groups = [
  { code: '023', name: '컴퓨터시스템', fullName: '', match_detail: detail, reasons: [], jobCount: 2,
    jobs: [{ jobCode: '132002', title: '컴퓨터시스템설계 및 분석가' }, { jobCode: '132004', title: '정보통신컨설턴트 및 감리원' }] },
  { code: '026', name: '데이터·정보시스템·웹 운영', fullName: '', match_detail: detail, reasons: [], jobCount: 4,
    jobs: [{ jobCode: '134303', title: 'IT기술지원전문가' },
      { jobCode: '900001', title: '묶음', members: [{ jobCode: '900001', title: '가' }, { jobCode: '900002', title: '나' }, { jobCode: '900003', title: '다' }] }] },
] as unknown as JobGroupRecommend[]

describe('내 추천 직무 3가지로 배지 판정', () => {
  it('직무에 든 직업이면 그 직무', () => {
    expect(groupForJob(groups, '132004')?.name).toBe('컴퓨터시스템')
    expect(groupForJob(groups, '134303')?.code).toBe('026')
  })
  it('묶음 직업은 풀어서 — 구성원 누구든 배지', () => {
    expect(groupForJob(groups, '900003')?.code).toBe('026')
    expect(unfoldJob(groups[1]!.jobs[1]!)).toEqual(['900001', '900002', '900003'])
  })
  it('없거나 자료가 없으면 null', () => {
    expect(groupForJob(groups, '832101')).toBeNull()
    expect(groupForJob([], '132002')).toBeNull()
    expect(groupForJob(null, '132002')).toBeNull()
    expect(groupForJob(groups, undefined)).toBeNull()
  })
  it('직무 3가지의 직업 코드 전부(겹침 없이)', () => {
    expect(jobCodesOfGroups(groups)).toEqual(['132002', '132004', '134303', '900001', '900002', '900003'])
  })
})

import { hasMoreJobs, targetLine } from '../lib/myJobGroups'

describe("'모두 보기' — 풀어 센 직업 수가 보여 준 대표 직업보다 많을 때", () => {
  const job = (c: string, n = 0) => ({ jobCode: c, title: c, ...(n ? { members: Array.from({ length: n }, (_, i) => ({ jobCode: `${c}-${i}`, title: '' })) } : {}) })
  it('자리 셋에 직업 셋이면 없음', () => {
    expect(hasMoreJobs({ jobs: [job('a'), job('b'), job('c')], jobCount: 3 })).toBe(false)
  })
  it('자리가 넷 이상이면 있음', () => {
    expect(hasMoreJobs({ jobs: [job('a'), job('b'), job('c'), job('d')], jobCount: 4 })).toBe(true)
  })
  it('자리는 둘이지만 묶음 하나가 여러 직업이면 — 보여 준 것보다 많지 않으면 없음', () => {
    expect(hasMoreJobs({ jobs: [job('a'), job('g', 4)], jobCount: 5 })).toBe(false)
  })
  it('넷째 자리가 묶음이라 풀어 센 수가 더 많으면 있음', () => {
    expect(hasMoreJobs({ jobs: [job('a'), job('b'), job('c'), job('g', 3)], jobCount: 6 })).toBe(true)
  })
})

describe('목표 한 줄', () => {
  it('직업 목표', () => {
    expect(targetLine({ refType: 'jobCode', ref: '011201', title: '기업고위임원' })).toEqual({ title: '기업고위임원', jobCode: '011201' })
  })
  it('직업 자료가 없어져 이름 대신 코드가 오면 감춘다', () => {
    expect(targetLine({ refType: 'jobCode', ref: '011201', title: '011201' })).toBeNull()
    expect(targetLine({ refType: 'jobCode', ref: '011201', title: null })).toBeNull()
  })
  it('직접 적은 목표는 이름만', () => {
    expect(targetLine({ refType: 'custom', ref: '신입 마케터', title: null })).toEqual({ title: '신입 마케터', jobCode: null })
  })
  it('없음', () => {
    expect(targetLine(null)).toBeNull()
  })
})
