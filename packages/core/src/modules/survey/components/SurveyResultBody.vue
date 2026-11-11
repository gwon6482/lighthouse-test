<template>
  <!-- 결과지 디자인 정본은 랜딩 /survey 결과지(lighthouse-landing components/survey/ResearchResult.vue, 2026-10-26).
       구성·색·글씨를 그대로 따른다 — 랜딩 쪽을 고치면 여기도 같이 고칠 것(레포가 달라 자동으로 맞춰지지 않는다).
       앱에만 있는 것: 업무 환경 항목 아이콘, 진입 관문 배지, 추천 직업 누르기(묶음 직업 고르기), 하단 액션 슬롯,
       직무 카드의 직업 누르기(진로백과)·앱 안 채용 공고 화면·진입 관문 배지(직무 3가지 자체는 랜딩과 같다, 2026-11-09) -->
  <!-- data-export-chunks: 이 요소의 직계 자식(구역)이 '여러 장 이미지' 의 나눔 단위다(export/useResultExport.captureImageSet) -->
  <div class="rr" data-export-chunks>
    <!-- 이미 만들어진 결과를 불러오는 중이다(분석은 제출 때 끝났다) — 마이페이지에서 다시 볼 때도 같은 화면 -->
    <div v-if="isLoading" class="rr__state">
      <div class="rr__spinner" />
      <p>결과를 불러오고 있어요…</p>
    </div>

    <div v-else-if="error" class="rr__state">
      <template v-if="guestMode">
        <p>결과를 볼 수 없어요.<br />가입하지 않은 검사 결과는 검사한 기기에서만,<br />24시간 동안만 볼 수 있어요.</p>
        <RouterLink to="/start" class="rr__retry">검사 다시 하기</RouterLink>
      </template>
      <template v-else>
        <p>결과를 불러오지 못했어요.<br />잠시 후 다시 시도해주세요.</p>
        <button type="button" class="rr__retry" @click="load">다시 시도</button>
      </template>
    </div>

    <template v-else-if="analysis">
      <!-- 1. 성격 유형 -->
      <section ref="heroEl" class="rr__hero">
        <p class="rr__hero-label">나의 성격 유형</p>
        <h1 class="rr__hero-name">{{ analysis.personality_type?.full_name ?? '알 수 없음' }}</h1>
        <img
          v-if="t1ImgSrc"
          class="rr__hero-img"
          :src="t1ImgSrc"
          :alt="analysis.personality_type?.full_name ?? ''"
        />
        <p class="rr__hero-desc">{{ analysis.personality_type?.description }}</p>
        <div v-if="analysis.personality_type" class="rr__tags">
          <span class="rr__tag rr__tag--y">{{ analysis.personality_type.base_name }}</span>
          <span class="rr__tag rr__tag--s">{{ analysis.personality_type.modifier }}</span>
        </div>
      </section>

      <!-- 2. 성격 분포 -->
      <section class="rr__sec">
        <p class="rr__eyebrow rr__eyebrow--y">성격 & 기질</p>
        <h2 class="rr__title">나의 성격 분포</h2>
        <p class="rr__sub">9가지 성격 요소에서 나의 점수예요</p>
        <div v-for="(f, i) in (guestMode ? analysis.personality.all.slice(0, 3) : analysis.personality.all)" :key="f.code" class="rr__pd">
          <div class="rr__pd-head">
            <span :class="['rr__pd-name', { 'is-top': i < 3 }]">
              {{ f.name }}
              <!-- 4위부터는 정의가 펼쳐져 있지 않다 — (?) 로 본다. 마우스: 올리면 말풍선 / 터치: 누르면 같은 말풍선(toggleTip) -->
              <template v-if="i >= 3 && t1Definition(f)">
                <button
                  type="button"
                  class="rr__pd-q"
                  :aria-label="`${f.name} 뜻 보기`"
                  :aria-expanded="openTip === f.code"
                  :aria-describedby="`rr-pd-tip-${f.code}`"
                  @click.stop="toggleTip(f.code)"
                >?</button>
                <span
                  :id="`rr-pd-tip-${f.code}`"
                  role="tooltip"
                  :class="['rr__pd-tip', { 'is-open': openTip === f.code }]"
                >{{ t1Definition(f) }}</span>
              </template>
            </span>
            <span class="rr__pd-bar"><span class="rr__pd-fill" :style="{ width: pct(f.score) + '%', background: pdBar(i) }" /></span>
            <span :class="['rr__pd-score', { 'is-top': i < 3 }]" :style="{ color: pdScore(i) }">{{ pct(f.score) }}</span>
          </div>
          <template v-if="i < 3">
            <span v-if="f.top_percent != null" class="rr__pd-pct">상위 {{ f.top_percent }}%</span>
            <p class="rr__pd-desc">{{ t1Definition(f) }}</p>
          </template>
        </div>
        <!-- 비회원: 4위부터는 흐린 줄로 이어서 이 구역도 일부만 봤다는 걸 보여 준다(2026-11-11 맛보기). 누르면 가입 상자로 -->
        <div v-if="guestMode && analysis.personality.all.length > 3" class="rr__more">
          <div class="rr__more-rows" aria-hidden="true">
            <div v-for="(f, i) in analysis.personality.all.slice(3)" :key="f.code" class="rr__pd">
              <div class="rr__pd-head">
                <span class="rr__pd-name">{{ f.name }}</span>
                <span class="rr__pd-bar"><span class="rr__pd-fill" :style="{ width: pct(f.score) + '%', background: pdBar(i + 3) }" /></span>
                <span class="rr__pd-score" :style="{ color: pdScore(i + 3) }">{{ pct(f.score) }}</span>
              </div>
            </div>
          </div>
          <button type="button" class="rr__more-btn" @click="scrollToLock">
            <span><AppIcon name="ui-privacy" :size="13" />나머지 {{ analysis.personality.all.length - 3 }}가지 요소</span>
          </button>
        </div>
      </section>

      <!-- 비회원(2026-11-11 맛보기형 — 시안 https://claude.ai/artifact/GndLA9VBmqqr72j3g5oLTu 의 ②):
           회원 결과지의 나머지 구역을 같은 순서로 목차처럼 깔고, 구역마다 무엇이 몇 개 들었는지(내 결과 숫자)와
           1위 하나만 또렷하게 보여 준다 — '가입하면 이만큼 본다'가 안 전해진다는 지적(2026-11-09). 누르면 맨 아래 가입 상자로.
           흐린 줄은 이미 받은 분석 값이다(비회원 분석 API 는 본인 응답이라 전부 준다). 직무는 1위 이름과 개수만 받는다.
           비회원은 내보내기가 없어서(로그인 뒤에만) data-export-chunks 나눔 단위와 상관없다 -->
      <template v-if="guestMode">
        <div class="rr__teaser-head">
          <p class="rr__teaser-t">가입하면 열리는 결과</p>
          <p class="rr__teaser-s">내 결과 기준</p>
        </div>

        <section class="rr__teaser rr__teaser--gray" @click="scrollToLock">
          <div class="rr__teaser-top">
            <div><p class="rr__eyebrow rr__eyebrow--s">하고 싶은 일</p><p class="rr__teaser-title">재능 · 가치관 · 관심</p></div>
            <span class="rr__teaser-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
          </div>
          <p class="rr__teaser-what">
            <b>재능 Top {{ analysis.talent.top3.length }}</b><template v-if="valueCount"> · <b>가치관 {{ valueCount > 1 ? `1~${valueCount}` : 1 }}순위</b></template><template v-if="analysis.interest.total > 0"> · <b>관심 분야 {{ analysis.interest.total }}개</b></template> · 나를 한 문장으로
          </p>
          <div v-if="analysis.talent.top3[0]" class="rr__cards">
            <div v-for="(t, i) in analysis.talent.top3.slice(0, 2)" :key="t.code" :class="['rr__card', `rr__card--p${i + 1}`, { 'rr__blur': i > 0 }]" :aria-hidden="i > 0 || undefined">
              <span class="rr__rank">{{ i + 1 }}순위</span>
              <div class="rr__card-body">
                <span class="rr__card-name">{{ t.name }}</span>
                <span class="rr__bar"><span :class="['rr__bar-fill', i === 0 ? 'is-hi' : 'is-mi']" :style="{ width: pct(t.score) + '%' }" /></span>
                <span v-if="i === 0" class="rr__card-def">{{ t.definition || T21_DEFINITIONS[t.code] }}</span>
              </div>
              <span :class="['rr__card-score', i === 0 ? 'is-hi' : 'is-mi']">{{ pct(t.score) }}</span>
            </div>
          </div>
        </section>

        <section class="rr__teaser" @click="scrollToLock">
          <div class="rr__teaser-top">
            <div><p class="rr__eyebrow rr__eyebrow--g">업무 환경</p><p class="rr__teaser-title">나의 업무 환경 성향</p></div>
            <span class="rr__teaser-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
          </div>
          <p class="rr__teaser-what">
            <template v-if="t3AllNeutral"><b>환경 유연형</b> 풀이</template>
            <template v-else>
              <b v-if="t3GoodTexts.length">맞는 환경 {{ t3GoodTexts.length }}가지</b><template v-if="t3GoodTexts.length && t3BadTexts.length"> · </template><b v-if="t3BadTexts.length">맞지 않는 환경 {{ t3BadTexts.length }}가지</b>
            </template>
            <template v-if="weCount"> · 업무 조건 {{ weCount }}개</template>
          </p>
          <!-- 1위 = 맞는 환경 첫 문장(없으면 맞지 않는 환경 첫 문장). 나머지는 흐리게 -->
          <div class="rr__teaser-peek">
            <div v-if="t3AllNeutral" class="rr__env rr__env--neutral">
              <p class="rr__env-head"><span class="rr__env-mk" aria-hidden="true"><AppIcon :name="ENV_JUDGE_ICON.neutral" :size="18" /></span><strong>환경 유연형</strong></p>
              <p class="rr__env-text rr__blur" aria-hidden="true">특정 환경에 대한 강한 선호나 거부감이 없어요.</p>
            </div>
            <template v-else>
              <div v-if="t3GoodTexts.length" class="rr__env rr__env--good">
                <p class="rr__env-head"><span class="rr__env-mk" aria-hidden="true"><AppIcon :name="ENV_JUDGE_ICON.good" :size="18" /></span><strong>나에게 맞는 환경</strong></p>
                <p class="rr__env-text">{{ t3GoodTexts[0]?.text }}</p>
                <p v-if="t3GoodTexts[1]" class="rr__env-text rr__blur" aria-hidden="true">{{ t3GoodTexts[1].text }}</p>
              </div>
              <div v-if="t3BadTexts.length" :class="['rr__env', 'rr__env--bad', { 'rr__blur': t3GoodTexts.length }]" :aria-hidden="t3GoodTexts.length ? 'true' : undefined">
                <p class="rr__env-head"><span class="rr__env-mk" aria-hidden="true"><AppIcon :name="ENV_JUDGE_ICON.bad" :size="18" /></span><strong>나에게 맞지 않는 환경</strong></p>
                <p class="rr__env-text">{{ t3BadTexts[0]?.text }}</p>
              </div>
            </template>
          </div>
        </section>

        <section class="rr__teaser" @click="scrollToLock">
          <div class="rr__teaser-top">
            <div><p class="rr__eyebrow rr__eyebrow--gold">종합 추천</p><p class="rr__teaser-title">나에게 맞는 직무 3가지</p></div>
            <span class="rr__teaser-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
          </div>
          <p class="rr__teaser-what">
            <b>직무 {{ guestJobs?.groupCount || 3 }}가지</b> · 추천 이유 · <b v-if="guestJobs?.jobCount">관련 직업 {{ guestJobs.jobCount }}개</b><template v-else>관련 직업</template> · 채용 공고
          </p>
          <!-- 1위 이름만 또렷하게(비회원 직무 맛보기 API). 못 받으면 이름도 흐리게. 흐린 줄의 글자는 자리만 채우는 것이다 -->
          <div class="rr__teaser-peek">
            <div class="rr__tjob">
              <span class="rr__tjob-n">1</span>
              <div>
                <p v-if="guestJobs?.top" class="rr__tjob-name">{{ guestJobs.top.name }}</p>
                <p v-else class="rr__tjob-name rr__blur" aria-hidden="true">○○·○○○ 직무</p>
                <p class="rr__tjob-meta rr__blur" aria-hidden="true">관련 직업 ○개 · 추천 이유 ○○, ○○</p>
              </div>
            </div>
            <div class="rr__tjob rr__blur" aria-hidden="true">
              <span class="rr__tjob-n">2</span>
              <div><p class="rr__tjob-name">○○·○○○·○○ 관리</p><p class="rr__tjob-meta">관련 직업 ○개 · 추천 이유 ○○</p></div>
            </div>
          </div>
        </section>

        <!-- ⚠️ 쪽 수는 report/ResultReport.vue 의 PAGES 와 같게(지금 4쪽) -->
        <section class="rr__teaser rr__teaser--mini" @click="scrollToLock">
          <span class="rr__pages" aria-hidden="true"><i /><i /><i /><i /></span>
          <div><p class="rr__teaser-title">결과 리포트 저장</p><p class="rr__teaser-what">PDF 4쪽 · 이미지로 저장하고 언제든 다시 보기</p></div>
          <span class="rr__teaser-pill"><AppIcon name="ui-privacy" :size="12" /></span>
        </section>

        <!-- 가입 상자(A안 — 시안 https://claude.ai/artifact/CSnzPsWWeDNEnW4N8H2EVo): 제목 바로 밑에 공식 모양 버튼 -->
        <div ref="lockEl" class="rr__lock">
          <GuestLockCard
            eyebrow="가입 한 번이면 모두 열려요"
            :title="'가입하면 전체 결과를\n바로 볼 수 있어요'"
            note="가입하지 않고 나가면 결과는 바로 삭제돼요. (늦어도 24시간 뒤)"
          >
            <SocialLoginButton v-if="providers.kakao" provider="kakao" @click="goOAuth('kakao')">카카오로 시작하기</SocialLoginButton>
            <SocialLoginButton v-if="providers.google" provider="google" @click="goOAuth('google')">Google 계정으로 계속하기</SocialLoginButton>
            <p class="rr__lock-save"><AppIcon name="ui-check" :size="15" />가입하면 이 결과가 내 계정에 저장돼요</p>
            <RouterLink to="/onboarding/auth" class="rr__lock-email">이메일로 가입 · 로그인</RouterLink>
          </GuestLockCard>
        </div>

        <!-- 떠 있는 가입 카드(2026-11-11, 시안 https://claude.ai/artifact/5f99gwCLauoXZ2MLBJpdbf 의 ② 작은 카드).
             가입 버튼이 맨 아래(화면 약 3개 아래)에만 있어 성격 유형만 보고 멈추면 버튼을 못 본다 — 성격 유형을 지나면 올라오고,
             맨 아래 가입 상자가 보이면 내려간다(같은 버튼이 두 번 보이지 않게). 화면 끝에 붙은 바는 사용자가 싫다고 했다 -->
        <Teleport to="body">
          <div v-if="providers.kakao || providers.google" :class="['rr__float', { 'is-show': floatShow }]" data-export-skip>
            <div class="rr__float-card">
              <p class="rr__float-t"><AppIcon name="ui-privacy" :size="14" />가입하면 전체 결과를 볼 수 있어요</p>
              <div class="rr__float-btns">
                <SocialLoginButton v-if="providers.kakao" provider="kakao" small @click="goOAuth('kakao')">카카오로 시작</SocialLoginButton>
                <SocialLoginButton v-if="providers.google" provider="google" small @click="goOAuth('google')">Google로 계속</SocialLoginButton>
              </div>
            </div>
          </div>
        </Teleport>
      </template>

      <!-- 3. 하고 싶은 일 -->
      <section v-if="!guestMode" class="rr__sec rr__sec--gray">
        <p class="rr__eyebrow rr__eyebrow--s">하고 싶은 일</p>
        <h2 class="rr__title">재능 · 가치관 · 관심</h2>

        <p class="rr__label">재능 Top 3</p>
        <div class="rr__cards">
          <div v-for="(t, i) in analysis.talent.top3" :key="t.code" :class="['rr__card', `rr__card--p${i + 1}`]">
            <span class="rr__rank">{{ i + 1 }}순위</span>
            <div class="rr__card-body">
              <span class="rr__card-name">{{ t.name }}</span>
              <span class="rr__bar"><span :class="['rr__bar-fill', i === 0 ? 'is-hi' : 'is-mi']" :style="{ width: pct(t.score) + '%' }" /></span>
              <span class="rr__card-def">{{ t.definition || T21_DEFINITIONS[t.code] }}</span>
            </div>
            <span :class="['rr__card-score', i === 0 ? 'is-hi' : 'is-mi']">{{ pct(t.score) }}</span>
          </div>
        </div>

        <p class="rr__label">나의 가치관</p>
        <div class="rr__cards">
          <template v-for="(v, i) in valueList" :key="i">
            <div v-if="v" :class="['rr__card', `rr__card--p${i + 1}`]">
              <span class="rr__rank">{{ i + 1 }}순위</span>
              <div class="rr__card-body">
                <span class="rr__card-name">{{ v.name }}</span>
                <span class="rr__card-def">{{ v.definition || T23_DEFINITIONS[v.code] }}</span>
              </div>
            </div>
          </template>
        </div>

        <p class="rr__label">관심 분야</p>
        <div v-if="analysis.interest.total > 0" class="rr__interest">
          <div v-for="(cat, key) in analysis.interest.by_category" :key="key" class="rr__interest-group">
            <span class="rr__interest-cat">{{ cat.name }}</span>
            <div class="rr__interest-row">
              <span v-for="item in cat.items" :key="item.field_id" class="rr__interest-tag">{{ item.name }}</span>
            </div>
          </div>
        </div>
        <p v-else class="rr__empty">선택한 관심 분야가 없어요.</p>

        <template v-if="topInterestName || analysis.talent.top3[0] || analysis.values.priority_1">
          <p class="rr__label">나는</p>
          <div class="rr__like">
            <p>
              <!-- 분야 이름이 이미 '… 분야' 로 끝난다. 조사는 이름에 따라 을/를 -->
              <template v-if="topInterestName"><span class="rr__chip">{{ topInterestName }}</span>에서<br /></template>
              <template v-if="analysis.talent.top3[0]"><span class="rr__chip">{{ analysis.talent.top3[0].name }}</span>{{ objectJosa(analysis.talent.top3[0].name) }} 활용해<br /></template>
              <template v-if="analysis.values.priority_1"><span class="rr__chip">{{ analysis.values.priority_1.name }}</span>{{ objectJosa(analysis.values.priority_1.name) }} 좇는 일을 할 때 가장 빛나요.</template>
            </p>
          </div>
        </template>
      </section>

      <!-- 4. 업무 환경 -->
      <section v-if="!guestMode" class="rr__sec">
        <p class="rr__eyebrow rr__eyebrow--g">업무 환경</p>
        <h2 class="rr__title">나의 업무 환경 성향</h2>

        <div v-if="t3AllNeutral" class="rr__env rr__env--neutral">
          <p class="rr__env-head"><span class="rr__env-mk" aria-hidden="true"><AppIcon :name="ENV_JUDGE_ICON.neutral" :size="18" /></span><strong>환경 유연형</strong></p>
          <p class="rr__env-text">특정 환경에 대한 강한 선호나 거부감이 없어요.</p>
          <p class="rr__env-text">다양한 업무 환경에 무난하게 적응할 수 있는 유연한 성향이에요.</p>
        </div>
        <template v-else>
          <div v-if="t3GoodTexts.length" class="rr__env rr__env--good">
            <p class="rr__env-head"><span class="rr__env-mk" aria-hidden="true"><AppIcon :name="ENV_JUDGE_ICON.good" :size="18" /></span><strong>나에게 맞는 환경</strong></p>
            <p v-for="t in t3GoodTexts" :key="t.part" class="rr__env-text">{{ t.text }}</p>
            <ul v-if="t3WeVisible && t3WeRec.length" class="rr__we">
              <li v-for="w in t3WeRec" :key="w.code"><AppIcon :name="T3_WE_ITEMS[w.code]?.icon ?? weIcon(w.code)" :size="14" />{{ T3_WE_ITEMS[w.code]?.name }}</li>
            </ul>
          </div>
          <div v-if="t3BadTexts.length" class="rr__env rr__env--bad">
            <p class="rr__env-head"><span class="rr__env-mk" aria-hidden="true"><AppIcon :name="ENV_JUDGE_ICON.bad" :size="18" /></span><strong>나에게 맞지 않는 환경</strong></p>
            <p v-for="t in t3BadTexts" :key="t.part" class="rr__env-text">{{ t.text }}</p>
            <ul v-if="t3WeVisible && t3WeNonRec.length" class="rr__we">
              <li v-for="w in t3WeNonRec" :key="w.code"><AppIcon :name="T3_WE_ITEMS[w.code]?.icon ?? weIcon(w.code)" :size="14" />{{ T3_WE_ITEMS[w.code]?.name }}</li>
            </ul>
          </div>
        </template>
      </section>

      <!-- 5. 종합 추천 — 나에게 맞는 직무 3가지(2026-11-09, 랜딩 결과지에도 같은 날 반영).
           직업 Top 5 가 '엉뚱하다·뜬금없다'는 테스터 반응에 직업 하나 대신 직무(고용24 채용 직종 중분류)로 넓혔다.
           시안 https://claude.ai/artifact/8rzj7uxZajqRPFj53YXj26 의 '개선안' 그대로 — 총점 % 는 없고, 직업 순위는 아래 '직업 순위 보기'로 남겼다.
           직무를 못 불러오면(로그인 안 됨·서버 오류) 예전처럼 직업 Top 5 를 바로 보여 준다 -->
      <section v-if="!guestMode" class="rr__sec">
        <p class="rr__eyebrow rr__eyebrow--gold">종합 추천</p>
        <h2 class="rr__title">{{ groupMode ? '나에게 맞는 직무 3가지' : '나에게 맞는 직업 Top 5' }}</h2>
        <p class="rr__sub">성격·재능·관심·가치관·업무환경을 모두 고려한 추천이에요</p>

        <div v-if="groupLoading" class="rr__skeletons">
          <div v-for="n in 3" :key="n" class="rr__skeleton" />
        </div>

        <template v-else-if="groupMode">
          <div v-for="(g, i) in groups" :key="g.code" class="rr__grp">
            <div class="rr__grp-head">
              <span :class="['rr__job-rank', `rr__job-rank--${i + 1}`]">{{ i + 1 }}</span>
              <h3 class="rr__grp-name">{{ g.name }}</h3>
            </div>

            <!-- 막대 = 대표 직업 3개의 영역별 일치도 평균(직업 Top 5 카드와 같은 막대) -->
            <div class="rr__job-bars rr__grp-bars">
              <span class="rr__jl rr__jl--t1">성격/기질</span>
              <span class="rr__jt"><span class="rr__jf rr__jf--t1" :style="{ width: pct(g.match_detail.T1) + '%' }" /></span>
              <span class="rr__jv">{{ pct(g.match_detail.T1) }}</span>

              <span class="rr__jl rr__jl--t2">재능/흥미/가치관</span>
              <span class="rr__jt"><span class="rr__jf rr__jf--t2" :style="{ width: pct(calcT2Score(g.match_detail)) + '%' }" /></span>
              <span class="rr__jv">{{ pct(calcT2Score(g.match_detail)) }}</span>

              <span class="rr__jl rr__jl--t3">업무환경</span>
              <span class="rr__jt"><span class="rr__jf rr__jf--t3" :style="{ width: pct(g.match_detail.T3) + '%' }" /></span>
              <span class="rr__jv">{{ pct(g.match_detail.T3) }}</span>
            </div>

            <!-- 이유 한 문장 — 결과지에 나온 이름 중 이 직무의 대표 직업들이 중요하게 쓰는 것(2개까지, 서버가 고른다). 없으면 문장째 뺀다.
                 핵심어 뒤 회색 괄호 = 어느 영역의 항목인지("지적 추구(가치관)와") — 조사는 괄호 앞 단어를 따른다(2026-11-09 사용자 요청).
                 ⚠️ 한 줄로 둔다 — 줄을 바꾸면 핵심어와 조사 사이에 공백이 생긴다 -->
            <p v-if="g.reasons.length" class="rr__grp-why"><template v-for="(seg, k) in whyParts(g)" :key="k"><template v-if="seg.kw"><b :class="['rr__grp-kw', { 'rr__grp-kw--t1': seg.kw.axis === 'T1' }]">{{ seg.kw.name }}</b><span class="rr__grp-ax">({{ REASON_AXIS[seg.kw.axis] }})</span></template><template v-else>{{ seg.text }}</template></template></p>

            <div class="rr__grp-jobs">
              <p class="rr__grp-label">{{ isOpen(g) ? `직업 ${g.jobCount}개 · 나와 맞는 순` : '대표 직업' }}</p>
              <ul class="rr__grp-list">
                <li v-for="job in isOpen(g) ? g.jobs : g.jobs.slice(0, 3)" :key="job.jobCode">
                  <button type="button" class="rr__grp-job" @click="openJob(job)">
                    <span class="rr__grp-job-t">{{ job.title }}</span>
                    <span v-if="(job.members?.length ?? 1) > 1" class="rr__grp-sim">유사 {{ job.members!.length }}개</span>
                    <JobGateBadges :job-code="job.jobCode" :max="1" />
                    <AppIcon name="ui-chevron-right" class="rr__grp-chev" :size="16" />
                  </button>
                </li>
              </ul>
            </div>

            <div class="rr__grp-foot">
              <!-- 모두 보기는 제자리에서 펼친다(진로백과 버튼은 여기로 합쳤다 — 직업을 누르면 진로백과로 간다) -->
              <button v-if="g.jobs.length > 3" type="button" class="rr__grp-link" :aria-expanded="isOpen(g)" @click="toggleOpen(g)">
                {{ isOpen(g) ? '접기' : `직업 ${g.jobCount}개 모두 보기` }}<AppIcon name="ui-chevron-down" :class="['rr__grp-fold', { 'is-open': isOpen(g) }]" :size="16" />
              </button>
              <button v-if="recruitLink" type="button" class="rr__grp-link rr__grp-link--sub" @click="emit('group-recruit', g.code)">
                채용 공고<AppIcon name="ui-chevron-right" :size="16" />
              </button>
            </div>
          </div>

          <p class="rr__grp-alt" data-export-skip>
            <template v-if="!showJobRank">직업 하나하나의 순위가 궁금하다면 </template>
            <button type="button" class="rr__grp-alt-btn" :aria-expanded="showJobRank" @click="showJobRank = !showJobRank">{{ showJobRank ? '직업 순위 접기' : '직업 순위 보기' }}</button>
          </p>
          <p v-if="showJobRank" class="rr__label">직업 순위 Top 5</p>
        </template>

        <!-- 직업 순위(예전 Top 5) — 직무 카드 아래 '직업 순위 보기'로 펼친다. 직무를 못 불러오면 바로 보인다 -->
        <template v-if="!groupLoading && (!groupMode || showJobRank)">
        <div v-if="compLoading" class="rr__skeletons">
          <div v-for="n in 3" :key="n" class="rr__skeleton" />
        </div>
        <p v-else-if="compError" class="rr__empty">데이터를 불러오지 못했습니다.</p>
        <p v-else-if="compJobs.length === 0" class="rr__empty">추천 직업을 찾을 수 없습니다.</p>

        <template v-else>
        <div
          v-for="(job, i) in compJobs"
          :key="job.jobCode"
          class="rr__job rr__job--link"
          @click="openJob(job)"
        >
          <span :class="['rr__job-rank', `rr__job-rank--${i + 1}`]">{{ i + 1 }}</span>
          <div class="rr__job-body">
            <div class="rr__job-top">
              <span class="rr__job-title">{{ job.title }}</span>
              <JobGateBadges :job-code="job.jobCode" />
              <!-- 묶음 직업: 고용24가 여러 직업을 한 직업으로 묶어 조사해 점수가 같은 경우
                   추천이 한 자리로 접힌다. 탭하면 세부 직업을 고르게 한다. -->
              <span v-if="(job.members?.length ?? 1) > 1" class="rr__job-group">유사 {{ job.members!.length }}개</span>
              <span class="rr__job-score">{{ pct(job.match_score) }}%</span>
            </div>
            <p class="rr__job-class">{{ job.classification.primary }} › {{ job.classification.secondary }}</p>
            <p v-if="(job.members?.length ?? 1) > 1" class="rr__job-members">
              {{ job.members!.map((m) => m.title).join(' · ') }}
            </p>
            <div class="rr__job-bars">
              <span class="rr__jl rr__jl--t1">성격/기질</span>
              <span class="rr__jt"><span class="rr__jf rr__jf--t1" :style="{ width: pct(job.match_detail.T1) + '%' }" /></span>
              <span class="rr__jv">{{ pct(job.match_detail.T1) }}</span>

              <span class="rr__jl rr__jl--t2">재능/흥미/가치관</span>
              <span class="rr__jt"><span class="rr__jf rr__jf--t2" :style="{ width: pct(calcT2Score(job.match_detail)) + '%' }" /></span>
              <span class="rr__jv">{{ pct(calcT2Score(job.match_detail)) }}</span>

              <span class="rr__jl rr__jl--t3">업무환경</span>
              <span class="rr__jt"><span class="rr__jf rr__jf--t3" :style="{ width: pct(job.match_detail.T3) + '%' }" /></span>
              <span class="rr__jv">{{ pct(job.match_detail.T3) }}</span>
            </div>
            <p v-if="job.salary?.median || job.jobSatisfaction" class="rr__job-meta">
              <span v-if="job.salary?.median">급여 중위 {{ job.salary.median.toLocaleString() }}만원</span>
              <span v-if="job.salary?.median && job.jobSatisfaction"> · </span>
              <span v-if="job.jobSatisfaction">만족도 {{ job.jobSatisfaction }}%</span>
            </p>
          </div>
        </div>
        </template>
        </template>
      </section>


      <!-- 하단 액션(래퍼가 주입): 일반=CTA / 온보딩=다음으로. 비회원은 위 잠금 상자가 대신한다 -->
      <slot v-if="!guestMode" />
    </template>

    <!-- 묶음 직업 선택 -->
    <JobGroupPicker
      v-model="pickerOpen"
      :group-title="pickerTitle"
      :members="pickerMembers"
      @select="(code) => emit('job-click', code)"
    />
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ENV_JUDGE_ICON, weIcon } from '@/modules/survey/surveyIcons'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  fetchSurveyAnalysis,
  fetchT2Recommend,
  fetchComprehensiveRecommend,
  fetchJobGroupRecommend,
  saveRecommendedJobs,
  linkSurveyToUser,
} from '../survey.api'
import { useAuthStore } from '@/shared/stores/auth'
import type {
  SurveyAnalysisResponse,
  T2RecommendJob,
  ComprehensiveRecommendJob,
  JobGroupRecommend,
  JobGroupReason,
  JobGroupMember,
} from '../types/survey'
import JobGroupPicker from '@/shared/components/JobGroupPicker.vue'
import GuestLockCard from '@/shared/components/GuestLockCard.vue'
import SocialLoginButton from '@/shared/components/SocialLoginButton.vue'
import { getGuestSurvey, fetchGuestAnalysis, fetchGuestJobTeaser, markLoginRedirect, type GuestJobTeaser } from '@/shared/guest/guestSurvey'
import { fetchProviders, startOAuth, type Provider } from '@/shared/auth/oauth'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'

// recruitLink: 직무 카드의 '채용 공고'(다른 화면으로 간다). 온보딩 결과처럼 흐름을 벗어나면 안 되는 곳은 끈다
const props = withDefaults(defineProps<{ surveyId: string; recruitLink?: boolean }>(), { recruitLink: true })
const emit = defineEmits<{
  (e: 'job-click', jobCode: string): void
  // 직무 카드의 '채용 공고' — 직무 코드(고용24 채용 직종 중분류)
  (e: 'group-recruit', code: string): void
  // 결과지가 다 그려졌는가(추천 직업까지) + 파일 이름용 성격 유형 — 내보내기 버튼을 켤 때 쓴다
  (e: 'ready', ok: boolean, label?: string): void
}>()

// ── 묶음 직업 ─────────────────────────────────────────────────────────────
// 고용24가 여러 직업을 한 직업으로 묶어 조사한 경우(전문의 13종 등) 구성원 점수가 완전히 같아서
// 서버가 추천을 한 자리로 접어 보낸다(`title` = 그룹명, `members` = 세부 직업).
// 바로 jobCode 를 올리면 **누른 이름과 열린 모달 제목이 달라지므로** 여기서 고르게 한다.
// 부모는 최종 선택된 jobCode 만 받으므로 바뀔 필요가 없다.
const pickerOpen = ref(false)
const pickerTitle = ref('')
const pickerMembers = ref<{ jobCode: string; title: string }[]>([])

function openJob(job: { jobCode: string; title: string; members?: JobGroupMember[] }) {
  if ((job.members?.length ?? 1) > 1) {
    pickerTitle.value = job.title
    pickerMembers.value = job.members ?? []
    pickerOpen.value = true
    return
  }
  emit('job-click', job.jobCode)
}

const T1_DEFINITIONS: Record<string, string> = {
  E: '외부 세계와의 상호작용에서 활력과 긍정적인 감정을 얻는 경향',
  C: '새로운 생각이나 발상을 잘 해내며, 기존의 가치나 이론에 갇혀있지 않은 정도',
  S: '목표를 설정하고 계획하며, 책임감 있고 조직적으로 자신의 의무를 수행하는 경향',
  A: '타인을 이해하고 공감하며, 협조적이고 친절하며, 원만한 대인 관계를 유지하려는 경향',
  I: '새롭고 신기한 자극에 대해 강한 흥미를 느끼고, 그러한 자극이나 경험을 추구하려는 선천적인 경향성',
  R: '위험하거나 혐오스러운 자극에 대해 행동이 억제되고 위축되는 선천적인 경향성',
  G: '따뜻한 사회적 관계를 형성하고 유지하기 위해 타인의 긍정적인 신호에 민감하게 반응하는 선천적인 경향성',
  U: '외부의 압력이나 기대보다는 자신의 가치관과 신념에 따라 스스로 생각하고 행동하려는 강한 경향성',
  T: '자신을 사회의 통합된 구성원으로 인식하고, 다른 사람들과 자연스럽게 조화를 이루며 협력하려는 내재적인 성향',
}

const T21_DEFINITIONS: Record<string, string> = {
  T: '자연 현상을 인식하고 분류하며 이해하는 능력. 동식물에 대한 관심, 환경 패턴 인식.',
  L: '말과 글을 이해하고 표현하는 능력. 언어 구사 능력, 어휘력, 문장 구성 능력.',
  M: '논리적인 추론, 문제 해결, 수학적 사고 능력. 패턴 인식, 분석적 사고.',
  B: '신체를 이용하여 생각이나 감정을 표현하고 문제를 해결하는 능력. 운동 능력, 손재주.',
  S: '시각적 정보를 인식하고 조작하는 능력, 공간적인 관계를 이해하는 능력.',
  I: '다른 사람의 감정, 의도, 동기를 이해하고 효과적으로 상호작용하는 능력.',
  N: '자신의 감정, 생각, 동기를 이해하고 자기 성찰을 하는 능력. 자기 인식.',
  A: '음악의 리듬, 음조, 가락 등을 이해하고 창조하는 능력. 악기 연주, 작곡.',
}

const T23_DEFINITIONS: Record<string, string> = {
  T23_1:
    '다른 사람들을 돕거나 사회에 긍정적인 영향을 미치는 데서 큰 만족감을 느끼는 것을 의미합니다.',
  T23_2:
    '심리적으로나 물질적으로 불안감 없이 꾸준하고 예측 가능한 삶을 유지하는 것을 중요하게 여깁니다.',
  T23_3: '새로운 지식을 배우고 탐구하는 과정 자체에서 큰 즐거움을 얻는 것을 의미합니다.',
  T23_4:
    '스스로 도전적인 목표를 세우고 이를 내 자신의 노력으로 달성했을 때 큰 만족감을 느끼는 것을 의미합니다.',
  T23_5:
    '다른 사람들의 생각이나 행동, 혹은 중요한 결정에 긍정적인 영향을 미치고 싶어 하는 경향을 의미합니다.',
  T23_6:
    '나의 노력과 성과에 대해 다른 사람들에게 긍정적으로 평가받고 인정받는 것을 중요하게 생각합니다.',
  T23_7: '내가 하는 일에 대해 충분하고 만족스러운 금전적인 대가를 받는 것을 중요하게 생각합니다.',
  T23_8: '정신적, 육체적으로 건강하고 여유로운 삶을 유지하는 것을 최우선으로 생각합니다.',
  T23_9:
    '타인의 간섭이나 지시 없이 스스로 생각하고 결정하며, 나의 방식대로 일을 주도적으로 해나갈 수 있는 환경을 중요하게 생각합니다.',
  T23_10:
    '개인의 이익을 넘어 소속된 공동체나 더 큰 목표를 위해 기꺼이 자신을 바치고 기여하는 것을 중요하게 여깁니다.',
  T23_11: '업무가 새롭고 변화무쌍하며 다양한 도전으로 가득 찬 환경을 선호합니다.',
  T23_12: '업무를 수행하면서 육체적인 활동이나 움직임이 많지 않은 것을 선호하는 가치관입니다.',
  T23_13: '다른 사람들과 함께 어울려 일하기보다는 혼자 독립적으로 업무를 수행하는 것을 선호합니다.',
}

const T1_IMG_MAP: Record<string, string> = {
  A: '/T1_img/A-Photoroom.png',
  C: '/T1_img/C-Photoroom.png',
  E: '/T1_img/E-Photoroom.png',
  G: '/T1_img/G-Photoroom.png',
  I: '/T1_img/I-Photoroom.png',
  R: '/T1_img/R-Photoroom.png',
  S: '/T1_img/S-Photoroom.png',
  T: '/T1_img/T-Photoroom.png',
  U: '/T1_img/U-Photoroom.png',
}

const T3_WE_ITEMS: Record<string, { icon: string; name: string; description: string }> = {
  WE01: { icon: weIcon('WE01'), name: '실내 근무', description: '건물 내부에서 주로 업무를 처리하는 환경' },
  WE02: {
    icon: weIcon('WE02'),
    name: '앉아서 근무',
    description: '대부분의 업무를 앉은 자세로 처리하는 환경',
  },
  WE03: {
    icon: weIcon('WE03'),
    name: '이메일 업무',
    description: '이메일을 통한 소통과 업무 처리가 많은 환경',
  },
  WE04: {
    icon: weIcon('WE04'),
    name: '사람들과 직접 접촉',
    description: '고객이나 동료와 직접 만나 일하는 환경',
  },
  WE05: {
    icon: weIcon('WE05'),
    name: '다른 사람과의 상호작용',
    description: '타인과 지속적으로 소통하며 협력하는 환경',
  },
  WE06: { icon: weIcon('WE06'), name: '다른 사람과의 접촉', description: '다양한 사람들과 접촉이 잦은 환경' },
  WE07: {
    icon: weIcon('WE07'),
    name: '조율·이끌기',
    description: '다른 사람들을 조율하거나 이끄는 역할이 있는 환경',
  },
  WE08: {
    icon: weIcon('WE08'),
    name: '공문·문서 교환',
    description: '공식 문서나 공문을 주고받는 업무가 많은 환경',
  },
  WE09: { icon: weIcon('WE09'), name: '전화 업무', description: '전화 통화가 잦은 업무 환경' },
  WE10: { icon: weIcon('WE10'), name: '외부 고객 응대', description: '외부 고객을 직접 상대하는 업무 환경' },
  WE11: {
    icon: weIcon('WE11'),
    name: '정확성·정밀성',
    description: '높은 정밀도와 꼼꼼함이 요구되는 업무 환경',
  },
  WE12: {
    icon: weIcon('WE12'),
    name: '조직에 미치는 강도',
    description: '이미지, 평판, 재정에 큰 영향을 미치는 업무 환경',
  },
  WE13: { icon: weIcon('WE13'), name: '반복적인 업무', description: '동일한 작업이 반복되는 구조의 환경' },
  WE14: {
    icon: weIcon('WE14'),
    name: '의사결정 권한',
    description: '중요한 결정을 스스로 내릴 수 있는 권한이 있는 환경',
  },
  WE15: {
    icon: weIcon('WE15'),
    name: '결과에 대한 책임',
    description: '업무 결과에 대해 명확하게 책임지는 환경',
  },
  WE16: {
    icon: weIcon('WE16'),
    name: '신체적 접촉',
    description: '타인과 신체적으로 접촉하는 업무가 포함된 환경',
  },
  WE17: {
    icon: weIcon('WE17'),
    name: '조직에 미치는 영향력',
    description: '조직의 방향이나 성과에 영향력을 행사하는 환경',
  },
  WE18: {
    icon: weIcon('WE18'),
    name: '손 사용',
    description: '도구나 장치를 손으로 직접 다루는 작업이 많은 환경',
  },
  WE19: { icon: weIcon('WE19'), name: '마감시간', description: '촉박한 마감이 자주 있는 업무 환경' },
  WE20: {
    icon: weIcon('WE20'),
    name: '의사결정 가능성',
    description: '업무 내에서 판단하고 결정할 기회가 많은 환경',
  },
  WE21: { icon: weIcon('WE21'), name: '갈등 상황', description: '갈등이나 충돌이 발생할 수 있는 환경' },
  WE22: { icon: weIcon('WE22'), name: '균형 유지', description: '신체 균형을 요구하는 작업이 포함된 환경' },
  WE23: {
    icon: weIcon('WE23'),
    name: '건강·안전 책임',
    description: '타인의 건강과 안전을 책임지는 역할이 포함된 환경',
  },
  WE24: { icon: weIcon('WE24'), name: '실외 근무', description: '야외나 현장에서 주로 활동하는 환경' },
  WE25: { icon: weIcon('WE25'), name: '발표·회의', description: '연설, 발표, 회의가 자주 있는 환경' },
  WE26: {
    icon: weIcon('WE26'),
    name: '무례한 사람 상대',
    description: '불쾌하거나 무례한 상황을 감수해야 하는 환경',
  },
  WE27: {
    icon: weIcon('WE27'),
    name: '실수의 심각성',
    description: '실수가 큰 결과로 이어질 수 있는 긴장감 있는 환경',
  },
  WE28: { icon: weIcon('WE28'), name: '움직이는 기계', description: '가동 중인 기계 근처에서 작업하는 환경' },
  WE29: {
    icon: weIcon('WE29'),
    name: '주말·공휴일 근무',
    description: '주말이나 공휴일에도 근무해야 하는 환경',
  },
  WE30: { icon: weIcon('WE30'), name: '치열한 경쟁', description: '성과 경쟁이 치열한 업무 환경' },
  WE31: { icon: weIcon('WE31'), name: '소음 노출', description: '작업 중 상당한 소음에 노출되는 환경' },
  WE32: { icon: weIcon('WE32'), name: '자동화 환경', description: '자동화된 시스템이나 장비가 많은 환경' },
  WE33: {
    icon: weIcon('WE33'),
    name: '장비 속도에 보조',
    description: '기계나 장비의 속도에 맞춰 작업해야 하는 환경',
  },
  WE34: { icon: weIcon('WE34'), name: '극단적 기온', description: '매우 춥거나 더운 환경에서 일하는 환경' },
  WE35: { icon: weIcon('WE35'), name: '재택근무', description: '집이나 원격지에서 근무하는 환경' },
  WE36: {
    icon: weIcon('WE36'),
    name: '비좁은 업무 공간',
    description: '좁거나 제한된 공간에서 작업하는 환경',
  },
  WE37: { icon: weIcon('WE37'), name: '부적절한 조명', description: '지나치게 밝거나 어두운 조명 환경' },
  WE38: { icon: weIcon('WE38'), name: '서서 근무', description: '장시간 서서 일하는 환경' },
  WE39: {
    icon: weIcon('WE39'),
    name: '경미한 부상 위험',
    description: '가벼운 화상, 자상 등에 노출될 수 있는 환경',
  },
  WE40: {
    icon: weIcon('WE40'),
    name: '몸을 구부리거나 비틀기',
    description: '신체를 자주 굽히거나 비트는 자세가 요구되는 환경',
  },
  WE41: { icon: weIcon('WE41'), name: '걷거나 뛰기', description: '이동이 잦고 신체활동이 많은 환경' },
  WE42: {
    icon: weIcon('WE42'),
    name: '온몸 진동 노출',
    description: '진동이 심한 장비나 차량을 다루는 환경',
  },
  WE43: {
    icon: weIcon('WE43'),
    name: '오염물질 노출',
    description: '먼지, 화학물질 등 오염 환경에서 일하는 환경',
  },
  WE44: {
    icon: weIcon('WE44'),
    name: '보호장비 착용',
    description: '안전모, 장갑 등 보호장비를 착용해야 하는 환경',
  },
  WE45: { icon: weIcon('WE45'), name: '위험한 장비 노출', description: '위험한 기계나 장비를 다루는 환경' },
  WE46: {
    icon: weIcon('WE46'),
    name: '위험한 상태 노출',
    description: '사고 위험이 있는 상황에서 작업하는 환경',
  },
  WE47: { icon: weIcon('WE47'), name: '질병·감염 위험', description: '질병이나 감염에 노출될 수 있는 환경' },
  WE48: { icon: weIcon('WE48'), name: '고지대 작업', description: '높은 곳에서 작업하는 환경' },
  WE49: {
    icon: weIcon('WE49'),
    name: '규칙적인 근무',
    description: '일정하고 예측 가능한 루틴으로 일하는 환경',
  },
}

const T3_PARTS_MAP: Record<
  string,
  { up: Array<{ code: string; weight: number }>; down: Array<{ code: string; weight: number }> }
> = {
  T3_PHY: {
    up: [
      { code: 'WE24', weight: 1.5 },
      { code: 'WE38', weight: 1 },
      { code: 'WE40', weight: 1 },
      { code: 'WE41', weight: 1 },
      { code: 'WE22', weight: 0.7 },
      { code: 'WE31', weight: 0.7 },
      { code: 'WE34', weight: 0.7 },
      { code: 'WE37', weight: 0.5 },
      { code: 'WE36', weight: 0.5 },
      { code: 'WE18', weight: 0.7 },
      { code: 'WE28', weight: 1 },
      { code: 'WE39', weight: 1 },
      { code: 'WE42', weight: 1.5 },
      { code: 'WE43', weight: 1.5 },
      { code: 'WE44', weight: 1 },
      { code: 'WE45', weight: 1.5 },
      { code: 'WE46', weight: 1.5 },
      { code: 'WE47', weight: 1 },
      { code: 'WE48', weight: 1 },
    ],
    down: [
      { code: 'WE01', weight: 1.5 },
      { code: 'WE02', weight: 1 },
      { code: 'WE35', weight: 0.5 },
    ],
  },
  T3_PEO: {
    up: [
      { code: 'WE04', weight: 1.5 },
      { code: 'WE05', weight: 1.5 },
      { code: 'WE06', weight: 1 },
      { code: 'WE10', weight: 1 },
      { code: 'WE16', weight: 1 },
      { code: 'WE26', weight: 0.7 },
    ],
    down: [{ code: 'WE35', weight: 1 }],
  },
  T3_COM: {
    up: [
      { code: 'WE25', weight: 1.5 },
      { code: 'WE09', weight: 1 },
      { code: 'WE08', weight: 0.7 },
      { code: 'WE03', weight: 0.7 },
    ],
    down: [{ code: 'WE35', weight: 0.7 }],
  },
  T3_RES: {
    up: [
      { code: 'WE14', weight: 1.5 },
      { code: 'WE20', weight: 1.5 },
      { code: 'WE07', weight: 1 },
      { code: 'WE15', weight: 1 },
      { code: 'WE17', weight: 1 },
      { code: 'WE23', weight: 1 },
      { code: 'WE27', weight: 0.7 },
      { code: 'WE12', weight: 0.7 },
      { code: 'WE11', weight: 0.5 },
    ],
    down: [],
  },
  T3_STR: {
    up: [
      { code: 'WE21', weight: 1.5 },
      { code: 'WE30', weight: 1.5 },
      { code: 'WE19', weight: 1 },
      { code: 'WE29', weight: 0.7 },
    ],
    down: [{ code: 'WE35', weight: 0.5 }],
  },
  T3_FLX: {
    up: [],
    down: [
      { code: 'WE49', weight: 1.5 },
      { code: 'WE13', weight: 1 },
      { code: 'WE32', weight: 1 },
      { code: 'WE33', weight: 0.7 },
    ],
  },
}

const authStore = useAuthStore()
const surveyId = props.surveyId

// 비회원 결과지(2026-11-09) — 로그인하지 않았으면 이 기기의 열람 키로 받고, 성격 Top 3 까지만 보여 준다.
// 들어오는 길은 비회원 경로(features.guestEntry)가 켜진 빌드뿐이다(꺼지면 라우터가 로그인으로 보낸다)
const guestMode = !authStore.isLoggedIn
const providers = ref<Record<Provider, boolean>>({ kakao: false, google: false })
function goOAuth(p: Provider) {
  markLoginRedirect()   // 소셜 로그인은 같은 탭으로 돌아온다 — '나가면 삭제' 경고를 띄우지 않는다
  startOAuth(p)
}

// 비회원 맛보기(2026-11-11) — 잠긴 구역을 누르면 맨 아래 가입 상자로 내린다
const lockEl = ref<HTMLElement | null>(null)
function scrollToLock() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  lockEl.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
}
// 떠 있는 가입 카드 — 성격 유형이 60% 넘게 지나가면 올라오고, 맨 아래 가입 상자가 화면에 들어오면 내려간다
const heroEl = ref<HTMLElement | null>(null)
const floatShow = ref(false)
let floatIo: IntersectionObserver | null = null
watch([heroEl, lockEl], ([hero, lock]) => {
  floatIo?.disconnect()
  floatShow.value = false
  if (!guestMode || !hero || !lock || typeof IntersectionObserver === 'undefined') return
  let heroPast = false
  let lockSeen = false
  // ⚠️ 0.4 는 성격 유형 상자(약 410px)가 화면보다 작아서 쓸 수 있다 — 화면보다 큰 요소는 비율이 1까지 못 간다
  floatIo = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target === hero) heroPast = e.intersectionRatio < 0.4
      else lockSeen = e.isIntersecting
    }
    floatShow.value = heroPast && !lockSeen
  }, { threshold: [0, 0.4] })
  floatIo.observe(hero)
  floatIo.observe(lock)
})
onBeforeUnmount(() => floatIo?.disconnect())

