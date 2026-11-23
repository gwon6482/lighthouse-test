// 새 버전으로 바꾸기 — 서비스 워커가 새 버전을 받으면 **다음 화면 이동 때** 새 화면으로 다시 연다(2026-11-23 운영 핫픽스).
//
// 왜: 서비스 워커(vite-plugin-pwa, registerType 'autoUpdate')는 index.html 을 미리 담아 두고 내준다.
//   배포 뒤 처음 연 화면은 담아 둔 옛 화면이고, 새 서비스 워커는 그 뒤에야 받아져 넘겨받는다(skipWaiting·clientsClaim).
//   옛 화면은 그대로 돌아서, 홈 화면 앱·열어 둔 탭은 며칠씩 옛 화면으로 남았다.
//   11-23 아이폰에서 메일 확인 단계가 없는 옛 가입 화면(v0.1.47 전)이 남아 가입이 막혔다(서버 로그: send-code 없이 register 400 만 10번).
//
// 하는 일
//   1) 새 버전 알아채기 — 화면이 다시 보일 때·화면을 옮길 때 서비스 워커에 업데이트를 묻는다(1분에 한 번까지).
//   2) 새 서비스 워커가 넘겨받으면 '준비됨'만 표시한다 — 입력 중인 화면을 갑자기 새로 고치지 않는다.
//   3) 다음 화면 이동 때 가려던 주소로 새로 연다(같은 화면 안 주소만 바뀌는 이동은 건너뜀).
//   4) 로그인·가입·비밀번호 찾기 화면에 들어서기 전에는 진행 중인 업데이트를 잠깐(최대 몇 초) 기다린다 —
//      배포 뒤 처음 연 사람도 가입 위저드 0단계에 서기 전에 새 버전이 되게.
//   5) 무한 새로고침 막기 — 1분 안에 두 번 새로 열지 않는다. sessionStorage 를 못 쓰면 새로 열지 않는다(지금처럼).
//   서비스 워커를 못 쓰는 환경(사파리 개인 정보 보호 모드·iOS 껍데기 앱 등)과 오프라인에서는 아무것도 하지 않는다 — 지금과 같다.
//   새로 열어도 로그인(localStorage)·가입 위저드 임시 보관(sessionStorage, 같은 탭)·멈춘 집중(localStorage)은 그대로 남는다.
//
// 옛 청크(chunkReload.ts)와의 관계: 그쪽은 '화면 파일을 못 불러왔을 때'의 복구, 이쪽은 '새 버전이 준비됐을 때'의 바꾸기.
//   둘 다 가려던 주소로 새로 열고, 반복 막기 기록은 따로 둔다(서로의 기록을 지우지 않는다). 연결은 createRouter.ts 한 곳에서 한다.
//
// 판정은 순수 함수로 두고(시험 __tests__/swUpdate.spec.ts), 서비스 워커 등록은 swRegister.ts(virtual:pwa-register)가 한다.
import { START_LOCATION, type RouteLocationNormalized, type Router } from 'vue-router'

export const SW_RELOAD_KEY = 'lh_sw_reload'
/** 새로 연 뒤 이 시간 안에는 다시 새로 열지 않는다 */
export const SW_RELOAD_GAP_MS = 60_000
/** 업데이트 묻기 간격(화면 이동·다시 보일 때) */
export const SW_CHECK_GAP_MS = 60_000
/** 로그인·가입 화면 앞에서는 이 시간보다 오래된 확인이면 한 번 더 묻는다 */
export const SW_AUTH_CHECK_GAP_MS = 15_000

/** 들어서기 전에 새 버전을 기다리는 화면 — 계정을 만들거나 비밀번호를 정하는 곳 */
const AUTH_ENTRY_PATHS = ['/onboarding/auth', '/onboarding/signup', '/onboarding/password']
/** 새로 열지 않는 화면 — 소셜 로그인 복귀(한 번 쓰는 값이 주소에 실려 온다) */
const NO_RELOAD_PATHS = ['/onboarding/oauth']

export function isAuthEntry(path: string): boolean {
  return AUTH_ENTRY_PATHS.includes(path)
}

/**
 * 이 이동에서 새 버전으로 새로 열지 — 'reload' 면 기록을 남긴다.
 * 준비 안 됨·앱 첫 화면·같은 화면 안 이동·새로 열지 않는 화면·1분 안에 이미 새로 엶·저장소 막힘 → 'stay'
 */
