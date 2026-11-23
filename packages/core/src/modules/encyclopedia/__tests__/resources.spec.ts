import { describe, expect, it } from 'vitest'
import { costAmountLine, costBasisLine, examLinksOf, resourcesOf } from '../lib/preparation'
import { helperExampleToProject, projectToExample } from '@/modules/career-design/composables/useHelperExamples'
import type { JobPreparation, PrepCost, PrepItem, PrepLink, PrepProject } from '../types/encyclopedia'

// 공식 안내·응시료(2026-11-23 진로설계 보완 ⑧) — API 브랜치 data/job-resources 의 응답 모양(shapeLinks·shapeCost)
const qnet: PrepLink = { name: '큐넷(한국산업인력공단)', url: 'https://www.q-net.or.kr/crf005.do?jmCd=1320', what: '정보처리기사 시험 안내', kind: 'exam' }
const kmooc: PrepLink = { name: 'K-MOOC(국가평생교육진흥원)', url: 'https://www.kmooc.kr/', what: '온라인 공개 강좌', kind: 'free-lecture' }
const kuksiwon: PrepLink = { name: '한국보건의료인국가시험원', url: 'https://www.kuksiwon.or.kr/x', what: '간호사 시험 안내', kind: 'exam' }
const written: PrepCost = { lines: [{ label: '응시료(필기)', amount: 19400 }], unit: '원', of: '2026년 큐넷 안내 기준', basis: 'official', source: '큐넷', at: '2026-11-23' }
const nurse: PrepCost = { lines: [{ label: '응시료', amount: 90000 }], unit: '원', of: '2027년 1월 시험 기준', basis: 'official', source: '국시원', at: '2026-11-23' }

const project = (over: Partial<PrepProject> = {}): PrepProject => ({
  id: 'cp.exam', name: '국가시험', type: 'cert', typeName: '자격', subtype: null, subtypeName: null,
  category: 'qualification', method: 'book', level: '입문', daysPerWeek: 5, minutesPerSession: 120,
  goal: '', phases: [{ weeks: 4, title: '기출', items: ['가'] }], weeks: 4, scope: 'all', basis: null, ...over,
})
const item = (over: Partial<PrepItem> = {}): PrepItem => ({ ref: 'cp.exam', step: 1, major: true, optional: false, fromTrack: false, ...over })

describe('공식 안내·응시료 고르기', () => {
  it('옛 서버(칸 없음)면 아무것도 없다 — 화면은 지금과 같다', () => {
    expect(resourcesOf(item(), project())).toEqual({ links: [], cost: null })
  })
  it('프로젝트 값을 쓴다', () => {
    expect(resourcesOf(item(), project({ links: [qnet, kmooc], cost: written }))).toEqual({ links: [qnet, kmooc], cost: written })
  })
  it('계획 안 걸음 값이 프로젝트 값보다 먼저다(국가시험 직종 페이지)', () => {
    const r = resourcesOf(item({ links: [kuksiwon], cost: nurse }), project({ links: [qnet], cost: written }))
    expect(r.links).toEqual([kuksiwon])
    expect(r.cost).toBe(nurse)
  })
  it('계획 안 걸음의 빈 목록은 "이 계획에선 링크 없음" — 프로젝트 링크로 돌아가지 않는다', () => {
    expect(resourcesOf(item({ links: [] }), project({ links: [qnet] })).links).toEqual([])
  })
  it('비회원: 서버가 가린 걸음은 칸이 아예 없다 — 아무것도 그리지 않는다', () => {
    const hidden = project({ name: '', goal: '' })
    expect(resourcesOf(item(), hidden)).toEqual({ links: [], cost: null })
  })
  it('http·https 가 아닌 주소와 빈 응시료는 버린다', () => {
    const bad = { ...qnet, url: 'javascript:alert(1)' }
    expect(resourcesOf(item(), project({ links: [bad], cost: { ...written, lines: [] } }))).toEqual({ links: [], cost: null })
  })
})

describe('응시료 글', () => {
  it('응시료(필기) → "응시료 19,400원(필기)" · 숫자 사이 쉼표, 원은 붙여 쓴다', () => {
    expect(costAmountLine(written)).toBe('응시료 19,400원(필기)')
    expect(costAmountLine(nurse)).toBe('응시료 90,000원')
  })
  it('여러 줄이면 "응시료 필기 19,400원 · 실기 22,600원"', () => {
    expect(costAmountLine({ ...written, lines: [{ label: '응시료(필기)', amount: 19400 }, { label: '응시료(실기)', amount: 22600 }] }))
      .toBe('응시료 필기 19,400원 · 실기 22,600원')
  })
  it('아래 작은 글 — 기준 · 내는 때(있을 때만) · 해마다 바뀔 수 있어요(확인 날짜)', () => {
    expect(costBasisLine(nurse)).toBe('2027년 1월 시험 기준 · 해마다 바뀔 수 있어요(확인 2026-11-23)')
    expect(costBasisLine({ ...nurse, when: '대학 마지막 해에 내요' })).toBe('2027년 1월 시험 기준 · 대학 마지막 해에 내요 · 해마다 바뀔 수 있어요(확인 2026-11-23)')
  })
})

describe('시험 날짜 상자의 공고 보기', () => {
  it('시험 기관 링크만, 같은 주소는 한 번', () => {
    expect(examLinksOf([[qnet, kmooc], [qnet], undefined])).toEqual([qnet])
  })
  it('진로설계 템플릿 프로젝트로 넘어간다(계획 안 걸음 값 먼저) · 옛 서버면 칸이 생기지 않는다', () => {
    const prep = { plan: { jobCode: '000001' }, paths: [], passStats: {} } as unknown as JobPreparation
    const p = helperExampleToProject(projectToExample(prep, item({ links: [kuksiwon] }), project({ links: [qnet] })), 'qualification', [])
    expect(p.officialLinks).toEqual([kuksiwon])
    const old = helperExampleToProject(projectToExample(prep, item(), project()), 'qualification', [])
    expect('officialLinks' in old).toBe(false)
  })
})
