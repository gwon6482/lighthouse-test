<template>
  <div class="home">
    <h1 class="title">라이트하우스 테스트 페이지</h1>

    <!-- 로그인 전 -->
    <section v-if="!authStore.isLoggedIn" class="login-panel">
      <p class="login-panel__desc">아이디/비밀번호를 입력한 뒤 로그인하거나 회원가입 버튼을 눌러주세요.</p>
      <form @submit.prevent="handleLogin" class="login-panel__form">
        <div class="login-panel__field">
          <label class="login-panel__label">아이디</label>
          <input
            type="email"
            v-model="email"
            placeholder="admin@lighthouse.com"
            class="login-panel__input"
          />
        </div>

        <div class="login-panel__field">
          <label class="login-panel__label">비밀번호</label>
          <input
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="login-panel__input"
          />
        </div>

        <p v-if="error" class="login-panel__error">{{ error }}</p>

        <div class="login-panel__actions">
          <button type="submit" class="login-panel__btn login-panel__btn--primary" :disabled="loading">
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
          <button type="button" @click="showSignUp = true" class="login-panel__btn login-panel__btn--secondary">회원가입</button>
        </div>
      </form>
    </section>

    <!-- 로그인 후 -->
    <section v-else class="user-panel">
      <div class="user-panel__avatar">{{ avatarLetter }}</div>
      <div class="user-panel__info">
        <p class="user-panel__name">{{ authStore.user?.name ?? authStore.user?.email }}</p>
        <p class="user-panel__email">{{ authStore.user?.email }}</p>
        <div class="user-panel__meta" v-if="authStore.user?.age || authStore.user?.gender">
          <span v-if="authStore.user?.age">{{ authStore.user.age }}세</span>
          <span v-if="authStore.user?.gender">{{ authStore.user.gender === 'M' ? '남성' : '여성' }}</span>
        </div>
      </div>
      <div class="user-panel__actions">
        <RouterLink to="/mypage" class="user-panel__mypage">마이페이지</RouterLink>
        <button class="user-panel__logout" @click="handleLogout">로그아웃</button>
      </div>
    </section>

    <!-- 랜딩페이지 진입 — 별도 프로젝트(lighthouse_landing, Nuxt)로 운영, 외부 도메인 -->
    <a href="https://www.lighthouse.career" target="_blank" rel="noopener" class="landing-link">
      <span class="landing-link__icon">🌟</span>
      <span class="landing-link__text">랜딩페이지</span>
      <span class="landing-link__arrow">↗</span>
    </a>

    <HomeButtonContainer :menus="menus" />
    <button @click="lastPage" style="display: none;">마지막 페이지</button>

    <!-- 개발자 기능 -->
    <section class="dev-tools">
      <div class="dev-tools__head">
        <span class="dev-tools__badge">DEV</span>
        <h2 class="dev-tools__title">개발자 기능</h2>
      </div>

      <!-- 오늘 날짜 시뮬레이션 -->
      <div class="dev-tools__group">
        <h3 class="dev-tools__group-title">오늘 날짜 시뮬레이션</h3>
        <p class="dev-tools__desc">
          진로달성 페이지가 "오늘"을 인식하는 날짜를 임의로 바꿔서 테스트할 수 있어요.
          <strong v-if="devDate">현재: {{ devDate }}</strong>
          <strong v-else>현재: 실제 오늘 사용 중</strong>
        </p>
        <div class="dev-tools__row">
          <input v-model="devDateInput" type="date" class="dev-tools__input" />
          <button class="dev-tools__btn dev-tools__btn--primary" @click="applyDevDate">적용</button>
          <button class="dev-tools__btn" @click="clearDevDate">실제 오늘로</button>
        </div>
        <div class="dev-tools__row dev-tools__row--step">
          <button class="dev-tools__btn dev-tools__btn--step" @click="shiftDevDate(-1)">‹ 이전날</button>
          <button class="dev-tools__btn dev-tools__btn--step" @click="shiftDevDate(1)">다음날 ›</button>
        </div>
      </div>

      <!-- 진행상황 초기화 -->
      <div class="dev-tools__group">
        <h3 class="dev-tools__group-title">진행상황 초기화</h3>
        <p class="dev-tools__desc">
          완료 마킹, 기록, 축하 상태, 주간 일정(WeeklySchedule)을 모두 지웁니다.
          진로계획·프로젝트·루틴 같은 마스터 데이터는 유지돼요.
        </p>
        <div class="dev-tools__row">
          <button
            class="dev-tools__btn dev-tools__btn--danger"
            :disabled="resetting"
            @click="resetProgress"
          >
            {{ resetting ? '초기화 중...' : '진행상황 초기화' }}
          </button>
        </div>
      </div>
    </section>

    <SignUpModal v-model="showSignUp" @registered="onRegistered" />

    <!-- 진로달성 데일리 / 주간리뷰 선택 팝업 -->
    <Teleport to="body">
      <Transition name="ach-modal">
        <div v-if="showAchievementChoice" class="ach-modal" @click.self="showAchievementChoice = false">
          <div class="ach-modal__sheet">
            <div class="ach-modal__handle" />
            <h2 class="ach-modal__title">진로달성</h2>
            <p class="ach-modal__sub">어떤 화면으로 이동할까요?</p>
            <div class="ach-modal__btns">
              <button class="ach-modal__btn ach-modal__btn--daily" @click="pickAchievement('daily')">
                <span class="ach-modal__btn-icon">📅</span>
                <span class="ach-modal__btn-name">데일리</span>
                <span class="ach-modal__btn-desc">오늘의 할일과 루틴을 확인</span>
              </button>
              <button class="ach-modal__btn ach-modal__btn--weekly" @click="pickAchievement('weekly')">
                <span class="ach-modal__btn-icon">📝</span>
                <span class="ach-modal__btn-name">주간 리뷰</span>
                <span class="ach-modal__btn-desc">한 주를 돌아보고 다음 주를 계획</span>
              </button>
            </div>
            <button class="ach-modal__cancel" @click="showAchievementChoice = false">취소</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { ref, computed } from 'vue'
