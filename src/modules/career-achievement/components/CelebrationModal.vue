<template>
  <Teleport to="body">
    <Transition name="cm-fade">
      <div v-if="modelValue" class="cm" @click="close">
        <!-- 콘페티 -->
        <div class="cm__confetti" aria-hidden="true">
          <span
            v-for="i in 18"
            :key="i"
            class="cm__piece"
            :style="pieceStyle(i)"
          />
        </div>

        <!-- 카드 -->
        <div class="cm__card" @click.stop>
          <div class="cm__icon">🎉</div>
          <h2 class="cm__title">{{ title }}</h2>
          <p class="cm__sub">{{ sub }}</p>
          <button class="cm__btn" @click="close">계속 가기</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title: string
  sub: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

const COLORS = ['#FFC700', '#FF8A00', '#1DB95A', '#4480F5', '#A855F7', '#F47820', '#FF5C8A']

function pieceStyle(i: number): Record<string, string> {
  // i를 시드처럼 활용해 결정론적이지만 골고루 흩뿌리기
  const left   = ((i * 53)  % 100)
  const delay  = ((i * 71)  % 800) / 1000      // 0 ~ 0.8s
  const dur    = 1.6 + ((i * 31) % 8) / 10     // 1.6 ~ 2.4s
  const rot    = ((i * 137) % 360)
  const color  = COLORS[i % COLORS.length]!
  const size   = 8 + (i % 4) * 2               // 8 ~ 14px
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${dur}s`,
    background: color,
    width: `${size}px`,
    height: `${size * 0.4}px`,
    transform: `rotate(${rot}deg)`,
  }
}
</script>

<style lang="scss">
.cm {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;

  &__confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  &__piece {
    position: absolute;
    top: -20px;
    border-radius: 2px;
    animation-name: cm-fall;
    animation-timing-function: ease-in;
    animation-iteration-count: infinite;
    opacity: 0.95;
  }

  &__card {
    position: relative;
    z-index: 1;
    background: #fff;
    border-radius: 24px;
    padding: 36px 28px 24px;
    text-align: center;
    width: 100%;
    max-width: 320px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: cm-pop 0.4s cubic-bezier(0.18, 1.2, 0.4, 1);
  }

  &__icon {
    font-size: 56px;
    line-height: 1;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 20px;
    font-weight: 900;
    color: #222;
    margin: 0;
    letter-spacing: -0.3px;
  }

  &__sub {
    font-size: 13px;
    color: #777;
    margin: 0 0 8px;
    line-height: 1.5;
  }

  &__btn {
    margin-top: 8px;
    width: 100%;
    background: linear-gradient(135deg, #FFC700 0%, #FFB300 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 14px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(255, 138, 0, 0.35);
  }
}

@keyframes cm-fall {
  0%   { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 1; }
}

@keyframes cm-pop {
  0%   { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.cm-fade-enter-active,
.cm-fade-leave-active {
  transition: opacity 0.22s;
}
.cm-fade-enter-from,
.cm-fade-leave-to {
  opacity: 0;
}
</style>
