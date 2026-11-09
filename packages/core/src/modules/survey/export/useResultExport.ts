/**
 * 결과 내보내기 — 요소를 이미지(PNG)로 찍고, A4 쪽 요소들을 PDF 로 합친다.
 *
 * 🔁 랜딩 lighthouse-landing composables/useResultExport.ts 의 **사본**(2026-11-06 이식). 고치면 두 레포를 같이 고칠 것.
 *
 * 🚨 **결과지의 내부 구조를 모른다.** 넘겨받은 요소를 통째로 찍을 뿐이다.
 *    결과지(ResearchResult.vue)의 섹션·클래스를 바꿔도 여기는 고칠 필요가 없게 둔다.
 *    결과지 쪽이 지킬 약속은 두 가지뿐이다:
 *    1. 그림은 **같은 도메인**에서 불러온다 (다른 도메인 그림은 캡처에 담기지 않고 빈칸이 된다)
 *    2. 캡처에서 빼고 싶은 요소에는 `data-export-skip` 을 단다 (예: 다시 시도 버튼)
 *
 * PDF 는 화면 결과지가 아니라 **PDF 전용 양식**(components/survey/report, A4 쪽 단위)을 찍어 만든다.
 *   (화면을 찍어 A4 로 자르던 방식은 2026-10-14 폐기 — 쪽 나눔이 늘 어색했다)
 */

// 1×1 투명 PNG — 다른 도메인 그림이 섞여도 캡처 **전체가** 실패하지 않게 빈칸으로 대체한다
const BLANK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

// iOS Safari 의 캔버스 최대 면적(약 16.7M px). 넘으면 **빈 이미지**가 나온다.
// 결과지가 길어져도 깨지지 않도록 배율을 낮춰 맞춘다.
const MAX_CANVAS_AREA = 16_000_000

const FONT_WAIT_MS = 3000

const isWebKit = () => /AppleWebKit/.test(navigator.userAgent) && !/Chrome|CriOS|Android/.test(navigator.userAgent)

/** 요소 안의 그림·폰트가 다 준비될 때까지 기다린다 — 그림이 새로 생겨도 그대로 대응된다 */
async function waitForAssets(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll('img'))
  await Promise.all(imgs.map((img) => (img.complete
    ? Promise.resolve()
    : new Promise((r) => {
      img.addEventListener('load', r, { once: true })
      img.addEventListener('error', r, { once: true })
    }))))
  await Promise.all(imgs.map((img) => img.decode?.().catch(() => {})))
  // ⚠️ 폰트 대기에 상한을 둔다. 폰트 CDN(jsDelivr)이 멈추면 fonts.ready 가 끝나지 않아
  //    '만들고 있어요…' 에서 영원히 멈춘다(2026-10-15 실제로 CDN 이 woff2 를 30초 넘게 안 줬다).
  //    상한이 지나면 기본 폰트로라도 만든다 — 못 만드는 것보다 낫다
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, FONT_WAIT_MS))])
}

// 🐢 앱 전용(랜딩에는 없음): 그림에 넣을 웹폰트 CSS 를 **한 번만** 만들어 재사용한다.
//    html-to-image 는 찍을 때마다 문서의 모든 @font-face 를 내려받아 base64 로 넣는데, 앱은 Pretendard 가
//    가변 폰트(npm) + 정적 9굵기(CDN, 옛 SelfUnderstandingIntro.scss — 2026-11-09 삭제) 로 두 벌이라 한 장에 10초 넘게 걸렸다
//    (여러 장 6장 = 94초, 2026-11-06 실측). 폰트는 장마다 같으므로 처음 만든 것을 그대로 쓴다.
let fontEmbedCss: Promise<string> | null = null
async function fontCssFor(el: HTMLElement) {
  if (!fontEmbedCss) {
    const { getFontEmbedCSS } = await import('html-to-image')
    // 실패하면 비워 두고 다음에 다시 만든다(이번 캡처는 폰트를 라이브러리 기본 방식으로)
    fontEmbedCss = getFontEmbedCSS(el).catch(() => { fontEmbedCss = null; return '' })
  }
  return fontEmbedCss
}