import HomeButtonContainer from '../components/page/HomeButtonContainer.vue'
import SignUpModal from '../components/SignUpModal.vue'
import { useSurvey } from '../composables/useSurvey'
import { useAuthStore } from '@/shared/stores/auth'
import { useDevDate } from '@/shared/utils/dev-date'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import { useWeeklySchedule } from '@/modules/career-achievement/composables/useWeeklySchedule'

const router = useRouter()
const { currentPageIndex, totalPages } = useSurvey()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showSignUp = ref(false)

const avatarLetter = computed(() => {
  const src = authStore.user?.name ?? authStore.user?.email ?? '?'
  return src.charAt(0).toUpperCase()
})

// 진로달성은 데일리/주간리뷰 중 선택하도록 팝업을 띄움
const showAchievementChoice = ref(false)
function pickAchievement(target: 'daily' | 'weekly') {
  showAchievementChoice.value = false
  router.push(target === 'daily' ? '/career-achievement' : '/career-achievement/weekly-review')
}

const menus = [
  { name: '자기이해', icon: '🔍', route: '/self-understanding' },
  { name: '진로백과', icon: '📚', route: '/career-encyclopedia' },
  { name: '진로설계', icon: '🗺️', route: '/career-design' },
  { name: '진로달성', icon: '🏆', onClick: () => { showAchievementChoice.value = true } },
  { name: '메인 페이지', icon: '🏠', route: '/main' },
  { name: '자기이해 랜딩페이지', icon: '🌟', route: '/self-understanding/intro' },
]

const lastPage = () => {
  currentPageIndex.value = totalPages.value - 1
  router.push('/self-understanding/test')
}

const handleLogin = async () => {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = '아이디와 비밀번호를 모두 입력해주세요.'
    return
  }
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    email.value = ''
    password.value = ''
  } catch (e: any) {
    error.value = e.response?.data?.error ?? '로그인 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
}

const onRegistered = (token: string, user: any) => {
  authStore.setAuth(token, user)
}

