<template>
  <Teleport to="body">
    <Transition name="jobmodal">
      <div v-if="modelValue" class="jobmodal-overlay" @click.self="close">
        <div class="jobmodal">
          <div class="jobmodal__header">
            <button class="jobmodal__close" @click="close" aria-label="닫기">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="#888" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="jobmodal__body">
            <div v-if="loading" class="jobmodal__state">개요를 불러오는 중...</div>
            <div v-else-if="error" class="jobmodal__state">
              <p>개요를 불러오지 못했어요.</p>
              <button class="jobmodal__retry" @click="loadJob">다시 시도</button>
            </div>
            <JobOverviewCard v-else-if="job" :job="job" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { fetchJob } from '@/modules/encyclopedia/encyclopedia.api'
import type { Job } from '@/modules/encyclopedia/types/encyclopedia'
import JobOverviewCard from './JobOverviewCard.vue'

const props = defineProps<{ modelValue: boolean; jobCode: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const job = ref<Job | null>(null)
const loading = ref(false)
const error = ref(false)

function close() {
  emit('update:modelValue', false)
}

async function loadJob() {
  if (!props.jobCode) return
  loading.value = true
  error.value = false
  job.value = null
  try {
    const { data } = await fetchJob(props.jobCode)
    job.value = data.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

// 열릴 때(또는 대상 직업이 바뀔 때) 개요 로드
watch(
  () => [props.modelValue, props.jobCode] as const,
  ([open]) => {
    if (open) loadJob()
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.jobmodal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;

  @media (min-width: 600px) {
    align-items: center;
    padding: 1rem;
  }
}

.jobmodal {
  background: #fff;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.18);

  @media (min-width: 600px) {
    border-radius: 1.25rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.875rem 0.875rem 0.5rem;
  }

  &__close {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border: none;
    background: #F5F5F0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #EEEEE8; }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem 1.5rem;
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
  }

  &__state {
    text-align: center;
    color: #888;
    font-size: 0.9375rem;
    padding: 2.5rem 0;
  }

  &__retry {
    margin-top: 0.75rem;
    padding: 0.5rem 1rem;
    border: 1px solid #E0E0DA;
    border-radius: 0.625rem;
    background: #fff;
    font-family: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }
}

.jobmodal-enter-active,
.jobmodal-leave-active {
  transition: opacity 0.2s ease;

  .jobmodal {
    transition: transform 0.25s ease;
  }
}

.jobmodal-enter-from,
.jobmodal-leave-to {
  opacity: 0;

  .jobmodal {
    transform: translateY(100%);
  }
}
</style>