export interface Capture {
  blob: Blob
  /** CSS 1px 이 이미지에서 몇 px 인지 — PDF 쪽 여백 판정 기준을 화면 크기와 무관하게 맞춘다 */
  pixelRatio: number
}

export async function captureImage(
  el: HTMLElement,
  override: { pixelRatio?: number; backgroundColor?: string } = {},
): Promise<Capture> {
  await waitForAssets(el)
  const { toBlob } = await import('html-to-image')

  const w = el.scrollWidth
  const h = el.scrollHeight
  const pixelRatio = Math.min(override.pixelRatio ?? 2, Math.sqrt(MAX_CANVAS_AREA / (w * h)))
  const fontCss = await fontCssFor(el)
  const opts = {
    pixelRatio,
    backgroundColor: override.backgroundColor ?? getComputedStyle(el).backgroundColor,
    imagePlaceholder: BLANK_PNG,
    ...(fontCss ? { fontEmbedCSS: fontCss } : {}),
    filter: (node: HTMLElement) => !(node instanceof HTMLElement && node.dataset?.exportSkip !== undefined),
  }

  // ⚠️ WebKit(iOS 의 모든 브라우저)은 첫 렌더에서 그림·폰트를 빠뜨리는 일이 있다
  //    (html-to-image 알려진 문제). 한 번 버리고 다시 찍는다.
  if (isWebKit()) await toBlob(el, opts).catch(() => null)
  const blob = await toBlob(el, opts)
  if (!blob) throw new Error('capture failed')
  return { blob, pixelRatio }
}

// ── 여러 장 이미지 ────────────────────────────────────────────────────────

// 한 장의 최대 세로 = 가로 × 이 값. 장 비율을 바꿀 때는 이것만 고친다.
// 사용자 확정(2026-10-16): 3 → 7장, '한 장 = 한 주제'. 휴대폰 화면 비율(2.1)은 10장으로 잘게 쪼개져 탈락
export const IMAGE_SET_MAX_RATIO = 3
const MAX_SPLIT_DEPTH = 2   // 긴 구역을 몇 단계까지 쪼갤지
const ORPHAN_PX = 60        // 이보다 짧은 단위가 장 끝에 남으면 다음 장으로(제목만 홀로 남는 것 방지)

/**
 * 결과지를 **여러 장**으로 찍는다. 결과지 구조를 모르는 규칙 하나만 쓴다:
 *   wrapper 안의 `[data-export-chunks]` 요소의 **직계 자식들**이 나눔 단위다. 한 장보다 긴 구역은 그 안의
 *   직계 자식으로 한 단계 더 나눈다(최대 MAX_SPLIT_DEPTH). 앞에서부터 담다가 (가로 × maxRatio) 를 넘으면 다음 장.
 *   그래도 넘치는 단위(쪼갤 수 없는 큰 덩어리)는 그 장만 길다.
 *   (구역이 추가·삭제돼도 이 규칙만으로 따라간다)
 *
 * 화면을 건드리지 않으려고 wrapper 를 **화면 밖에 복제**해서, 장마다 그 장의 구역만 보이게 하고 찍는다.
 * 복제본의 `[data-export-pageno]` 에 '2 / 5' 를 넣는다(머리말의 장 번호).
 */
