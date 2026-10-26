// public/icons/*.svg → packages/core/src/shared/icons/icons.generated.ts (2026-10-27)
//
// 디자이너(사용자)가 public/icons 에 SVG 를 넣고 `pnpm icons` 를 돌리면 코드에서 <AppIcon name="…"> 로 쓸 수 있다.
// 원본 규칙: 48×48 색 둥근 사각형(배경) + 가운데 흰 그림(<g transform="translate(x y) scale(s)">, 24칸 기준).
//   - 배경 사각형은 버리고(배지·칩이 자기 바탕을 갖는다) 색만 bg 로 남긴다
//   - 흰색(#fff·white)은 currentColor 로 → 쓰는 곳의 글자색으로 칠해진다
//   - viewBox 는 그림 영역(x y 24s 24s)으로 잘라 작은 크기에서도 그림이 꽉 차게
//   - 위 규칙에 안 맞는 파일(배경 없음·여러 색)은 원본 viewBox·색 그대로 둔다
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('public/icons')
const OUT = path.resolve('packages/core/src/shared/icons/icons.generated.ts')
const icons = {}
for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.svg')).sort()) {
  const name = f.replace(/\.svg$/, '')
  let s = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[^>]*>/, '')
  const viewBox = (s.match(/viewBox="([^"]+)"/) || [, '0 0 24 24'])[1]
  const inner = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim()
  // 배경: 전체를 덮는 첫 rect
  const [, , vw, vh] = viewBox.split(/\s+/).map(Number)
  const bgM = inner.match(new RegExp(`<rect[^>]*width="${vw}"[^>]*height="${vh}"[^>]*fill="([^"]+)"[^>]*/>`))
  let body = bgM ? inner.replace(bgM[0], '').trim() : inner
  let box = viewBox
  const t = body.match(/^<g([^>]*)transform="translate\(([\d.]+)[ ,]+([\d.]+)\)\s*scale\(([\d.]+)\)"([^>]*)>([\s\S]*)<\/g>$/)
  if (bgM && t) {
    const [, pre, tx, ty, sc, post, content] = t
    const w = +(24 * +sc).toFixed(3)
    box = `${tx} ${ty} ${w} ${w}`
    body = `<g${pre}transform="translate(${tx} ${ty}) scale(${sc})"${post}>${content.trim()}</g>`
  }
  if (bgM) body = body.replace(/(fill|stroke)="(#fff|#ffffff|white)"/gi, '$1="currentColor"')
  icons[name] = { viewBox: box, body: body.replace(/\s+/g, ' ').replace(/> </g, '><'), bg: bgM ? bgM[1] : null }
}
const out = `// ⚠️ 생성 파일 — 손대지 말 것. public/icons/*.svg 를 고치고 \`pnpm icons\` (scripts/build-icons.mjs)
// 배경 색 사각형은 버리고 흰 그림을 currentColor 로 바꿔 담았다(bg = 원래 배경색)
export interface IconDef { viewBox: string; body: string; bg: string | null }
export const ICONS: Record<string, IconDef> = ${JSON.stringify(icons, null, 2)}
export type IconName = keyof typeof ICONS
`
fs.writeFileSync(OUT, out)
console.log(`icons: ${Object.keys(icons).length} → ${path.relative(process.cwd(), OUT)}`)