// 직무 1위 이름과 개수(비회원 직무 맛보기 API). 못 받으면 직무 칸은 이름 없이 흐리게 둔다
const guestJobs = ref<GuestJobTeaser | null>(null)
async function loadGuestJobs() {
  const g = getGuestSurvey()
  if (g?.surveyId !== surveyId) return
  try {
    guestJobs.value = (await fetchGuestJobTeaser(surveyId, g.key)).data
  } catch { /* 맛보기만 빠진다 */ }
}

async function tryLinkSurvey() {
  if (!authStore.isLoggedIn) return
  // 이미 연결된 경우(409)는 정상, 나머지 오류는 무시
  await linkSurveyToUser(surveyId).catch(() => {})
}

const isLoading = ref(true)
const error = ref(false)
const analysis = ref<SurveyAnalysisResponse['analysis'] | null>(null)

const t1ImgSrc = computed(() => {
  const baseType = analysis.value?.personality_type?.base_type
  return baseType ? (T1_IMG_MAP[baseType] ?? null) : null
})

// 결과지 공용 계산 — 랜딩 결과지와 같은 규칙
const pct = (v: number | null | undefined) => Math.round((v ?? 0) * 100)
// 성격 분포 막대·숫자 색: 1위 노랑 · 2~3위 하늘 · 4위부터 연하늘(숫자는 보조 회색)
const pdBar = (i: number) => (i === 0 ? '#FFD100' : i < 3 ? '#5BB8F5' : '#A5D8F8')
const pdScore = (i: number) => (i === 0 ? '#9A7400' : i < 3 ? '#2B69B6' : '#5F6670')
const t1Definition = (f: { code: string; definition?: string | null }) => f.definition || T1_DEFINITIONS[f.code] || ''
// 목적격 조사 을/를 — 받침 있으면 '을'. 한글이 아니면 '을(를)'
const objectJosa = (w: string) => { const c = w.trim().slice(-1).charCodeAt(0) - 0xac00; return c < 0 || c > 11171 ? '을(를)' : c % 28 ? '을' : '를' }

