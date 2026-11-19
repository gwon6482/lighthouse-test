// 내 진로상황으로 예시 진로설계를 맞추는 계산(2026-11-16) — 화면과 무관한 순수 함수만 둔다.
//
// 진로계획 라이브러리의 길(비전공자 기준으로 빈틈없이 짠 것)에서 내 상황에 필요 없는 걸음을 빼고, 남은 학교 과정을 줄인다.
// 규칙(시안 https://claude.ai/artifact/RQWGF4cLM9nSZQsNWQ5oED 의 '답에 따라 계획이 바뀌는 규칙'):
//   · 중·고등학생·고등학교 졸업      바뀌는 것 없음
//   · 대학생 + 관련 학과             입시(수능·원서) 빼기 · 대학 과정을 남은 학년만큼(이번 학년 포함) · 전공 과목에서 배우는 걸음 빼기
//   · 대학 졸업 + 관련 학과          위에 더해 대학 과정과, 그 과정 중에 학교에서 하는 걸음(실습·교직이수·교육봉사 등) 빼기
//                                    — 시험·자격·지원 준비와 실무 연습은 남긴다(이미 붙었으면 '이미 해 둔 것'으로 뺀다)
//   · 다른 학과                      바뀌는 것 없음(수능 걸음의 '편입·학사편입' 안내가 보인다)
//   · 법조(항목 skipFor:'any')       학과와 상관없이 대학생이면 입시 빼기·학부 남은 학년만, 졸업이면 학부까지 빼기
//   · 대학 학위를 대신하는 과정      (프로젝트 replacesCollege — 학점은행으로 전문학사 받기, 2026-11-19) 대학생·졸업자면 학년과 상관없이 빼고,
//                                    그 안에 겹쳐 있던 걸음(자격 과목 이수)은 따로 센다 — 학위는 다니는 대학이 채운다
//   · 대학원생·졸업 + 관련           학부는 졸업으로 보고, 석사 과정은 대학원생이면 남은 1년·졸업이면 빼기(그 과정의 학업 걸음·학위 논문도)
//   · 이미 해 둔 것                  고른 걸음 빼기(자격·면허·어학·근무 경험). 자격을 해 뒀으면 짝인 필기·1차·연수도 뺀다(2026-11-17)
// 경력·성과는 계획에 반영하지 않는다.
import type { JobPreparation, PrepItem, PrepPath, PrepPhase, PrepProject } from '@/modules/encyclopedia/types/encyclopedia'
import { sumWeeks } from '@/modules/encyclopedia/lib/preparation'
import type { CareerProfile } from '../types/career-design'
import { atCollege } from '../composables/useCareerProfile'

/** 이미 해 뒀을 수 있는 걸음 — 자격·면허·어학(유형 cert)과 근무 경험. 학교·수련 과정은 학교 질문으로 다룬다 */
export const canHave = (p: PrepProject) =>
  !p.course && (!!p.mayHave || p.type === 'cert' || (p.type === 'activity' && p.subtype === 'work'))

/** '이미 해 둔 것' 목록에 쓰는 이름 — 메모가 자격 이름인 것(간호사 국가시험) > 정해 둔 이름(운전면허) > 프로젝트 이름에서 '따기·준비' 떼기 */
export function haveLabelOf(item: Pick<PrepItem, 'note'>, p: PrepProject): string {
  if (p.haveByNote && item.note) return item.note
  if (p.haveLabel) return p.haveLabel
  return p.name.replace(/\s*(따기|준비|만들기|쌓기|익히기)$/, '')
}

/** 저장 열쇠 — 보편은 'cp.번호', 직업 전용은 '계획 코드:p.번호'(전용 번호는 계획마다 겹친다) */
export const haveKey = (prep: Pick<JobPreparation, 'plan'>, p: PrepProject) =>
  (p.id.startsWith('cp.') ? p.id : `${prep.plan.jobCode}:${p.id}`)

export interface HaveRef { key: string; label: string }
export const haveRefOf = (prep: Pick<JobPreparation, 'plan'>, item: Pick<PrepItem, 'note'>, p: PrepProject): HaveRef =>
  ({ key: haveKey(prep, p), label: haveLabelOf(item, p) })

