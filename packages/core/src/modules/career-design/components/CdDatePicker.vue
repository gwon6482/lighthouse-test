<template>
  <div class="cd-dp" ref="rootRef">
    <!-- 트리거 -->
    <div class="cd-dp__trigger" :class="{ 'cd-dp__trigger--filled': !!modelValue }" @click="toggle">
      <span class="cd-dp__trigger-text">{{ modelValue ? fmtDisplay(modelValue) : placeholder }}</span>
      <svg class="cd-dp__icon" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M7 2v4M13 2v4M3 8h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- 캘린더 패널 -->
    <Teleport to="body">
      <Transition name="cd-dp-slide">
        <div v-if="isOpen" class="cd-dp__panel" :style="panelStyle" @click.stop>
        <!-- 월 네비게이션 -->
        <div class="cd-dp__nav">
          <button class="cd-dp__nav-btn" @click="shift(-1)">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <path d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <span class="cd-dp__nav-label">{{ viewYear }}년 {{ viewMonth + 1 }}월</span>
          <button class="cd-dp__nav-btn" @click="shift(1)">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- 요일 헤더 -->
        <div class="cd-dp__weekdays">
          <span v-for="d in weekdays" :key="d.label" :class="['cd-dp__wd', d.cls]">{{ d.label }}</span>
        </div>

        <!-- 날짜 그리드 -->
        <div class="cd-dp__grid">
          <button
            v-for="cell in cells"
            :key="cell.key"
            class="cd-dp__cell"
            :class="{
              'cd-dp__cell--out':       !cell.inMonth,
              'cd-dp__cell--selected':  cell.isSelected,
              'cd-dp__cell--today':     cell.isToday && !cell.isSelected,
              'cd-dp__cell--sun':       cell.isSun && cell.inMonth,
              'cd-dp__cell--sat':       cell.isSat && cell.inMonth,
              'cd-dp__cell--disabled':  cell.isDisabled,
            }"
            :disabled="cell.isDisabled"
            @click="pick(cell.dateStr, cell.isDisabled)"
          >
            {{ cell.day }}
          </button>
        </div>

        <!-- 오늘 빠른 선택 -->
        <div class="cd-dp__footer">
          <button class="cd-dp__today-btn" @click="pickToday">오늘</button>
          <button class="cd-dp__clear-btn" @click="clear">초기화</button>
        </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ modelValue: string; placeholder?: string; min?: string }>()
const emit  = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const rootRef = ref<HTMLElement | null>(null)
const isOpen  = ref(false)
const panelStyle = ref<Record<string, string>>({})

const today = new Date()
const viewYear  = ref(props.modelValue ? +props.modelValue.slice(0, 4) : today.getFullYear())
const viewMonth = ref(props.modelValue ? +props.modelValue.slice(5, 7) - 1 : today.getMonth())

const PANEL_WIDTH = 300
const VIEWPORT_MARGIN = 8

function updatePanelPosition() {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)
  let left = rect.left + rect.width / 2 - width / 2
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN
  if (left + width > window.innerWidth - VIEWPORT_MARGIN) {
    left = window.innerWidth - width - VIEWPORT_MARGIN
  }
  panelStyle.value = {
    top:   `${rect.bottom + 6}px`,
    left:  `${left}px`,
    width: `${width}px`,
  }
}

function openPanel() {
  isOpen.value = true
  nextTick(updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
  window.addEventListener('resize', updatePanelPosition)
}

function closePanel() {
  isOpen.value = false
  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
}

function toggle() { isOpen.value ? closePanel() : openPanel() }

function shift(d: number) {
  let m = viewMonth.value + d
  let y = viewYear.value
  if (m > 11) { m = 0; y++ }
  if (m < 0)  { m = 11; y-- }
  viewMonth.value = m
  viewYear.value  = y
}

const weekdays = [
  { label: '일', cls: 'cd-dp__wd--sun' },
  { label: '월', cls: '' },
  { label: '화', cls: '' },
  { label: '수', cls: '' },
  { label: '목', cls: '' },
  { label: '금', cls: '' },
  { label: '토', cls: 'cd-dp__wd--sat' },
]

interface Cell { key: string; day: number; dateStr: string; inMonth: boolean; isSelected: boolean; isToday: boolean; isSun: boolean; isSat: boolean; isDisabled: boolean }

const cells = computed<Cell[]>(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const daysInPrev  = new Date(y, m, 0).getDate()
  const todayStr = fmt(today)
  const min = props.min ?? ''
  const result: Cell[] = []

  for (let i = 0; i < firstDow; i++) {
    const day = daysInPrev - firstDow + 1 + i
    const pm = m === 0 ? 11 : m - 1
    const py = m === 0 ? y - 1 : y
    const ds = fmt(new Date(py, pm, day))
    result.push({ key: ds, day, dateStr: ds, inMonth: false, isSelected: false, isToday: false, isSun: i === 0, isSat: i === 6, isDisabled: !!min && ds < min })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const ds  = fmt(new Date(y, m, d))
    const dow = new Date(y, m, d).getDay()
    result.push({
      key: ds, day: d, dateStr: ds, inMonth: true,
      isSelected: ds === props.modelValue,
      isToday:    ds === todayStr,
      isSun: dow === 0,
      isSat: dow === 6,
      isDisabled: !!min && ds < min,
    })
  }

  const remaining = 42 - result.length
  for (let d = 1; d <= remaining; d++) {
    const nm = m === 11 ? 0 : m + 1
    const ny = m === 11 ? y + 1 : y
    const ds = fmt(new Date(ny, nm, d))
    const dow = new Date(ny, nm, d).getDay()
    result.push({ key: ds, day: d, dateStr: ds, inMonth: false, isSelected: false, isToday: false, isSun: dow === 0, isSat: dow === 6, isDisabled: !!min && ds < min })
  }

  return result
})

