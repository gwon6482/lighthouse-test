// 진로백과 '분류로 찾기'(2026-11-17) — 축(고르기 화면)·목록·'내 검사 결과로 찾기'.
// 판정·개수는 서버가 한다. 여기서는 받아 두고, 빠르게 고를 때 늦게 온 옛 응답이 새 것을 덮지 않게 앞선 요청을 끊는다.
import { ref, shallowRef } from 'vue'
import { fetchBrowseAxes, fetchBrowseJobs, fetchUserSurveyResults } from '../encyclopedia.api'
import { fetchSurveyAnalysis } from '@/modules/survey/survey.api'
import { useAuthStore } from '@/shared/stores/auth'
import { paramsFromState, type BrowseState } from '../lib/browseQuery'
import { myBrowseStart, type MyBrowseStart } from '../lib/browseMyStart'
import type { BrowseAxes, BrowseResult } from '../types/browse'

// ── 축 — 서버 색인이 10분마다 바뀌므로 앱도 10분 둔다 ──
const AXES_TTL_MS = 10 * 60 * 1000
let axesCache: { at: number; data: BrowseAxes } | null = null
let axesLoading: Promise<BrowseAxes> | null = null

export function loadBrowseAxes(): Promise<BrowseAxes> {
  if (axesCache && Date.now() - axesCache.at < AXES_TTL_MS) return Promise.resolve(axesCache.data)
  if (!axesLoading) {
    axesLoading = fetchBrowseAxes()
      .then(({ data }) => {
        axesCache = { at: Date.now(), data: data.data }
        return data.data
      })
      .finally(() => { axesLoading = null })
  }
  return axesLoading
}

export function useBrowseAxes() {
  const axes = shallowRef<BrowseAxes | null>(axesCache?.data ?? null)
  const failed = ref(false)
  async function load() {
    try {
      axes.value = await loadBrowseAxes()
      failed.value = false
    } catch {
      failed.value = true
    }
  }
  return { axes, failed, load }
}

const isCanceled = (e: unknown) => {
  const x = e as { name?: string; code?: string } | null
  return x?.name === 'CanceledError' || x?.code === 'ERR_CANCELED'
}

/** 목록·개수 한 갈래. run 을 새로 부르면 앞선 요청은 끊긴다 */
export function useBrowseQuery() {
  const result = shallowRef<BrowseResult | null>(null)
  const loading = ref(false)
  const failed = ref(false)
  let ctrl: AbortController | null = null

  async function run(state: BrowseState, opts: Record<string, string | number> = {}): Promise<BrowseResult | null> {
    ctrl?.abort()
    const mine = new AbortController()
    ctrl = mine
    loading.value = true
    failed.value = false
    try {
      const { data } = await fetchBrowseJobs({ ...paramsFromState(state), ...opts }, mine.signal)
      if (ctrl !== mine) return null
      result.value = data
      return data
    } catch (e) {
      if (ctrl !== mine || isCanceled(e)) return null
      failed.value = true
      return null
    } finally {
      if (ctrl === mine) loading.value = false
    }
  }

  /** 더 보기 — 지금 결과 뒤에 붙인다 */
  async function more(state: BrowseState, opts: Record<string, string | number> = {}) {
    const cur = result.value
    if (!cur || loading.value) return
    loading.value = true
    try {
      const { data } = await fetchBrowseJobs({ ...paramsFromState(state), ...opts, offset: cur.data.length, limit: cur.limit })
      if (result.value === cur) result.value = { ...cur, data: [...cur.data, ...data.data] }
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * '하나만 빼고 맞아요' 한 묶음 더 보기 — 그 묶음의 다음 조각을 받아 near 안 그 묶음 끝에 잇는다(묶음끼리는 이어 붙어 온다).
   * 옛 서버(nearPage 없음)면 아무것도 하지 않는다
   */
  const nearLoading = ref<string | null>(null)
  async function moreNear(state: BrowseState, id: string, opts: Record<string, string | number> = {}, limit = 30) {
    const cur = result.value
    if (!cur?.near || nearLoading.value) return
    const shown = cur.near.filter((r) => r.missing?.id === id)
    nearLoading.value = id
    try {
      const { data } = await fetchBrowseJobs({ ...paramsFromState(state), ...opts, limit: 1, nearMore: id, nearOffset: shown.length, nearLimit: limit })
      const page = data.nearPage
      if (result.value !== cur || !page?.data.length) return
      const seen = new Set(cur.near.map((r) => `${r.missing?.id}:${r.jobCode}`))
      const add = page.data.filter((r) => !seen.has(`${id}:${r.jobCode}`))
      const lastAt = cur.near.map((r) => r.missing?.id).lastIndexOf(id)
      const near = [...cur.near.slice(0, lastAt + 1), ...add, ...cur.near.slice(lastAt + 1)]
      result.value = { ...cur, near }
    } catch {
      /* 더 보기 버튼이 그대로 남는다 — 다시 누르면 된다 */
    } finally {
      nearLoading.value = null
    }
  }

  return { result, loading, failed, run, more, moreNear, nearLoading }
}

// ── '내 검사 결과로 찾기'(오너 결정 10) — 검사한 회원에게만. 못 받으면 조용히 입구 칸만 안 보인다 ──
// 최근 검사 찾기는 '나의 추천 진로'(EncyclopediaRecommendedPage)와 같은 순서다: 이 탭에 둔 id → 내 검사 목록의 최신
async function resolveSurveyId(): Promise<string> {
  const cached = sessionStorage.getItem('lh_survey_id')
  if (cached) return cached
  const { data } = await fetchUserSurveyResults()
  if (!data.success || !data.surveyResults.length) return ''
  const latest = [...data.surveyResults].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]
  return latest?.survey_id ?? ''
}

export function useMyBrowseStart() {
  const auth = useAuthStore()
  const mine = shallowRef<MyBrowseStart | null>(null)
  /** 회원인데 검사 결과가 없다 — 검사 안내 한 줄을 보인다 */
  const noSurvey = ref(false)
  async function load() {
    mine.value = null
    noSurvey.value = false
    if (!auth.isLoggedIn) return
    try {
      const id = await resolveSurveyId()
      if (!id) { noSurvey.value = true; return }
      const { data } = await fetchSurveyAnalysis(id)
      mine.value = data.success ? myBrowseStart(data.analysis) : null
      if (!mine.value) noSurvey.value = true
    } catch {
      /* 입구의 '내 결과로' 칸만 빠진다 */
    }
  }
  return { mine, noSurvey, load }
}