type HaveEntry = CareerProfile['has'][number]
/** 저장·비교할 대상. 필기·1차·연수 걸음이면 짝인 자격 걸음을 pair 로 싣는다 — '다시 넣기'로 뺄 때 함께 뺀다 */
export interface HaveTarget extends HaveRef { byNote: boolean; pair?: HaveTarget }

// ── 열쇠가 바뀐 옛 저장값(2026-11-17 필기·실기 차수 나누기) ──
// '이미 해 둔 것'은 프로젝트 id(+ 메모가 자격 이름인 것은 그 메모)로 저장한다. 자료를 나누면서 아래 저장값은 그대로는 맞지 않게 됐다
// (운영 자료 main 과 data/written-practical 을 직업마다 맞대 본 결과 — 바뀐 저장값은 이 11개뿐이다. 한국사 3곳은 선택 항목이 됐을 뿐 열쇠는 그대로).
//   · 보건의료 6직업: 국가시험 한 걸음(cp.license-exam '○ 국가시험(필기·실기)')이 필기·실기 두 걸음으로 — 옛 값은 둘 다 붙은 것
//   · 미용사 4갈래: 기능사 메모에서 '필기·실기'를 뗐다(cp.craftsman-cert 는 메모가 저장 이름이다)
// 옛 값은 고쳐 쓰지 않고 읽을 때 새 걸음으로 본다 — 자료와 앱 중 무엇이 먼저 나가도 맞게. 체크를 하나 풀면 그때 새 열쇠로 풀어 저장한다(withoutHave)
const licenseSplit = (old: string, base: string) => ({
  ref: 'cp.license-exam', name: old,
  to: [{ ref: 'cp.license-written', name: `${base} 필기` }, { ref: 'cp.license-practical', name: `${base} 실기` }],
})
const craftsmanNote = (kind: string) => ({
  ref: 'cp.craftsman-cert', name: `미용사(${kind}) 필기·실기`, to: [{ ref: 'cp.craftsman-cert', name: `미용사(${kind})` }],
})
export const HAVE_ALIASES: { ref: string; name: string; to: HaveEntry[] }[] = [
  licenseSplit('의사 국가시험(필기·실기)', '의사 국가시험'),
  licenseSplit('치과의사 국가시험(필기·실기)', '치과의사 국가시험'),
  licenseSplit('치과기공사 국가시험(필기·실기)', '치과기공사 국가시험'),
  licenseSplit('치과위생사 국가시험(필기·실기)', '치과위생사 국가시험'),
  licenseSplit('의지·보조기 기사 국가시험', '의지·보조기 기사 국가시험'),
  licenseSplit('1급 응급구조사 국가시험(필기·실기)', '1급 응급구조사 국가시험'),
  licenseSplit('2급 응급구조사 시험(필기·실기)', '2급 응급구조사 시험'),
  craftsmanNote('일반'), craftsmanNote('피부'), craftsmanNote('네일'), craftsmanNote('메이크업'),
]
const aliasesOf = (h: HaveEntry): HaveEntry[] => HAVE_ALIASES.find((a) => a.ref === h.ref && a.name === h.name)?.to ?? []
const hits = (e: HaveEntry, t: HaveRef & { byNote: boolean }) => e.ref === t.key && (!t.byNote || e.name === t.label)

/** 저장값 하나가 대상을 가리키는가 — 직접, 또는 옛 저장값(별칭)으로 */
export const sameHave = (h: HaveEntry, t: HaveRef & { byNote: boolean }) => hits(h, t) || aliasesOf(h).some((a) => hits(a, t))

/** 해 둔 것으로 저장돼 있는가 — 메모가 자격 이름인 보편 프로젝트(기능사·기사)는 번호가 같아도 이름이 같아야 한다 */
export function isHad(has: CareerProfile['has'], ref: HaveRef, byNote: boolean): boolean {
  return has.some((h) => sameHave(h, { ...ref, byNote }))
}

