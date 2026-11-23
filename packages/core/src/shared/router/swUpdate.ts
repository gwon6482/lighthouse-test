// 새 버전으로 바꾸기 — 서비스 워커가 새 버전을 받으면 **허락한 화면 이동 때** 새 화면으로 다시 연다(2026-11-23 운영 핫픽스).
//
// 왜: 서비스 워커(vite-plugin-pwa, registerType 'autoUpdate')는 index.html 을 미리 담아 두고 내준다.
//   배포 뒤 처음 연 화면은 담아 둔 옛 화면이고, 새 서비스 워커는 그 뒤에야 받아져 넘겨받는다(skipWaiting·clientsClaim).
//   옛 화면은 그대로 돌아서, 홈 화면 앱·열어 둔 탭은 며칠씩 옛 화면으로 남았다.
//   11-23 아이폰에서 메일 확인 단계가 없는 옛 가입 화면(v0.1.47 전)이 남아 가입이 막혔다(서버 로그: send-code 없이 register 400 만 10번).
//
// 하는 일
//   1) 새 버전 알아채기 — 화면이 다시 보일 때·화면을 옮긴 뒤 서비스 워커에 업데이트를 묻는다(1분에 한 번까지).
//   2) 새 서비스 워커가 넘겨받으면 '준비됨'만 표시한다 — 입력 중인 화면을 갑자기 새로 고치지 않는다.
//   3) **허락한 이동에서만** 새로 연다(검토 11-23 2번 — 막을 곳 목록이 아니라 허락한 곳 목록):
//        가려는 곳이 route meta `swReloadTo`(로그인·이메일 가입·비밀번호 찾기·하단 탭 뿌리 화면)이고,
//        떠나는 곳이 meta `noSwReload`(검사 진행·집중·주간결산·가입 위저드·진로설계 편집 등 입력·진행 중 화면)가 아니고,
//        같은 라우트 레코드 안 이동(params·query 만 바뀜)이 아닐 때.
//   4) 새로 여는 방법(검토 11-23 3번) — 이동을 막고 다른 주소로 새로 여는(location.assign) 대신, **이동을 그대로 끝낸 뒤
//      그 자리에서 location.reload()** 한다. 그래서 바꿔치기(replace)·쌓기(push)·이동에 실린 history.state(비밀번호 찾기의 메일 등)·
//      뒤로가기 기록이 SPA 이동 그대로 남는다. 떠나는 화면의 정리(onBeforeUnmount 등)도 평소대로 돈다.
//      보조: 뒤·앞 캐시(bfcache)에서 옛 문서가 되살아났는데 새 버전이 준비돼 있으면 다시 불러온다(pageshow persisted).
//   5) 로그인·가입·비밀번호 찾기 화면 앞에서는, **이 화면이 서비스 워커 아래서 열렸을 때만** 받는 중인 새 버전을 잠깐 기다린다
//      (전체 상한 SW_SETTLE_MAX_MS 하나 — 넘으면 이번에는 지금 화면으로, 다음 허락된 이동 때 바뀐다).
//      서비스 워커 없이 연 화면(처음 온 사람)은 이미 네트워크에서 받은 최신이라 기다리지 않는다(검토 11-23 1번 — 첫 설치 30MB 를 기다리던 문제).
//   6) 무한 새로고침 막기 — 1분 안에 두 번 새로 열지 않는다. sessionStorage 를 못 쓰면 새로 열지 않는다(지금처럼).
//   서비스 워커를 못 쓰는 환경(사파리 개인 정보 보호 모드·iOS 껍데기 앱 등)과 오프라인에서는 아무것도 하지 않는다 — 지금과 같다.
//   새로 열어도 로그인(localStorage)·가입 위저드 임시 보관(sessionStorage, 같은 탭)·멈춘 집중(localStorage)은 그대로 남는다.
//
// 옛 청크(chunkReload.ts)와의 관계: 그쪽은 '화면 파일을 못 불러왔을 때'의 복구, 이쪽은 '새 버전이 준비됐을 때'의 바꾸기.
//   반복 막기 기록은 따로 둔다(서로의 기록을 지우지 않는다). 연결은 createRouter.ts 한 곳에서 한다.
//
// 판정은 순수 함수로 두고(시험 __tests__/swUpdate.spec.ts), 서비스 워커 등록은 swRegister.ts(virtual:pwa-register)가 한다.
import { START_LOCATION, type RouteLocationNormalized, type Router } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 새 버전이 준비됐으면 이 화면으로 갈 때 새로 열어도 된다(로그인·가입·비밀번호 찾기·하단 탭 뿌리 화면) — swUpdate.ts */
    swReloadTo?: boolean
    /** 이 화면을 떠나는 이동에서는 새로 열지 않는다(입력·진행 중 화면) — swUpdate.ts */
    noSwReload?: boolean
  }
}

