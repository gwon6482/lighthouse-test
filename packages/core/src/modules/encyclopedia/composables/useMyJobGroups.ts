// 내 최근 검사의 추천 직무 3가지 — 진로백과 메인 '나의 추천 진로' 카드와 직업 상세 배지가 함께 쓴다(2026-11-24).
// 받은 것은 검사 id별로 이 모듈에 둔다: 메인에서 받아 두면 직업 상세에서는 다시 부르지 않는다.
// 다시 검사하면 검사 id가 바뀌어 새로 받는다. 못 받으면(서버 오류) 담아 두지 않아 다음에 다시 부른다.
import { shallowRef, ref } from 'vue'
import { fetchJobGroupRecommend } from '@/modules/survey/survey.api'
import { resolveLatestSurveyId } from '@/modules/survey/lib/latestSurvey'
import type { JobGroupRecommend } from '@/modules/survey/types/survey'
import { useAuthStore } from '@/shared/stores/auth'

const bySurvey = new Map<string, Promise<JobGroupRecommend[]>>()

function groupsOf(surveyId: string): Promise<JobGroupRecommend[]> {
  let p = bySurvey.get(surveyId)
  if (!p) {
    p = fetchJobGroupRecommend(surveyId).then(({ data }) => {
      if (!data.success) throw new Error('job groups')
      return data.groups ?? []
    })
    bySurvey.set(surveyId, p)
    p.catch(() => { if (bySurvey.get(surveyId) === p) bySurvey.delete(surveyId) })
  }
  return p
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
    state.value = 'loading'
    try {
      const id = await resolveLatestSurveyId()
      if (!id) { state.value = 'noSurvey'; return }
      surveyId.value = id
      groups.value = await groupsOf(id)
      state.value = 'ready'
    } catch {
      state.value = 'failed'
    }
  }

  return { state, surveyId, groups, load }
}