/**
 * 대상을 '이미 해 둔 것'에서 뺀다(체크 풀기·다시 넣기). 옛 저장값이 다른 걸음도 함께 가리키면 그 걸음들은 새 열쇠로 풀어 남긴다.
 * 대상이 필기·1차·연수 걸음이면 짝인 자격도 뺀다 — 필기에 안 붙었거나 연수를 안 마쳤으면 자격도 없다
 */
export function withoutHave(has: CareerProfile['has'], t: HaveTarget): CareerProfile['has'] {
  const out: HaveEntry[] = []
  const add = (e: HaveEntry) => { if (!out.some((x) => x.ref === e.ref && x.name === e.name)) out.push(e) }
  for (const h of has) {
    if (hits(h, t)) continue
    const to = aliasesOf(h)
    if (to.some((a) => hits(a, t))) { to.filter((a) => !hits(a, t)).forEach(add); continue }
    add(h)
  }
  return t.pair ? withoutHave(out, t.pair) : out
}

// ── 짝 걸음 — 자격을 해 뒀으면 함께 빠지는 걸음(2026-11-17) ──
// 자료의 id 꼬리 규칙(plan-library README '필기·실기(1·2차) 차수'·'법정 교육은 과정 걸음'). 자격 이름은 자격 걸음의 예전 id 에 그대로 있다.
//   · 필기·학과 '<id>-written', 1차 '<id>-first' → 뒤의 자격 걸음 '<id>'. 예전부터 나눈 전문자격 1·2차는 '<id>-first' → '<id>-second',
//     'p.first' → 'p.second'(관세사·감정평가사 등)
//   · 법정 연수 '<id>-training' → 앞의 자격 걸음 '<id>'(청소년상담사 자격연수 p.pc-youth-training → p.pc-youth,
//     생활스포츠지도사 연수 cp.sports-instructor-cert-training → cp.sports-instructor-cert). 연수를 마쳐야 자격이 나온다
// 짝은 같은 계획에 있고 '해 둘 수 있는 것'(canHave)일 때만 본다 — '-training' 이 붙은 다른 걸음(발성 훈련·공정 실습)은 짝이 없다.
// 실무 수습('-train')은 짝이 아니다 — 시험에 붙어도 수습은 따로 한다.
// 보건의료 국가시험 필기·실기(cp.license-written·cp.license-practical)는 꼬리 규칙 밖이다 — 직종마다 먼저 보는 시험이 달라 한쪽이 다른 쪽을 품지 않는다
export function pairedCertIds(id: string): string[] {
  let m = id.match(/^(.+)-written$/)
  if (m) return [m[1]!]
  m = id.match(/^(.+)-first$/)
  if (m) return [m[1]!, `${m[1]}-second`]
  m = id.match(/^(.+\.)first$/)
  if (m) return [`${m[1]}second`]
  m = id.match(/^(.+)-training$/)
  if (m) return [m[1]!]
  return []
}
export const pairedCertOf = (prep: Pick<JobPreparation, 'projects'>, p: PrepProject): PrepProject | undefined =>
  pairedCertIds(p.id).map((id) => prep.projects[id]).find((b): b is PrepProject => !!b && canHave(b))

/**
 * 짝 걸음 이름 — 자격 걸음이 메모를 자격 이름으로 쓰는 보편 자격(기사·기능사)이면 그 자격 이름을 붙인다: '정보보안기사 필기 합격'.
 * 자료의 필기 걸음 이름은 '기사 필기 합격'처럼 자격 이름이 없어, 한 계획에 기사가 둘이면 체크 하나로 둘 다 빠졌다(2026-11-17 lead 점검).
 * 메모 끝의 ' — 설명'은 이름 뒤로 둔다('가스기능사 필기 합격 — 가스 점검원 우대'). 괄호는 자격 이름의 일부일 수 있어(미용사(일반)) 그대로 둔다
 */
export function pairedHaveLabel(note: string, id: string): string {
  const word = /[.-]first$/.test(id) ? '1차 합격' : /-training$/.test(id) ? '연수 수료' : '필기 합격'
  const dash = note.indexOf(' — ')
  return dash > 0 ? `${note.slice(0, dash)} ${word}${note.slice(dash)}` : `${note} ${word}`
}