export async function captureImageSet(wrapper: HTMLElement, maxRatio = IMAGE_SET_MAX_RATIO): Promise<Blob[]> {
  // ⚠️ 화면 밖 위치(left:-10000px)는 **바깥 상자**에 준다. 복제본 자체에 주면 캡처가 그 위치값까지 옮겨가
  //    캡처 틀 밖으로 밀려나 **빈 이미지**가 된다(2026-10-16 실제로 10장 전부 비었다)
  const holder = document.createElement('div')
  holder.style.cssText = 'position:absolute;left:-10000px;top:0;pointer-events:none'
  const clone = wrapper.cloneNode(true) as HTMLElement
  clone.style.width = `${wrapper.offsetWidth}px`
  holder.appendChild(clone)
  wrapper.parentElement!.appendChild(holder)
  try {
    const root = clone.querySelector<HTMLElement>('[data-export-chunks]')
    if (!root) return [(await captureImage(clone)).blob]

    const W = clone.offsetWidth
    const chrome = clone.scrollHeight - root.offsetHeight      // 머리말·꼬리말·여백
    const limit = W * maxRatio - chrome
    const visible = (el: Element) => (el as HTMLElement).offsetHeight > 0
    const outer = (el: HTMLElement) => {
      const cs = getComputedStyle(el)
      return el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)
    }

    // 나눔 단위 — 한 장보다 긴 구역은 **그 안의 직계 자식으로 한 단계 더** 나눈다(최대 2단계).
    // 바깥 구역(카드 배경·여백)은 그대로 보이므로 장이 바뀌어도 같은 카드가 이어진다
    const unitsOf = (el: HTMLElement, depth: number): HTMLElement[] => {
      const kids = Array.from(el.children).filter(visible) as HTMLElement[]
      if (outer(el) <= limit || depth >= MAX_SPLIT_DEPTH || kids.length < 2) return [el]
      return kids.flatMap((k) => unitsOf(k, depth + 1))
    }
    const chunks = (Array.from(root.children).filter(visible) as HTMLElement[])
    const units = chunks.flatMap((c) => unitsOf(c, 0))
    // 보이기·숨기기를 판정할 요소 = 단위 + 단위와 root 사이의 모든 조상
    const nodes = new Set<HTMLElement>()
    for (const u of units) {
      for (let n: HTMLElement | null = u; n && n !== root; n = n.parentElement) nodes.add(n)
    }

    // 앞에서부터 담기. 장을 넘길 때 **짧은 단위(제목 등)가 장 끝에 홀로 남으면** 다음 장으로 데려간다
    const packs: HTMLElement[][] = []
    let cur: HTMLElement[] = []
    let h = 0
    for (const u of units) {
      const uh = outer(u)
      if (cur.length && h + uh > limit) {
        const carry: HTMLElement[] = []
        while (cur.length > 1 && outer(cur[cur.length - 1]!) < ORPHAN_PX) carry.unshift(cur.pop()!)
        packs.push(cur)
        cur = carry
        h = carry.reduce((a, c) => a + outer(c), 0)
      }
      cur.push(u)
      h += uh
    }
    if (cur.length) packs.push(cur)

    const pageno = clone.querySelector<HTMLElement>('[data-export-pageno]')
    const out: Blob[] = []
    for (let i = 0; i < packs.length; i++) {
      const pack = packs[i]!
      for (const n of nodes) n.style.display = pack.some((u) => n === u || n.contains(u)) ? '' : 'none'
      if (pageno) pageno.textContent = packs.length > 1 ? `${i + 1} / ${packs.length}` : ''
      out.push((await captureImage(clone)).blob)
    }
    return out
  } finally {
    holder.remove()
  }
}

/**
 * 여러 파일 저장. 휴대폰: 공유 시트 **한 번**으로 전부(사진첩 저장·카톡). PC: 차례로 내려받기.
 * ⚠️ 클릭 핸들러 안에서 바로 부를 것(saveFile 주석 참조).
 */
export async function saveFiles(blobs: Blob[], filenames: string[]): Promise<SaveResult> {
  if (blobs.length === 1) return saveFile(blobs[0]!, filenames[0]!)
  const files = blobs.map((b, i) => new File([b], filenames[i]!, { type: b.type || 'image/png' }))
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files })
      return 'shared'
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled'
    }
  }
  for (let i = 0; i < blobs.length; i++) {
    downloadBlob(blobs[i]!, filenames[i]!)
    // 브라우저가 연속 다운로드를 한 번에 막지 않게 살짝 띄운다
    await new Promise((r) => setTimeout(r, 300))
  }
  return 'downloaded'
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// ── PDF ──────────────────────────────────────────────────────────────────

