<template>
  <!-- 진로백과 비회원 안내(2026-11-11) — 개요 맨 아래와 다른 탭 아래에 같은 카드. 흐린 곳을 누르면 이 카드로 내려온다.
       목표 진로 설정 대신 비회원 검사(A 경로)로 보낸다(사용자 결정 2026-11-09) -->
  <GuestLockCard
    eyebrow="검사하고 가입하면 모두 열려요"
    title="이 직업, 나와 맞을까요?"
    note="검사를 마치고 가입하면 흐린 정보와 나에게 맞는 직무까지 모두 볼 수 있어요."
  >
    <RouterLink to="/start" class="overview-lock__cta">나에게 맞는 직업 찾기</RouterLink>
    <RouterLink to="/onboarding/auth" class="overview-lock__login">이미 회원이에요 · 로그인</RouterLink>
  </GuestLockCard>
</template>

<script setup lang="ts">
import GuestLockCard from '@/shared/components/GuestLockCard.vue'
</script>
