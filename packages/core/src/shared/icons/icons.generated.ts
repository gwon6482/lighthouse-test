// ⚠️ 생성 파일 — 손대지 말 것. public/icons/*.svg 를 고치고 `pnpm icons` (scripts/build-icons.mjs)
// 배경 색 사각형은 버리고 흰 그림을 currentColor 로 바꿔 담았다(bg = 원래 배경색)
export interface IconDef { viewBox: string; body: string; bg: string | null }
export const ICONS: Record<string, IconDef> = {
  "mark-degree": {
    "viewBox": "13 13 22.001 22.001",
    "body": "<g transform=\"translate(13 13) scale(0.9167)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 9 12 4l9 5Z\"/><path d=\"M6 12v5M10 12v5M14 12v5M18 12v5\"/><path d=\"M3 20.5h18\"/></g>",
    "bg": "#6366F1"
  },
  "mark-exam": {
    "viewBox": "13 13 22.001 22.001",
    "body": "<g transform=\"translate(13 13) scale(0.9167)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4\"/><path d=\"M8 8h6M8 12h4\"/><path d=\"M19.4 12.6a1.6 1.6 0 0 1 2.3 2.3L15.5 21l-3 .8.8-3Z\"/></g>",
    "bg": "#14B8A6"
  },
  "mark-experience": {
    "viewBox": "13 13 22.001 22.001",
    "body": "<g transform=\"translate(13 13) scale(0.9167)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5\"/><path d=\"M3.5 3.5v5h5\"/><path d=\"M12 7.5V12l3 2\"/></g>",
    "bg": "#F59E0B"
  },
  "mark-license": {
    "viewBox": "13 13 22.001 22.001",
    "body": "<g transform=\"translate(13 13) scale(0.9167)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"9.5\" r=\"6.5\"/><path d=\"m9.3 9.6 1.9 1.9 3.5-3.6\"/><path d=\"M8.3 14.8 7 21.5l5-2.3 5 2.3-1.3-6.7\"/></g>",
    "bg": "#0EA5E9"
  },
  "mark-senior": {
    "viewBox": "13 13 22.001 22.001",
    "body": "<g transform=\"translate(13 13) scale(0.9167)\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 21.5h5v-4h5v-4h5v-4h4\"/><path d=\"M20 9.5v-7h-5.5l1.5 2-1.5 2H20\"/></g>",
    "bg": "#475569"
  }
}
export type IconName = keyof typeof ICONS