export function swReloadDecision(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  o: { ready: boolean; fromStart: boolean; fromPath: string; toPath: string; now: number },
): 'reload' | 'stay' {
  if (!o.ready || !storage) return 'stay'
  if (o.fromStart && !isAuthEntry(o.toPath)) return 'stay'   // 앱을 막 연 첫 이동 — 로그인·가입 화면만 바로 바꾼다
  if (!o.fromStart && o.fromPath === o.toPath) return 'stay'  // 같은 화면 안(주소의 ?… 만 바뀜) — 입력 중일 수 있다
  if (NO_RELOAD_PATHS.includes(o.toPath)) return 'stay'
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

const timeout = <T>(p: Promise<T>, ms: number): Promise<T | undefined> =>
  Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))])

interface SwState {
  reg: ServiceWorkerRegistration | null
  regPromise: Promise<ServiceWorkerRegistration | null>
  ready: boolean
  lastCheckAt: number
  /** 지금 묻는 중인 업데이트 — 로그인·가입 화면 앞에서 이것이 끝나기를 기다린다(앱을 막 연 직후의 확인과 겹칠 때) */
  checking: Promise<void> | null
  readyWaiters: Array<() => void>
}

let state: SwState | null = null

function markReady() {
  if (!state || state.ready) return
  state.ready = true
  for (const w of state.readyWaiters.splice(0)) w()
}

async function checkNow(force = false) {
  const s = state
  if (!s?.reg) return
  const now = Date.now()
  if (!force && !shouldCheck(s.lastCheckAt, now)) return
  s.lastCheckAt = now
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  // update() 는 새 파일을 찾으면 설치를 시작한 뒤(registration.installing 이 생긴 뒤) 끝난다
  const p = s.reg.update().then(() => undefined, () => undefined)   // 오프라인·서버 오류 — 다음에 다시
  s.checking = p
  await p
  if (s.checking === p) s.checking = null
}

function waitActivated(sw: ServiceWorker): Promise<void> {
  return new Promise((resolve) => {
    if (sw.state === 'activated' || sw.state === 'redundant') return resolve()
    const on = () => {
      if (sw.state === 'activated' || sw.state === 'redundant') { sw.removeEventListener('statechange', on); resolve() }
    }
    sw.addEventListener('statechange', on)
  })
}

/** 로그인·가입 화면 앞 — 진행 중인 업데이트가 있으면 넘겨받을 때까지 잠깐 기다린다(모두 합쳐 길어야 약 12초, 보통 즉시) */
async function settle() {
  const s = state
  if (!s) return
  const reg = s.reg ?? (await timeout(s.regPromise, 3000)) ?? null
  if (!reg) return
  if (s.checking) await timeout(s.checking, 3000)   // 막 연 직후의 확인이 아직 도는 중이면 그 결과를 본다
  else if (!reg.installing && !reg.waiting && shouldCheck(s.lastCheckAt, Date.now(), SW_AUTH_CHECK_GAP_MS)) {
    await timeout(checkNow(true), 3000)
  }
  const incoming = reg.installing ?? reg.waiting
  if (!incoming) return
  await timeout(waitActivated(incoming), 8000)
  // 넘겨받음(controllerchange)은 활성화 바로 뒤에 온다
  if (!s.ready) await timeout(new Promise<void>((r) => s.readyWaiters.push(r)), 1000)
}

/**
 * 라우터에 연결한다(createRouter.ts). 서비스 워커를 못 쓰면 아무것도 하지 않는다.
 * register: 서비스 워커를 등록하고 새 버전이 넘겨받으면 onNeedReload 를 부른다(swRegister.ts — 시험에서는 가짜)
 */
export function installSwUpdate(
  router: Router,
  register: (h: { onNeedReload: () => void; onRegistered: (r: ServiceWorkerRegistration | undefined) => void; onError: () => void }) => void,
) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  let resolveReg!: (r: ServiceWorkerRegistration | null) => void
  state = { reg: null, regPromise: new Promise((r) => { resolveReg = r }), ready: false, lastCheckAt: 0, checking: null, readyWaiters: [] }
  const s = state

  // 넘겨받음 — 이 화면이 이미 서비스 워커 아래서 열렸을 때만 '새 버전'이다(처음 설치 때의 넘겨받음은 아님)
  let hadController = !!navigator.serviceWorker.controller
  try {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) markReady()
      hadController = true
    })
  } catch { /* 막힌 환경 */ }

  try {
    register({
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
  router.afterEach(() => { void checkNow() })

  router.beforeResolve(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    const fromStart = from === START_LOCATION
    if (isAuthEntry(to.path)) await settle()
    let store: Storage | null = null
    try { store = window.sessionStorage } catch { /* 막힌 환경 */ }
    const d = swReloadDecision(store, { ready: s.ready, fromStart, fromPath: from.path, toPath: to.path, now: Date.now() })
    if (d !== 'reload') return true
    window.location.assign(router.resolve(to.fullPath).href)
    return false
  })
}

/** 시험용 — 상태 비우기 */
export function _resetSwUpdateForTest() { state = null }