export const SW_RELOAD_KEY = 'lh_sw_reload'
/** 새로 연 뒤 이 시간 안에는 다시 새로 열지 않는다 */
export const SW_RELOAD_GAP_MS = 60_000
/** 업데이트 묻기 간격(화면 이동·다시 보일 때) */
export const SW_CHECK_GAP_MS = 60_000
/** 로그인·가입 화면 앞에서는 이 시간보다 오래된 확인이면 한 번 더 묻는다 */
export const SW_AUTH_CHECK_GAP_MS = 15_000
/** 로그인·가입 화면 앞에서 기다리는 전체 상한(등록·확인·활성화·넘겨받음 모두 합쳐) */
export const SW_SETTLE_MAX_MS = 4_500
/** 업데이트 묻기 하나의 상한 — 끝나지 않는 update() 가 다음 이동을 붙잡지 않게 */
export const SW_CHECK_TIMEOUT_MS = 5_000

/** 들어서기 전에 새 버전을 기다리는 화면 — 계정을 만들거나 비밀번호를 정하는 곳 */
const AUTH_ENTRY_PATHS = ['/onboarding/auth', '/onboarding/signup', '/onboarding/password']

export function isAuthEntry(path: string): boolean {
  return AUTH_ENTRY_PATHS.includes(path)
}

/** 판정에 쓰는 이동의 모양(라우트 정보에서 뽑는다 — routeMove) */
export interface SwMove {
  fromStart: boolean
  /** 같은 라우트 레코드 안 이동(params·query 만 바뀜) */
  sameRecord: boolean
  /** 가려는 곳이 허락한 화면인가(meta swReloadTo, 소셜 가입 위저드는 뺀다) */
  toAllowed: boolean
  /** 떠나는 곳이 입력·진행 중 화면인가(meta noSwReload) */
  fromBlocked: boolean
}

export function routeMove(to: RouteLocationNormalized, from: RouteLocationNormalized): SwMove {
  const fromStart = from === START_LOCATION
  const toRec = to.matched[to.matched.length - 1]
  const fromRec = from.matched[from.matched.length - 1]
  return {
    fromStart,
    sameRecord: !fromStart && !!toRec && toRec === fromRec,
    // 소셜 가입 위저드(?social=1)는 계정이 이미 있는 사람의 이어 하기라 '가입(이메일)'에 들지 않는다
    toAllowed: !!to.meta.swReloadTo && !(to.path === '/onboarding/signup' && to.query.social === '1'),
    fromBlocked: !fromStart && from.matched.some((r) => r.meta.noSwReload),
  }
}

/**
 * 이 이동에서 새 버전으로 새로 열지 — 'reload' 면 기록을 남긴다.
 * 허락한 이동이 아님·준비 안 됨·1분 안에 이미 새로 엶·저장소 막힘 → 'stay'
 */
export function swReloadDecision(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  o: SwMove & { ready: boolean; now: number },
): 'reload' | 'stay' {
  if (!o.ready || !storage) return 'stay'
  if (!o.toAllowed || o.fromBlocked || o.sameRecord) return 'stay'
  try {
    const prev = Number(storage.getItem(SW_RELOAD_KEY))
    if (Number.isFinite(prev) && prev > 0 && o.now - prev >= 0 && o.now - prev < SW_RELOAD_GAP_MS) return 'stay'
    storage.setItem(SW_RELOAD_KEY, String(o.now))
    return 'reload'
  } catch {
    return 'stay'
  }
}

