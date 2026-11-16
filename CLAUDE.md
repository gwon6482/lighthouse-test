# 라이트하우스 앱 (`lighthouse-test`) — Claude 참조 문서

> 이 레포는 **공개**다. 비밀값·계정·사용자 정보·사업 정보를 코드·커밋 메시지·문서에 넣지 않는다.
> 팀 공용 규칙·에이전트 정의는 상위 폴더의 비공개 저장소 `lighthouse-workspace`(CLAUDE.md · `.claude/skills`)에 있다. 이 문서는 이 레포에서 꼭 알아야 할 것만 적는다.

## 구조 (pnpm 모노레포, 2026-06-24~)
- `packages/core/src` — 기능 코드 전부(`@` 별칭)
  - `modules/` — `survey`(검사·결과지) · `encyclopedia`(진로백과) · `career-design`(진로설계) · `career-achievement`(진로달성) · `onboarding`
  - `shared/` — `api` · `auth` · `router`(`app.ts` 운영 셸 라우트, `entryGuard.ts`, `chunkReload.ts`) · `config/features.ts` · `icons` · `guest`(비회원 진입)
- `apps/test` — 스테이징 셸(워크벤치, 전체 기능)
- `apps/app` — 운영 셸(완성된 기능만). **승격 = `packages/core/src/shared/router/app.ts`에 모듈 라우트를 import**
- 진입 가드(운영, `shared/router/entryGuard.ts`): 토큰 없음 → `/onboarding`, 소셜 가입 후 가입 설문 미완 → `/onboarding/signup?social=1`, 진행 중인 계획 없음 → `/main/before`, 있음 → `/career-achievement`
- `android/` · `ios/` · `capacitor.config.ts` — 모바일 껍데기(캐패시터). **아직 템플릿 그대로**다(앱 ID `com.vue3.app`, 이름 'Vue3 App', 서버 주소 자리표시). 첫 스토어 출시 전에 앱 ID·이름·서버 주소 방식을 정해야 한다. 앱 ID는 출시 뒤 바꿀 수 없다.

## 명령
```bash
pnpm dev            # 스테이징 셸(apps/test) 개발 서버
pnpm dev:app        # 운영 셸
pnpm test           # vitest
pnpm type-check     # vue-tsc
pnpm build:app      # 운영 빌드(해시 대조용: VITE_API=https://api.lighthouse.career pnpm build:app)
pnpm icons          # public/icons/*.svg → 아이콘 묶음 다시 만들기
```
- `.env*`는 **모노레포 루트**에 있다(각 앱 vite.config의 `envDir`). `.env.production`에는 공개 API 주소만 있다.
- 바꾼 뒤에는 `pnpm test`와 `pnpm type-check`를 통과시킨다.

## 배포
| 트리거 | 워크플로 | 반영 |
|---|---|---|
| `main` push | `deploy-test` | 스테이징 test.lighthouse.career |
| `v*` 태그 | `deploy-app` | 운영 app.lighthouse.career |

- 태그는 그 시점의 main 전체를 내보낸다. `git log v<이전>..origin/main`으로 범위를 먼저 확인한다. **운영 태그는 오너가 지시할 때만** 단다.
- **스테이징도 운영 API·DB를 쓴다.** 테스트로 가입·저장한 것은 운영 데이터가 된다.
- 배포 직후 옛 화면이 보이면 서비스 워커(PWA)부터 의심한다. 지운 청크 때문에 이동이 멈추는 경우는 `chunkReload.ts`가 처리한다.
- GitHub가 push를 500으로 거절했다 재시도로 받으면 워크플로가 안 도는 일이 있다. 그때는 `gh workflow run deploy-test.yml`을 쓴다.
- 문서만 바꾸는 커밋은 메시지에 `[skip ci]`를 넣어 스테이징 빌드를 건너뛴다.

## 지킬 것
- **화면 글:** 눈에 띄는 문장은 해요체로 쓴다. 보면 아는 것에 안내 글을 붙이지 않는다. '예시·검토 전' 단서는 내용 아래에 둔다.
- **고르는 UI:** 여러 개 고르는 것은 네모 체크박스, 하나만 고르는 것은 동그라미.
- **새 화면은 구현 전에 시안부터** 오너에게 보여 준다.
- **정본·사본**
  - 검사 결과지 디자인의 정본은 랜딩 `ResearchResult.vue`이고, 여기 `SurveyResultBody`는 사본이다.
  - 계획 기간 계산 `encyclopedia/lib/preparation.ts` `sumWeeks`는 서버 `services/planLibrary` `pathOf` totals와 같은 규칙이다.
  - 프로젝트 분류 5개의 색·라벨 표는 여러 곳에 복제돼 있다.
  - 위 셋 중 하나를 바꾸면 상대도 함께 바꾼다.
- 직업인 조사의 분류·진행 방식은 이 앱의 영역·진행 방식과 1:1이다(랜딩·API와 함께 고친다).
- 프로젝트 저장은 화면마다 필드를 골라 담는다. 커리큘럼 화면은 주의 checks·pause를 버리므로 '과정' 프로젝트는 그 화면을 거치지 않는다.
- 주 경계는 계획 시작 요일(reviewDay) 기준 7일이다. 주 계산을 호출할 때 reviewDay를 넘긴다.
- `android/gradle/wrapper/gradle-wrapper.properties` 변경은 커밋하지 않는다.

## 문서
기능을 바꾸면 공유 문서 `lighthouse-docs`의 `frontend/progress.md`와 그날 개발일지(`devlog/YYYY-MM-DD.md`)를 갱신한다. 공유 문서도 공개 레포다.
