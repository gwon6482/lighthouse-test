<template>
  <Teleport to="body">
    <div v-if="open" class="xs" @click.self="close">
      <div class="xs__sheet" role="dialog" aria-modal="true" aria-label="결과 내보내기">
        <p class="xs__title">결과 내보내기</p>

        <!-- 1. 형식 고르기 -->
        <div v-if="state === 'choose'" class="xs__options">
          <button type="button" class="xs__opt" @click="make('images')">
            <span class="xs__opt-name">이미지로 저장</span>
            <span class="xs__opt-desc">휴대폰 화면 크기로 나눠서 · 사진첩 저장 · 카톡 공유용</span>
          </button>
          <button type="button" class="xs__opt" @click="make('png')">
            <span class="xs__opt-name">긴 이미지 한 장으로</span>
            <span class="xs__opt-desc">결과 전체를 한 장에</span>
          </button>
          <button type="button" class="xs__opt" @click="make('pdf')">
            <span class="xs__opt-name">PDF로 저장</span>
            <span class="xs__opt-desc">인쇄 · 보관용 (A4)</span>
          </button>
        </div>

        <!-- 2. 만드는 중 -->
        <div v-else-if="state === 'working'" class="xs__state">
          <div class="xs__spinner" />
          <p>{{ kind === 'pdf' ? '결과 PDF를' : '결과 이미지를' }} 만들고 있어요…</p>
        </div>

        <!-- 3. 저장 — 캡처와 저장을 나눈 이유는 useResultExport.saveFile 주석 참조 -->
        <div v-else-if="state === 'ready'" class="xs__ready">
          <!-- 여러 장은 가로로 넘겨 본다 -->
          <div v-if="previewUrls.length > 1" class="xs__strip">
            <img v-for="(u, i) in previewUrls" :key="u" :src="u" :alt="`내 검사 결과 이미지 ${i + 1}`" />
          </div>
          <div v-else class="xs__preview"><img :src="previewUrls[0]" alt="내 검사 결과 이미지" /></div>
          <p v-if="kind === 'pdf'" class="xs__meta">A4 {{ pages }}쪽</p>
          <p v-else-if="previewUrls.length > 1" class="xs__meta">{{ previewUrls.length }}장 · 옆으로 넘겨 보세요</p>
          <button type="button" class="xs__btn xs__btn--primary" @click="save">
            {{ saved === 'downloaded' ? '저장했어요' : kind === 'pdf' ? 'PDF 저장하기' : previewUrls.length > 1 ? `이미지 ${previewUrls.length}장 저장하기` : '이미지 저장하기' }}
          </button>
          <p v-if="kind !== 'pdf'" class="xs__hint">저장이 안 되면 위 이미지를 길게 눌러 저장해주세요.</p>
        </div>

        <div v-else class="xs__state">
          <p>{{ kind === 'pdf' ? 'PDF를' : '이미지를' }} 만들지 못했어요.<br />잠시 후 다시 시도해주세요.</p>
          <button type="button" class="xs__btn" @click="make(kind)">다시 시도</button>
        </div>

        <button type="button" class="xs__btn xs__btn--ghost" :disabled="state === 'working'" @click="close">닫기</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 🔁 랜딩 lighthouse-landing components/survey/ExportSheet.vue 의 사본(2026-11-06 이식). 고치면 두 레포를 같이 고칠 것.
 * 결과 내보내기 선택 시트. **무엇을 찍는지 모른다** — 부모가 준 `makeImages()`·`makeImage()`·`makePdf()` 가 결과물을 돌려줄 뿐이다.
 * 이미지: 여러 장(기본, 휴대폰 화면 크기) / 긴 한 장 — 사용자가 고른다(2026-10-16).
 * 이미지 = 화면 결과지 캡처 / PDF = PDF 전용 양식(A4). 미리보기는 이미지 전체 또는 PDF 첫 쪽.
 * (찍을 범위·머리말은 부모가 정한다. 결과지 구조가 바뀌어도 이 파일은 그대로다)
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { resultFilename, saveFiles, type Capture, type SaveResult } from './useResultExport'

const props = defineProps<{
  open: boolean
  makeImage: () => Promise<Capture>
  makeImages: () => Promise<Blob[]>
  makePdf: () => Promise<{ blob: Blob; pages: number; preview: Blob }>
  label?: string | null
}>()
const emit = defineEmits<{ close: [] }>()

