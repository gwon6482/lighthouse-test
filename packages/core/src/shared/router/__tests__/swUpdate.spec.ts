import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import {
  swReloadDecision, shouldCheck, isAuthEntry, installSwUpdate, _resetSwUpdateForTest, routeMove,
  SW_RELOAD_KEY, SW_RELOAD_GAP_MS, SW_SETTLE_MAX_MS, SW_CHECK_TIMEOUT_MS,
} from '../swUpdate'
import onboardingRoutes from '@/modules/onboarding/onboarding.routes'
import achievementRoutes from '@/modules/career-achievement/career-achievement.routes'
import encyclopediaRoutes from '@/modules/encyclopedia/encyclopedia.routes'
import surveyRoutes from '@/modules/survey/survey.routes'
import designRoutes from '@/modules/career-design/career-design.routes'

// 2026-11-23 운영 핫픽스: 서비스 워커가 담아 둔 옛 가입 화면(메일 확인 단계 없음)이 남아 아이폰에서 가입이 막혔다
// 검토(11-23): 처음 온 사람 대기·같은 화면 번호 이동·replace 기록·상한·끝나지 않는 update() 를 고쳤다
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}
const ok = { fromStart: false, sameRecord: false, toAllowed: true, fromBlocked: false, ready: true, now: 1_000_000 }

describe('swReloadDecision — 허락한 이동만', () => {
  it('허락한 목적지·막히지 않은 출발지·다른 레코드면 새로 열고 기록을 남긴다', () => {
    const s = memory()
    expect(swReloadDecision(s, ok)).toBe('reload')
    expect(s.getItem(SW_RELOAD_KEY)).toBe(String(ok.now))
  })
  it('허락 안 된 목적지·막힌 출발지·같은 레코드·준비 안 됨·저장소 없음이면 그대로', () => {
    expect(swReloadDecision(memory(), { ...ok, toAllowed: false })).toBe('stay')
    expect(swReloadDecision(memory(), { ...ok, fromBlocked: true })).toBe('stay')
    expect(swReloadDecision(memory(), { ...ok, sameRecord: true })).toBe('stay')
    expect(swReloadDecision(memory(), { ...ok, ready: false })).toBe('stay')
    expect(swReloadDecision(null, ok)).toBe('stay')
  })
  it('무한 새로고침 막기 — 1분 안에 두 번 새로 열지 않는다', () => {
    const s = memory()
    expect(swReloadDecision(s, ok)).toBe('reload')
    expect(swReloadDecision(s, { ...ok, now: ok.now + 5_000 })).toBe('stay')
    expect(swReloadDecision(s, { ...ok, now: ok.now + SW_RELOAD_GAP_MS - 1 })).toBe('stay')
    expect(swReloadDecision(s, { ...ok, now: ok.now + SW_RELOAD_GAP_MS })).toBe('reload')
  })
  it('기기 시계가 뒤로 가도(기록이 미래) 영영 막히지 않는다', () => {
    const s = memory()
    s.setItem(SW_RELOAD_KEY, String(ok.now + 10_000_000))
    expect(swReloadDecision(s, ok)).toBe('reload')
  })
  it('저장소가 막히면(사파리 개인 정보 보호 모드 등) 새로 열지 않는다', () => {
    const broken = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('QuotaExceededError') } }
    expect(swReloadDecision(broken, ok)).toBe('stay')
  })
})