/**
 * A4 쪽 요소들(`.rp-page`, 210×297mm)을 한 장씩 찍어 PDF 로 합친다.
 * 쪽은 PDF 결과지 양식(components/survey/report)이 이미 나눠 두었으므로 여기서는 자르지 않는다.
 * 첫 쪽 이미지는 시트의 미리보기로 쓴다.
 */
export async function buildPdfFromPages(pages: HTMLElement[]): Promise<{ blob: Blob; pages: number; preview: Blob }> {
  if (!pages.length) throw new Error('no pages')
  const shots: Blob[] = []
  for (const el of pages) {
    // A4 를 화면 96dpi 로 그리면 794×1123px → 2배면 인쇄에 충분하다
    shots.push((await captureImage(el, { pixelRatio: 2, backgroundColor: '#ffffff' })).blob)
  }

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  for (let i = 0; i < shots.length; i++) {
    if (i > 0) pdf.addPage()
    pdf.addImage(await toJpegDataUrl(shots[i]!), 'JPEG', 0, 0, 210, 297)
  }
  return { blob: pdf.output('blob'), pages: shots.length, preview: shots[0]! }
}

/**
 * 텍스트 PDF — 렌더 서비스(lighthouse-pdf)가 서버의 Chrome 으로 /survey-report 를 인쇄해 준다.
 * 실패·타임아웃이면 null — 부르는 쪽이 이미지 PDF(buildPdfFromPages)로 대체한다. 사용자는 늘 PDF 를 받는다.
 */
export async function fetchServerPdf(service: string, respondentId: string, timeoutMs = 25_000): Promise<Blob | null> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(`${service.replace(/\/$/, '')}/pdf?r=${encodeURIComponent(respondentId)}`, { signal: ctl.signal })
    if (!res.ok) return null
    const blob = await res.blob()
    return blob.type === 'application/pdf' && blob.size > 0 ? blob : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// PNG 그대로 넣으면 쪽당 1MB 를 넘는다. JPEG 로 바꿔 넣는다(배경이 흰색이라 투명도 손실이 없다)
async function toJpegDataUrl(png: Blob): Promise<string> {
  const bmp = await createImageBitmap(png)
  const c = document.createElement('canvas')
  c.width = bmp.width
  c.height = bmp.height
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  return c.toDataURL('image/jpeg', 0.92)
}

export type SaveResult = 'shared' | 'downloaded' | 'cancelled'

/**
 * 휴대폰: 공유 시트(사진에 저장 · 카톡 보내기) / PC: 파일 내려받기.
 * ⚠️ 반드시 **버튼 클릭 핸들러 안에서 바로** 부를 것. 캡처(수 초) 뒤에 부르면 iOS 가
 *    사용자 동작이 끝났다고 보고 공유를 거부한다 — 그래서 캡처와 저장을 두 번의 클릭으로 나눴다.
 */
export async function saveFile(blob: Blob, filename: string): Promise<SaveResult> {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled'
      // 공유가 막힌 환경이면 아래 내려받기로 넘어간다
    }
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}

/**
 * 내보내기 파일 이름 규칙 — `라이트하우스_검사결과_{성격유형}_{YYYY-MM-DD}.{png|pdf}`
 *   예) 라이트하우스_검사결과_신중한리더_2026-10-14.png
 *
 * - 한글: 사진첩·다운로드 폴더에서 무슨 파일인지 바로 알아보게
 * - 날짜는 YYYY-MM-DD: 이름순 정렬 = 날짜순
 * - 구분자는 `_`. 공백·파일명 금지문자(/ \ : * ? " < > |)는 지운다
 * - 성격 유형은 **있을 때만** 넣는다. 결과지가 이름을 안 넘겨주면 빼고 만든다(내보내기는 결과지 구조를 모른다)
 */
export function resultFilename(ext: 'png' | 'pdf', label?: string | null, part?: number) {
  const d = new Date()
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const clean = (label ?? '').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 30)
  // 여러 장이면 끝에 _1, _2 … (사진첩에서 순서대로 정렬되게)
  return ['라이트하우스', '검사결과', clean, ymd, part].filter((x) => x !== undefined && x !== '' && x !== null).join('_') + `.${ext}`
}
