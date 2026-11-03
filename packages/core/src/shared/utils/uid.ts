// 무작위 ID(UUID v4 형식).
// crypto.randomUUID 는 **보안 연결(https·localhost)에서만** 있다. 폰에서 http://<맥 이름>.local 로 열면
// 없어서 진로달성 홈이 이번 주 일정을 만들다 멈췄다(2026-11-03). 운영(https)이라도 iOS 15.3 이하처럼
// randomUUID 가 없는 브라우저면 같은 일이 난다. getRandomValues 는 보안 연결이 아니어도 있으므로 그걸로 만든다.
export function uid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6]! & 0x0f) | 0x40 // 버전 4
  b[8] = (b[8]! & 0x3f) | 0x80 // RFC 4122 변형
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
