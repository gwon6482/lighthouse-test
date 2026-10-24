// 🧪 프로토타입 더미 — 진로계획 템플릿의 '단계'(비전공 > 전공 > 이직) 표시 (2026-10-22)
//
// 사용자 원칙: 비전공 단계를 가장 빈틈없이 설계하고, 그 뒤 단계는 대학(전공)·실무(이직)에서 배우는 것을 **빼서** 만든다.
//   → 도우미 예시(helperExamples.mock.ts)마다 '어느 단계까지 필요한가'(upTo)와 빠지는 이유(skip)를 붙였다. 단계는 누적:
//      N = 비전공만 / M = 비전공·전공 / C = 비전공·전공·이직(모두)
//   순서(order 배열 순서) = 실제로 해 나갈 순서. 목록에 없는 예시는 템플릿에 넣지 않는다(목표와 단계가 다르거나 직종 연결 오류 산물).
// ⚠️ 표시는 사람이 붙인 더미다(Gemini 크레딧 소진으로 생성 불가였음). 실제 데이터는 lighthouse-api
//    scripts/plan-templates-generate.js(같은 원칙의 LLM 생성)로 만든다.
// '이직' = 이 직업과 **관련된 분야에서 일해 본 사람**으로 해석했다.

export type StageKey = 'nonmajor' | 'major' | 'career'
export type UpTo = 'N' | 'M' | 'C'

export interface StageItem {
  id: string           // helperExamples.mock.ts 의 예시 id
  upTo: UpTo
  skip?: string        // 빠지는 단계에서 보여줄 이유
}

export interface JobStagePlan {
  order: StageItem[]
  notes?: Partial<Record<StageKey, string>>   // 단계별 안내(자격 요건 등)
}