function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function fmtDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}.${m}.${d}`
}

function pick(dateStr: string, disabled = false) {
  if (disabled) return
  emit('update:modelValue', dateStr)
  viewYear.value  = +dateStr.slice(0, 4)
  viewMonth.value = +dateStr.slice(5, 7) - 1
  closePanel()
}

function pickToday() {
  const todayStr = fmt(today)
  if (props.min && todayStr < props.min) return
  pick(todayStr)
}

function clear() {
  emit('update:modelValue', '')
  closePanel()
}

function onOutsideClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    closePanel()
  }
}

onMounted(()  => document.addEventListener('click', onOutsideClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onOutsideClick)
  window.removeEventListener('scroll', updatePanelPosition, true)
  window.removeEventListener('resize', updatePanelPosition)
})
</script>

<style lang="scss">
.cd-dp {
  position: relative;
  flex: 1;
  min-width: 0;

  &__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: border-color 0.15s;
    user-select: none;
    min-width: 0;

    &--filled { border-color: #FFC700; }
    &:hover   { border-color: #FFC700; }
  }

  &__trigger-text {
    font-size: 13px;
    font-weight: 500;
    color: #222;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .cd-dp__trigger:not(.cd-dp__trigger--filled) & { color: #bbb; font-weight: 400; }
  }

  &__icon {
    width: 16px;
    height: 16px;
    color: #bbb;
    flex-shrink: 0;

    .cd-dp__trigger--filled & { color: #FFC700; }
  }

  /* 패널 (Teleport to body — top/left/width는 인라인 스타일로 동적 지정) */
  &__panel {
    position: fixed;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
    padding: 16px;
    z-index: 100;
    box-sizing: border-box;
  }

  /* 월 네비 */
  &__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  &__nav-btn {
    background: #F5F5F5;
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #444;
    transition: background 0.12s;

    &:hover { background: #FFC700; color: #fff; }
  }

  &__nav-label {
    font-size: 15px;
    font-weight: 700;
    color: #222;
  }

  /* 요일 헤더 */
  &__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 6px;
  }

  &__wd {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: #bbb;
    padding: 4px 0;

    &--sun { color: #FF6B6B; }
    &--sat { color: #5B9CF6; }
  }

  /* 날짜 그리드 */
  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  &__cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    background: none;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
    position: relative;

    &:hover:not(&--out) { background: #FFF8E0; }

    &--out     { color: #ddd; cursor: default; }
    &--sun     { color: #FF6B6B; }
    &--sat     { color: #5B9CF6; }

    &--disabled,
    &--disabled:hover {
      color: #d6d6d6 !important;
      background: none !important;
      cursor: not-allowed;
      text-decoration: line-through;
      opacity: 0.55;
    }

    &--today::after {
      content: '';
      position: absolute;
      bottom: 3px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #FFC700;
    }

    &--selected {
      background: #FFC700 !important;
      color: #fff !important;
      font-weight: 700;
    }
  }

  /* 하단 버튼 */
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #F0F0F0;
  }

  &__today-btn {
    background: #FFC700;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:hover { opacity: 0.9; }
  }

  &__clear-btn {
    background: #F5F5F5;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    color: #aaa;
    cursor: pointer;

    &:hover { background: #eee; }
  }
}

/* 슬라이드 트랜지션 */
.cd-dp-slide-enter-active,
.cd-dp-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.cd-dp-slide-enter-from,
.cd-dp-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
