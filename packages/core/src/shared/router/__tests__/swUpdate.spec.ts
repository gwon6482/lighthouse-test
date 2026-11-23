import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import {
  swReloadDecision, shouldCheck, isAuthEntry, installSwUpdate, _resetSwUpdateForTest,
  SW_RELOAD_KEY, SW_RELOAD_GAP_MS,
} from '../swUpdate'

// 2026-11-23 운영 핫픽스: 서비스 워커가 담아 둔 옛 가입 화면(메일 확인 단계 없음)이 남아 아이폰에서 가입이 막혔다
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}
const base = { ready: true, fromStart: false, fromPath: '/main', toPath: '/encyclopedia', now: 1_000_000 }

describe('swReloadDecision', () => {
  it('준비됐고 다른 화면으로 옮기면 새로 열고 기록을 남긴다', () => {
    const s = memory()
    expect(swReloadDecision(s, base)).toBe('reload')
    expect(s.getItem(SW_RELOAD_KEY)).toBe(String(base.now))
  })
  it('준비 안 됨·저장소 없음이면 그대로', () => {
    expect(swReloadDecision(memory(), { ...base, ready: false })).toBe('stay')
    expect(swReloadDecision(null, base)).toBe('stay')
  })
  it('같은 화면 안 이동(주소의 ?… 만 바뀜)은 새로 열지 않는다 — 입력 중일 수 있다', () => {
    expect(swReloadDecision(memory(), { ...base, toPath: '/main' })).toBe('stay')
  })
  it('앱을 막 연 첫 이동은 로그인·가입 화면만 바꾼다', () => {
    expect(swReloadDecision(memory(), { ...base, fromStart: true, fromPath: '/', toPath: '/' })).toBe('stay')
    expect(swReloadDecision(memory(), { ...base, fromStart: true, fromPath: '/', toPath: '/onboarding/signup' })).toBe('reload')
  })
  it('소셜 로그인 복귀 화면은 새로 열지 않는다', () => {
    expect(swReloadDecision(memory(), { ...base, toPath: '/onboarding/oauth' })).toBe('stay')
  })
  it('무한 새로고침 막기 — 1분 안에 두 번 새로 열지 않는다', () => {
    const s = memory()
    expect(swReloadDecision(s, base)).toBe('reload')
    expect(swReloadDecision(s, { ...base, now: base.now + 5_000 })).toBe('stay')
    expect(swReloadDecision(s, { ...base, now: base.now + SW_RELOAD_GAP_MS - 1 })).toBe('stay')
    expect(swReloadDecision(s, { ...base, now: base.now + SW_RELOAD_GAP_MS })).toBe('reload')
  })
  it('기기 시계가 뒤로 가도(기록이 미래) 새로 열 수 있다 — 영영 막히지 않게', () => {
    const s = memory()
    s.setItem(SW_RELOAD_KEY, String(base.now + 10_000_000))
    expect(swReloadDecision(s, base)).toBe('reload')
  })
  it('저장소가 막히면(사파리 개인 정보 보호 모드 등) 새로 열지 않는다', () => {
    const broken = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('QuotaExceededError') } }
    expect(swReloadDecision(broken, base)).toBe('stay')
  })
})

describe('shouldCheck·isAuthEntry', () => {
  it('업데이트 묻기는 1분에 한 번까지', () => {
    expect(shouldCheck(0, 1000)).toBe(true)
    expect(shouldCheck(1000, 30_000)).toBe(false)
    expect(shouldCheck(1000, 61_000)).toBe(true)
    expect(shouldCheck(1000, 5000, 3000)).toBe(true)
  })
  it('기다리는 화면 — 로그인·가입·비밀번호 찾기', () => {
    expect(['/onboarding/auth', '/onboarding/signup', '/onboarding/password'].every(isAuthEntry)).toBe(true)
    expect(isAuthEntry('/onboarding/intro')).toBe(false)
  })
})

// ── 라우터에 연결한 채로(가짜 서비스 워커) ───────────────────────────
class FakeTarget {
  private l = new Map<string, Set<() => void>>()
  addEventListener(t: string, f: () => void) { (this.l.get(t) ?? this.l.set(t, new Set()).get(t)!).add(f) }
  removeEventListener(t: string, f: () => void) { this.l.get(t)?.delete(f) }
  emit(t: string) { for (const f of [...(this.l.get(t) ?? [])]) f() }
}
class FakeSW extends FakeTarget { constructor(public state: string) { super() } }

