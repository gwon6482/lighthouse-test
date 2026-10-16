<template>
  <!-- 묶음 직업 선택. 고용24가 여러 직업을 한 직업으로 묶어 조사한 경우
       (전문의 13종 → '전문의사', 초·중·고 교장 → 한 묶음) 구성원의 점수가 **완전히 같다.**
       그래서 추천 목록은 한 자리로 접히고, 열 때 어느 세부 직업을 볼지 여기서 고른다.

       ⚠️ 이 단계를 생략하면 사용자가 누른 이름과 열린 화면 제목이 달라진다. -->
  <div v-if="modelValue" class="jgp" @click.self="close">
    <div class="jgp__sheet" role="dialog" aria-modal="true" :aria-label="`${groupTitle} 세부 직업 선택`">
      <p class="jgp__title">{{ groupTitle }}</p>
      <p class="jgp__desc">아래 직업들은 <strong>같은 조사 자료</strong>를 사용해요.<br />어떤 직업을 볼지 골라주세요.</p>

      <ul class="jgp__list">
        <li v-for="m in members" :key="m.jobCode">
          <button type="button" class="jgp__item" @click="pick(m.jobCode)">
            {{ m.title }}
          </button>
        </li>
      </ul>

      <button type="button" class="jgp__cancel" @click="close">닫기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  groupTitle: string
  members: { jobCode: string; title: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  select: [jobCode: string]
}>()

function close() {
  emit('update:modelValue', false)
}

function pick(jobCode: string) {
  emit('select', jobCode)
  close()
}
</script>

<style lang="scss" scoped>
.jgp {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);

  &__sheet {
    width: 100%;
    max-width: 480px;
    padding: 24px 20px calc(20px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0;
    background: #fff;
  }

  &__title {
    margin: 0 0 6px;
    font-size: 17px;
    font-weight: 700;
    color: #111;
  }

  &__desc {
    margin: 0 0 18px;
    font-size: 13px;
    line-height: 1.5;
    color: #666;
  }

  &__list {
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e3e5e8;
    border-radius: 12px;
    background: #fff;
    font-size: 15px;
    color: #111;
    text-align: left;
    cursor: pointer;

    &:active { background: #f4f5f7; }
  }

  &__cancel {
    width: 100%;
    padding: 13px;
    border: 0;
    border-radius: 12px;
    background: #f1f2f4;
    font-size: 14px;
    color: #555;
    cursor: pointer;
  }
}
</style>