// 성격 4~9위 (?) 터치용 말풍선 — 한 번에 하나만. 같은 (?) 를 다시 누르거나 다른 곳을 누르면 닫힌다.
// 마우스 기기는 CSS :hover 가 보여 주므로 누를 필요가 없다
const openTip = ref<string | null>(null)
const toggleTip = (code: string) => { openTip.value = openTip.value === code ? null : code }
const closeTip = () => { openTip.value = null }
onMounted(() => document.addEventListener('click', closeTip))
onBeforeUnmount(() => document.removeEventListener('click', closeTip))

const valueList = computed(() => {
  const v = analysis.value?.values
  return v ? [v.priority_1, v.priority_2, v.priority_3] : []
})
const valueCount = computed(() => valueList.value.filter(Boolean).length)

const t3GoodTexts = computed(() => analysis.value?.environment.texts?.good ?? [])
const t3BadTexts = computed(() => analysis.value?.environment.texts?.bad ?? [])

const t3AllNeutral = computed(
  () =>
    (analysis.value?.environment.parts ?? []).length === 6 &&
    (analysis.value?.environment.parts ?? []).every((p) => p.level === 3),
)

function computeWEItems(
  parts: Array<{ code: string; level: number }>,
  config: Array<{ levels: number[]; side: 'up' | 'down' }>,
): Array<{ code: string; weight: number }> {
  const map = new Map<string, number>()
  for (const part of parts) {
    const partData = T3_PARTS_MAP[part.code]
    if (!partData) continue
    for (const { levels, side } of config) {
      if (levels.includes(part.level)) {
        for (const item of partData[side]) {
          map.set(item.code, (map.get(item.code) ?? 0) + item.weight)
        }
      }
    }
  }
  return [...map.entries()]
    .map(([code, weight]) => ({ code, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
}

const t3WeVisible = computed(() =>
  (analysis.value?.environment.parts ?? []).some((p) => p.level !== 3),
)

const t3WeRec = computed(() =>
  computeWEItems(analysis.value?.environment.parts ?? [], [
    { levels: [4, 5], side: 'up' },
    { levels: [1, 2], side: 'down' },
  ]),
)

const t3WeNonRec = computed(() =>
  computeWEItems(analysis.value?.environment.parts ?? [], [
    { levels: [1, 2], side: 'up' },
    { levels: [4, 5], side: 'down' },
  ]),
)
// 비회원 맛보기의 '업무 조건 n개' — 회원 화면에 실제로 그려지는 항목 수와 같게
const weCount = computed(() => (t3WeVisible.value ? t3WeRec.value.length + t3WeNonRec.value.length : 0))

async function load() {
  isLoading.value = true
  error.value = false
  try {
    const g = guestMode ? getGuestSurvey() : null
    if (guestMode && g?.surveyId !== surveyId) {
      // 이 기기에서 한 비회원 검사가 아니거나 이미 지워졌다(나가며 삭제·24시간 경과)
      error.value = true
      return
    }
    const { data } = guestMode ? await fetchGuestAnalysis(surveyId, g!.key) : await fetchSurveyAnalysis(surveyId)
    if (data.success) {
      analysis.value = data.analysis
    } else {
      error.value = true
    }
  } catch {
    error.value = true
  } finally {
    isLoading.value = false
  }
}

// ─── T2 추천 ────────────────────────────────────────────────────────────────

const T21_LABEL: Record<string, string> = {
  L: '읽고 쓰고 말',
  M: '논리적으로 분석하고 설계',
  S: '시각적으로 구성하고 표현',
  A: '소리와 리듬으로 창작',
  B: '직접 몸으로 만들고 행동',
  I: '사람을 이해하고 소통',
  N: '깊이 사유하고 성찰',
  T: '자연을 관찰하고 탐구',
}

const T23_TO_VA_FE: Record<string, string> = {
  T23_1: 'VA10',
  T23_2: 'VA11',
  T23_3: 'VA04',
  T23_4: 'VA01',
  T23_5: 'VA06',
  T23_6: 'VA09',
  T23_7: 'VA05',
  T23_8: 'VA12',
  T23_9: 'VA07',
  T23_10: 'VA08',
  T23_11: 'VA03',
  T23_12: 'VA13',
  T23_13: 'VA02',
}

const T23_LABEL: Record<string, string> = {
  VA01: '목표를 달성하는 것',
  VA02: '나만의 방식으로 일하는 것',
  VA03: '다양한 경험을 쌓는 것',
  VA04: '끊임없이 배우고 성장하는 것',
  VA05: '충분한 경제적 보상을 얻는 것',
  VA06: '주변에 영향을 미치는 것',
  VA07: '스스로 결정하며 일하는 것',
  VA08: '더 큰 목표에 기여하는 것',
  VA09: '타인에게 인정받는 것',
  VA10: '타인에게 도움이 되는 것',
  VA11: '안정적으로 오래 일하는 것',
  VA12: '여유롭고 균형 잡힌 삶을 사는 것',
  VA13: '몸을 활발히 움직이는 것',
}

const t2Jobs = ref<T2RecommendJob[]>([])
const t2Loading = ref(false)
const t2Error = ref(false)

const t2LabelInterest = computed(() => {
  const cats = analysis.value?.interest.by_category
  if (!cats) return ''
  const firstCat = Object.values(cats)[0]
  return firstCat?.items[0]?.name ?? ''
})

const t2LabelTalent = computed(() => {
  const code = analysis.value?.talent.top3[0]?.code
  return code ? (T21_LABEL[code] ?? '') : ''
})

const t2LabelValue = computed(() => {
  const code = analysis.value?.values.priority_1?.code
  if (!code) return ''
  const vaCode = T23_TO_VA_FE[code]
  return vaCode ? (T23_LABEL[vaCode] ?? '') : ''
})

// 좋아하는 일 카드용 — T22 최다 선택 카테고리명
const topInterestName = computed(() => {
  const cats = Object.values(analysis.value?.interest.by_category ?? {})
  if (cats.length === 0) return null
  return cats.reduce((a, b) => (a.items.length >= b.items.length ? a : b)).name
})

async function loadT2Recommend() {
  t2Loading.value = true
  t2Error.value = false
  try {
    const { data } = await fetchT2Recommend(surveyId)
    if (data.success) {
      t2Jobs.value = data.data
    } else {
      t2Error.value = true
    }
  } catch {
    t2Error.value = true
  } finally {
    t2Loading.value = false
  }
}

// ─── 종합 추천 ──────────────────────────────────────────────────────────────

const compJobs = ref<ComprehensiveRecommendJob[]>([])
const compLoading = ref(false)
const compError = ref(false)

function calcT2Score(detail: { T21: number; T22: number; T23: number }): number {
  return (detail.T21 * 0.25 + detail.T22 * 0.25 + detail.T23 * 0.2) / 0.7
}

async function loadComprehensiveRecommend() {
  compLoading.value = true
  compError.value = false
  try {
    const { data } = await fetchComprehensiveRecommend(surveyId, 5)
    if (data.success) {
      compJobs.value = data.data
      if (authStore.isLoggedIn) {
        saveRecommendedJobs(data.data.map((j) => j.jobCode)).catch(() => {})
      }
    } else {
      compError.value = true
    }
  } catch {
    compError.value = true
  } finally {
    compLoading.value = false
  }
}

// ─── 직무 추천 ──────────────────────────────────────────────────────────────
// 서버(services/jobGroups)가 고르고·늘어놓고·이유까지 정해 보낸다. 화면은 그리기만 한다

const groups = ref<JobGroupRecommend[]>([])
const groupLoading = ref(false)
const groupError = ref(false)
const groupMode = computed(() => !groupError.value && groups.value.length > 0)
const showJobRank = ref(false)   // '직업 순위 보기' — 예전 Top 5
const openGroups = ref<string[]>([])   // '직업 N개 모두 보기'를 펼친 직무
const isOpen = (g: JobGroupRecommend) => openGroups.value.includes(g.code)
const toggleOpen = (g: JobGroupRecommend) => {
  openGroups.value = isOpen(g) ? openGroups.value.filter((c) => c !== g.code) : [...openGroups.value, g.code]
}

// 이유 항목의 영역 — 결과지에서 그 이름이 나온 구역(성격 분포 · 재능 Top 3 · 관심 분야 · 나의 가치관)
const REASON_AXIS: Record<JobGroupReason['axis'], string> = { T1: '성격', T21: '재능', T22: '관심', T23: '가치관' }
// 조사 — 받침이 있으면 앞 것(과·이). 한글이 아니면 둘 다
const josa = (w: string, batchim: string, none: string) => { const c = w.trim().slice(-1).charCodeAt(0) - 0xac00; return c < 0 || c > 11171 ? `${batchim}(${none})` : c % 28 ? batchim : none }
// "특히 A와 B가 잘 맞아요" — 핵심어만 굵은 색 글씨. 칩 상자를 씌우면 조사가 떨어져 보였다(시안 때 실제로 그랬다)
// '잘 맞아요'는 줄바꿈 없는 공백으로 붙인다 — 영역 괄호가 붙어 길어지자 '잘 / 맞아요'로 끊겼다
function whyParts(g: JobGroupRecommend): { text?: string; kw?: JobGroupReason }[] {
  const [a, b] = g.reasons
  if (!a) return []
  return b
    ? [{ text: '특히 ' }, { kw: a }, { text: `${josa(a.name, '과', '와')} ` }, { kw: b }, { text: `${josa(b.name, '이', '가')} 잘\u00a0맞아요` }]
    : [{ text: '특히 ' }, { kw: a }, { text: `${josa(a.name, '이', '가')} 잘\u00a0맞아요` }]
}

async function loadJobGroups() {
  groupLoading.value = true
  groupError.value = false
  try {
    const { data } = await fetchJobGroupRecommend(surveyId)
    if (data.success) groups.value = data.groups
    else groupError.value = true
  } catch {
    groupError.value = true
  } finally {
    groupLoading.value = false
  }
}

watch(
  () => !isLoading.value && !error.value && !!analysis.value && !compLoading.value && !groupLoading.value,
  (v) => emit('ready', v, analysis.value?.personality_type?.full_name),
  { immediate: true },
)

// PDF 결과지(report/ResultReport.vue)용 원재료 — 화면과 같은 응답을 다시 부르지 않고 넘긴다
defineExpose({
  reportSource: () => ({ analysis: analysis.value, recommend: compJobs.value, groups: groupMode.value ? groups.value : [] }),
})

onMounted(() => {
  load()
  if (guestMode) {
    // 비회원은 추천 전체를 부르지 않는다(로그인 필요) — 직무 1위 이름과 개수만 맛보기 API 로
    fetchProviders().then((v) => { providers.value = v })
    loadGuestJobs()
    return
  }
  loadT2Recommend()
  loadComprehensiveRecommend()
  loadJobGroups()
  tryLinkSurvey()
})
</script>

<style lang="scss" scoped>
// 정본: 랜딩 lighthouse-landing components/survey/ResearchResult.vue 의 스타일(2026-10-26). 값·주석을 그대로 옮겼다.
// 랜딩에만 있는 현재 직업 매칭도(.rr__cj*)는 뺐고, 앱에만 있는 것은 맨 아래 「앱 전용」에 모았다

// ── 영역 색(2026-10-20 결과지 정리) ── 같은 영역은 어디서나 같은 색. 맑은 파스텔(채도는 높게, 밝기만 올림)
//   성격 = 주황 · 재능·흥미·가치관 = 파랑 · 업무환경 = 청록. 강조(1위·게이지·주 버튼)는 브랜드 노랑
//   색 글씨는 같은 색상의 진한 값(-text)을 쓴다 — 파스텔 글씨는 흐려서 읽기 어렵다
//   노랑 글씨는 $c-gold, 파랑 글씨는 $c-b-text 하나로(2026-10-23 위쪽 구역까지 통일)
// 파랑 영역은 하늘색 체계(2026-10-23) — 막대는 위쪽 원래 하늘색, 바탕은 '2순위' 배지의 연하늘 하나로
$c-b: #5bb8f5;  $c-b-light: #a5d8f8;  $c-b-text: #2b69b6;  $c-b-tint: #e8f4fe;  $c-b-line: #b9def7;
$c-g: #5fcca1;  $c-g-text: #297a67;  $c-g-tint: #dbf5ef;
// 3색 그래프(매칭도 카드·Top 5 의 영역별 일치도) 전용 — 세 색을 같은 OKLCH 밝기(0.73)·채도(0.14)로 맞췄다(2026-10-26).
//   위 영역 색보다 살짝 선명하다(파스텔이면 막대가 흐렸다). 다른 곳의 $c-b·$c-g 는 그대로 둔다
$c-tri-1: #ef8959;  // 성격/기질
$c-tri-2: #43b2f6;  // 재능/흥미/가치관
$c-tri-3: #32c392;  // 업무환경
$c-pri: #ffd100; $c-pri-tint: #fff6c2; $c-gold: #9a7400;
$c-line: #eeeeee; $c-alt: #f5f5f5;
// 글씨 회색은 역할별 4단계만 쓴다(2026-10-23) — 강조 · 본문 · 보조 · 메타
//   메타도 흰 바탕 대비 4.5 이상(#999·#888 은 2.8~3.5 라 읽기 어려웠다)
$c-text-1: #1a1a1a;  // 강조 — 제목, 이름, 핵심 수치
$c-text-body: #333;  // 본문 — 설명 문장
$c-text-2: #5f6670;  // 보조 — 부제, 카드 설명, 라벨
$c-text-3: #767676;  // 메타 — 분류·급여, 순위, 작은 안내

// 페이지 바탕·폭은 랜딩 /survey 의 .rs · .rs__main 과 같다
.rr {
  max-width: 640px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 16px 16px 48px;
  background: #fafaf8;
  color: $c-text-1;
}

.rr__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 50vh;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.6;
  color: $c-text-2;
}

.rr__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #eaeaea;
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: rr-spin 0.8s linear infinite;
}
@keyframes rr-spin { to { transform: rotate(360deg); } }

.rr__retry {
  padding: 12px 22px;
  border-radius: 10px;
  background: #1a1a1a;
  color: #fff;
  font: inherit;
  font-weight: 700;
}

.rr__hero {
  padding: 28px 22px 24px;
  border-radius: 18px;
  background: linear-gradient(160deg, #fffdf0 0%, $c-b-tint 100%);
  text-align: center;
}

.rr__hero-label { font-size: 0.875rem; color: $c-text-2; }
// 결과지의 대표 결과 — 가장 큰 글씨. 넓은 카드에서는 같은 크기가 작아 보여 한 단계 더 키운다(560px = 매칭도 카드 두 칸 기준과 같다)
.rr__hero-name {
  margin-top: 6px;
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.35;

  @media (min-width: 560px) { font-size: 1.875rem; }  // 2rem 은 아래 구역이 작아 보였다
}
.rr__hero-img { max-width: 55%; max-height: 150px; margin: 16px auto 12px; object-fit: contain; }
.rr__hero-desc { max-width: 380px; margin: 0 auto; font-size: 0.8125rem; line-height: 1.6; color: $c-text-body; }  // 넓은 화면에서 양끝까지 퍼지지 않게 가운데로 모은다(한 줄 약 29자). 모바일은 원래 이보다 좁다

.rr__tags { display: flex; justify-content: center; gap: 6px; margin-top: 14px; }
.rr__tag {
  padding: 4px 12px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;

  &--y { background: #fff3b0; color: $c-gold; border-color: #ffe566; }
  &--s { background: $c-b-tint; color: $c-b-text; border-color: $c-b-line; }
}

.rr__sec {
  margin-top: 14px;
  padding: 24px 20px;
  border-radius: 18px;
  background: #fff;

  &--gray { background: #f5f5f5; }
}

.rr__eyebrow {
  margin-bottom: 8px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 2px;

  &--y { color: $c-gold; }
  &--s { color: $c-b-text; }
  &--g { color: $c-g-text; }
  &--gold { color: $c-gold; }
}

.rr__title { font-size: 1.2rem; font-weight: 800; line-height: 1.35; }
.rr__sub { margin-top: 4px; font-size: 0.85rem; color: $c-text-2; }
.rr__label { margin: 26px 0 10px; font-size: 0.95rem; font-weight: 700; color: $c-text-1; }
.rr__empty { margin-top: 12px; font-size: 0.9rem; color: $c-text-2; }

// 성격 분포
.rr__pd { padding: 12px 0; border-bottom: 1px solid #eceef0; &:last-child { border-bottom: 0; } }
.rr__pd:first-of-type { margin-top: 14px; }
.rr__pd-head { display: grid; grid-template-columns: 100px 1fr 30px; align-items: center; gap: 10px; }  // 이름 칸: 가장 긴 '사회적민감성' + (?) 가 99px
.rr__pd-name {
  position: relative;  // 말풍선(.rr__pd-tip) 기준
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;  // 4~9위 400 은 결과지에서 혼자 가늘어 보였다
  color: $c-text-body;

  &.is-top { font-weight: 800; color: $c-text-1; }
}
// (?) 버튼 — 글씨 크기는 작지만 누르는 영역은 넓힌다(::before 로 사방 8px)
.rr__pd-q {
  position: relative;
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 15px;
  height: 15px;
  padding: 0;
  border: 1px solid #c9ccd1;
  border-radius: 50%;
  background: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: $c-text-3;
  cursor: help;

  &::before { content: ''; position: absolute; inset: -8px; }
  &:hover, &:focus-visible { border-color: $c-text-2; color: $c-text-1; }
}
// 말풍선 — 마우스 기기는 올리면(:hover), 터치 기기는 누르면(.is-open) 보인다.
// :hover 는 (hover: hover) 에서만 건다 — 터치 기기는 :hover 가 붙었다 남는다
.rr__pd-tip {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 5;
  width: 260px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(26, 26, 26, 0.82);  // $c-text-1 반투명 — 꽉 찬 검정은 무거웠다. 뒤 막대가 비쳐도 글씨는 흐려지지 않게 살짝 흐림
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.55;
  color: #fff;
  white-space: normal;

  &.is-open { display: block; }
}
@media (hover: hover) and (pointer: fine) {
  .rr__pd-q:hover + .rr__pd-tip,
  .rr__pd-q:focus-visible + .rr__pd-tip { display: block; }
}
.rr__pd-bar { height: 8px; border-radius: 999px; background: #e9eaed; overflow: hidden; }
.rr__pd-fill { display: block; height: 100%; border-radius: 999px; }
.rr__pd-score { font-size: 0.875rem; font-weight: 500; text-align: right; &.is-top { font-weight: 800; } }  // 4~9위는 이름(500)과 같은 무게
.rr__pd-pct { display: inline-block; margin-top: 6px; font-size: 0.75rem; font-weight: 700; color: $c-gold; }
.rr__pd-desc { margin-top: 4px; font-size: 0.8rem; line-height: 1.55; color: $c-text-2; }

// 재능·가치관 카드
.rr__cards { display: flex; flex-direction: column; gap: 8px; }
.rr__card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1.5px solid #eaeaea;
  border-radius: 14px;
  background: #fff;

  &--p1 { border-color: #ffd100; background: #fffdf0; .rr__rank { background: #ffd100; color: #1a1a1a; } }
  &--p2 { border-color: $c-b-tint; .rr__rank { background: $c-b-tint; color: $c-b-text; } }
  &--p3 .rr__rank { background: #eaeaea; color: $c-text-2; }
}
.rr__rank { flex: none; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; }
.rr__card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.rr__card-name { font-size: 0.95rem; font-weight: 800; }
.rr__card-def { font-size: 0.8rem; line-height: 1.55; color: $c-text-2; }
.rr__card-score { flex: none; font-size: 1rem; font-weight: 800; &.is-hi { color: $c-gold; } &.is-mi { color: $c-b-text; } }
.rr__bar { height: 6px; border-radius: 999px; background: #eaeaea; overflow: hidden; }
.rr__bar-fill { display: block; height: 100%; border-radius: 999px; &.is-hi { background: #ffd100; } &.is-mi { background: $c-b; } }

// 관심 분야
.rr__interest { display: flex; flex-direction: column; gap: 14px; padding: 16px; border: 1px solid $c-b-line; border-radius: 14px; background: $c-b-tint; }
.rr__interest-cat { display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 700; color: $c-b-text; }
.rr__interest-row { display: flex; flex-wrap: wrap; gap: 6px; }
.rr__interest-tag { padding: 4px 10px; border: 1px solid $c-b-line; border-radius: 999px; background: #fff; font-size: 0.8rem; font-weight: 600; color: $c-text-body; }  // 태그는 본문 회색 600 — 500 은 묻히고 검정 700 은 설명보다 튄다

.rr__like {
  padding: 18px;
  border: 1px solid $c-b-line;
  border-radius: 14px;
  background: #fff;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  line-height: 2;
}
// 핵심어만 굵게·파랑 — 이어지는 문장은 500으로 낮춰 핵심어가 먼저 읽히게
.rr__chip { padding: 3px 6px; border-radius: 6px; background: $c-b-tint; color: $c-b-text; font-weight: 700; }

// 업무 환경
.rr__env {
  margin-top: 14px;
  padding: 16px;
  border-radius: 12px;

  &--good { background: $c-g-tint; }
  &--bad, &--neutral { background: $c-alt; }
}
.rr__env-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.95rem; }
// 맞는/안 맞는 표시 — 상자 전체를 칠하지 않고 머리의 작은 원만 색
.rr__env-mk {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 900;
  color: #fff;
  background: #9a9a9a;

  .rr__env--good & { background: $c-g; }
  .rr__env--bad & { background: #e5484d; }
}
.rr__env-text { font-size: 0.875rem; line-height: 1.65; color: $c-text-body; & + & { margin-top: 4px; } }
.rr__we {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  li { padding: 4px 10px; border-radius: 999px; background: #fff; font-size: 0.8rem; font-weight: 600; color: $c-text-body; }
}

// 추천 직업
.rr__job {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid $c-line;
  border-radius: 14px;
}
.rr__job-rank {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 900;
  background: $c-alt;
  color: $c-text-2;

  &--1 { background: $c-pri; color: #1a1a1a; }   // 1위만 강조
}
.rr__job-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.rr__job-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rr__job-title { font-size: 0.95rem; font-weight: 700; line-height: 1.3; }
.rr__job-group { padding: 2px 7px; border-radius: 999px; background: $c-b-tint; font-size: 0.7rem; font-weight: 600; color: $c-b-text; }
.rr__job-score { margin-left: auto; padding: 2px 8px; border-radius: 20px; background: $c-pri-tint; color: $c-gold; font-size: 0.75rem; font-weight: 800; }
.rr__job-class { font-size: 0.72rem; color: $c-text-3; }

.rr__job-bars { padding-top: 3px; }  // 매칭도 카드: 위 해석 줄 → 막대 15px(Top 5 카드는 기본값 그대로)
.rr__cj-field {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);

  ul { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  // 줄마다 연회색 상자 — 글씨만 있을 땐 위 설명에 묻혀 목록으로 안 보였다(2026-10-26)
  li { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; background: $c-alt; font-size: 0.85rem; }
}
.rr__cj-field-h {
  font-size: 0.85rem;
  font-weight: 700;

  span { display: block; margin-top: 5px; font-size: 0.75rem; font-weight: 500; color: $c-text-2; }  // 제목과 설명이 붙어 보이지 않게
}
.rr__cj-field-t { flex: 1; min-width: 0; font-size: 0.8rem; font-weight: 600; color: $c-text-1; }  // 400 검정은 이 카드에서 혼자 튀었다 — 이름은 600, 제목(700)보다 한 단계 작게
.rr__cj-field-r { font-size: 0.75rem; color: $c-text-3; }
.rr__cj-field-s { min-width: 36px; font-size: 0.8rem; font-weight: 700; text-align: right; color: $c-gold; }
.rr__job-members { font-size: 0.75rem; line-height: 1.5; color: $c-text-2; }
.rr__job-bars {
  display: grid;
  grid-template-columns: max-content 1fr 26px;
  align-items: center;
  row-gap: 5px;
  column-gap: 8px;
  margin-top: 6px;
  padding-top: 4px;
}
.rr__jl {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 500;
  color: $c-text-body;  // 본문 회색 — 보조 회색이면 위 분류 줄과 같아 묻혔다. 오른쪽 수치(메타 회색)보다 한 단계 진하게

  &::before { content: ''; flex: none; width: 6px; height: 6px; border-radius: 50%; }
  &--t1::before { background: $c-tri-1; }
  &--t2::before { background: $c-tri-2; }
  &--t3::before { background: $c-tri-3; }
}
.rr__jt { height: 6px; border-radius: 4px; background: $c-alt; overflow: hidden; }
.rr__jf {
  display: block;
  height: 100%;
  border-radius: 4px;

  &--t1 { background: $c-tri-1; }
  &--t2 { background: $c-tri-2; }
  &--t3 { background: $c-tri-3; }
}
.rr__jv {
  font-size: 0.7rem;
  font-weight: 400;  // 라벨(500)보다 한 단계 가볍게 — 숫자는 획이 촘촘해 같은 굵기면 더 진해 보인다
  text-align: right;
  color: $c-text-body;  // 왼쪽 라벨(.rr__jl)과 같은 색 — 라벨·막대·수치를 한 줄로 읽히게
}
.rr__job-meta { margin-top: 6px; padding-top: 6px; border-top: 1px solid $c-line; font-size: 0.72rem; color: $c-text-3; }
// ── 앱 전용 ──────────────────────────────────────────────
// 맞는/안 맞는 표시는 자체 아이콘(원 모양이 이미 들어 있다) — 랜딩의 색 원 + ✓ ! ~ 글자 대신 아이콘에 같은 색
.rr__env-mk {
  width: auto;
  height: auto;
  background: none !important;
  color: #9a9a9a;

  .rr__env--good & { color: $c-g; }
  .rr__env--bad & { color: #e5484d; }
}
// 업무 환경 항목 칩 앞 아이콘
.rr__we li { display: inline-flex; align-items: center; gap: 5px; :deep(.app-icon) { color: $c-text-2; } }
// 추천 직업은 눌러서 진로백과로 간다
.rr__job--link {
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover { border-color: #d6d6d6; }
  &:active { transform: scale(0.99); }
}
.rr__job-top :deep(.gate-badges) { order: 3; flex-basis: 100%; }  // 진입 관문 배지는 다음 줄로 — 한 줄에 두면 긴 직업명이 세로로 꺾였다(2026-10-27)
// 직무 카드(2026-11-09, 시안 '개선안') — 들여쓰기 없이 막대·문장·직업 상자·버튼이 같은 왼쪽 선에서 시작한다
.rr__grp {
  margin-top: 12px;
  padding: 18px 16px 4px;
  border: 1px solid $c-line;
  border-radius: 16px;
  background: #fff;
}
.rr__grp-head { display: flex; align-items: center; gap: 10px; }
.rr__grp-name { font-size: 1.08rem; font-weight: 800; line-height: 1.3; letter-spacing: -0.01em; word-break: keep-all; }
.rr__grp-bars { margin-top: 16px; padding-top: 0; row-gap: 8px; }
// 핵심어는 영역 색의 진한 글씨 — 성격 = 주황, 재능·가치관·관심 = 파랑. 줄 끝에서 '맞아/요'로 끊기지 않게 keep-all
.rr__grp-why { margin-top: 14px; font-size: 0.86rem; font-weight: 500; line-height: 1.6; color: $c-text-body; word-break: keep-all; }
.rr__grp-kw { font-weight: 700; color: $c-b-text; &--t1 { color: #b4532a; } }
.rr__grp-ax { font-weight: 500; color: $c-text-3; }   // '(가치관)' — 핵심어보다 한참 약하게
.rr__grp-jobs { margin-top: 14px; padding: 10px 14px 4px; border-radius: 12px; background: #f6f6f4; }
.rr__grp-label { font-size: 0.7rem; font-weight: 700; color: $c-text-3; }
.rr__grp-list { margin-top: 2px; list-style: none; }
.rr__grp-job {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: $c-text-1;
  text-align: left;
  cursor: pointer;

  &:active { opacity: 0.6; }
}
.rr__grp-job-t { min-width: 0; word-break: keep-all; }
.rr__grp-sim { font-size: 0.72rem; font-weight: 500; color: $c-text-3; white-space: nowrap; }
.rr__grp-chev { margin-left: auto; flex: none; color: #b5b5b5; }
.rr__grp-foot { display: flex; justify-content: space-between; align-items: center; }
.rr__grp-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 12px 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: $c-text-1;
  cursor: pointer;

  &--sub { margin-left: auto; font-weight: 600; color: $c-text-2; }   // 모두 보기가 없는 카드(직업 3개 이하)에서도 오른쪽에
}
.rr__grp-fold { transition: transform 0.15s; &.is-open { transform: rotate(180deg); } }
.rr__grp-alt { margin-top: 18px; text-align: center; font-size: 0.78rem; color: $c-text-3; }
.rr__grp-alt-btn {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: $c-text-2;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.rr__skeletons { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
// 비회원 맛보기(2026-11-11) — 성격 4위부터 흐린 줄, 잠긴 구역 목차, 맨 아래 가입 상자
.rr__blur { filter: blur(4.5px); opacity: 0.5; user-select: none; pointer-events: none; }
.rr__more { position: relative; }
.rr__more-rows { filter: blur(4px); opacity: 0.5; user-select: none; pointer-events: none; }
.rr__more-btn {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 13px;
    border: 1px solid #eee;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    font-size: 0.78rem;
    font-weight: 700;
    color: $c-text-1;
  }
}
.rr__teaser-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 26px 4px 0; }
.rr__teaser-t { font-size: 0.95rem; font-weight: 800; }
.rr__teaser-s { font-size: 0.72rem; color: $c-text-3; }
.rr__teaser {
  display: grid;
  gap: 10px;
  margin-top: 10px;
  padding: 18px 18px 16px;
  border-radius: 18px;
  background: #fff;
  cursor: pointer;

  &--gray { background: #f5f5f5; }
  .rr__eyebrow { margin-bottom: 4px; }
  .rr__env { margin-top: 0; }
}
.rr__teaser-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.rr__teaser-title { font-size: 1.06rem; font-weight: 800; }
.rr__teaser-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #f0f0f0;
  font-size: 0.72rem;
  font-weight: 700;
  color: $c-text-2;
  .rr__teaser--gray & { background: #fff; }
}
.rr__teaser-what { font-size: 0.8125rem; line-height: 1.65; color: $c-text-2; word-break: keep-all; b { font-weight: 700; color: $c-text-1; } }
.rr__teaser-peek { display: grid; gap: 8px; }
.rr__tjob { display: grid; grid-template-columns: 26px 1fr; align-items: start; gap: 10px; padding: 12px; border: 1px solid #eee; border-radius: 12px; }
.rr__tjob-n { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; background: #fff6c2; color: #9a7400; font-size: 0.8rem; font-weight: 800; }
.rr__tjob-name { font-size: 0.9rem; font-weight: 800; line-height: 1.45; word-break: keep-all; }
.rr__tjob-meta { margin-top: 3px; font-size: 0.75rem; color: $c-text-3; }
.rr__teaser--mini { grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; padding: 14px 16px; .rr__teaser-title { font-size: 0.9rem; } .rr__teaser-what { font-size: 0.78rem; } }
.rr__pages {
  display: flex;
  padding-left: 8px;

  i {
    display: grid;
    align-content: start;
    gap: 3px;
    width: 22px;
    height: 30px;
    margin-left: -8px;
    padding: 5px 4px;
    box-sizing: border-box;
    border: 1px solid #e3e3e3;
    border-radius: 3px;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

    &::before, &::after { content: ''; display: block; height: 2px; border-radius: 2px; background: #e9eaed; }
  }
}
.rr__lock { margin-top: 14px; }
.rr__float {
  position: fixed;
  z-index: 50;
  left: 0;
  right: 0;
  bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  padding: 0 max(10px, env(safe-area-inset-right, 0px)) 0 max(10px, env(safe-area-inset-left, 0px));
  pointer-events: none;
}
.rr__float-card {
  display: grid;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
  transform: translateY(calc(100% + 30px));
  opacity: 0;
  visibility: hidden;   // 숨었을 때 버튼에 탭 이동이 가지 않게
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s, visibility 0s 0.3s;
  .rr__float.is-show & { transform: none; opacity: 1; visibility: visible; pointer-events: auto; transition-delay: 0s; }
}
.rr__float-t { display: flex; align-items: center; gap: 6px; padding: 0 2px; font-size: 0.875rem; font-weight: 800; color: $c-text-1; :deep(svg) { color: $c-gold; } }
.rr__float-btns { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 8px; }
@media (prefers-reduced-motion: reduce) { .rr__float-card { transition: none; } }
.rr__lock-save { display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 2px; font-size: 0.8rem; color: $c-text-2; :deep(svg) { color: $c-gold; } }
.rr__lock-email { margin-top: 2px; font-size: 0.8rem; font-weight: 600; color: $c-text-2; text-decoration: underline; text-underline-offset: 3px; }
.rr__skeleton { height: 120px; border-radius: 14px; background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: rr-shimmer 1.4s infinite; }
@keyframes rr-shimmer { to { background-position: -200% 0; } }
</style>
