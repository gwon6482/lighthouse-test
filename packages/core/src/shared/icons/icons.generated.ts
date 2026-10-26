// ⚠️ 생성 파일 — 손대지 말 것. public/icons/*.svg 를 고치고 `pnpm icons` (scripts/build-icons.mjs)
// 배경 색 사각형은 버리고 흰 그림을 currentColor 로 바꿔 담았다(bg = 원래 배경색)
export interface IconDef { viewBox: string; body: string; bg: string | null }
export const ICONS: Record<string, IconDef> = {
  "area-environment": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16\"/><path d=\"M7 7.5h3M7 11.5h3M7 15.5h3\"/><circle cx=\"18\" cy=\"12.5\" r=\"3\"/><path d=\"M18 15.5V21M2 21h20\"/></g>",
    "bg": null
  },
  "area-likes": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.5 3.5 12.3 9 17.5 10.5 12.3 12 10.5 17.5 8.7 12 3.5 10.5 8.7 9Z\"/><path d=\"M18.5 14.5v6M15.5 17.5h6\"/></g>",
    "bg": null
  },
  "area-personality": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14.5 21.5v-3h2.5a2 2 0 0 0 2-2V14l1.8-.7-1.8-3.3C18.6 6 15.6 3 11.5 3a7.2 7.2 0 0 0-4.5 12.8v5.7\"/><path d=\"M11.5 12.3s-2.6-1.5-2.6-3.3a1.3 1.3 0 0 1 2.6-.5 1.3 1.3 0 0 1 2.6.5c0 1.8-2.6 3.3-2.6 3.3Z\"/></g>",
    "bg": null
  },
  "env-bad": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"m9 9 6 6M15 9l-6 6\"/></g>",
    "bg": null
  },
  "env-good": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"m7.8 12.2 2.8 2.8 5.6-5.8\"/></g>",
    "bg": null
  },
  "env-neutral": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"M8 12h8\"/></g>",
    "bg": null
  },
  "env-we01": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"1.5\"/><circle cx=\"9\" cy=\"7.5\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"7.5\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"9\" cy=\"11.5\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"11.5\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M10.5 21v-4.5h3V21\"/></g>",
    "bg": null
  },
  "env-we02": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"7\" y=\"2.5\" width=\"10\" height=\"8\" rx=\"2\"/><rect x=\"5\" y=\"10.5\" width=\"14\" height=\"3.5\" rx=\"1.5\"/><path d=\"M12 14v4M7 21l5-3 5 3\"/></g>",
    "bg": null
  },
  "env-we03": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.5\" y=\"5\" width=\"19\" height=\"14\" rx=\"2\"/><path d=\"m3 7 9 6 9-6\"/></g>",
    "bg": null
  },
  "env-we04": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"6.5\" cy=\"8\" r=\"2.6\"/><circle cx=\"17.5\" cy=\"8\" r=\"2.6\"/><path d=\"M2 19.5c0-3 2-5.2 4.5-5.2S11 16.5 11 19.5M13 19.5c0-3 2-5.2 4.5-5.2s4.5 2.2 4.5 5.2\"/></g>",
    "bg": null
  },
  "env-we05": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 8.5h15M15 5l3.5 3.5L15 12\"/><path d=\"M20.5 15.5h-15M9 12l-3.5 3.5L9 19\"/></g>",
    "bg": null
  },
  "env-we06": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"6.5\" r=\"2.5\"/><circle cx=\"5\" cy=\"9.5\" r=\"2.1\"/><circle cx=\"19\" cy=\"9.5\" r=\"2.1\"/><path d=\"M7.5 20c0-3.2 2-5.5 4.5-5.5s4.5 2.3 4.5 5.5\"/><path d=\"M2 18c0-2.3 1.3-4 3-4 .8 0 1.5.3 2 .9M22 18c0-2.3-1.3-4-3-4-.8 0-1.5.3-2 .9\"/></g>",
    "bg": null
  },
  "env-we07": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 17 4.5 7l5 4.5L12 5l2.5 6.5 5-4.5L21 17Z\"/><path d=\"M3.5 20.5h17\"/></g>",
    "bg": null
  },
  "env-we08": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8.5 4V3.5a1 1 0 0 1 1-1h7.5l3.5 3.5v10.5a1 1 0 0 1-1 1h-.5\"/><rect x=\"3.5\" y=\"7\" width=\"13\" height=\"14.5\" rx=\"1.5\"/><path d=\"M7 12h6M7 16h4\"/></g>",
    "bg": null
  },
  "env-we09": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2Z\"/></g>",
    "bg": null
  },
  "env-we10": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 18.5h19\"/><path d=\"M4.5 18.5a7.5 7.5 0 0 1 15 0\"/><path d=\"M12 11V8.5M10 8.5h4\"/></g>",
    "bg": null
  },
  "env-we11": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"7.5\"/><path d=\"M12 2v4.5M12 17.5V22M2 12h4.5M17.5 12H22\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "env-we12": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"2.5\" width=\"6\" height=\"5\" rx=\"1\"/><rect x=\"2.5\" y=\"15\" width=\"6\" height=\"5\" rx=\"1\"/><rect x=\"15.5\" y=\"15\" width=\"6\" height=\"5\" rx=\"1\"/><path d=\"M12 7.5v4M5.5 15v-3.5h13V15\"/></g>",
    "bg": null
  },
  "env-we13": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 2.5 20.5 6 17 9.5\"/><path d=\"M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5\"/><path d=\"M7 21.5 3.5 18 7 14.5\"/><path d=\"M20.5 13v1.5a3.5 3.5 0 0 1-3.5 3.5H3.5\"/></g>",
    "bg": null
  },
  "env-we14": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8\" cy=\"15.5\" r=\"4.5\"/><path d=\"M11.2 12.3 20 3.5M16.5 7l2.5 2.5M14 9.5l2 2\"/></g>",
    "bg": null
  },
  "env-we15": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10\" cy=\"7.5\" r=\"3.5\"/><path d=\"M3.5 20c0-3.6 2.9-6.2 6.5-6.2 1.2 0 2.3.3 3.3.8\"/><path d=\"m15 18 2 2 4.5-4.5\"/></g>",
    "bg": null
  },
  "env-we16": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 11 6 7.5l4 1.5\"/><path d=\"M21.5 11 18 7.5l-4.5 1-4 3.5a1.5 1.5 0 0 0 2 2.2l2.5-2 5.5 5\"/><path d=\"m19.5 17.2-2.6 2.5a1.5 1.5 0 0 1-2.1-.1L13.5 18.4\"/><path d=\"m15.5 18.8-1 1a1.5 1.5 0 0 1-2.1 0L5 12.5 2.5 11\"/></g>",
    "bg": null
  },
  "env-we17": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8\"/><path d=\"M5 5a9.9 9.9 0 0 0 0 14M19 5a9.9 9.9 0 0 1 0 14\"/></g>",
    "bg": null
  },
  "env-we18": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M18 11.5V7a1.5 1.5 0 0 0-3 0v4\"/><path d=\"M15 10.5V4.5a1.5 1.5 0 0 0-3 0v6\"/><path d=\"M12 10.5V5.5a1.5 1.5 0 0 0-3 0v7\"/><path d=\"M18 9.5a1.5 1.5 0 0 1 3 0v4a8 8 0 0 1-8 8h-1a7 7 0 0 1-5.5-2.7L3 15a1.5 1.5 0 0 1 2.3-2L9 16\"/></g>",
    "bg": null
  },
  "env-we19": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"13\" r=\"7.5\"/><path d=\"M12 9.5V13l2.5 1.5\"/><path d=\"M3.5 5 6.5 2.5M20.5 5l-3-2.5M6.5 19.5 5 21M17.5 19.5 19 21\"/></g>",
    "bg": null
  },
  "env-we20": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21v-7\"/><path d=\"M12 14 5.5 7.5M12 14l6.5-6.5\"/><path d=\"M5 12V7h5M19 12V7h-5\"/></g>",
    "bg": null
  },
  "env-we21": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 12h6M6 8.5 9.5 12 6 15.5\"/><path d=\"M21.5 12h-6M18 8.5 14.5 12l3.5 3.5\"/><path d=\"M12 3v3M12 18v3\"/></g>",
    "bg": null
  },
  "env-we22": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"4.5\" r=\"2\"/><path d=\"M3.5 9.5h17\"/><path d=\"M12 6.5v7.5M12 14l-3 7M12 14l3 7\"/></g>",
    "bg": null
  },
  "env-we23": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21.5s7.5-3.5 7.5-9.5V5.5L12 2.5 4.5 5.5V12c0 6 7.5 9.5 7.5 9.5Z\"/><path d=\"M12 8.5v6M9 11.5h6\"/></g>",
    "bg": null
  },
  "env-we24": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"17.5\" cy=\"6\" r=\"2.5\"/><path d=\"M8 3 3.5 13h9Z\"/><path d=\"M8 13v8M2.5 21h19\"/></g>",
    "bg": null
  },
  "env-we25": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"2.5\" width=\"6\" height=\"11\" rx=\"3\"/><path d=\"M5.5 11a6.5 6.5 0 0 0 13 0\"/><path d=\"M12 17.5V21M8.5 21h7\"/></g>",
    "bg": null
  },
  "env-we26": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"m7.5 8 3 1.5M16.5 8l-3 1.5\"/><circle cx=\"9\" cy=\"11.8\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"11.8\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M8.5 17c1-1.3 2.2-2 3.5-2s2.5.7 3.5 2\"/></g>",
    "bg": null
  },
  "env-we27": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 2.5h8L21.5 8v8L16 21.5H8L2.5 16V8Z\"/><path d=\"M12 7.5v5.5\"/><circle cx=\"12\" cy=\"16.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "env-we28": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M18.81 13.63 L21.42 13.26 L21.42 10.74 L18.81 10.37 L17.97 8.34 L19.55 6.24 L17.76 4.45 L15.66 6.03 L13.63 5.19 L13.26 2.58 L10.74 2.58 L10.37 5.19 L8.34 6.03 L6.24 4.45 L4.45 6.24 L6.03 8.34 L5.19 10.37 L2.58 10.74 L2.58 13.26 L5.19 13.63 L6.03 15.66 L4.45 17.76 L6.24 19.55 L8.34 17.97 L10.37 18.81 L10.74 21.42 L13.26 21.42 L13.63 18.81 L15.66 17.97 L17.76 19.55 L19.55 17.76 L17.97 15.66Z\"/><circle cx=\"12\" cy=\"12\" r=\"2.8\"/></g>",
    "bg": null
  },
  "env-we29": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4.5\" width=\"18\" height=\"16.5\" rx=\"2\"/><path d=\"M3 9.5h18M8 2.5v4M16 2.5v4\"/><path d=\"M12 11.7 L11.06 14.01 L8.58 14.19 L10.48 15.79 L9.88 18.21 L12 16.9 L14.12 18.21 L13.52 15.79 L15.42 14.19 L12.94 14.01Z\"/></g>",
    "bg": null
  },
  "env-we30": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 3h18\" stroke-dasharray=\"2 2\"/><path d=\"M8 21V9.5M4.5 13 8 9.5l3.5 3.5\"/><path d=\"M16 21V6M12.5 9.5 16 6l3.5 3.5\"/></g>",
    "bg": null
  },
  "env-we31": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 9.5H7L12 5v14l-5-4.5H3.5Z\"/><path d=\"M15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12\"/></g>",
    "bg": null
  },
  "env-we32": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 21h9M8 21v-3.5\"/><path d=\"m8 17.5 3-8 6 2\"/><circle cx=\"8\" cy=\"17.5\" r=\"1.6\"/><circle cx=\"11\" cy=\"9.5\" r=\"1.6\"/><path d=\"M17 11.5 19 14M19 14l2.5-1M19 14l.5 2.5\"/></g>",
    "bg": null
  },
  "env-we33": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.5\" y=\"15\" width=\"19\" height=\"5\" rx=\"2.5\"/><circle cx=\"7\" cy=\"17.5\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"17.5\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"17\" cy=\"17.5\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><rect x=\"5\" y=\"8\" width=\"5\" height=\"5\" rx=\"1\"/><path d=\"M13.5 10.5h6M17 8l2.5 2.5L17 13\"/></g>",
    "bg": null
  },
  "env-we34": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 14.3V5a2 2 0 0 0-4 0v9.3a4 4 0 1 0 4 0Z\"/><path d=\"M11 17v-6\"/><path d=\"M16.5 5h4M16.5 9h3M16.5 13h4\"/></g>",
    "bg": null
  },
  "env-we35": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 10.5 12 3.5l8.5 7V20a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 20Z\"/><rect x=\"8\" y=\"11.5\" width=\"8\" height=\"5\" rx=\".8\"/><path d=\"M6.5 18.5h11\"/></g>",
    "bg": null
  },
  "env-we36": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"8\" y=\"8\" width=\"8\" height=\"8\" rx=\"1\"/><path d=\"m2.5 2.5 3.5 3.5M6 3v3H3M21.5 2.5 18 6M18 3v3h3M2.5 21.5 6 18M3 18h3v3M21.5 21.5 18 18M21 18h-3v3\"/></g>",
    "bg": null
  },
  "env-we37": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 18h6M10 21.5h4\"/><path d=\"M15 14.6c1.5-1.3 2.5-3.1 2.5-5.1a5.5 5.5 0 0 0-9.9-3.3M6.6 8.4a5.4 5.4 0 0 0-.1 1.1c0 2 1 3.8 2.5 5.1V18\"/><path d=\"m3 3 18 18\"/></g>",
    "bg": null
  },
  "env-we38": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"4\" r=\"2\"/><path d=\"M12 6.5V14M12 8 8.5 13M12 8l3.5 5\"/><path d=\"m12 14-2 7.5M12 14l2 7.5\"/></g>",
    "bg": null
  },
  "env-we39": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g transform=\"rotate(-45 12 12)\"><rect x=\"2\" y=\"8.5\" width=\"20\" height=\"7\" rx=\"3.5\"/><path d=\"M8.5 8.5v7M15.5 8.5v7\"/></g><circle cx=\"11\" cy=\"11\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"13\" cy=\"13\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "env-we40": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"18\" cy=\"12.5\" r=\"2\"/><path d=\"M7.5 7.5 16 10.5\"/><path d=\"m14 9.8.5 8.7\"/><path d=\"M7.5 7.5 6 21M7.5 7.5 9.5 21\"/></g>",
    "bg": null
  },
  "env-we41": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"14.5\" cy=\"4\" r=\"2\"/><path d=\"M13.5 6.5 11 13\"/><path d=\"m12.8 8.3 3.7 2.7M12.8 8.3 8.5 9.5\"/><path d=\"m11 13 3.5 3.5V21M11 13l-2.5 4.5-4 1\"/></g>",
    "bg": null
  },
  "env-we42": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"4.5\" r=\"2\"/><path d=\"M12 7v7M8.5 10h7M12 14l-2.5 7M12 14l2.5 7\"/><path d=\"M4.5 7v10M19.5 7v10M1.5 10v4M22.5 10v4\"/></g>",
    "bg": null
  },
  "env-we43": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 2.5v6.3L4 19a1.6 1.6 0 0 0 1.4 2.5h13.2A1.6 1.6 0 0 0 20 19L14.5 8.8V2.5\"/><path d=\"M8 2.5h8M6.5 15h11\"/><circle cx=\"10\" cy=\"18\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14\" cy=\"18.5\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "env-we44": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8.5 2.5 4 6v14.5a1 1 0 0 0 1 1h5V11Z\"/><path d=\"M15.5 2.5 20 6v14.5a1 1 0 0 1-1 1h-5V11Z\"/><path d=\"M8.5 2.5c1 1.5 2 2.2 3.5 2.2s2.5-.7 3.5-2.2\"/><path d=\"M4 15h6M14 15h6\"/></g>",
    "bg": null
  },
  "env-we45": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.3 3.9 2.4 17.8A2 2 0 0 0 4.1 20.8h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z\"/><path stroke-width=\"1.6\" d=\"M14.38 15.37 L15.54 15.24 L15.54 13.96 L14.38 13.83 L13.86 12.93 L14.32 11.85 L13.22 11.21 L12.52 12.15 L11.48 12.15 L10.78 11.21 L9.68 11.85 L10.14 12.93 L9.62 13.83 L8.46 13.96 L8.46 15.24 L9.62 15.37 L10.14 16.27 L9.68 17.35 L10.78 17.99 L11.48 17.05 L12.52 17.05 L13.22 17.99 L14.32 17.35 L13.86 16.27Z\"/><circle stroke-width=\"1.6\" cx=\"12\" cy=\"14.6\" r=\"0.9\"/></g>",
    "bg": null
  },
  "env-we46": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 17v-5a5 5 0 0 1 10 0v5\"/><rect x=\"4.5\" y=\"17\" width=\"15\" height=\"4\" rx=\"1\"/><path d=\"M12 2.5v2M4.5 5.5 6 7M19.5 5.5 18 7M2 11.5h2M20 11.5h2\"/></g>",
    "bg": null
  },
  "env-we47": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"4.6\"/><path d=\"M16.25 10.24L19.21 9.02M13.76 7.75L14.98 4.79M10.24 7.75L9.02 4.79M7.75 10.24L4.79 9.02M7.75 13.76L4.79 14.98M10.24 16.25L9.02 19.21M13.76 16.25L14.98 19.21M16.25 13.76L19.21 14.98\"/><circle cx=\"20.5\" cy=\"8.48\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15.52\" cy=\"3.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"8.48\" cy=\"3.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"3.5\" cy=\"8.48\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"3.5\" cy=\"15.52\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"8.48\" cy=\"20.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15.52\" cy=\"20.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"20.5\" cy=\"15.52\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "env-we48": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 2.5v19M17 2.5v19M7 7h10M7 12h10M7 17h10\"/></g>",
    "bg": null
  },
  "env-we49": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4.5\" width=\"18\" height=\"16.5\" rx=\"2\"/><path d=\"M3 9.5h18M8 2.5v4M16 2.5v4\"/><path d=\"m8.5 15 2.5 2.5 4.5-4.5\"/></g>",
    "bg": null
  },
  "feel-blank": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><circle cx=\"9\" cy=\"10.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"10.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "feel-confused": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><circle cx=\"8.8\" cy=\"9\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15.2\" cy=\"10.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M8 16c1-1.1 1.8-1.1 2.7 0s1.8 1.1 2.7 0 1.8-1.1 2.7 0\"/></g>",
    "bg": null
  },
  "feel-sigh": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"M7.5 10h2.5M14 10h2.5\"/><circle cx=\"12\" cy=\"15.5\" r=\"1.4\"/></g>",
    "bg": null
  },
  "feel-tired": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"m7.5 8.5 2.5 1.5-2.5 1.5M16.5 8.5 14 10l2.5 1.5\"/><path d=\"M9 17c.7-1.2 1.8-1.8 3-1.8s2.3.6 3 1.8\"/></g>",
    "bg": null
  },
  "gate-degree": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 9 12 4l9 5Z\"/><path d=\"M6 12v5M10 12v5M14 12v5M18 12v5\"/><path d=\"M3 20.5h18\"/></g>",
    "bg": null
  },
  "gate-experience": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5\"/><path d=\"M3.5 3.5v5h5\"/><path d=\"M12 7.5V12l3 2\"/></g>",
    "bg": null
  },
  "gate-license": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"9.5\" r=\"6.5\"/><path d=\"m9.3 9.6 1.9 1.9 3.5-3.6\"/><path d=\"M8.3 14.8 7 21.5l5-2.3 5 2.3-1.3-6.7\"/></g>",
    "bg": null
  },
  "gate-selection": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4\"/><path d=\"M8 8h6M8 12h4\"/><path d=\"M19.4 12.6a1.6 1.6 0 0 1 2.3 2.3L15.5 21l-3 .8.8-3Z\"/></g>",
    "bg": null
  },
  "gate-senior": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 21.5h5v-4h5v-4h5v-4h4\"/><path d=\"M20 9.5v-7h-5.5l1.5 2-1.5 2H20\"/></g>",
    "bg": null
  },
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
  },
  "method-academy": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"12\" rx=\"1.5\"/><path d=\"M7 7.5h6M7 11h9\"/><path d=\"m8 15-2 6M16 15l2 6\"/></g>",
    "bg": null
  },
  "method-activity": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 20s-8-4.6-8-10.3A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.7C20 15.4 12 20 12 20Z\"/></g>",
    "bg": null
  },
  "method-book": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 19A2.5 2.5 0 0 1 7.5 16.5H19V2.5H7.5A2.5 2.5 0 0 0 5 5Z\"/><path d=\"M5 19a2.5 2.5 0 0 0 2.5 2.5H19v-5\"/><path d=\"M9 7h6\"/></g>",
    "bg": null
  },
  "method-club": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 4.5c3.6 0 6.5 2.5 6.5 5.5s-2.9 5.5-6.5 5.5c-.9 0-1.8-.2-2.6-.5L3 16l1-3a5.2 5.2 0 0 1-1.5-3C2.5 7 5.4 4.5 9 4.5Z\"/><path d=\"M17.8 8.8c2.2.9 3.7 2.8 3.7 5 0 1.1-.4 2.2-1.1 3.1l.8 2.6-2.9-.9c-.8.3-1.7.4-2.6.4-1.8 0-3.4-.6-4.5-1.6\"/></g>",
    "bg": null
  },
  "method-content": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3a9 9 0 0 0 0 18c1.2 0 2-.8 2-1.9 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1 .9-1.8 2-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z\"/><circle cx=\"7.5\" cy=\"11\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"10\" cy=\"7\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"7.5\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "method-contest": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 3.5h10V9a5 5 0 0 1-10 0Z\"/><path d=\"M7 5.5H4.5c0 2.5 1.2 4 3 4.3M17 5.5h2.5c0 2.5-1.2 4-3 4.3\"/><path d=\"M12 14v4\"/><rect x=\"8\" y=\"18\" width=\"8\" height=\"3\" rx=\"1\"/></g>",
    "bg": null
  },
  "method-etc": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"5.5\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"18.5\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "method-field-practice": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 16v-2a7 7 0 0 1 14 0v2\"/><path d=\"M3 16h18v1.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z\"/><path d=\"M10 7.3V12M14 7.3V12\"/></g>",
    "bg": null
  },
  "method-internship": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m9 2.5 3 4 3-4\"/><rect x=\"5\" y=\"6.5\" width=\"14\" height=\"15\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M9 18c.5-1.3 1.6-2 3-2s2.5.7 3 2\"/></g>",
    "bg": null
  },
  "method-lecture": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.5\" y=\"3.5\" width=\"19\" height=\"13\" rx=\"2\"/><path d=\"M8 21h8M12 16.5V21\"/><path d=\"M10.2 7.6v5l4.2-2.5Z\"/></g>",
    "bg": null
  },
  "method-parttime": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8Z\"/><path d=\"M14 2.5V8h5.5\"/><path d=\"M8 12h5\"/><path d=\"M8 17.2c1.1-1.6 2-1.6 2.6-.2.6 1.4 1.5 1.5 2.8-.3\"/></g>",
    "bg": null
  },
  "method-personal-project": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7Z\"/><path d=\"M3.5 7 12 11.5 20.5 7\"/><path d=\"M12 11.5v10\"/></g>",
    "bg": null
  },
  "method-practice": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6.5 6.5v11M17.5 6.5v11\"/><path d=\"M3.5 9v6M20.5 9v6\"/><path d=\"M6.5 12h11\"/></g>",
    "bg": null
  },
  "method-required-course": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"4\" width=\"14\" height=\"17.5\" rx=\"2\"/><rect x=\"9\" y=\"2.5\" width=\"6\" height=\"3\" rx=\"1\"/><path d=\"m8.5 10.5 1.3 1.3 2.4-2.4M14.5 10.5h1.5\"/><path d=\"m8.5 16 1.3 1.3 2.4-2.4M14.5 16h1.5\"/></g>",
    "bg": null
  },
  "method-school": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4.5 21v-9.5L12 7l7.5 4.5V21\"/><path d=\"M2.5 21h19\"/><path d=\"M10 21v-4.5h4V21\"/><path d=\"M12 7V2.5l3.5 1.4L12 5.3\"/></g>",
    "bg": null
  },
  "method-study-group": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"9\" cy=\"8\" r=\"3.5\"/><path d=\"M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6\"/><path d=\"M16 4.5a3.5 3.5 0 0 1 0 7\"/><path d=\"M18.5 14.4c1.8.9 3 2.9 3 5.6\"/></g>",
    "bg": null
  },
  "method-team-project": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"5\" r=\"2.5\"/><circle cx=\"5\" cy=\"18\" r=\"2.5\"/><circle cx=\"19\" cy=\"18\" r=\"2.5\"/><path d=\"M10.8 7.2 6.2 15.8M13.2 7.2l4.6 8.6M7.5 18h9\"/></g>",
    "bg": null
  },
  "onboard-compass": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5Z\"/></g>",
    "bg": null
  },
  "onboard-encyclopedia": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 4v16M8.5 4v16M13 6v14\"/><path d=\"m16 6 4 14\"/></g>",
    "bg": null
  },
  "onboard-launch": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5c3 2.3 4.5 5.6 4.5 9.6V16h-9v-3.9c0-4 1.5-7.3 4.5-9.6Z\"/><circle cx=\"12\" cy=\"9.5\" r=\"1.8\"/><path d=\"M7.5 12.5 4.5 15.5V18h3M16.5 12.5l3 3V18h-3\"/><path d=\"M10.5 19v2M13.5 19v2\"/></g>",
    "bg": null
  },
  "pace-allin": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 16A9 9 0 0 1 4.41 11.16M5.06 10.28A9 9 0 0 1 8.7 7.63M9.75 7.29A9 9 0 0 1 14.25 7.29M15.3 7.63A9 9 0 0 1 18.94 10.28M19.59 11.16A9 9 0 0 1 21 16\" stroke-width=\"3\"/><path d=\"M12 16L17.23 14.3\"/><circle cx=\"12\" cy=\"16\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 20.5h16\"/></g>",
    "bg": null
  },
  "pace-focus": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15.3 7.63A9 9 0 0 1 18.94 10.28M19.59 11.16A9 9 0 0 1 21 16\" opacity=\".3\"/><path d=\"M3 16A9 9 0 0 1 4.41 11.16M5.06 10.28A9 9 0 0 1 8.7 7.63M9.75 7.29A9 9 0 0 1 14.25 7.29\" stroke-width=\"3\"/><path d=\"M12 16L12 10.5\"/><circle cx=\"12\" cy=\"16\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 20.5h16\"/></g>",
    "bg": null
  },
  "pace-full": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19.59 11.16A9 9 0 0 1 21 16\" opacity=\".3\"/><path d=\"M3 16A9 9 0 0 1 4.41 11.16M5.06 10.28A9 9 0 0 1 8.7 7.63M9.75 7.29A9 9 0 0 1 14.25 7.29M15.3 7.63A9 9 0 0 1 18.94 10.28\" stroke-width=\"3\"/><path d=\"M12 16L15.23 11.55\"/><circle cx=\"12\" cy=\"16\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 20.5h16\"/></g>",
    "bg": null
  },
  "pace-light": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.06 10.28A9 9 0 0 1 8.7 7.63M9.75 7.29A9 9 0 0 1 14.25 7.29M15.3 7.63A9 9 0 0 1 18.94 10.28M19.59 11.16A9 9 0 0 1 21 16\" opacity=\".3\"/><path d=\"M3 16A9 9 0 0 1 4.41 11.16\" stroke-width=\"3\"/><path d=\"M12 16L6.77 14.3\"/><circle cx=\"12\" cy=\"16\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 20.5h16\"/></g>",
    "bg": null
  },
  "pace-steady": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.75 7.29A9 9 0 0 1 14.25 7.29M15.3 7.63A9 9 0 0 1 18.94 10.28M19.59 11.16A9 9 0 0 1 21 16\" opacity=\".3\"/><path d=\"M3 16A9 9 0 0 1 4.41 11.16M5.06 10.28A9 9 0 0 1 8.7 7.63\" stroke-width=\"3\"/><path d=\"M12 16L8.77 11.55\"/><circle cx=\"12\" cy=\"16\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 20.5h16\"/></g>",
    "bg": null
  },
  "priority-high": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke-width=\"3.2\" d=\"M6 20V15\"/><path stroke-width=\"3.2\" d=\"M12 20V10\"/><path stroke-width=\"3.2\" d=\"M18 20V5\"/></g>",
    "bg": null
  },
  "priority-low": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke-width=\"3.2\" d=\"M6 20V15\"/><path stroke-width=\"3.2\" d=\"M12 20V10\" opacity=\".3\"/><path stroke-width=\"3.2\" d=\"M18 20V5\" opacity=\".3\"/></g>",
    "bg": null
  },
  "priority-normal": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke-width=\"3.2\" d=\"M6 20V15\"/><path stroke-width=\"3.2\" d=\"M12 20V10\"/><path stroke-width=\"3.2\" d=\"M18 20V5\" opacity=\".3\"/></g>",
    "bg": null
  },
  "result-interest": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10.5\" cy=\"10.5\" r=\"7.5\"/><path d=\"m16 16 5 5\"/><path d=\"M10.5 13.5s-3-1.7-3-3.8a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 2.1-3 3.8-3 3.8Z\"/></g>",
    "bg": null
  },
  "result-talent": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 21v-6.5h6.5V10h6v7h6.5v4Z\"/><path d=\"m12 2.8 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3Z\"/></g>",
    "bg": null
  },
  "result-values": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6.5 3.5h11l4 5L12 20.5 2.5 8.5Z\"/><path d=\"M2.5 8.5h19\"/><path d=\"M10 3.5 8.5 8.5 12 20.5l3.5-12L14 3.5\"/></g>",
    "bg": null
  },
  "service-achievement": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 21 9.5 9.5l4 6.5 2.5-3.5L21.5 21Z\"/><path d=\"M9.5 9.5V2.5l4.5 1.8-4.5 1.8\"/></g>",
    "bg": null
  },
  "service-ai": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"8\" width=\"16\" height=\"12.5\" rx=\"3\"/><path d=\"M12 8V5\"/><circle cx=\"12\" cy=\"3.5\" r=\"1.5\"/><circle cx=\"9\" cy=\"13.5\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15\" cy=\"13.5\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M10 17h4M2 13v3M22 13v3\"/></g>",
    "bg": null
  },
  "service-encyclopedia-plus": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 4v16M8 4v16M12.5 6v14\"/><path d=\"m15.5 6 2.2 7\"/><path d=\"M19 15.5v6M16 18.5h6\"/></g>",
    "bg": null
  },
  "service-encyclopedia": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 4v16M8.5 4v16M13 6v14\"/><path d=\"m16 6 4 14\"/></g>",
    "bg": null
  },
  "service-growth": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21v-9\"/><path d=\"M12 12.5c0-4-2.8-6.5-7.5-6.5 0 4 2.8 6.5 7.5 6.5Z\"/><path d=\"M12 10.5c0-3.8 2.6-6 7-6 0 3.8-2.6 6-7 6Z\"/><path d=\"M7 21h10\"/></g>",
    "bg": null
  },
  "service-job-experience": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"7\" width=\"18\" height=\"13.5\" rx=\"2\"/><path d=\"M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2\"/><path d=\"M10.5 11.2v5.6l4.5-2.8Z\"/></g>",
    "bg": null
  },
  "service-mentoring": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"8\" cy=\"7\" r=\"3.3\"/><path d=\"M2 20.5c0-3.6 2.7-6.3 6-6.3s6 2.7 6 6.3\"/><circle cx=\"17.5\" cy=\"11\" r=\"2.4\"/><path d=\"M14.5 20.5c.3-2.5 1.4-4 3-4s2.7 1.5 3 4\"/></g>",
    "bg": null
  },
  "service-test": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3\"/><circle cx=\"12\" cy=\"10\" r=\"2.6\"/><path d=\"M7.5 17c.8-2 2.4-3 4.5-3s3.7 1 4.5 3\"/></g>",
    "bg": null
  },
  "tip-honest": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3.5c4.7 0 8.5 3.2 8.5 7.2s-3.8 7.2-8.5 7.2c-1 0-2-.1-2.9-.4L4.5 20l1-3.6A6.9 6.9 0 0 1 3.5 10.7c0-4 3.8-7.2 8.5-7.2Z\"/><path d=\"M12 13.6s-3-1.7-3-3.8a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 2.1-3 3.8-3 3.8Z\"/></g>",
    "bg": null
  },
  "tip-quick": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13.5 2.5 4.5 13.5h7l-1 8 9-11h-7Z\"/></g>",
    "bg": null
  },
  "tip-warning": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.3 3.9 2.4 17.8A2 2 0 0 0 4.1 20.8h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z\"/><path d=\"M12 9v4.5\"/><circle cx=\"12\" cy=\"17\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "ui-avatar": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4.5 21c0-4 3.4-7 7.5-7s7.5 3 7.5 7\"/></g>",
    "bg": null
  },
  "ui-bell": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 9.5a6 6 0 0 1 12 0c0 5.5 2.5 7.5 2.5 7.5h-17S6 15 6 9.5Z\"/><path d=\"M10 20.5a2.2 2.2 0 0 0 4 0\"/></g>",
    "bg": null
  },
  "ui-calendar": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4.5\" width=\"18\" height=\"16.5\" rx=\"2\"/><path d=\"M3 9.5h18M8 2.5v4M16 2.5v4\"/><circle cx=\"8\" cy=\"13.5\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"13.5\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"16\" cy=\"13.5\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"8\" cy=\"17.2\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"17.2\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"16\" cy=\"17.2\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "ui-celebrate": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 20.5 8 9l7 7Z\"/><path d=\"M14 3v2M19 10h2M18.5 4.5 17 6M12 8.5c.4-1.4 1.6-2 2.8-1.6M15.5 12c1.2-.4 2.4.2 2.8 1.5\"/><circle cx=\"20\" cy=\"17\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"9.5\" cy=\"4\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "ui-coming-soon": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2.5\" y=\"7\" width=\"19\" height=\"7\" rx=\"1\"/><path d=\"M8 7 4.5 14M13.5 7 10 14M19 7l-3.5 7\"/><path d=\"M6 4v3M18 4v3M6 14v6.5M18 14v6.5\"/></g>",
    "bg": null
  },
  "ui-done": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"4\"/><path d=\"m8 12.2 2.8 2.8 5.2-5.6\"/></g>",
    "bg": null
  },
  "ui-duration": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"13.5\" r=\"8\"/><path d=\"M12 13.5V9.5M9.5 2.5h5M12 2.5v3M18.5 6.5 20 5\"/></g>",
    "bg": null
  },
  "ui-edit": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 3.5a2.1 2.1 0 0 1 3 3L7.5 18 3 19.5 4.5 15Z\"/><path d=\"m14 5.5 3 3M13 20.5h8\"/></g>",
    "bg": null
  },
  "ui-empty-result": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10.5\" cy=\"10.5\" r=\"7.5\"/><path d=\"m16 16 5 5\"/><path d=\"m8.3 8.3 4.4 4.4M12.7 8.3l-4.4 4.4\"/></g>",
    "bg": null
  },
  "ui-free": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\"/><path d=\"M4.5 12v8a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-8M12 8v13.5\"/><path d=\"M12 8C10.6 4.2 7 3.6 7 6s3 2 5 2 5 .4 5-2-3.6-1.8-5 2Z\"/></g>",
    "bg": null
  },
  "ui-no-survey": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"4\" width=\"14\" height=\"17.5\" rx=\"2\"/><rect x=\"9\" y=\"2.5\" width=\"6\" height=\"3\" rx=\"1\"/><path d=\"M9.5 13h5\" opacity=\".45\"/></g>",
    "bg": null
  },
  "ui-photo": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8.5a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/></g>",
    "bg": null
  },
  "ui-privacy": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4.5\" y=\"10.5\" width=\"15\" height=\"11\" rx=\"2\"/><path d=\"M8 10.5V7a4 4 0 0 1 8 0v3.5M12 15v2.5\"/></g>",
    "bg": null
  },
  "ui-recommend": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3 L9.47 9.12 L2.87 9.63 L7.91 13.93 L6.36 20.37 L12 16.9 L17.64 20.37 L16.09 13.93 L21.13 9.63 L14.53 9.12Z\"/></g>",
    "bg": null
  },
  "ui-repeat": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20.5 12a8.5 8.5 0 0 1-15.2 5.2M3.5 12A8.5 8.5 0 0 1 18.7 6.8\"/><path d=\"M19 2.5v4.5h-4.5M5 21.5V17h4.5\"/></g>",
    "bg": null
  },
  "ui-search": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10.5\" cy=\"10.5\" r=\"7.5\"/><path d=\"m16 16 5 5\"/></g>",
    "bg": null
  },
  "ui-target": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></g>",
    "bg": null
  },
  "ui-template": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M3 9h18M9 9v12\"/></g>",
    "bg": null
  },
  "ui-time-input": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"M12 6.5V12l3.5 2\"/></g>",
    "bg": null
  },
  "ui-tip": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 18h6M10 21.5h4\"/><path d=\"M15 14.6c1.5-1.3 2.5-3.1 2.5-5.1a5.5 5.5 0 0 0-11 0c0 2 1 3.8 2.5 5.1V18h6Z\"/></g>",
    "bg": null
  },
  "ui-views": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></g>",
    "bg": null
  },
  "ui-weekly-review": {
    "viewBox": "0 0 24 24",
    "body": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><path d=\"M8 7.5h8\"/><path d=\"m8 16 2.5-3 2.5 2 3-4\"/></g>",
    "bg": null
  }
}
export type IconName = keyof typeof ICONS