/** 업데이트를 물을 때인가 */
export function shouldCheck(lastCheckAt: number, now: number, gap = SW_CHECK_GAP_MS): boolean {
  return !(lastCheckAt > 0 && now - lastCheckAt >= 0 && now - lastCheckAt < gap)
}

// ── 브라우저 연결 ─────────────────────────────────────────────

/** p 를 ms 까지만 기다린다. 시간이 지나면 onTimeout(리스너 정리 등)을 부르고 undefined */
function within<T>(p: Promise<T>, ms: number, onTimeout?: () => void): Promise<T | undefined> {
  if (ms <= 0) { onTimeout?.(); return Promise.resolve(undefined) }
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    p.finally(() => clearTimeout(timer)),
    new Promise<undefined>((r) => { timer = setTimeout(() => { onTimeout?.(); r(undefined) }, ms) }),
  ])
}

interface SwState {
  reg: ServiceWorkerRegistration | null
  regPromise: Promise<ServiceWorkerRegistration | null>
  ready: boolean
  lastCheckAt: number
  /** 지금 묻는 중인 업데이트 — 로그인·가입 화면 앞에서 이것이 끝나기를 기다린다(앱을 막 연 직후의 확인과 겹칠 때) */
  checking: Promise<void> | null
  readyWaiters: Set<() => void>
  /** 이 문서가 서비스 워커 아래서 열렸는가(넘겨받음 판정·기다림 여부) */
  hadController: boolean
}

let state: SwState | null = null

function markReady() {
  if (!state || state.ready) return
  state.ready = true
  for (const w of [...state.readyWaiters]) w()
  state.readyWaiters.clear()
}

async function checkNow(force = false) {
  const s = state
  if (!s?.reg) return
  const now = Date.now()
  if (!force && !shouldCheck(s.lastCheckAt, now)) return
  s.lastCheckAt = now
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  // update() 는 새 파일을 찾으면 설치를 시작한 뒤(registration.installing 이 생긴 뒤) 끝난다.
  // 끝나지 않는 update()(망이 매달림)가 checking 에 남아 다음 로그인 이동마다 기다리지 않게 상한을 두고 비운다(검토 11-23 5번)
  const p = within(s.reg.update().then(() => undefined, () => undefined), SW_CHECK_TIMEOUT_MS).then(() => undefined)
  s.checking = p
  await p
  if (s.checking === p) s.checking = null
}

/** sw 가 활성화(또는 버려짐)될 때까지 — 상한이 지나면 리스너를 떼고 그만 기다린다 */
function waitActivated(sw: ServiceWorker, ms: number): Promise<unknown> {
  let on: (() => void) | null = null
  const done = new Promise<void>((resolve) => {
    if (sw.state === 'activated' || sw.state === 'redundant') return resolve()
    on = () => { if (sw.state === 'activated' || sw.state === 'redundant') resolve() }
    sw.addEventListener('statechange', on)
  })
  const off = () => { if (on) sw.removeEventListener('statechange', on) }
  return within(done, ms, off).finally(off)
}

function waitReady(s: SwState, ms: number): Promise<unknown> {
  if (s.ready) return Promise.resolve()
  let w: (() => void) | null = null
  const p = new Promise<void>((r) => { w = r; s.readyWaiters.add(r) })
  const off = () => { if (w) s.readyWaiters.delete(w) }
  return within(p, ms, off).finally(off)
}

/**
 * 로그인·가입 화면 앞 — 진행 중인 업데이트가 있으면 넘겨받을 때까지 잠깐 기다린다(전체 상한 SW_SETTLE_MAX_MS 하나).
 * 이 문서가 서비스 워커 없이 열렸으면 기다리지 않는다 — 이미 최신이고, 그때 '받는 중'인 것은 첫 설치(미리 담기 30MB)다.
 */
