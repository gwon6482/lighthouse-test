// 내 최근 검사의 추천 직무 3가지와 목표 진로 — 진로백과 메인 '나의 추천 진로' 카드와 직업 상세 배지가 함께 쓴다(2026-11-24).
// 받은 것은 이 모듈에 담아 둔다: 메인에서 받아 두면 직업 상세·메인으로 돌아올 때 다시 부르지 않는다(자리도 바로 정해진다).
//   - 열쇠는 '계정 세대:검사 id'(shared/auth/accountScope) — 같은 탭에서 계정을 바꾸면 앞 계정 것을 꺼내 쓸 수 없다(검토 1번).
//   - 계정이 바뀌면 모두 비운다. 다시 검사하면 검사 id 가 바뀌어 새로 받는다. 못 받은 것(서버 오류)은 담지 않는다.
import { shallowRef, ref } from 'vue'
import { fetchJobGroupRecommend } from '@/modules/survey/survey.api'
import { resolveLatestSurveyId } from '@/modules/survey/lib/latestSurvey'
import type { JobGroupRecommend } from '@/modules/survey/types/survey'
import { accountGeneration, onAccountChange } from '@/shared/auth/accountScope'
import { useAuthStore } from '@/shared/stores/auth'
import { fetchTargetCareer } from '../encyclopedia.api'
import { targetLine, type TargetLine } from '../lib/myJobGroups'

const groupsCache = new Map<string, Promise<JobGroupRecommend[]>>()
let targetCache: { gen: number; p: Promise<TargetLine | null> } | null = null
onAccountChange(() => {
  groupsCache.clear()
  targetCache = null
})

function groupsOf(gen: number, surveyId: string): Promise<JobGroupRecommend[]> {
  const key = `${gen}:${surveyId}`
  let p = groupsCache.get(key)
  if (!p) {
    p = fetchJobGroupRecommend(surveyId).then(({ data }) => {
      if (!data.success) throw new Error('job groups')
      return data.groups ?? []
    })
    groupsCache.set(key, p)
    p.catch(() => { if (groupsCache.get(key) === p) groupsCache.delete(key) })
  }
  return p
}

/** 이미 받아 둔 직무가 있나(받는 동안 자리를 그릴지 정할 때) */
export function hasCachedGroups(surveyId: string): boolean {
  return groupsCache.has(`${accountGeneration()}:${surveyId}`)
}

/** 목표 진로 한 줄(직업이면 직업 코드까지). 없거나 못 받으면 null. 계정 세대마다 한 번 */
export function loadMyTarget(): Promise<TargetLine | null> {
  const gen = accountGeneration()
  if (targetCache?.gen === gen) return targetCache.p
  const p = fetchTargetCareer()
    .then(({ data }) => (data.success ? targetLine(data.targetCareer) : null))
  const entry = { gen, p: p.catch(() => null) }
  targetCache = entry
  p.catch(() => { if (targetCache === entry) targetCache = null }) // 실패는 다음에 다시
  return entry.p
}

/**
 * state: 'idle'(아직) · 'loading' · 'guest'(비로그인) · 'noSurvey'(검사 없음) · 'ready' · 'failed'
 * 화면마다 새로 만든다(상태는 화면 것, 받은 응답만 모듈에서 나눠 쓴다).
 */
export type MyJobGroupsState = 'idle' | 'loading' | 'guest' | 'noSurvey' | 'ready' | 'failed'

export function useMyJobGroups() {
  const auth = useAuthStore()
  const state = ref<MyJobGroupsState>(auth.isLoggedIn ? 'idle' : 'guest')
  const surveyId = ref('')
  const groups = shallowRef<JobGroupRecommend[]>([])

  async function load() {
    groups.value = []
    surveyId.value = ''
    if (!auth.isLoggedIn) { state.value = 'guest'; return }
    const gen = accountGeneration()
    state.value = 'loading'
    try {
      const id = await resolveLatestSurveyId()
      if (accountGeneration() !== gen) return // 받는 사이 계정이 바뀌었다 — 바뀐 화면이 다시 부른다
      if (!id) { state.value = 'noSurvey'; return }
      surveyId.value = id // 직무를 못 받아도 '결과에서 보기'는 남긴다
      const g = await groupsOf(gen, id)
      if (accountGeneration() !== gen) return
      groups.value = g
      state.value = 'ready'
    } catch {
      if (accountGeneration() === gen) state.value = 'failed'
    }
  }

  return { state, surveyId, groups, load }
}