const state = ref<'choose' | 'working' | 'ready' | 'error'>('choose')
type Kind = 'images' | 'png' | 'pdf'
const kind = ref<Kind>('images')
const blobs = ref<Blob[]>([])   // 저장할 파일들(여러 장 이미지 / 한 장 / PDF)
const pages = ref(0)
const previewUrls = ref<string[]>([])
const saved = ref<SaveResult | null>(null)

function clearPreviews() {
  for (const u of previewUrls.value) URL.revokeObjectURL(u)
  previewUrls.value = []
}

function reset() {
  clearPreviews()
  state.value = 'choose'
  blobs.value = []
  pages.value = 0
  saved.value = null
}

// 열 때마다 처음부터 — 이전에 만든 이미지를 재사용하지 않는다(결과가 바뀌었을 수 있다)
watch(() => props.open, (v) => { if (v) reset() })
onBeforeUnmount(reset)

async function make(k: Kind) {
  kind.value = k
  state.value = 'working'
  try {
    clearPreviews()
    if (k === 'pdf') {
      const pdf = await props.makePdf()
      blobs.value = [pdf.blob]
      pages.value = pdf.pages
      previewUrls.value = [URL.createObjectURL(pdf.preview)]
    } else if (k === 'images') {
      blobs.value = await props.makeImages()
      previewUrls.value = blobs.value.map((b) => URL.createObjectURL(b))
    } else {
      const cap = await props.makeImage()
      blobs.value = [cap.blob]
      previewUrls.value = [URL.createObjectURL(cap.blob)]
    }
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

async function save() {
  if (!blobs.value.length) return
  const ext = kind.value === 'pdf' ? 'pdf' : 'png'
  const multi = blobs.value.length > 1
  const names = blobs.value.map((_, i) => resultFilename(ext, props.label, multi ? i + 1 : undefined))
  saved.value = await saveFiles(blobs.value, names)
}

function close() {
  if (state.value !== 'working') emit('close')
}
</script>

<style lang="scss" scoped>
.xs {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.xs__sheet {
  width: 100%;
  max-width: 640px;
  max-height: 88vh;
  overflow-y: auto;
  padding: 22px 18px calc(18px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: #fff;
  color: #1a1a1a;
}

.xs__title { margin: 0 0 14px; font-size: 1.05rem; font-weight: 800; }

.xs__options { display: flex; flex-direction: column; gap: 10px; }

.xs__opt {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 14px 16px;
  border: 1.5px solid #eaeaea;
  border-radius: 12px;
  background: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:disabled { cursor: default; opacity: 0.45; }
  em { margin-left: 4px; font-style: normal; font-size: 0.75rem; font-weight: 600; color: #999; }
}
.xs__opt-name { font-size: 0.95rem; font-weight: 700; }
.xs__opt-desc { font-size: 0.8rem; color: #888; }

.xs__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  font-size: 0.88rem;
  text-align: center;
  color: #666;

  p { margin: 0; line-height: 1.6; }
}

.xs__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #eee;
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: xs-spin 0.8s linear infinite;
}
@keyframes xs-spin { to { transform: rotate(360deg); } }

.xs__ready { display: flex; flex-direction: column; gap: 10px; }

.xs__preview {
  max-height: 46vh;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fafaf8;

  img { display: block; width: 100%; height: auto; }
}

.xs__meta { margin: 0; font-size: 0.8rem; color: #888; text-align: center; }
.xs__strip {
  display: flex;
  gap: 8px;
  max-height: 46vh;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 4px;

  img {
    flex: none;
    width: 62%;
    height: auto;
    max-height: 46vh;
    object-fit: contain;
    object-position: top;
    border: 1px solid #eee;
    border-radius: 10px;
    background: #fafaf8;
    scroll-snap-align: start;
  }
}
.xs__hint { margin: 0; font-size: 0.75rem; color: #999; text-align: center; }

.xs__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 50px;
  border: 1.5px solid #eaeaea;
  border-radius: 12px;
  background: #fff;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a1a;
  cursor: pointer;
}
.xs__btn--primary { border-color: #ffd100; background: #ffd100; }
.xs__btn--ghost { margin-top: 10px; border-color: transparent; color: #888; }
.xs__btn:disabled { opacity: 0.5; cursor: default; }
</style>