export const PLAN_STAGES_MOCK: Record<string, JobStagePlan> = {
  // 회계사무원
  '027101': {
    order: [
      { id: '027101-knowledge-1', upTo: 'M', skip: '경리·회계 실무에서 4대보험 신고를 직접 처리하며 익혀요' },
      { id: '027101-knowledge-2', upTo: 'M', skip: '원천세·연말정산은 실무에서 매년 반복해요' },
      { id: '027101-knowledge-3', upTo: 'N', skip: '세무회계 전공 과목(부가가치세법)에서 배워요' },
      { id: '027101-knowledge-4', upTo: 'N', skip: '전공 과목(법인세법·세무회계)에서 배워요' },
      { id: '027101-skill-2', upTo: 'N', skip: '대학 과제·보고서로 충분히 익혀요' },
      { id: '027101-skill-1', upTo: 'N', skip: '전공 수업과 과제에서 익혀요' },
      { id: '027101-qualification-1', upTo: 'N', skip: '전공 기초 수준이라 1급부터 시작해도 돼요' },
      { id: '027101-qualification-2', upTo: 'M', skip: '실무 경력이 있으면 상위 자격(전산세무)으로 바로 가요' },
      { id: '027101-skill-3', upTo: 'M', skip: '실무에서 회계프로그램을 매일 써요' },
      { id: '027101-skill-4', upTo: 'M', skip: '실무에서 회계프로그램을 매일 써요' },
      { id: '027101-qualification-3', upTo: 'C' },
      { id: '027101-portfolio-1', upTo: 'M', skip: '실제 급여 업무 경험으로 대신해요' },
      { id: '027101-portfolio-2', upTo: 'M', skip: '실제 결산 경험으로 대신해요' },
      { id: '027101-portfolio-3', upTo: 'M', skip: '부가세 신고 실무 경험으로 대신해요' },
      { id: '027101-qualification-4', upTo: 'C' },
      { id: '027101-portfolio-4', upTo: 'C' },
      { id: '027101-experience-1', upTo: 'M', skip: '실무 경력으로 대신해요' },  // 🧪 시안: 실무경험
    ],
  },

  // 응용소프트웨어개발자
  '133201': {
    order: [
      { id: '133201-knowledge-1', upTo: 'N', skip: '컴퓨터공학 전공 필수 과목(컴퓨터구조)이에요' },
      { id: '133201-knowledge-2', upTo: 'N', skip: '전공 필수 과목(자료구조)이에요' },
      { id: '133201-skill-3', upTo: 'N', skip: '전공 프로그래밍 수업에서 배워요' },
      { id: '133201-skill-1', upTo: 'M', skip: '현업에서 매일 쓰며 익혀요' },
      { id: '133201-knowledge-3', upTo: 'N', skip: '전공 필수 과목(운영체제)이에요' },
      { id: '133201-knowledge-4', upTo: 'N', skip: '전공 과목(데이터베이스·소프트웨어공학)이에요' },
      { id: '133201-skill-2', upTo: 'M', skip: '현업 데이터 작업으로 익혀요' },
      { id: '133201-skill-4', upTo: 'N', skip: '전공 객체지향 프로그래밍 과목에서 배워요' },
      { id: '133201-qualification-1', upTo: 'N', skip: '전공자는 졸업(예정)으로 정보처리기사 응시 자격이 있어 바로 기사로 가요' },
      { id: '133201-portfolio-1', upTo: 'N', skip: '전공 과제·졸업작품으로 비슷한 결과물이 있어요' },
      { id: '133201-portfolio-2', upTo: 'N', skip: '전공 과제·졸업작품으로 비슷한 결과물이 있어요' },
      { id: '133201-qualification-2', upTo: 'M', skip: '서버 운영 실무 경험으로 대신해요' },
      { id: '133201-qualification-3', upTo: 'N', skip: '전공자는 산업기사를 건너뛰고 기사로 가요' },
      { id: '133201-portfolio-3', upTo: 'M', skip: '실무 프로젝트 경력으로 대신해요' },
      { id: '133201-qualification-4', upTo: 'C' },
      { id: '133201-portfolio-4', upTo: 'C' },
      { id: '133201-experience-1', upTo: 'M', skip: '관련 경력이 있으면 실무 경험으로 대신해요' },  // 🧪 시안: 실무경험
    ],
  },

  // 사회복지사
  '231101': {
    order: [
      { id: '231101-knowledge-1', upTo: 'N', skip: '사회복지학 전공 과목(사회복지개론)이에요' },
      { id: '231101-knowledge-2', upTo: 'N', skip: '전공 필수 과목(사회복지실천론·기술론)이에요' },
      { id: '231101-knowledge-3', upTo: 'N', skip: '전공 과목(노인·아동복지론)이에요' },
      { id: '231101-knowledge-4', upTo: 'N', skip: '전공 과목(사회복지행정론)이에요' },
      { id: '231101-qualification-2', upTo: 'N', skip: '사회복지학과를 졸업하면 2급 자격 요건을 갖춰요' },
      { id: '231101-experience-1', upTo: 'N', skip: '전공 과정에 현장실습(120시간)이 들어 있어요' },
      { id: '231101-skill-1', upTo: 'N', skip: '대학 과제·보고서로 충분히 익혀요' },
      { id: '231101-skill-2', upTo: 'N', skip: '대학 과제로 익혀요' },
      { id: '231101-qualification-1', upTo: 'M', skip: '기관 행정 실무 경험으로 대신해요' },
      { id: '231101-skill-3', upTo: 'M', skip: '현장에서 희망이음을 쓰며 익혀요' },
      { id: '231101-skill-4', upTo: 'M', skip: '현장에서 케어포를 쓰며 익혀요' },
      { id: '231101-portfolio-1', upTo: 'M', skip: '현장 기록 업무 경력으로 대신해요' },
      { id: '231101-portfolio-2', upTo: 'M', skip: '실제 보호자 상담 경력으로 대신해요' },
      { id: '231101-portfolio-3', upTo: 'C' },
      { id: '231101-qualification-4', upTo: 'C' },
      { id: '231101-qualification-3', upTo: 'C' },
    ],
    notes: {
      nonmajor: '사회복지사 2급은 정해진 교과목(학점)과 현장실습을 이수해야 받을 수 있어요. 비전공자는 학점은행제 등으로 교과목을 채우는 과정이 함께 필요해요.',
    },
  },

  // 간호사 — 간호조무사(하위 자격)·조산사(간호사 이후 단계)는 넣지 않는다
  '304004': {
    order: [
      { id: '304004-knowledge-1', upTo: 'N', skip: '간호학과 전공 과목(간호와 의사소통)이에요' },
      { id: '304004-knowledge-2', upTo: 'N', skip: '전공 과목(환자안전·감염관리)이에요' },
      { id: '304004-knowledge-3', upTo: 'N', skip: '전공 과목(약리학)이에요' },
      { id: '304004-knowledge-4', upTo: 'N', skip: '전공 과목(정신간호학·간호와 상담)이에요' },
      { id: '304004-qualification-2', upTo: 'M', skip: '이미 면허가 있는 경력 간호사는 필요 없어요' },
      { id: '304004-skill-1', upTo: 'N', skip: '임상실습에서 간호기록을 쓰며 익혀요' },
      { id: '304004-skill-3', upTo: 'N', skip: '임상실습에서 간호일지를 쓰며 익혀요' },
      { id: '304004-skill-2', upTo: 'M', skip: '요양·의료기관 근무에서 익혀요' },
      { id: '304004-skill-4', upTo: 'M', skip: '요양·의료기관 근무에서 익혀요' },
      { id: '304004-portfolio-1', upTo: 'N', skip: '임상실습 교육자료 과제로 비슷한 결과물이 있어요' },
      { id: '304004-portfolio-3', upTo: 'N', skip: '임상실습 케이스 스터디로 해요' },
      { id: '304004-qualification-3', upTo: 'M', skip: '이미 면허가 있는 경력 간호사는 필요 없어요' },
      { id: '304004-portfolio-2', upTo: 'M', skip: '현장 근무 경력으로 대신해요' },
      { id: '304004-portfolio-4', upTo: 'C' },
      { id: '304004-experience-1', upTo: 'M', skip: '임상 경력으로 대신해요' },  // 🧪 시안: 실무경험
    ],
    notes: {
      nonmajor: '간호사 면허는 간호학과(3·4년제)를 졸업해야 국가시험을 볼 수 있어요. 이 계획은 진학을 준비하거나 재학 중에 함께 하는 용도예요.',
      career: '면허가 있는 경력 간호사는 준비보다 옮기려는 분야에 맞춘 결과물이 중심이에요.',
    },
  },

  // 광고·홍보·마케팅전문가 — 워드프로세서·거래처 관리표는 직종 연결 오류(영업·마케팅 사무원 공고)에서 나온 것이라 뺐다
  '024101': {
    order: [
      { id: '024101-knowledge-1', upTo: 'N', skip: '경영·광고홍보 전공 과목(마케팅원론)이에요' },
      { id: '024101-knowledge-2', upTo: 'N', skip: '전공 과목(커뮤니케이션·미디어론)이에요' },
      { id: '024101-knowledge-3', upTo: 'N', skip: '전공 과목(소비자행동론)이에요' },
      { id: '024101-knowledge-4', upTo: 'N', skip: '전공 과목(경영학원론)이에요' },
      { id: '024101-skill-1', upTo: 'N', skip: '대학 과제·보고서로 충분히 익혀요' },
      { id: '024101-skill-2', upTo: 'N', skip: '대학 발표 과제로 충분히 익혀요' },
      { id: '024101-skill-3', upTo: 'N', skip: '대학 과제로 익혀요' },
      { id: '024101-skill-4', upTo: 'M', skip: '실무 디자인 작업으로 익혀요' },
      { id: '024101-portfolio-1', upTo: 'M', skip: '실무 기획서 작성 경력으로 대신해요' },
      { id: '024101-portfolio-2', upTo: 'C' },
      { id: '024101-portfolio-4', upTo: 'C' },
      { id: '024101-experience-1', upTo: 'M', skip: '마케팅 실무 경력으로 대신해요' },  // 🧪 시안: 실무경험
    ],
  },
}
