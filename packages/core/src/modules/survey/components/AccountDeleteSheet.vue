<template>
  <!-- 회원 탈퇴 확인. 🚨 **되돌릴 수 없는 작업**이라 두 단계를 둔다:
       (1) 무엇이 지워지는지 보여주고 (2) '삭제'를 직접 입력받는다.
       버튼 한 번으로 끝나면 오조작으로 계정이 날아간다. -->
  <div v-if="modelValue" class="ads" @click.self="close">
    <div class="ads__sheet" role="dialog" aria-modal="true" aria-label="회원 탈퇴">
      <p class="ads__title">정말 탈퇴하시겠어요?</p>

      <p class="ads__warn">
        탈퇴하면 아래 정보가 <strong>영구 삭제</strong>되고<br />
        <strong>되돌릴 수 없어요.</strong>
      </p>

      <ul class="ads__list">
        <li>검사 결과와 분석 내용</li>
        <li>진로 계획 · 주간 일정 · 달성 기록</li>
        <li>북마크한 직업과 목표 진로</li>
        <li>업로드한 인증 사진</li>
      </ul>

      <!-- 후기는 남는다는 점을 숨기지 않는다. 개인정보처리방침과 어긋나 보이면 안 된다. -->
      <p class="ads__note">
        작성한 직업 후기는 다른 사용자에게 도움이 되도록 <strong>내용만 남고</strong>,
        이메일 등 작성자 정보는 지워져요.
      </p>

      <label class="ads__label" for="ads-confirm">
        계속하려면 <strong>삭제</strong>를 입력해주세요
      </label>
      <input
        id="ads-confirm"
        v-model="typed"
        class="ads__input"
        type="text"
        inputmode="text"
        autocomplete="off"
        placeholder="삭제"
        :disabled="busy"
      />

      <p v-if="error" class="ads__error">{{ error }}</p>

      <button
        type="button"
        class="ads__danger"
        :disabled="!canDelete || busy"
        @click="submit"
      >
        {{ busy ? '삭제 중…' : '탈퇴하고 모든 정보 삭제' }}
      </button>
      <button type="button" class="ads__cancel" :disabled="busy" @click="close">
        취소
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { deleteAccount } from '../survey.api'

const CONFIRM_WORD = '삭제'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  deleted: []
}>()

const typed = ref('')
const busy = ref(false)
const error = ref('')

const canDelete = computed(() => typed.value.trim() === CONFIRM_WORD)

// 열 때마다 초기화. 닫았다 다시 열면 입력이 남아 있으면 안 된다
// (한 번 통과한 확인이 재사용되는 셈이 된다).
watch(() => props.modelValue, (open) => {
  if (open) { typed.value = ''; error.value = ''; busy.value = false }
})

function close() {
  if (busy.value) return          // 삭제 중에는 닫지 못하게 한다
  emit('update:modelValue', false)
}

async function submit() {
  if (!canDelete.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await deleteAccount()
    emit('deleted')               // 토큰 정리·이동은 부모가 한다
  } catch (e: any) {
    // ⚠️ 실패해도 토큰을 지우지 않는다. 지우면 계정은 남았는데 로그아웃돼
    //    사용자가 다시 시도할 길이 막힌다.
    error.value = e?.response?.data?.error ?? '탈퇴 처리 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.'
    busy.value = false
  }
}
</script>

<style lang="scss" scoped>
.ads {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);

  &__sheet {
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px 20px calc(20px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0;
    background: #fff;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 700;
    color: #111;
  }

  &__warn {
    margin: 0 0 14px;
    font-size: 14px;
    line-height: 1.55;
    color: #c0392b;
  }

  &__list {
    margin: 0 0 14px;
    padding: 12px 14px 12px 30px;
    border-radius: 10px;
    background: #f7f8fa;
    font-size: 13.5px;
    line-height: 1.7;
    color: #444;
  }

  &__note {
    margin: 0 0 18px;
    font-size: 12.5px;
    line-height: 1.55;
    color: #777;
  }

  &__label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: #333;
  }

  &__input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    border: 1px solid #d8dbe0;
    border-radius: 10px;
    font-size: 15px;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #c0392b;
    }
  }

  &__error {
    margin: 10px 0 0;
    font-size: 13px;
    color: #c0392b;
  }

  &__danger {
    width: 100%;
    margin-top: 16px;
    padding: 14px;
    border: 0;
    border-radius: 12px;
    background: #c0392b;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    color: #fff;
    cursor: pointer;

    &:disabled {
      background: #e3b5af;
      cursor: not-allowed;
    }
  }

  &__cancel {
    width: 100%;
    margin-top: 8px;
    padding: 13px;
    border: 0;
    border-radius: 12px;
    background: #f1f2f4;
    font-size: 14px;
    font-family: inherit;
    color: #555;
    cursor: pointer;
  }
}
</style>
