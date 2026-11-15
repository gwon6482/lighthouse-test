/**
 * useEncyclopedia Composable
 *
 * 진로백과 기능을 관리하는 Composable
 * - 직업 상세 데이터 로드 및 상태 관리
 * - 직업 검색 및 추천 목록 관리
 * - 세부 진로 페이지 탭 관리
 * - 후기 / 준비과정 / 채용 데이터 관리
 *
 * 싱글톤 패턴으로 구현되어 상태가 전역적으로 공유됨
 */
import { ref } from 'vue'
import {
  fetchJob,
  searchJobsWide,
  fetchJobsByClassification,
  fetchExploreJobs,
  fetchRecommendedJobs,
  fetchJobReviews,
  fetchBookmarks,
  addBookmark,
  removeBookmark,
  fetchUserProfile,
  fetchUserSurveyResults,
} from '../encyclopedia.api'
import type {
  Job,
  JobSummary,
  JobSearchGroup,
  JobExploreItem,
  JobReview,
  JobDetailTab,
} from '../types/encyclopedia'

// ────────────────────────────────────────────────────────────────────────────
// 모듈 레벨 상태 (모든 인스턴스가 공유)
// ────────────────────────────────────────────────────────────────────────────

// 홈 화면
const searchQuery = ref<string>('')
const searchResults = ref<JobSummary[]>([])
// 검색어가 들어간 분류(1·2차) — 결과 위에 칩으로 띄운다
const searchGroups = ref<JobSearchGroup[]>([])
// 분류 칩을 눌러 그 분류의 직업을 보고 있을 때. null 이면 검색 결과
const searchScope = ref<JobSearchGroup | null>(null)
const scopeResults = ref<JobSummary[]>([])
// 검색 실패(네트워크 등) — '결과가 없어요'와 구분해서 보여 준다
const searchFailed = ref(false)
// 늦게 온 옛 응답이 새 검색을 덮지 않게 하는 번호
// 검색 중(직업 상세·추천이 쓰는 isLoading 과 따로 둔다 — 같이 쓰면 다른 화면의 로딩이 검색 표시를 건드린다)
const isSearching = ref(false)
let searchSeq = 0
// 진로 둘러보기에 뽑아 둔 직업 — 직업을 눌렀다 돌아와도 같은 목록이 보이게 모듈에 둔다('다른 직업 보기'나 새로 열 때만 바뀐다)
const exploreJobs = ref<JobExploreItem[]>([])
const isExploring = ref(false)
const recommendedJobs = ref<JobSummary[]>([])

// 세부 진로 페이지
const selectedJob = ref<Job | null>(null)
const activeTab = ref<JobDetailTab>('overview')

// 탭별 데이터
const reviews = ref<JobReview[]>([])

// 북마크
const bookmarkedJobCodes = ref<string[]>([])

// 유저 저장된 추천 직업 jobCodes (프로필 기반)
const userRecommendedJobCodes = ref<string[]>([])

// 로딩 / 에러 상태
const isLoading = ref(false)
const error = ref<string | null>(null)

// ────────────────────────────────────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────────────────────────────────────