// ── 개발 도구: 오늘 날짜 시뮬레이션 ───────────────
const { devDate, setDevDate } = useDevDate()
const devDateInput = ref(devDate.value ?? '')

function applyDevDate() {
  const v = devDateInput.value.trim()
  if (!v) return
  setDevDate(v)
}

function clearDevDate() {
  devDateInput.value = ''
  setDevDate(null)
}

// 이전/다음 날로 한 칸 이동. 현재 devDate 가 있으면 그 기준, 없으면 실제 오늘 기준.
function shiftDevDate(delta: number) {
  const base = devDate.value
    ? new Date(devDate.value + 'T00:00:00')
    : new Date()
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() + delta)
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  const next = `${y}-${m}-${d}`
  devDateInput.value = next
  setDevDate(next)
}

// ── 진행상황 초기화 ───────────────────────────────
// localStorage 의 완료 마킹·기록·축하 + 모든 WeeklySchedule 을 삭제.
// 진로계획·프로젝트·루틴 같은 마스터 데이터는 그대로 유지.
const resetting = ref(false)
const { fetchMyPlans } = useCareerDesign()
const { fetchSchedules, deleteSchedule } = useWeeklySchedule()

async function resetProgress() {
  const ok = confirm(
    '진행상황을 초기화할까요?\n\n' +
    '· 완료 마킹·기록·축하 상태 (localStorage)\n' +
    '· 모든 주간 일정(WeeklySchedule)\n' +
    '· 오늘 날짜 시뮬레이션\n\n' +
    '진로계획·프로젝트·루틴 등 마스터 데이터는 유지됩니다.'
  )
  if (!ok) return

  resetting.value = true
  try {
    // 1) localStorage 진행상황 키 클리어
    const fixedKeys = [
      'lh_achievement_v1',
      'lh_curriculum_items_v1',
      'lh_achievement_entries_v1',
    ]
    for (const k of fixedKeys) localStorage.removeItem(k)
    // lh_celebration_YYYY-MM-DD 들
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith('lh_celebration_')) localStorage.removeItem(k)
    }

    // 2) BE WeeklySchedule 전부 삭제 (모든 plan 의 모든 weekStart)
    try {
      const plans = await fetchMyPlans()
      for (const plan of plans) {
        if (!plan?.planId) continue
        const schedules = await fetchSchedules(plan.planId)
        for (const s of schedules) {
          await deleteSchedule(plan.planId, s.weekStart)
        }
      }
    } catch (err) {
      // BE 실패해도 localStorage 는 이미 초기화됨 — 사용자에 알리고 계속 진행
      console.warn('[resetProgress] BE WeeklySchedule 삭제 일부 실패', err)
    }

    // 3) dev-date 초기화
    setDevDate(null)
    devDateInput.value = ''

    // 4) 새로고침으로 모든 상태 클린 로드
    location.reload()
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped lang="scss">
/* 랜딩페이지 진입 — button-container 와 동일 폭, login/user panel 과 동일 간격 */
.landing-link {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;             // button-container 와의 간격 (panel 들과 동일)
  padding: 16px 20px;
  background: linear-gradient(135deg, #FFFBEC 0%, #FFF1D6 100%);
  border: 1px solid #FFE99A;
  border-radius: 1rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 3px 12px rgba(255, 199, 0, 0.10);
  transition: transform 0.08s, box-shadow 0.15s, border-color 0.15s;
  box-sizing: border-box;

  @media (min-width: 768px) {
    max-width: 480px;
  }

  &:hover {
    border-color: #FFC700;
    box-shadow: 0 5px 18px rgba(255, 199, 0, 0.20);
  }

  &:active { transform: scale(0.985); }

  &__icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: 0 2px 6px rgba(255, 199, 0, 0.18);
  }

  &__text {
    flex: 1;
    font-size: 16px;
    font-weight: 800;
    color: #222;
    letter-spacing: -0.2px;
  }

  &__arrow {
    flex-shrink: 0;
    font-size: 22px;
    font-weight: 700;
    color: #B07800;
  }
}