describe('라우트 표시(실제 라우트 정의)', () => {
  const routes = [...onboardingRoutes, ...achievementRoutes, ...encyclopediaRoutes, ...surveyRoutes, ...designRoutes] as RouteRecordRaw[]
  const r = createRouter({ history: createMemoryHistory(), routes })
  const move = (from: string, to: string) => routeMove(r.resolve(to) as any, r.resolve(from) as any)

  it('허락한 목적지 — 로그인·이메일 가입·비밀번호 찾기·하단 탭 뿌리 화면만', () => {
    const allowed = ['/onboarding/auth', '/onboarding/signup', '/onboarding/password', '/career-achievement', '/career-info',
      '/career-encyclopedia', '/career-achievement/roadmap', '/career-achievement/records', '/mypage']
    for (const p of allowed) expect(move('/career-encyclopedia/browse', p).toAllowed, p).toBe(true)
    const notAllowed = ['/onboarding/signup?social=1', '/onboarding/intro', '/onboarding/oauth', '/career-achievement/review/2',
      '/self-understanding/complete', '/career-encyclopedia/job/123', '/career-design', '/main/before', '/career-achievement/weekly-schedule']
    for (const p of notAllowed) expect(move('/career-encyclopedia/browse', p).toAllowed, p).toBe(false)
  })
  it('막은 출발지 — 검사 진행·완료, 집중·기록, 주간결산, 일정 조정, 가입 위저드, 비밀번호 찾기, 진로설계', () => {
    const blocked = ['/self-understanding/select', '/self-understanding/test', '/self-understanding/complete',
      '/career-achievement/start/project/1', '/career-achievement/complete/project/1', '/career-achievement/review/3',
      '/career-achievement/weekly-review', '/career-achievement/weekly-schedule', '/onboarding/signup', '/onboarding/password',
      '/onboarding/oauth', '/career-design/plan/new', '/career-design/project/period', '/mypage/career-situation', '/career-design/plan/abc']
    for (const p of blocked) expect(move(p, '/career-achievement').fromBlocked, p).toBe(true)
    expect(move('/career-encyclopedia/job/1', '/career-achievement').fromBlocked).toBe(false)
    expect(move('/onboarding/auth', '/career-achievement').fromBlocked).toBe(false)
  })
  it('같은 라우트 레코드 안 이동(번호·주소 뒤 ?… 만 바뀜)은 같은 레코드', () => {
    expect(move('/career-achievement/review/3', '/career-achievement/review/4').sameRecord).toBe(true)
    expect(move('/career-encyclopedia?x=1', '/career-encyclopedia?x=2').sameRecord).toBe(true)
    expect(move('/career-achievement', '/career-info').sameRecord).toBe(false)
  })
  it('isAuthEntry', () => {
    expect(['/onboarding/auth', '/onboarding/signup', '/onboarding/password'].every(isAuthEntry)).toBe(true)
    expect(isAuthEntry('/onboarding/intro')).toBe(false)
  })
  it('업데이트 묻기는 1분에 한 번까지', () => {
    expect(shouldCheck(0, 1000)).toBe(true)
    expect(shouldCheck(1000, 30_000)).toBe(false)
    expect(shouldCheck(1000, 61_000)).toBe(true)
  })
})

// ── 라우터에 연결한 채로(가짜 서비스 워커) ───────────────────────────
class FakeTarget {
  private l = new Map<string, Set<(e?: any) => void>>()
  addEventListener(t: string, f: (e?: any) => void) { (this.l.get(t) ?? this.l.set(t, new Set()).get(t)!).add(f) }
  removeEventListener(t: string, f: () => void) { this.l.get(t)?.delete(f) }
  emit(t: string, e?: any) { for (const f of [...(this.l.get(t) ?? [])]) f(e) }
  count(t: string) { return this.l.get(t)?.size ?? 0 }
}
class FakeSW extends FakeTarget { constructor(public state: string) { super() } }

const C = { template: '<div/>' }
const TEST_ROUTES: RouteRecordRaw[] = [
  { path: '/', component: C },
  { path: '/onboarding/auth', component: C, meta: { swReloadTo: true } },
  { path: '/onboarding/signup', component: C, meta: { swReloadTo: true, noSwReload: true } },
  { path: '/onboarding/intro', component: C },
  { path: '/career-achievement', component: C, meta: { swReloadTo: true } },
  { path: '/career-info', component: C, meta: { swReloadTo: true } },
  { path: '/career-encyclopedia/job/:code', component: C },
  { path: '/career-achievement/review/:step', component: C, meta: { noSwReload: true } },
  { path: '/self-understanding/test', component: C, meta: { noSwReload: true } },
  { path: '/self-understanding/complete', component: C, meta: { noSwReload: true } },
]

