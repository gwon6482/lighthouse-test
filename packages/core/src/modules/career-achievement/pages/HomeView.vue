<template>
  <div class="home">
    <!-- 진행 화면 -->
    <ProjectView
      v-if="activeIndex !== null"
      :task="tasks[activeIndex]"
      @back="closeProject"
      @complete="completeActive"
    />

    <!-- 홈 -->
    <div v-else>
      <header class="home-top">
        <span class="home-logo"><i class="ti ti-building-lighthouse" aria-hidden="true"></i>LightHouse</span>
        <i class="ti ti-user-circle home-profile" aria-hidden="true"></i>
      </header>

      <DayProgressCard
        class="home-status"
        :day-count="dayCount"
        :date="date"
        :done="doneCount"
        :total="totalCount"
      />

      <div class="home-section-head">
        <span class="home-bar home-bar--task"></span>
        <span class="home-section-title">오늘 할 일</span>
      </div>
      <p class="home-subline">첫날이에요. 이것 하나부터 가볍게 시작해요.</p>

      <div class="home-tasks">
        <TaskCard
          v-for="(task, i) in tasks"
          :key="i"
          :task="task"
          @open="openProject(i)"
          @toggle="toggleTask(i)"
        />
      </div>

      <div class="home-section-head">
        <span class="home-bar home-bar--routine"></span>
        <span class="home-section-title">오늘의 루틴</span>
        <span class="home-count">{{ routineDone }} / {{ routines.length }}</span>
      </div>
      <RoutineList :routines="routines" @toggle="toggleRoutine" />

      <nav class="home-nav">
        <span class="home-nav-item"><i class="ti ti-map-2" aria-hidden="true"></i>로드맵</span>
        <span class="home-nav-item home-nav-item--active"><i class="ti ti-home" aria-hidden="true"></i>홈</span>
        <span class="home-nav-item"><i class="ti ti-user" aria-hidden="true"></i>마이</span>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DayProgressCard from './DayProgressCard.vue'
import TaskCard from './TaskCard.vue'
import RoutineList from './RoutineList.vue'
import ProjectView from './ProjectView.vue'

const dayCount = ref(1)
const date = ref('9월 10일 (목)')

const tasks = ref([
  { title: '예술경영 아카데미 수료 · 경영전략', category: '자격요건', bg: '#EAF3DE', fg: '#27500A', meta: '계획 30분', done: false },
  { title: '공연·전시 기획론', category: '분야지식', bg: '#FAECE7', fg: '#712B13', meta: '계획 20분', done: false },
])
const routines = ref([
  { title: '매일 30분 독서', meta: '30분', done: false },
  { title: '영어 단어 10개 외우기', meta: '30분', done: true },
])

const activeIndex = ref(null)

const totalCount = computed(() => tasks.value.length + routines.value.length)
const doneCount = computed(
  () => tasks.value.filter((t) => t.done).length + routines.value.filter((r) => r.done).length,
)
const routineDone = computed(() => routines.value.filter((r) => r.done).length)

function openProject(i) { activeIndex.value = i }
function closeProject() { activeIndex.value = null }
function completeActive() {
  if (activeIndex.value !== null) tasks.value[activeIndex.value].done = true
  closeProject()
}
function toggleTask(i) { tasks.value[i].done = !tasks.value[i].done }
function toggleRoutine(i) { routines.value[i].done = !routines.value[i].done }
</script>

<style scoped>
.home {
  --home-surface: #ffffff;
  --home-border: #eceef0;
  --home-text: #374151;
  --home-muted: #9ca3af;
  --home-sub: #6b7280;

  background: var(--home-page, #f7f8fa);
  border-radius: 16px;
  padding: 14px;
  max-width: 400px;
}

.home-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 14px;
}
.home-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
}
.home-logo .ti {
  font-size: 20px;
  color: #ef9f27;
}
.home-profile {
  font-size: 22px;
  color: var(--home-muted);
}

.home-status {
  margin-bottom: 20px;
}

.home-section-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
}
.home-bar {
  width: 3px;
  height: 15px;
  border-radius: 2px;
}
.home-bar--task { background: #ffd100; }
.home-bar--routine { background: #5bb8f5; }
.home-section-title {
  font-size: 16px;
  font-weight: 500;
}
.home-count {
  font-size: 12px;
  color: var(--home-muted);
}

.home-subline {
  margin: 0 0 12px 10px;
  font-size: 13px;
  color: var(--home-sub);
}

.home-tasks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;
}
.home-section-head + .home-subline + .home-tasks {
  margin-bottom: 22px;
}
.home-section-head:has(.home-bar--routine) {
  margin-bottom: 12px;
}

.home-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 0.5px solid var(--home-border);
  margin-top: 18px;
  padding-top: 12px;
}
.home-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--home-muted);
}
.home-nav-item .ti {
  font-size: 21px;
}
.home-nav-item--active {
  color: #ba7517;
}
</style>
