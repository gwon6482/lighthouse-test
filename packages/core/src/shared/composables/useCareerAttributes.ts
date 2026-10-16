import { ref } from 'vue'
import { req } from '@/shared/api'

/**
 * 직업 속성(성격·흥미·가치관·업무수행능력·업무활동·업무환경·지식)의 **설명문**을 공급한다.
 *
 * 왜 별도 호출인가:
 * 직업 상세 응답에는 항목의 `code` 와 `name` 만 있고 `definition` 이 없다.
 * 설명문을 직업마다 실어 보내면 직업 1건당 항목이 ~190개라 응답이 크게 불어난다.
 * 설명문은 **직업과 무관한 마스터 데이터**(202건 고정)라, 한 번 받아 캐시하는 쪽이 맞다.
 *
 * ⚠️ 설명문은 **이미 전부 DB 에 있다**(`reference_data.career_attributes`, 202건,
 *    definition 누락 0건). 추가 수집이 필요하다고 오해하지 말 것 — 화면에 붙이는 일만 남았다.
 *
 * 캐시는 모듈 스코프다. 앱 수명 동안 한 번만 받는다(42KB, gzip 으로 ~10KB).
 * 실패해도 화면은 그대로 동작해야 한다 — 설명문은 **보조 정보**다.
 */

type Attribute = { code: string; name: string; definition: string; category?: string }

const defs = ref<Record<string, Attribute>>({})
const loaded = ref(false)
let inflight: Promise<void> | null = null

async function load() {
  if (loaded.value) return
  // 동시에 여러 컴포넌트가 불러도 요청은 한 번만 나간다
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const res = await req.get<{ success: boolean; data: Attribute[] }>('/api/reference/career-attributes')
      const list = res.data?.data ?? []
      const map: Record<string, Attribute> = {}
      for (const a of list) if (a?.code) map[a.code] = a
      defs.value = map
      loaded.value = true
    } catch {
      // 조용히 넘긴다. 설명문이 없으면 칩을 눌러도 아무 일도 일어나지 않는다.
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function useCareerAttributes() {
  return {
    loaded,
    load,
    /** 코드의 설명문. 없으면 null — 호출부가 '설명 없음' 처리를 하지 말고 그냥 안 띄우면 된다. */
    definitionOf: (code?: string | null): string | null => {
      if (!code) return null
      const d = defs.value[code]?.definition
      return d && d.trim() ? d : null
    },
  }
}
