// 계획이 바뀐 이번 주를 '오늘부터만' 다시 만들기(2026-11-26 #99 — 서버 services/scheduleReset.js 가 rebuildFrom 을 적는다).
// 화면과 무관한 계산만 여기(시험: __tests__/scheduleRebuild.spec.ts). 연결은 useWeeklySchedule.ensureWeekSchedule.
//
// 예전(서버가 이번 주를 통째로 지움 → 계획대로 다시 만듦)에 생기던 일(재현 2026-11-26):
//   · 이번 주의 지난 요일에 새 프로젝트 칸이 생겨 '못 한 날'이 되고 연속 달성이 거꾸로 끊겼다
//   · 미리 하기로 당겨 온 칸이 원래 요일로 돌아가고(이미 했는데 또 나옴), 일정 조정으로 옮긴 칸이 되돌아갔다
// 규칙
//   · from 전 날의 칸은 그대로(지난 요일 — 완료 기록과 맞물린 칸)
//   · from 부터는 일·루틴마다 본다. 계획이 그 일에 대해 바뀌지 않았으면(남은 칸 수와 그 주 차례가 같으면) 사용자가 옮겨 둔 자리 그대로,
//     바뀌었으면 계획대로. 미리 하기로 지난 요일에 당겨 간 칸은 남은 칸 수에 넣어 세고, 계획대로 다시 만들 때도 그 요일 칸을 뺀다
import { aheadFromNote } from './pullAhead'

/**
 * 실제로 다시 만들기 시작할 날 — 서버가 적은 날(표시한 날)과 앱의 오늘 가운데 늦은 날(2026-11-27 이어받아 점검).
 * 표시된 뒤 며칠 앱을 열지 않았으면 서버의 날은 이미 지났다 — 그 사이 지난 요일은 예전 칸 그대로 둔다(새 칸이 '못 한 날'이 되지 않게)
 */
export const rebuildStart = (serverFrom: string, today: string): string => (today > serverFrom ? today : serverFrom)

export interface RebuildItem { id?: string; itemType: 'project' | 'routine'; itemId: string; date: string; note?: string; curriculumWeek?: number | null }

/** exists — 계획에 아직 있는 일인가(지운 프로젝트·루틴의 지난 칸은 남기지 않는다 — 할 수 없는 칸이 연속 달성을 끊지 않게) */
export function rebuildWeekItems<T extends RebuildItem>(kept: T[], generated: T[], from: string, exists: (it: RebuildItem) => boolean = () => true): T[] {
  const key = (it: RebuildItem) => `${it.itemType}:${it.itemId}`
  const past = kept.filter((it) => it.date < from && exists(it))
  const keptFuture = kept.filter((it) => it.date >= from)
  const genFuture = generated.filter((it) => it.date >= from)
  // 지난 요일로 당겨 간 칸의 원래 날짜(아직 오지 않은 날) — 일마다
  const pulled = new Map<string, string[]>()
  for (const it of past) {
    const f = it.itemType === 'project' ? aheadFromNote(it.note) : null
    if (f && f >= from) pulled.set(key(it), [...(pulled.get(key(it)) ?? []), f])
  }
  const out: T[] = [...past]
  const ids = [...new Set([...keptFuture, ...genFuture].map(key))]
  for (const k of ids) {
    const kf = keptFuture.filter((x) => key(x) === k)
    const gf = genFuture.filter((x) => key(x) === k)
    const pf = pulled.get(k) ?? []
    const week = (x?: RebuildItem) => x?.curriculumWeek ?? null
    const unchanged = gf.length > 0 && kf.length + pf.length === gf.length && kf.every((x) => week(x) === week(gf[0]))
    if (unchanged) { out.push(...kf); continue }
    const rest = gf.slice()
    for (const f of pf) { const i = rest.findIndex((x) => x.date === f); if (i >= 0) rest.splice(i, 1) }
    out.push(...rest)
  }
  return out.map((it, i) => ({ it, i })).sort((a, b) => a.it.date.localeCompare(b.it.date) || a.i - b.i).map((x) => x.it)
}
