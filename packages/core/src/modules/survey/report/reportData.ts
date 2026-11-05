/**
 * PDF 결과지가 받는 데이터 — 랜딩 연구 설문 결과(`GET /api/survey/research/result`)와 **같은 모양**이다.
 * 앱은 분석(`/api/survey/analysis/:id`)과 종합 추천(`/api/job/recommend/:id`)을 따로 받는데,
 * 서버가 두 응답을 연구 설문과 같은 함수(buildSurveyAnalysis · runRecommend)로 만들어 그대로 끼워 맞춘다.
 * (양식 코드는 랜딩 components/survey/report 의 사본 — 이름도 그대로 둔다)
 */
import type { CurrentJob } from './currentJobMatch'

export interface ResearchResultData {
  /** 응답 번호 — 앱은 survey_id */
  respondent_id: string
  /** 검사일(제출 시각). 없으면 칸을 숨긴다 */
  completed_at?: string
  analysis: any
  recommend: any[]
  /** 연구 설문 실무자 전용 — 앱은 늘 null */
  currentJob?: CurrentJob | null
  reviewSubmitted?: boolean | null
}