function setup(opts: { controlled?: boolean; installing?: FakeSW | null } = {}) {
  const swc = new FakeTarget() as FakeTarget & { controller: object | null }
  swc.controller = opts.controlled === false ? null : {}
  const reg = { installing: opts.installing ?? null, waiting: null, update: vi.fn(async () => undefined) }
  const assign = vi.fn()
  const session = memory()
  const doc = new FakeTarget() as FakeTarget & { visibilityState: string }
  doc.visibilityState = 'visible'
  vi.stubGlobal('navigator', { serviceWorker: swc, onLine: true })
  vi.stubGlobal('document', doc)
  vi.stubGlobal('window', { location: { assign }, sessionStorage: session })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/main', '/encyclopedia', '/onboarding/auth', '/onboarding/signup', '/onboarding/oauth']
      .map((path) => ({ path, component: { template: '<div/>' } })),
  })
  let needReload!: () => void
  installSwUpdate(router, (h) => { needReload = h.onNeedReload; h.onRegistered(reg as unknown as ServiceWorkerRegistration) })
  return { router, swc, reg, assign, session, doc, needReload: () => needReload() }
}

describe('installSwUpdate — 라우터 연결', () => {
  beforeEach(() => _resetSwUpdateForTest())
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

  it('새 버전이 넘겨받으면 화면은 그대로, 다음 이동 때 가려던 주소로 한 번만 새로 연다', async () => {
    const t = setup()
    await t.router.push('/main')
    t.swc.emit('controllerchange')   // 새 서비스 워커가 넘겨받음
    expect(t.assign).not.toHaveBeenCalled()   // 입력 중인 화면을 새로 고치지 않는다
    await t.router.push('/main?tab=2')        // 같은 화면 안 — 그대로
    expect(t.assign).not.toHaveBeenCalled()
    expect(t.router.currentRoute.value.fullPath).toBe('/main?tab=2')
    const failure = await t.router.push('/encyclopedia')
    expect(failure).toBeTruthy()              // 이동은 멈추고
    expect(t.assign).toHaveBeenCalledWith('/encyclopedia')   // 그 주소로 새로 연다
    // 새로 열기가 늦어도(같은 문서에서 또 이동) 1분 안에는 다시 새로 열지 않는다
    await t.router.push('/onboarding/auth')
    expect(t.assign).toHaveBeenCalledTimes(1)
  })

  it('처음 설치(이 화면이 서비스 워커 없이 열림)의 넘겨받음은 새 버전이 아니다', async () => {
    const t = setup({ controlled: false })
    await t.router.push('/main')
    t.swc.emit('controllerchange')
    await t.router.push('/encyclopedia')
    expect(t.assign).not.toHaveBeenCalled()
    t.swc.emit('controllerchange')   // 그 뒤 또 넘겨받으면 새 버전
    await t.router.push('/main')
    expect(t.assign).toHaveBeenCalledWith('/main')
  })

  it('플러그인이 알린 새 버전(onNeedReload)도 같다', async () => {
    const t = setup()
    await t.router.push('/main')
    t.needReload()
    await t.router.push('/encyclopedia')
    expect(t.assign).toHaveBeenCalledWith('/encyclopedia')
  })

  it('가입 화면 앞 — 받는 중인 새 버전을 기다렸다가 새 버전으로 연다', async () => {
    const incoming = new FakeSW('installing')
    const t = setup({ installing: incoming })
    await t.router.push('/main')
    const nav = t.router.push('/onboarding/signup')
    await new Promise((r) => setTimeout(r, 10))
    expect(t.assign).not.toHaveBeenCalled()   // 아직 기다리는 중
    incoming.state = 'activated'; t.reg.installing = null; incoming.emit('statechange')
    t.swc.emit('controllerchange')
    await nav
    expect(t.assign).toHaveBeenCalledWith('/onboarding/signup')
  })

  it('가입 화면 앞 — 받는 중인 것이 없으면 기다리지 않고 지금 화면으로', async () => {
    const t = setup()
    await t.router.push('/main')
    await t.router.push('/onboarding/signup')
    expect(t.router.currentRoute.value.path).toBe('/onboarding/signup')
    expect(t.assign).not.toHaveBeenCalled()
  })

  it('화면이 다시 보이면 업데이트를 묻는다(1분에 한 번까지)', async () => {
    const t = setup()
    const before = t.reg.update.mock.calls.length   // 등록 때 한 번
    t.doc.emit('visibilitychange')
    expect(t.reg.update.mock.calls.length).toBe(before)   // 방금 물었다
    vi.useFakeTimers({ now: Date.now() + 61_000 })
    t.doc.emit('visibilitychange')
    expect(t.reg.update.mock.calls.length).toBe(before + 1)
  })

  it('서비스 워커를 못 쓰는 환경에서는 아무것도 하지 않는다', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('window', { location: { assign: vi.fn() } })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }, { path: '/a', component: { template: '<div/>' } }] })
    const register = vi.fn()
    installSwUpdate(router, register)
    expect(register).not.toHaveBeenCalled()
    await router.push('/a')
    expect(router.currentRoute.value.path).toBe('/a')
  })
})
