/**
 * 목적격 조사 '을/를' — API 가 주는 이름(재능·가치관 등) 뒤에 붙인다.
 * 마지막 글자에 받침이 있으면 '을', 없으면 '를'. 한글이 아니면 판단할 수 없어 '을(를)'.
 *   objectJosa('언어 지능') → '을' / objectJosa('지적 추구') → '를'
 */
export function objectJosa(word?: string | null): string {
  const last = (word ?? '').trim().slice(-1)
  const code = last.charCodeAt(0) - 0xac00
  if (!last || code < 0 || code > 11171) return '을(를)'
  return code % 28 ? '을' : '를'
}

/**
 * 부사격 조사 '로/으로' — 받침이 없거나 ㄹ 받침이면 '로', 그 밖의 받침이면 '으로'. 한글이 아니면 '(으)로'.
 *   toJosa('간호사') → '로' / toJosa('회계사무원') → '으로' / toJosa('경찰관') → '으로'
 */
export function toJosa(word?: string | null): string {
  const last = (word ?? '').trim().slice(-1)
  const code = last.charCodeAt(0) - 0xac00
  if (!last || code < 0 || code > 11171) return '(으)로'
  const jong = code % 28
  return jong === 0 || jong === 8 ? '로' : '으로'
}

/**
 * 보조사 '은/는' — 받침이 있으면 '은', 없으면 '는'. 한글이 아니면 '은(는)'.
 *   subjectJosa('간호사') → '는' / subjectJosa('회계사무원') → '은'
 */
export function subjectJosa(word?: string | null): string {
  const last = (word ?? '').trim().slice(-1)
  const code = last.charCodeAt(0) - 0xac00
  if (!last || code < 0 || code > 11171) return '은(는)'
  return code % 28 ? '은' : '는'
}
