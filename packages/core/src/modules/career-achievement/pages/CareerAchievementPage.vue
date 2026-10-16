<template>
  <div class="lh-page ca-page">
    <AppHeader />

    <!-- 진행 화면 -->
    <ProjectView
      v-if="activeIndex !== null && tasks[activeIndex]"
      :task="tasks[activeIndex]"
      @back="closeProject"
      @complete="completeActive"
    />

    <!-- 홈 -->
    <template v-else>
      <!-- ─── 섹션 1: 오늘의 달성률 ─────────────────── -->
      <section class="m-sec white">
        <DayProgressCard
          :day-count="dayCount"
          :date="date"
          :done="doneCount"
          :total="totalCount"
        />
      </section>

      <!-- ─── 섹션 2: 오늘 할 일 ─────────────────── -->
      <section class="m-sec gray">
        <span class="m-lbl y">오늘 할 일</span>
        <h2 class="m-ttl">두 가지만 해봐요</h2>
        <p class="m-sub">첫날이에요. 이것 하나부터 가볍게 시작해요.</p>

        <div class="home-tasks">
          <TaskCard
            v-for="(task, i) in tasks"
            :key="i"
            :task="task"
            @open="openProject(i)"
            @toggle="toggleTask(i)"
          />
        </div>
      </section>

      <!-- ─── 섹션 3: 오늘의 루틴 ─────────────────── -->
      <section class="m-sec white">
        <span class="m-lbl s">오늘의 루틴</span>
        <h2 class="m-ttl">꾸준함이 힘이에요</h2>
        <p class="m-sub">{{ routineDone }} / {{ routines.length }} 완료</p>

        <RoutineList :routines="routines" @toggle="toggleRoutine" />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DayProgressCard from '../components/DayProgressCard.vue'
import TaskCard from '../components/TaskCard.vue'
import RoutineList from '../components/RoutineList.vue'
import ProjectView from '../components/ProjectView.vue'
import AppHeader from '../../../shared/components/AppHeader.vue'

const dayCount = ref(1)
const date = ref('9월 10일 (목)')

const tasks = ref([
  {
    title: '예술경영 아카데미 수료 · 경영전략',
    category: '자격요건',
    bg: '#EAF3DE',
    fg: '#27500A',
    meta: '계획 30분',
    done: false,
  },
  {
    title: '공연·전시 기획론',
    category: '분야지식',
    bg: '#FAECE7',
    fg: '#712B13',
    meta: '계획 20분',
    done: false,
  },
])
const routines = ref([
  { title: '매일 30분 독서', meta: '30분', done: false },
  { title: '영어 단어 10개 외우기', meta: '30분', done: true },
])

const activeIndex = ref<number | null>(null)

const totalCount = computed(() => tasks.value.length + routines.value.length)
const doneCount = computed(
  () => tasks.value.filter((t) => t.done).length + routines.value.filter((r) => r.done).length,
)
const routineDone = computed(() => routines.value.filter((r) => r.done).length)

function openProject(i: number) {
  activeIndex.value = i
}
function closeProject() {
  activeIndex.value = null
}
function completeActive() {
  if (activeIndex.value === null) return
  const task = tasks.value[activeIndex.value]
  if (task) task.done = true
  closeProject()
}
function toggleTask(i: number) {
  const task = tasks.value[i]
  if (task) task.done = !task.done
}
function toggleRoutine(i: number) {
  const routine = routines.value[i]
  if (routine) routine.done = !routine.done
}
</script>

<style lang="scss">
.ca-page {
  padding-bottom: 96px; // 하단 고정 BottomNav(App.vue 전역 렌더)에 콘텐츠가 가리지 않도록

  .home-tasks {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