function setup(opts: { controlled?: boolean; installing?: FakeSW | null; update?: () => Promise<unknown> } = {}) {
  const swc = new FakeTarget() as FakeTarget & { controller: object | null }
  swc.controller = opts.controlled === false ? null : {}
  const reg = { installing: opts.installing ?? null, waiting: null, update: vi.fn(opts.update ?? (async () => undefined)) }
  const reload = vi.fn()
  const session = memory()
  const doc = new FakeTarget() as FakeTarget & { visibilityState: string }
  doc.visibilityState = 'visible'
  const win = new FakeTarget() as FakeTarget & { sessionStorage: unknown }
  win.sessionStorage = session
  vi.stubGlobal('navigator', { serviceWorker: swc, onLine: true })
  vi.stubGlobal('document', doc)
  vi.stubGlobal('window', win)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  let needReload!: () => void
  installSwUpdate(router, (h) => { needReload = h.onNeedReload; h.onRegistered(reg as unknown as ServiceWorkerRegistration) }, reload)
  return { router, swc, reg, reload, session, doc, win, needReload: () => needReload() }
}

describe('installSwUpdate — 라우터 연결', () => {
  beforeEach(() => _resetSwUpdateForTest())
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

  it('준비돼도 화면은 그대로, 허락한 이동은 **끝낸 뒤** 그 자리에서 한 번만 새로 연다(replace·push 기록 그대로)', async () => {
    const t = setup()
    await t.router.push('/career-encyclopedia/job/1')
    t.swc.emit('controllerchange')
    expect(t.reload).not.toHaveBeenCalled()
    await t.router.push('/career-encyclopedia/job/2')   // 같은 레코드 — 그대로
    await t.router.push('/onboarding/intro')            // 허락 안 된 목적지 — 그대로
    expect(t.reload).not.toHaveBeenCalled()
    const failure = await t.router.replace('/career-achievement')
    expect(failure).toBeUndefined()                      // 이동은 막지 않는다(기록이 replace 로 남는다)
    expect(t.router.currentRoute.value.path).toBe('/career-achievement')
    expect(t.reload).toHaveBeenCalledTimes(1)
    await t.router.push('/career-info')                  // 1분 안 — 더 새로 열지 않는다
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('주간결산 단계 이동·검사 제출에서는 새로 열지 않는다', async () => {
    const t = setup()
    await t.router.push('/career-achievement/review/3')
    t.swc.emit('controllerchange')
    await t.router.push('/career-achievement/review/4')
    await t.router.push('/career-achievement')           // 주간결산을 떠나 홈으로 — 막은 출발지
    await t.router.push('/self-understanding/test')
    await t.router.push('/self-understanding/complete')
    await t.router.push('/career-info')                  // 검사 완료에서 탭으로 — 막은 출발지
    expect(t.reload).not.toHaveBeenCalled()
  })

  it('처음 설치(서비스 워커 없이 연 문서)의 넘겨받음은 새 버전이 아니고, 로그인 화면 앞에서 기다리지도 않는다', async () => {
    const incoming = new FakeSW('installing')   // 첫 설치(미리 담기 30MB)
    const t = setup({ controlled: false, installing: incoming })
    const t0 = Date.now()
    await t.router.push('/onboarding/auth')
    expect(Date.now() - t0).toBeLessThan(200)
    expect(incoming.count('statechange')).toBe(0)
    t.swc.emit('controllerchange')
    await t.router.push('/career-achievement')
    expect(t.reload).not.toHaveBeenCalled()
    t.swc.emit('controllerchange')   // 그 뒤 또 넘겨받으면 새 버전
    await t.router.push('/career-info')
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('플러그인이 알린 새 버전(onNeedReload)도 같다', async () => {
    const t = setup()
    await t.router.push('/onboarding/intro')
    t.needReload()
    await t.router.push('/career-achievement')
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('로그인 화면 앞 — 받는 중인 새 버전을 기다렸다가 그 화면에서 새로 연다', async () => {
    const incoming = new FakeSW('installing')
    const t = setup({ installing: incoming })
    await t.router.push('/onboarding/intro')
    const nav = t.router.push('/onboarding/auth')
    await new Promise((r) => setTimeout(r, 10))
    expect(t.reload).not.toHaveBeenCalled()
    incoming.state = 'activated'; t.reg.installing = null; incoming.emit('statechange')
    t.swc.emit('controllerchange')
    await nav
    expect(t.router.currentRoute.value.path).toBe('/onboarding/auth')
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('기다림은 전체 상한 하나 — 넘으면 이번엔 지금 화면으로, 리스너도 정리', async () => {
    vi.useFakeTimers()
    const incoming = new FakeSW('installing')   // 끝나지 않는 설치
    const t = setup({ installing: incoming })
    await t.router.push('/onboarding/intro')
    const nav = t.router.push('/onboarding/auth')
    await vi.advanceTimersByTimeAsync(SW_SETTLE_MAX_MS - 100)
    expect(t.router.currentRoute.value.path).toBe('/onboarding/intro')   // 아직 기다리는 중
    await vi.advanceTimersByTimeAsync(200)
    await nav
    expect(t.router.currentRoute.value.path).toBe('/onboarding/auth')
    expect(t.reload).not.toHaveBeenCalled()
    expect(incoming.count('statechange')).toBe(0)
  })

  it('끝나지 않는 update() — 상한 뒤 비워서 다음 로그인 이동을 붙잡지 않는다', async () => {
    vi.useFakeTimers()
    const t = setup({ update: () => new Promise(() => {}) })
    await vi.advanceTimersByTimeAsync(SW_CHECK_TIMEOUT_MS + 10)   // 등록 때 물은 것이 끝나지 않음 → 비움
    vi.setSystemTime(Date.now() + 20_000)
    const nav = t.router.push('/onboarding/auth')                  // 15초가 지나 한 번 더 묻는다 — 이것도 끝나지 않음
    await vi.advanceTimersByTimeAsync(SW_SETTLE_MAX_MS + 10)
    await nav
    expect(t.router.currentRoute.value.path).toBe('/onboarding/auth')
    await vi.advanceTimersByTimeAsync(SW_CHECK_TIMEOUT_MS)
    const t1 = Date.now()
    await t.router.push('/onboarding/signup')                       // 방금 물었고 checking 은 비었다 → 바로
    expect(Date.now() - t1).toBe(0)
  })

  it('뒤·앞 캐시에서 되살아났고 새 버전이 준비돼 있으면 다시 불러온다', () => {
    const t = setup()
    t.win.emit('pageshow', { persisted: true })
    expect(t.reload).not.toHaveBeenCalled()
    t.swc.emit('controllerchange')
    t.win.emit('pageshow', { persisted: false })
    expect(t.reload).not.toHaveBeenCalled()
    t.win.emit('pageshow', { persisted: true })
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('화면이 다시 보이면 업데이트를 묻는다(1분에 한 번까지)', async () => {
    const t = setup()
    const before = t.reg.update.mock.calls.length
    t.doc.emit('visibilitychange')
    expect(t.reg.update.mock.calls.length).toBe(before)
    vi.useFakeTimers({ now: Date.now() + 61_000 })
    t.doc.emit('visibilitychange')
    expect(t.reg.update.mock.calls.length).toBe(before + 1)
  })

  it('서비스 워커를 못 쓰는 환경에서는 아무것도 하지 않는다', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('window', {})
    const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
    const register = vi.fn()
    installSwUpdate(router, register)
    expect(register).not.toHaveBeenCalled()
    await router.push('/onboarding/auth')
    expect(router.currentRoute.value.path).toBe('/onboarding/auth')
  })
})