export function useEncyclopedia() {

  // ── 홈 화면 ──────────────────────────────────────────────────────────────

  /** 추천 진로 목록 로드 */
  async function loadRecommendedJobs(surveyId?: string) {
    let id = surveyId ?? sessionStorage.getItem('lh_survey_id') ?? ''

    // sessionStorage에 없으면 유저 survey 이력에서 가장 최근 id 사용
    if (!id) {
      try {
        const { data: ud } = await fetchUserSurveyResults()
        if (ud.success && ud.surveyResults.length > 0) {
          const sorted = [...ud.surveyResults].sort(
            (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          )
          id = sorted[0]!.survey_id
        }
      } catch {
        // 비로그인 또는 실패 시 무시
      }
    }

    if (!id) {
      error.value = '검사 결과가 없습니다. 자기이해 검사를 먼저 완료해주세요.'
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const { data, status } = await fetchRecommendedJobs(id)
      if (status === 200) {
        recommendedJobs.value = data.data
      } else {
        throw new Error('추천 진로를 불러오는데 실패했습니다.')
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '추천 진로를 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  /** 유저 프로필에 저장된 추천 직업 jobCode 목록 로드 */
  async function loadUserRecommendedJobCodes() {
    try {
      const { data } = await fetchUserProfile()
      if (data.success) {
        userRecommendedJobCodes.value = data.user.recommendedJobs ?? []
      }
    } catch {
      // 비로그인 또는 실패 시 무시
    }
  }

  /**
   * 직업 검색(넓은 검색) — 이름·2차 분류명·일상어로 찾고, 맞는 분류는 searchGroups 로.
   * ⚠️ 시작할 때 이전 결과를 비운다. 예전에는 결과가 없으면(서버 404) catch 로 빠지면서
   *    이전 검색 결과가 화면에 그대로 남았다(2026-11-14 수정).
   */
  async function searchJob(query: string) {
    const seq = ++searchSeq
    searchQuery.value = query
    searchResults.value = []
    searchGroups.value = []
    searchScope.value = null
    scopeResults.value = []
    searchFailed.value = false
    if (!query.trim()) {
      isSearching.value = false
      return
    }
    isSearching.value = true
    error.value = null
    try {
      const { data } = await searchJobsWide(query.trim())
      if (seq !== searchSeq) return
      searchResults.value = data.data ?? []
      searchGroups.value = data.groups ?? []
    } catch (e) {
      if (seq !== searchSeq) return
      // 404 = 결과 없음(넓은 검색을 모르는 옛 서버). 그 밖은 실패
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status !== 404) {
        searchFailed.value = true
        error.value = '검색에 실패했습니다.'
      }
    } finally {
      if (seq === searchSeq) isSearching.value = false
    }
  }

  /** 분류 칩을 눌렀을 때 — 그 분류의 직업 전체를 보여 준다(검색어·검색 결과는 그대로 두고 위에 덮는다) */
  async function openSearchGroup(group: JobSearchGroup) {
    const seq = ++searchSeq
    searchScope.value = group
    scopeResults.value = []
    searchFailed.value = false
    isSearching.value = true
    try {
      const { data } = await fetchJobsByClassification(group.level, group.name)
      if (seq !== searchSeq) return
      scopeResults.value = data.data ?? []
    } catch {
      if (seq !== searchSeq) return
      searchFailed.value = true
    } finally {
      if (seq === searchSeq) isSearching.value = false
    }
  }

  /** 분류 보기 → 검색 결과로 돌아가기 */
  function closeSearchGroup() {
    searchSeq++
    searchScope.value = null
    scopeResults.value = []
    searchFailed.value = false
    isSearching.value = false
  }

  /** 검색 결과 초기화 */
  function clearSearch() {
    searchSeq++
    searchQuery.value = ''
    searchResults.value = []
    searchGroups.value = []
    searchScope.value = null
    scopeResults.value = []
    searchFailed.value = false
    isSearching.value = false
  }

  /**
   * 진로 둘러보기 — 서로 다른 직무에서 직업 5개를 무작위로 받는다.
   * force 가 아니면 이미 뽑아 둔 목록을 그대로 쓴다. 실패하면 목록을 비워 둔다(화면이 고정 목록으로 대신한다).
   */
  async function loadExploreJobs(force = false) {
    if (isExploring.value || (!force && exploreJobs.value.length)) return
    isExploring.value = true
    try {
      const { data } = await fetchExploreJobs(5)
      if (data.data?.length) exploreJobs.value = data.data
    } catch {
      // 둘러보기는 없어도 화면은 된다
    } finally {
      isExploring.value = false
    }
  }

  // ── 세부 진로 페이지 ──────────────────────────────────────────────────────

  /** 직업 상세 로드 */
  async function loadJob(jobCode: string) {
    isLoading.value = true
    error.value = null
    selectedJob.value = null
    activeTab.value = 'overview'
    try {
      const { data, status } = await fetchJob(jobCode)
      if (status === 200) {
        selectedJob.value = data.data
      } else {
        throw new Error('직업 정보를 불러오는데 실패했습니다.')
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '직업 정보를 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  /** 탭 전환 */
  function setActiveTab(tab: JobDetailTab) {
    activeTab.value = tab
  }

  // ── 후기 탭 ──────────────────────────────────────────────────────────────

  async function loadReviews(jobCode: string) {
    isLoading.value = true
    error.value = null
    try {
      const { data, status } = await fetchJobReviews(jobCode)
      if (status === 200) {
        reviews.value = data.data
      } else {
        throw new Error('후기를 불러오는데 실패했습니다.')
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '후기를 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  // ── 북마크 ────────────────────────────────────────────────────────────────

  /** 북마크 목록 로드 (로그인 상태에서만 호출) */
  async function loadBookmarks() {
    try {
      const { data, status } = await fetchBookmarks()
      if (status === 200) {
        bookmarkedJobCodes.value = data.bookmarkedJobs.map(j => j.jobCode)
      }
    } catch {
      // 비로그인 또는 실패 시 무시
    }
  }

  /** 북마크 토글 (이미 북마크면 해제, 아니면 추가) */
  async function toggleBookmark(jobCode: string) {
    const isBookmarked = bookmarkedJobCodes.value.includes(jobCode)
    if (isBookmarked) {
      await removeBookmark(jobCode)
      bookmarkedJobCodes.value = bookmarkedJobCodes.value.filter(c => c !== jobCode)
    } else {
      await addBookmark(jobCode)
      bookmarkedJobCodes.value.push(jobCode)
    }
  }

  return {
    // 상태
    searchQuery,
    searchResults,
    searchGroups,
    searchScope,
    scopeResults,
    searchFailed,
    isSearching,
    exploreJobs,
    isExploring,
    recommendedJobs,
    selectedJob,
    activeTab,
    reviews,
    isLoading,
    error,

    // 홈
    loadRecommendedJobs,
    searchJob,
    openSearchGroup,
    closeSearchGroup,
    clearSearch,
    loadExploreJobs,

    // 세부 진로
    loadJob,
    setActiveTab,

    // 탭별
    loadReviews,

    // 북마크
    bookmarkedJobCodes,
    loadBookmarks,
    toggleBookmark,

    // 유저 추천 직업 (프로필 저장 기반)
    userRecommendedJobCodes,
    loadUserRecommendedJobCodes,
  }
}