.dev-tools {
  width: 100%;
  max-width: 400px;
  margin-top: 1.5rem;
  background: #1a1a1a;
  color: #fff;
  border-radius: 1rem;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;

  @media (min-width: 768px) {
    max-width: 480px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__badge {
    background: #FFC700;
    color: #1a1a1a;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 0 4px;
    border-top: 1px solid #2a2a2a;

    &:first-of-type { padding-top: 4px; border-top: none; }
  }

  &__group-title {
    font-size: 12px;
    font-weight: 800;
    color: #FFC700;
    letter-spacing: 0.4px;
    margin: 0;
  }

  &__desc {
    font-size: 12px;
    color: #bbb;
    line-height: 1.5;
    margin: 0;

    strong { color: #FFC700; font-weight: 700; margin-left: 6px; }
  }

  &__row {
    display: flex;
    gap: 8px;
    margin-top: 4px;

    &--step {
      margin-top: 6px;
    }
  }

  &__input {
    flex: 1;
    min-width: 0;
    background: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;

    &:focus { border-color: #FFC700; }
    &::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); cursor: pointer; }
  }

  &__btn {
    background: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;

    &:hover { background: #3a3a3a; }

    &--primary {
      background: #FFC700;
      color: #1a1a1a;
      border-color: #FFC700;
      font-weight: 800;

      &:hover { background: #FFB300; }
    }

    &--step {
      flex: 1;
      background: #2a2a2a;
      color: #FFD84D;
      border-color: #3a3a3a;
      font-weight: 800;

      &:hover { background: #3a3a3a; color: #FFE99A; }
    }

    &--danger {
      background: #3a1f1f;
      color: #FF7A6B;
      border-color: #5a2a2a;
      font-weight: 800;

      &:hover { background: #5a2a2a; color: #fff; }
      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        background: #2a1818;
      }
    }
  }
}
</style>

<!-- Teleport 대상은 scoped 밖에 있어야 적용됨 -->
<style lang="scss">
.ach-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  &__sheet {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 22px 22px 0 0;
    padding: 14px 22px 28px;
    box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__handle {
    width: 44px;
    height: 4px;
    border-radius: 2px;
    background: #DDD;
    align-self: center;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 19px;
    font-weight: 900;
    color: #222;
    margin: 0;
    text-align: center;
  }

  &__sub {
    font-size: 13px;
    color: #888;
    text-align: center;
    margin: -4px 0 6px;
  }

  &__btns {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__btn {
    display: grid;
    grid-template-columns: 42px 1fr;
    grid-template-rows: auto auto;
    grid-column-gap: 14px;
    align-items: center;
    padding: 16px 18px;
    background: #fff;
    border: 1.5px solid #EEEEE8;
    border-radius: 14px;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, transform 0.08s;

    &:hover { background: #FAFAF7; }
    &:active { transform: scale(0.985); }

    &--daily {
      &:hover { border-color: #FFC700; background: #FFFBEC; }
    }
    &--weekly {
      &:hover { border-color: #4480F5; background: #EBF2FF; }
    }
  }

  &__btn-icon {
    grid-row: 1 / 3;
    font-size: 28px;
    text-align: center;
  }

  &__btn-name {
    font-size: 16px;
    font-weight: 800;
    color: #222;
    line-height: 1.2;
  }

  &__btn-desc {
    font-size: 12px;
    font-weight: 600;
    color: #888;
    line-height: 1.3;
  }

  &__cancel {
    margin-top: 4px;
    background: transparent;
    border: none;
    color: #888;
    font-size: 14px;
    font-weight: 700;
    padding: 12px;
    cursor: pointer;

    &:hover { color: #444; }
  }
}

.ach-modal-enter-active, .ach-modal-leave-active {
  transition: opacity 0.18s ease;

  .ach-modal__sheet {
    transition: transform 0.22s cubic-bezier(.2,.8,.2,1);
  }
}
.ach-modal-enter-from, .ach-modal-leave-to {
  opacity: 0;

  .ach-modal__sheet { transform: translateY(40px); }
}
</style>