/** 저장·비교 대상 — 필기·1차·연수 걸음이면 짝인 자격 걸음을 함께 싣는다. 짝 두 걸음은 메모가 같다(자료 약속) — 자격 이름도 이 항목의 메모로 */
export function haveTargetOf(prep: Pick<JobPreparation, 'plan' | 'projects'>, item: Pick<PrepItem, 'note'>, p: PrepProject): HaveTarget {
  const cert = pairedCertOf(prep, p)
  const pair: HaveTarget | undefined = cert ? { ...haveRefOf(prep, item, cert), byNote: !!cert.haveByNote } : undefined
  // 자격 걸음이 메모로 이름을 정하면 짝 걸음도 그 이름으로 저장·비교한다(번호만으로는 어느 기사의 필기인지 모른다)
  const t: HaveTarget = pair?.byNote && !p.haveByNote && item.note
    ? { key: haveKey(prep, p), label: pairedHaveLabel(item.note, p.id), byNote: true }
    : { ...haveRefOf(prep, item, p), byNote: !!p.haveByNote }
  return pair ? { ...t, pair } : t
}

/** 이미 해 둔 걸음인가 — 저장돼 있거나(옛 열쇠 포함), 짝인 자격을 해 뒀으면(자격이 있으면 필기·1차에 붙었고 연수도 마친 것) */
export function isOwned(prep: Pick<JobPreparation, 'plan' | 'projects'>, has: CareerProfile['has'], item: Pick<PrepItem, 'note'>, p: PrepProject): boolean {
  if (!canHave(p)) return false
  const t = haveTargetOf(prep, item, p)
  return isHad(has, t, t.byNote) || (!!t.pair && isHad(has, t.pair, t.pair.byNote))
}

/** 체크리스트 — 보여 줄 길들의 필수 걸음 가운데 이미 해 뒀을 수 있는 것(같은 열쇠·이름은 한 번). 이름·비교 규칙은 haveTargetOf */
export function haveCandidates(prep: JobPreparation): HaveTarget[] {
  const out = new Map<string, HaveTarget>()
  for (const path of prep.paths) {
    for (const item of path.items) {
      if (item.optional) continue
      const p = prep.projects[item.ref]
      if (!p || !canHave(p)) continue
      const t = haveTargetOf(prep, item, p)
      const k = `${t.key}|${t.byNote ? t.label : ''}`
      if (!out.has(k)) out.set(k, t)
    }
  }
  return [...out.values()]
}

/** 학과 질문을 하는 계획인가 — 관련 학과에 따라 빠지는 걸음(전공자 생략, 법조처럼 아무 대학이면 빠지는 것 제외)이 있을 때 */
export function asksRelated(prep: JobPreparation): boolean {
  if (!prep.plan.relatedMajor) return false
  return prep.paths.some((path) => path.items.some((i) => !i.major && i.skipFor !== 'any'))
}

export const isRelated = (profile: CareerProfile | null, jobCode: string) => !!profile?.relatedJobs.some((j) => j.jobCode === jobCode)

// ── 받침에 맞춘 조사 ──
const hasBatchim = (w: string) => {
  const c = w.replace(/[)\]'"」\s]+$/, '').slice(-1).charCodeAt(0)
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0
}
export const josa = (w: string, withB: string, withoutB: string) => `${w}${hasBatchim(w) ? withB : withoutB}`

// 자료의 '전공자는 건너뛴다' 이유는 '-다' 꼴이다(배운다·포함돼 있다) — 화면의 다른 말처럼 해요체로
export function toHaeyo(s: string): string {
  const rules: [RegExp, string][] = [
    [/배운다$/, '배워요'], [/있다$/, '있어요'], [/채워진다$/, '채워져요'], [/대신한다$/, '대신해요'],
    [/이수한다$/, '이수해요'], [/한다$/, '해요'], [/된다$/, '돼요'], [/이다$/, '이에요'],
  ]
  for (const [re, to] of rules) if (re.test(s)) return s.replace(re, to)
  return s
}

