<template>
  <div v-if="checked || caution" class="prep-notes">
    <!-- 출처와 대조한 사실 — 무엇을 어디서 확인했는지 그대로 보여 준다 -->
    <div v-if="checked" class="prep-note prep-note--checked">
      <p class="prep-note__lead">
        <AppIcon name="ui-check" :size="12" />
        <strong>{{ checkLevelLabel(checked) }}</strong>
        <span v-if="checkedAt" class="prep-note__date">{{ checkedAt }}</span>
      </p>
      <p v-if="checked.note" class="prep-note__text">{{ checked.note }}</p>
      <p class="prep-note__src">{{ checked.source }}</p>
    </div>
    <!-- 늘 붙어 있는 안내(공고마다 다르다 등) -->
    <p v-if="caution" class="prep-note prep-note--caution">
      <AppIcon name="tip-warning" :size="13" />
      <span>{{ caution }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
// 준비과정 탭의 확인 표시·주의 안내 — 계획 머리말과 프로젝트 펼침 양쪽에서 쓴다(2026-11-15)
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { checkLevelLabel } from '../../../../lib/preparation'
import type { PrepChecked } from '../../../../types/encyclopedia'

const props = defineProps<{ checked?: PrepChecked | null; caution?: string | null }>()

// '2026-11-13' → '2026.11.13 확인'
const checkedAt = computed(() => (props.checked?.at ? `${props.checked.at.replace(/-/g, '.')} 확인` : ''))
</script>
