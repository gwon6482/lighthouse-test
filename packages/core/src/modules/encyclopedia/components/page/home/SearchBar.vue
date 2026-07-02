<template>
  <div class="search-bar">
    <div class="search-bar__inner">
      <input
        class="search-bar__input"
        type="text"
        placeholder="직업을 검색해보세요"
        :value="query"
        @input="inputValue = ($event.target as HTMLInputElement).value"
        @keydown.enter="handleSearch"
      />
      <button
        v-if="query"
        class="search-bar__clear"
        @click="handleClear"
      >
        ✕
      </button>
      <button class="search-bar__btn" @click="handleSearch">
        검색
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  query: string
}>()

const emit = defineEmits<{
  search: [query: string]
  clear: []
}>()

const inputValue = ref(props.query)

function handleSearch() {
  emit('search', inputValue.value)
}

function handleClear() {
  inputValue.value = ''
  emit('clear')
}
</script>