// 학교 과정을 앞에서부터 줄인다(지나간 학년을 뺀다) — 단계 제목은 그대로 둔다
export function trimFront(phases: PrepPhase[], dropWeeks: number): PrepPhase[] {
  let left = dropWeeks
  const out: PrepPhase[] = []
  for (const ph of phases) {
    if (left >= ph.weeks) { left -= ph.weeks; continue }
    out.push({ ...ph, weeks: ph.weeks - left, items: [...ph.items] })
    left = 0
  }
  return out
}

// 줄인 과정은 이름도 '(남은 N년)'으로 — "대학 과정 이수(4년)" → "대학 과정 이수(남은 3년)"
function shortened(p: PrepProject, weeks: number): PrepProject {
  if (weeks >= p.weeks) return p
  const years = Math.max(1, Math.round(weeks / 52))
  const name = /\(\d+년\)$/.test(p.name) ? p.name.replace(/\(\d+년\)$/, `(남은 ${years}년)`) : `${p.name}(남은 ${years}년)`
  return { ...p, name, weeks, phases: trimFront(p.phases, p.weeks - weeks) }
}

export interface SituationChange { kind: 'cut' | 'shorten'; ref: string; name: string; reason: string; fromWeeks?: number; toWeeks?: number }
export interface SituationRow { item: PrepItem; project: PrepProject; during: boolean }
export interface SituationResult {
  rows: SituationRow[]            // 할 걸음(순서대로). 줄인 과정은 project 가 줄인 사본이다
  optional: SituationRow[]        // 지원하는 곳에 따라 고르는 것(플랜에는 넣지 않는다)
  changes: SituationChange[]      // 뺀 것·줄인 것과 이유
  weeks: number                   // 차례로 할 때의 주 수(과정 중 걸음은 겹쳐 세지 않는다)
  courseWeeks: number
}