async function settle(maxMs = SW_SETTLE_MAX_MS) {
  const s = state
  if (!s || !s.hadController) return
  const deadline = Date.now() + maxMs
  const left = () => deadline - Date.now()
  const reg = s.reg ?? (await within(s.regPromise, left())) ?? null
  if (!reg) return
  if (s.checking) await within(s.checking, left())   // 막 연 직후의 확인이 아직 도는 중이면 그 결과를 본다
  else if (!reg.installing && !reg.waiting && shouldCheck(s.lastCheckAt, Date.now(), SW_AUTH_CHECK_GAP_MS)) {
    await within(checkNow(true), left())
  }
  const incoming = reg.installing ?? reg.waiting
  if (!incoming || s.ready) return
  await waitActivated(incoming, left())
  // 넘겨받음(controllerchange)은 활성화 바로 뒤에 온다
  if (!s.ready) await waitReady(s, left())
}

/**
 * 라우터에 연결한다(createRouter.ts). 서비스 워커를 못 쓰면 아무것도 하지 않는다.
 * register: 서비스 워커를 등록하고 새 버전이 넘겨받으면 onNeedReload 를 부른다(swRegister.ts — 시험에서는 가짜)
 * reload: 그 자리에서 새로 불러오기(시험에서는 가짜)
 */
export function installSwUpdate(
  router: Router,
  register: (h: { onNeedReload: () => void; onRegistered: (r: ServiceWorkerRegistration | undefined) => void; onError: () => void }) => void,
  reload: () => void = () => window.location.reload(),
) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  let resolveReg!: (r: ServiceWorkerRegistration | null) => void
  state = {
    reg: null, regPromise: new Promise((r) => { resolveReg = r }), ready: false, lastCheckAt: 0, checking: null,
    readyWaiters: new Set(), hadController: !!navigator.serviceWorker.controller,
  }
  const s = state

  // 넘겨받음 — 이 문서가 이미 서비스 워커 아래서 열렸을 때만 '새 버전'이다(처음 설치 때의 넘겨받음은 아님)
  try {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (s.hadController) markReady()
      s.hadController = true
    })
  } catch { /* 막힌 환경 */ }

  try {
    register({
      // 플러그인이 알리는 '새 버전 활성화' — 처음 설치에는 부르지 않는다(isUpdate·isExternal 일 때만)
      onNeedReload: markReady,
      onRegistered: (r) => {
        s.reg = r ?? null
        resolveReg(s.reg)
        void checkNow(true)
      },
      onError: () => resolveReg(null),
    })
  } catch {
    resolveReg(null)
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkNow()
  })
  // 뒤·앞 캐시에서 옛 문서가 되살아났는데 새 버전이 준비돼 있으면 다시 불러온다(가드를 타지 않고 옛 화면이 보이는 것을 막는 보조)
  window.addEventListener?.('pageshow', (e: PageTransitionEvent) => {
    if (e.persisted && s.ready) reload()
  })

  // 이번 이동을 마친 뒤 새로 열지(beforeResolve 에서 정하고 afterEach 에서 연다)
  let reloadAfter: RouteLocationNormalized | null = null

  router.beforeResolve(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    reloadAfter = null
    const move = routeMove(to, from)
    if (isAuthEntry(to.path) && move.toAllowed && !move.fromBlocked && !move.sameRecord) await settle()
    let store: Storage | null = null
    try { store = window.sessionStorage } catch { /* 막힌 환경 */ }
    if (swReloadDecision(store, { ...move, ready: s.ready, now: Date.now() }) === 'reload') reloadAfter = to
    return true
  })

  router.afterEach((to, _from, failure) => {
    const target = reloadAfter
    reloadAfter = null
    if (target && !failure && to === target) {
      reload()   // 이동이 기록(push·replace·state)까지 끝난 자리에서 새로 연다
      return
    }
    void checkNow()
  })
}

/** 시험용 — 상태 비우기 */
export function _resetSwUpdateForTest() { state = null }
