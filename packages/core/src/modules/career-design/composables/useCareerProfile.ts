// 내 진로상황(2026-11-16) — 진로계획을 세울 때 묻고(내 진로상황 단계), 마이페이지에서 언제든 고친다.
//
// 서버의 내 정보(GET/PUT/DELETE /api/user/career-profile)에 둔다 — 다음 계획·다른 기기에서도 같은 답을 쓴다(오너 결정).
// 화면 여러 곳(단계·템플릿·마이페이지)이 같은 값을 보도록 모듈에 하나만 들고 있다. 처음 한 번 불러오고, 저장하면 바꿔 끼운다.
// 경력·성과(records)는 계획에 반영하지 않는다 — 나중에 포트폴리오에 쓴다.
import { ref } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import { deleteCareerProfile, fetchCareerProfile, putCareerProfile } from '../careerProfile.api'
import type { CareerProfile, CareerRecordKind, CareerSchool } from '../types/career-design'

export const SCHOOL_OPTIONS: { value: CareerSchool; label: string }[] = [
  { value: 'high', label: '고등학생' },
  { value: 'hs_grad', label: '고등학교 졸업' },
  { value: 'college', label: '대학생(휴학 포함)' },
  { value: 'college_grad', label: '대학 졸업' },
  { value: 'grad_school', label: '대학원생' },
  { value: 'grad_done', label: '대학원 졸업' },
]
// 학년 — 1·2·3·4+(4 = 4학년 이상, 2026-11-16 오너)
export const YEAR_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4+' },
]
export const RECORD_KINDS: { value: CareerRecordKind; label: string }[] = [
  { value: 'cert', label: '자격증·면허' },
  { value: 'language', label: '어학' },
  { value: 'work', label: '일·경력' },
  { value: 'activity', label: '활동·봉사' },
  { value: 'award', label: '수상' },
  { value: 'education', label: '교육·수료' },
  { value: 'project', label: '작품·프로젝트' },
  { value: 'etc', label: '기타' },
]
export const recordKindLabel = (k: CareerRecordKind) => RECORD_KINDS.find((x) => x.value === k)?.label ?? '기타'

/** 대학에 다니고 있거나 졸업한 단계인가(학과 질문을 하는 단계) */
export const atCollege = (s?: CareerSchool) => s === 'college' || s === 'college_grad' || s === 'grad_school' || s === 'grad_done'

export const emptyProfile = (): CareerProfile => ({ relatedJobs: [], has: [], records: [] })
export const cloneProfile = (p: CareerProfile): CareerProfile => ({
  ...p,
  relatedJobs: p.relatedJobs.map((j) => ({ ...j })),
  has: p.has.map((h) => ({ ...h })),
  records: p.records.map((r) => ({ ...r })),
})

/** 서버 응답 → 화면용(빠진 목록을 빈 목록으로) */
export function normalizeProfile(p: Partial<CareerProfile> | null | undefined): CareerProfile | null {
  if (!p) return null
  return {
    ...p,
    relatedJobs: [...(p.relatedJobs ?? [])],
    has: [...(p.has ?? [])],
    records: [...(p.records ?? [])],
  } as CareerProfile
}

/** 가입 때 고른 지금 상황 → 학교. 1 중·고등학생은 고등학생으로(중학생은 대상이 아니다), 2 대학생. 3·4 는 학교를 알 수 없다 */
export const schoolFromOnboarding = (status?: number | null): CareerSchool | undefined =>
  status === 1 ? 'high' : status === 2 ? 'college' : undefined

export const yearLabel = (y?: number) => (!y ? '' : y >= 4 ? '4학년 이상' : `${y}학년`)

/** 마이페이지·템플릿 요약 한 줄 — "대학생 2학년 · 간호학과" */
export function schoolSummary(p: CareerProfile | null): string {
  if (!p?.school) return ''
  const label = SCHOOL_OPTIONS.find((o) => o.value === p.school)?.label.replace('(휴학 포함)', '') ?? ''
  const head = p.school === 'college' && p.year ? `${label} ${yearLabel(p.year)}` : label
  return [head, atCollege(p.school) ? p.major : ''].filter(Boolean).join(' · ')
}

/** 적은 것이 하나라도 있는가 */
export const hasAnything = (p: CareerProfile | null) =>
  !!p && (!!p.school || !!p.major || p.relatedJobs.length > 0 || p.has.length > 0 || p.records.length > 0)

// ── 모듈에 하나만 ──
const profile = ref<CareerProfile | null>(null)
const onboardingStatus = ref<number | null>(null)
let loading: Promise<CareerProfile | null> | null = null
let loaded = false
let loadedFor: string | null = null   // 불러온 계정의 토큰 — 다른 계정으로 바뀌면(로그아웃 뒤 다시 로그인) 다시 불러온다

export function useCareerProfile() {
  const auth = useAuthStore()
  /** 서버에서 불러온다(한 번만 — force 면 다시). 실패하면 null(비로그인 등) */
  function load(force = false): Promise<CareerProfile | null> {
    if (loadedFor !== (auth.token ?? null)) { profile.value = null; onboardingStatus.value = null; loaded = false; loading = null }
    if (loaded && !force) return Promise.resolve(profile.value)
    if (!loading || force) {
      loading = fetchCareerProfile()
        .then(({ data }) => {
          profile.value = normalizeProfile(data.careerProfile)
          onboardingStatus.value = data.onboardingStatus ?? null
          loaded = true
          loadedFor = auth.token ?? null
          return profile.value
        })
        .catch(() => null)
        .finally(() => { loading = null })
    }
    return loading
  }

  /** 통째로 저장한다. 성공하면 서버가 정리한 값으로 바꿔 끼운다 */
  async function save(next: CareerProfile): Promise<boolean> {
    try {
      const { data } = await putCareerProfile(next)
      profile.value = normalizeProfile(data.careerProfile)
      loaded = true
      loadedFor = auth.token ?? null
      return true
    } catch {
      return false
    }
  }

  async function remove(): Promise<boolean> {
    try {
      await deleteCareerProfile()
      profile.value = null
      loaded = true
      loadedFor = auth.token ?? null
      return true
    } catch {
      return false
    }
  }

  /** 로그아웃·탈퇴 때 비운다 */
  function reset() {
    profile.value = null
    onboardingStatus.value = null
    loaded = false
    loading = null
    loadedFor = null
  }

  return { profile, onboardingStatus, load, save, remove, reset }
}