/** 길 하나를 내 진로상황에 맞춘다 */
export function applySituation(prep: JobPreparation, path: PrepPath, profile: CareerProfile): SituationResult {
  const school = profile.school
  const inCollege = school === 'college'
  const collegeDone = school === 'college_grad' || school === 'grad_school' || school === 'grad_done'
  const anyCollege = atCollege(school)
  const inGrad = school === 'grad_school'
  const gradDone = school === 'grad_done'
  const related = isRelated(profile, prep.jobCode)
  const year = Math.min(4, Math.max(1, Math.round(profile.year ?? 1)))
  const major = prep.plan.relatedMajor || '관련 학과'

  const rows: SituationRow[] = []
  const optional: SituationRow[] = []
  const changes: SituationChange[] = []
  const cut = (item: PrepItem, p: PrepProject, reason: string) => changes.push({ kind: 'cut', ref: item.ref, name: p.name, reason })

  let cutCourse: 'degree' | 'master' | null = null   // 바로 앞의 과정이 졸업으로 빠졌는가
  let lastCourseKept = false                          // 바로 앞의 과정이 플랜에 남았는가(과정 중 걸음을 그 안에 겹쳐 놓는다)

  for (const item of path.items) {
    const p = prep.projects[item.ref]
    if (!p) continue
    if (item.optional) { optional.push({ item, project: p, during: false }); continue }
    if (p.course) { cutCourse = null; lastCourseKept = false }
    const forAny = item.skipFor === 'any'
    const schoolSkip = forAny ? anyCollege : related && anyCollege

    // 1) 대학 입시(수능·원서·실기 입시)
    if (!item.major && p.subtype === 'admission' && schoolSkip) {
      cut(item, p, inCollege
        ? (forAny ? '대학에 다니고 있어요' : `${major}에 다니고 있어요`)
        : (forAny ? '대학을 졸업했어요' : `${josa(major, '을', '를')} 졸업했어요`))
      continue
    }
    // 2) 학부 과정(전공자 생략 과정)
    if (p.course && !item.major && schoolSkip) {
      // 대학 학위를 대신하는 과정 — 대학생이어도 '남은 학년'으로 줄이지 않고 뺀다. 과정 안에서 하던 걸음은 학교가 대신하지 않으므로
      // 졸업으로 빠진 과정(rule 5)으로 보지 않는다(cutCourse 를 두지 않는다 → 겹쳤던 걸음이 따로 세진다)
      if (p.replacesCollege) {
        cut(item, p, inCollege ? (forAny ? '대학에 다니고 있어요' : `${major}에 다니고 있어요`) : (forAny ? '대학을 졸업했어요' : `${josa(major, '을', '를')} 졸업했어요`))
        continue
      }
      if (collegeDone) { cut(item, p, '졸업했어요'); cutCourse = 'degree'; continue }
      const totalYears = Math.max(1, Math.round(p.weeks / 52))
      const remain = Math.max(1, totalYears - year + 1)
      if (remain < totalYears) {
        const q = shortened(p, remain * 52)
        rows.push({ item, project: q, during: false })
        changes.push({ kind: 'shorten', ref: item.ref, name: p.name, reason: `${year >= 4 ? '4학년 이상' : `${year}학년`}이에요(이번 학년 포함)`, fromWeeks: p.weeks, toWeeks: q.weeks })
      } else {
        rows.push({ item, project: p, during: false })
      }
      lastCourseKept = true
      continue
    }
    // 3) 석사 과정
    if (p.course && item.ref === 'cp.master-2y' && related) {
      if (gradDone) { cut(item, p, '대학원을 졸업했어요'); cutCourse = 'master'; continue }
      if (inGrad) {
        const q = shortened(p, 52)
        rows.push({ item, project: q, during: false })
        changes.push({ kind: 'shorten', ref: item.ref, name: p.name, reason: '대학원에 다니고 있어요', fromWeeks: p.weeks, toWeeks: q.weeks })
        lastCourseKept = true
        continue
      }
    }
    // 4) 전공 과목에서 배우는 걸음
    if (!item.major && !p.course && p.subtype !== 'admission' && related && anyCollege) {
      cut(item, p, item.skip ? toHaeyo(item.skip) : '전공 과목에서 배워요')
      continue
    }
    // 5) 졸업으로 빠진 과정 안에서 학교가 하던 걸음
    if (item.during && cutCourse) {
      const schoolWork = p.type === 'edu' || (cutCourse === 'degree' ? p.type === 'activity' : p.type === 'output' && p.subtype === 'research')
      if (schoolWork) { cut(item, p, '학교 과정에서 마쳤어요'); continue }
    }
    // 6) 이미 해 둔 것(옛 열쇠로 저장한 것, 자격을 해 둬서 함께 빠지는 필기·1차 포함)
    if (isOwned(prep, profile.has, item, p)) {
      cut(item, p, '이미 해 뒀어요')
      continue
    }
    rows.push({ item, project: p, during: !!item.during && lastCourseKept && !p.course })
    if (p.course) lastCourseKept = true
  }

  const sum = sumWeeks(rows.map((r) => ({ item: { ...r.item, during: r.during }, project: r.project })))
  return { rows, optional, changes, weeks: sum.weeks, courseWeeks: sum.courseWeeks }
}

/** 템플릿 카드의 한 줄 — "간호학과 2학년이에요" */
export function situationSentence(prep: JobPreparation, profile: CareerProfile): string {
  const related = isRelated(profile, prep.jobCode) && asksRelated(prep)
  const major = prep.plan.relatedMajor || ''
  switch (profile.school) {
    case 'high': return '고등학생이에요'
    case 'hs_grad': return '고등학교를 졸업했어요'
    case 'college': {
      const y = profile.year ? (profile.year >= 4 ? ' 4학년 이상' : ` ${profile.year}학년`) : ''
      return related && major ? `${major}${y}이에요` : `대학생${y}이에요`
    }
    case 'college_grad': return related && major ? `${josa(major, '을', '를')} 졸업했어요` : '대학을 졸업했어요'
    case 'grad_school': return '대학원생이에요'
    case 'grad_done': return '대학원을 졸업했어요'
    default: return '내 진로상황에 맞췄어요'
  }
}
