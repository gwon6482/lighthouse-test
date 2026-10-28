// 직업 진입 관문 데이터 — 🧪 시안용 정적 데이터(2026-10-27 사용자 검토 완료본)
// 출처: lighthouse-api data/job-gates/jobGates.draft.json (고용24 '되는 길' 문장을 읽어 붙인 조건)
// ⚠️ 평가 후 서버(job_info)로 옮기면 이 파일을 지우고 useJobGate 의 출처만 바꾼다
import type { JobGate } from './gateBadges'

export const GATE_CHECKED_AT = '2026-10-27'

export const JOB_GATES: Record<string, JobGate> = {
 "012401": {
  "title": "금융관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "금융관리자는 해당 분야 대학졸업 이상의 학력과 실무자로서의 충분한 업무 경력이 있어야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "016101": {
  "title": "건설·채굴관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "건설 및 광업관련 관리자 대부분은 사원으로 입사하여 경험과 기술을 습득하고 승진을 통해 관리자가 된다",
  "source": "고용24 직업정보(되는 길)"
 },
 "015201": {
  "title": "운송관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "운송관련관리자는 해당 분야 대학졸업 이상의 학력과 실무자로서의 충분한 업무경력이 필요하다",
  "source": "고용24 직업정보(되는 길)"
 },
 "012201": {
  "title": "경영지원관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "주로 경영지원, 일반행정 관련 부서의 사무원으로 일하다가 경력을 쌓아 승진해서 관리자가 되는 경우가 많다",
  "source": "고용24 직업정보(되는 길)"
 },
 "015101": {
  "title": "영업·판매관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "영업·판매관리자는 경영·경제, 사회과학, 전기·전자 전공자들이 많으며, 다른 부서관리자에 비해 고졸 및 전문대 졸업자들도 많은 편이다",
  "source": "고용24 직업정보(되는 길)"
 },
 "013601": {
  "title": "예술·디자인·방송관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "방송, 언론, 영상, 광고, 영화, 공연 관련 분야에서 경력을 쌓아 관리자로 승진하거나 스카우트 되는 경우가 많다",
  "source": "고용24 직업정보(되는 길)"
 },
 "013701": {
  "title": "정보통신관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "정보통신관련관리자는 해당 분야 대학졸업 이상의 학력과 실무자로서의 충분한 업무 경력이 있어야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "014301": {
  "title": "경비·청소관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "부서관리자는 부서의 성격에 따른 해당 분야 대학졸업 이상의 학력과 실무자로서의 충분한 업무경력이 요구된다",
  "source": "고용24 직업정보(되는 길)"
 },
 "016201": {
  "title": "전기·가스·수도관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "주로 전기, 가스, 수도 관련 공기업(민영화 기업 포함)에서 경영 및 사업 부서 내 업무를 수행하다가 경력을 쌓아 승진해서 관리자가 되는 경우가 많다",
  "source": "고용24 직업정보(되는 길)"
 },
 "016301": {
  "title": "제조·생산관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "제조·생산관리자는 해당 제조업체에서의 경력을 쌓아 승진을 통해 관리자가 되는 경우가 많다",
  "source": "고용24 직업정보(되는 길)"
 },
 "011201": {
  "title": "기업고위임원",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "기업고위임원에게 특별히 요구되는 학력, 자격은 없지만 일반적으로 대학 이상의 학력 소지자가 대부분이고 사업체의 성격에 따라 해당 분야의 석사 또는 박사학위, 기술사 또는 기타 전문자격증이나 면허가 요구되기도 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "012402": {
  "title": "보험관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "보험관리자는 보험분야에서의 근무경험을 토대로 팀장, 영업소장, 국장(지점장) 등으로 승진하여 관리자가 된다",
  "source": "고용24 직업정보(되는 길)"
 },
 "013401": {
  "title": "보건·의료관리자",
  "badges": [
   "senior"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사원으로 입사해 경력을 쌓고 승진해서 된다(통상 20년 안팎)",
  "evidence": "병원이나 보건소 등의 보건 및 의료서비스를 제공하는 기관 내에서 진단, 처치, 간호 및 치료 등의 건강관리 서비스를 기획, 지휘, 조정하는 보건의료관리자가 되려면 의료현장에서 의료인으로 종사하다가 관리자로 승진하는 경우가 있고 또한 병원의 행정업무를 담당하다가 관리 업무를 수행하는 경우가 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "011102": {
  "title": "행정부고위공무원",
  "badges": [
   "senior",
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "공무원 공채(또는 5급 공채) 합격 후 승진",
  "evidence": "행정부고위공무원이 되기 위한 방법으로는 공무원 공개채용시험에 합격하여 승진경로를 밟거나 특별채용되는 방법이 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "012101": {
  "title": "정부행정관리자",
  "badges": [
   "senior",
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "공무원 공채(또는 5급 공채) 합격 후 승진",
  "evidence": "정부행정관리자가 되려면 공무원 시험에 합격하거나 특별채용이 되어야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "013305": {
  "title": "경찰·소방·교도관리자",
  "badges": [
   "senior",
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [
    "fitness"
   ],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "경찰·소방·교정직 공채 또는 간부후보생 선발 후 승진",
  "evidence": "먼저 경찰간부후보생의 경우는 경찰간부후보생시험에 합격하여 경찰종합학교에서 1년간 소정의 교육을 이수하면 된다",
  "source": "고용24 직업정보(되는 길)"
 },
 "013501": {
  "title": "사회복지관리자",
  "badges": [
   "senior",
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "사회복지사 자격 + 현장 경력 후 관리자",
  "evidence": "사회복지관련관리자가 되기 위해서는 일반적으로 사회복지사 자격증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "013201": {
  "title": "유치원 원장 및 원감",
  "badges": [
   "senior",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": true,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "유치원 정교사 1급 + 교육경력 3년 이상 + 연수",
  "evidence": "유치원의 원감이 되려면 유치원 정교사 1급 자격증과 3년 이상의 교육경력이 있는자가 시도교육청의 교육연수를 받고 자격증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "021001": {
  "title": "정부·공공행정전문가",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "대부분 공무원 신분 — 5급 공채(행정고시)가 현실적 경로",
  "evidence": "정부정책기획전문가가는 민간인 신분 중 탁월한 업적이나 전문성이 있는 사람을 채용하기도 하지만 대부분 공무원 신분으로 중앙부처에 근무한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "025401": {
  "title": "일반행정공무원",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "국가·지방 공무원 공개경쟁채용시험 합격",
  "evidence": "일반행정공무원은 각종 행정업무를 정확하고 꼼꼼하게 처리할 수 있어야 하며, 담당 직무에 대한 관련 법규의 지식도 필요하다",
  "source": "고용24 직업정보(되는 길)"
 },
 "025201": {
  "title": "관세행정사무원",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "국가·지방 공무원 공채 합격",
  "evidence": "관세행정은 국가가 담당하므로 관세행정사무원이 되려면 관세청 등의 채용공고를 보고 지원해서 공무원 시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "025301": {
  "title": "병무행정사무원",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "국가·지방 공무원 공채 합격",
  "evidence": "국가공무원을 선발할 때 지원 후 합격해서 병무청에 배치되어야 병무행정사무원이 될 수 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "025101": {
  "title": "조세행정사무원",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "세무직 공무원 공개경쟁채용시험 합격. 응시 나이 상한은 없어요(만 18세 이상)",
  "evidence": "응시자격을 보면 국가직 공무원은 만 18세이상 ∼ 만 28세 이하이어야 하며 지방직 공무원은 만 18세이상 ∼ 만 32세 이하 (서울은 만 30세 이하) 이어야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "025402": {
  "title": "법원공무원",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "법원직 공무원 공개경쟁채용시험 합격",
  "evidence": "법률관련사무원이 되기 위해서는 특별한 자격증을 취득하거나 국가시험을 치루지 않아도 된다",
  "source": "고용24 직업정보(되는 길)"
 },
 "240301": {
  "title": "교도관",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [
    "fitness",
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "교정직 공채 — 필기 후 체력검사",
  "evidence": "교도관이 되기 위해서는 일반적으로 국가직 공무원 채용시험이나 특별채용 시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "240101": {
  "title": "경찰관",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [
    "fitness",
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "경찰 공채(순경·간부후보) — 체력·신체검사",
  "evidence": "경찰관이 되기 위해서는 4년제 경찰행정학과를 졸업하고 순경 공개채용에 합격하면 일정 교육이수 후 순경으로 일할 수 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "240201": {
  "title": "소방관",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [
    "fitness",
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "소방 공채·간부후보생 — 체력·신체검사",
  "evidence": "소방관이 되기 위해서는 소방직공무원 공개채용시험이나 소방간부후보생 선발시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "240102": {
  "title": "해양경찰관",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [
    "fitness",
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "해양경찰 공채 — 체력·신체 기준, 분야별 연령 기준",
  "evidence": "해양경찰관이 되기 위해서는 해양경찰청 소속 경찰공무원 시험에 합격해야한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "250301": {
  "title": "부사관",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [
    "fitness",
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "서류·면접·체력평가·신체검사 선발 후 교육훈련",
  "evidence": "부사관은 대체로 고등학교 졸업 이상의 학력을 갖춘 18세 이상~29세 미만의 대한민국 국민이면 지원가능하다",
  "source": "고용24 직업정보(되는 길)"
 },
 "250201": {
  "title": "위관급 장교",
  "badges": [
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [
    "fitness",
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "사관학교·ROTC·학사장교 등 선발 + 체력·신체검사",
  "evidence": "위관급 장교는 대체로 4년제 대학 졸업 이상의 학력을 갖춘 20세이상~29세 미만의 대한민국 국민이면 지원이 가능하다",
  "source": "고용24 직업정보(되는 길)"
 },
 "221201": {
  "title": "변호사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "graduate",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "법학전문대학원(로스쿨, LEET로 입학) 3년 → 변호사시험(졸업 후 5년 내 5회)",
  "evidence": "일반 4년제 대학 이상의 학력을 소지한 사람이 LEET(법학적성시험), 학부성적(GPA), 외국어\n시험, 사회봉사활동 및 면접 등 다양한 평가를 거쳐야만 법학전문대학원에 입학할 수 있으며, 3년 과정을 이수하고 변호사시험에 합격하여야 변호사 자격이 주어진다",
  "source": "고용24 직업정보(되는 길)"
 },
 "221102": {
  "title": "검사",
  "badges": [
   "degree",
   "selection"
  ],
  "conditions": {
   "education": "graduate",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "로스쿨 → 변호사시험 → 검사 임용 선발",
  "evidence": "검사가 되기 위해서는 변호사 자격이 있는 사람이나 사법시험에 합격하여\n 사법연수원 과정을 마친 후 임명되어야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "221101": {
  "title": "판사",
  "badges": [
   "senior",
   "degree"
  ],
  "conditions": {
   "education": "graduate",
   "training": "none",
   "exam": "none",
   "experience": true,
   "other": [],
   "entry": "senior"
  },
  "weight": "heavy",
  "note": "변호사 자격 + 법조 경력(2026년부터 10년) 후 임용",
  "evidence": "판사가 되기 위해서는 변호사 자격 취득 후 일정기간 이상의 법조 경력이 있는 사람 중 임명된다",
  "source": "고용24 직업정보(되는 길)"
 },
 "023201": {
  "title": "세무사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "세무사시험 → 실무수습 6개월 → 등록",
  "evidence": "세무사가 되기 위해서는 세무사시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "022201": {
  "title": "노무사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "공인노무사시험(정원 선발에 가까움)",
  "evidence": "노무사가 되기 위해서는 고용노동부가 주관하는 노무사시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "023401": {
  "title": "감정평가사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "감정평가사시험 → 실무수습 1년 → 등록",
  "evidence": "감정평가사가 되려면 국토교통부에서 주관하고 한국산업인력공단에서 시행하는 감정평가사시험(제1차, 제2차)에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "023301": {
  "title": "관세사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "관세사시험",
  "evidence": "관세사가 되기 위해서는 관세사 시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "221401": {
  "title": "변리사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "변리사시험 → 실무수습(집합 250시간 + 현장 6개월)",
  "evidence": "특허청 소속 공무원으로 일정기간 이상 특허행정사무에 종사한 경력이 있는 경우에는 제1차 시험을 면제하고, 제2차시험의 일부과목을 면제받을 수 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "031501": {
  "title": "손해사정사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "손해사정사시험 → 실무수습 6개월 → 등록",
  "evidence": "손해사정사가 되기 위해서는 금융감독원에서 주관하는 손해사정사 시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "029903": {
  "title": "행정사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "행정사 국가자격(일반·해사·외국어번역)",
  "evidence": "행정사가 되기 위해서는 행정사 국가자격을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "221301": {
  "title": "법무사 및 집행관",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "법무사시험(일반 응시 선발 인원 고정)",
  "evidence": "법무사법에 의해 법원, 헌법재판소, 검찰청 등 관련 공무원으로 10년 이상 근무한 경력이 있거나, 관련 공무원으로 일정 기간 이상 근무한 경력이 있는 자는 제1차 시험 면제와 2차 시험의 일부 과목을 면제받을 수 있으며, 제1차 시험에 합격한 경우 다음 회의 시험에 한해 제1차 시험을 면제받을 수 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "611001": {
  "title": "부동산중개인",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "공인중개사시험 → 실무교육 → 개설 등록",
  "evidence": "부동산중개인이 되기 위해서는 국토교통부의 주관으로 한국산업인력공단이 매년 시행하는 공인중개사 시험에 합격하여 자격을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "023101": {
  "title": "회계사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "공인회계사시험(영어 점수 + 1·2차) → 실무수습 → 등록. 회계·경영 관련 학점 이수 요건도 있음",
  "evidence": "회계사가 되기 위해서는 금융감독원에서 시행하는 회계사 자격시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "033202": {
  "title": "보험모집인",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "보험설계사 자격시험 → 연수 → 등록",
  "evidence": "보험중개사(보험개발원), 변액보험판매관리사(금융연수원), 보험설계사(생명보험협회), 등의 자격을 취득하면 업무에 도움이 된다",
  "source": "고용24 직업정보(되는 길)"
 },
 "413102": {
  "title": "문화재보존원",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "국가지정문화재 수리는 문화재수리기술자·기능자 자격 필요(그 외 업무는 아님)",
  "evidence": "국가지정문화재의 보수 및 수리 업무를 하기 위해서는 문화재청에서 시행하는 문화재수리기술자 및 기능자 자격시험에 응시하여 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301101": {
  "title": "내과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301109": {
  "title": "방사선과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301108": {
  "title": "소아청소년과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301102": {
  "title": "외과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301104": {
  "title": "산부인과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301107": {
  "title": "정신과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301106": {
  "title": "안과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301103": {
  "title": "성형외과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301105": {
  "title": "이비인후과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301112": {
  "title": "피부과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301110": {
  "title": "마취병리과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301113": {
  "title": "가정의학과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301111": {
  "title": "비뇨기과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "residency",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험. 전문의는 인턴 1년 + 레지던트 3~4년 + 전문의 시험이 더 필요",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301201": {
  "title": "일반의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의대(6년) 또는 의전원 → 의사 국가시험",
  "evidence": "의사가 되려면 의과대학을 졸업한 후, 의사국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301401": {
  "title": "치과의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "치대(또는 치전원) → 치과의사 국가시험. 전문의는 수련 4년 추가",
  "evidence": "치과의사가 되려면 치과대학 졸업 후에 치과의사 국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "301301": {
  "title": "한의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "한의대(또는 한의전) → 한의사 국가시험. 전문의는 수련 4년 추가",
  "evidence": "한의사가 되기 위해서는 한의과대학이나 한의학전문대학원을 졸업한 후에 보건의료인 국가시험원의 한의사 면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "303001": {
  "title": "약사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "약학대학(6년제) → 약사 국가시험",
  "evidence": "약사가 되기 위해서는 대학의 약학과를 졸업하고 보건의료인 국가시험원의 약사면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "302001": {
  "title": "수의사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "수의대(예과 2 + 본과 4) → 수의사 국가시험",
  "evidence": "1~2학년에는 수의예과에서 기본적 교양과 수의학 공부에 필요한 기초 지식을 습득해야 하며, 수의본과에서 4년간 본격적으로 수의학을 공부한 후 수의사 국가시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "304004": {
  "title": "간호사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "간호학과(3·4년제) → 간호사 국가시험",
  "evidence": "간호사가 되려면 정규대학 간호학과(4년제)나 간호전문대학(3년제)의 간호학과를 졸업하고 간호사 국가시험을 통해 간호사 면허증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306301": {
  "title": "치과기공사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "치기공학과 → 면허시험",
  "evidence": "치과기공사가 되기 위해서는 4년제 대학교 혹은 전문대학의 치기공학과를 졸업하고 치과기공사 면허시험에 합격하여야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "307401": {
  "title": "보건의료정보관리사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "보건의료정보 관련 학과 → 국가시험",
  "evidence": "의무기록사가 되기 위해서는 의무기록 관련 학과를 졸업하고 의무기록사 국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306901": {
  "title": "언어치료사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "언어재활 관련 학과 → 언어재활사 국가시험",
  "evidence": "언어치료사가 되기 위해서는 언어재활 관련학과(언어치료, 언어병리, 또는 언어재활이 포함된 학과)를 졸업하고 한국보건의료인국가시험원의 언어재활사 면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "307301": {
  "title": "안경사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "안경광학과 → 국가시험",
  "evidence": "안경사가 되기 위해서는 전문대학 및 대학교에 개설되어 있는 안경광학과를 졸업하고 안경사 국가면허 시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306201": {
  "title": "방사선사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "방사선학과 → 국가시험",
  "evidence": "방사선사가 되기 위해서는 4년제 대학교 혹은 전문대학교의 방사선학과를 졸업하고 방사선사 국가면허 시험에 합격하여야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306101": {
  "title": "임상병리사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "임상병리학과 → 국가시험",
  "evidence": "임상병리사가 되기 위해서는 4년제 대학교 혹은 전문대학교의 임상병리학과를 졸업하고 임상병리사 국가면허 시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306501": {
  "title": "물리치료사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "물리치료학과 → 국가시험",
  "evidence": "물리치료사가 되기 위해서는 전문대학 및 대학교에 개설되어 있는 물리치료(학)과를 졸업하고 물리치료사 국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "303002": {
  "title": "한약사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "한약학과 → 국가시험",
  "evidence": "한약사가 되기 위해서는 대학의 한약학과를 졸업하고 한약사 국가면허시험에 합격하여야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306701": {
  "title": "재활공학기사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "의료보장구 관련 학과 → 의지·보조기기사 국가시험",
  "evidence": "재활공학기사가 되기 위해서는 의료보장구학과 등 관련학과를 전공하여 한국보건의료인국가시험원에서 실시하는 의지보조기기사 시험에 합격해야만 활동할 수 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306502": {
  "title": "작업치료사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "작업치료학과 → 국가시험",
  "evidence": "작업치료사가 되기 위해서는 전문대학 및 대학교에 개설되어 있는 작업치료(학)과를 졸업하고 작업치료사 국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "306401": {
  "title": "치과위생사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "치위생학과 → 국가시험",
  "evidence": "치과위생사가 되기 위해서는 4년제 대학교와 전문대학교에서 치과위생학과를 졸업한 후 치위생사 국가면허시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "305001": {
  "title": "영양사",
  "badges": [
   "degree",
   "license"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "식품·영양 전공(지정 과목·학점 + 현장실습) → 영양사 국가시험",
  "evidence": "영양사가 되귀 위해서는 전문대학(2~3년제) 및 대학교에서 식품학 또는 영양학을 전공하고 식품영양관련 과목을 이수(최소 18과목, 52학점 이상)한 뒤 영양사 현장 실습을 마친 후 영양사 국가시험에 합격해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "413202": {
  "title": "기록물관리사",
  "badges": [
   "degree"
  ],
  "conditions": {
   "education": "graduate",
   "training": "designated",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "공공기관은 법으로 기록물관리학 석사(또는 역사·문헌정보 학사 + 지정 교육과정) 요구. 민간은 아님",
  "evidence": "기록물관리 전문인력 양성과 지원을 위한 ‘공공기관의 기록물관리에 관한 법률’ 시행으로 공공기관의 기록물관리사로 활동하기 위해서는 기록물관리학석사학위 이상, 혹은 역사학 또는 문헌정보학의 경우 학사학위 이상을 취득하고 행정자치부령으로 정하는 기록물관리학 교육과정을 이수해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "212101": {
  "title": "중·고등학교교사",
  "badges": [
   "degree",
   "selection"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "교원자격(사범대·교직 이수·교육대학원) 필요. 공립은 임용시험, 사립은 학교별 선발",
  "evidence": "중고등학교교사가 되기 위해서는 대학교의 사범계열 학과를 졸업하거나 비사범계열 학과에서 교직 과목을 이수하여 중등학교 2급 정교사 자격을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "212301": {
  "title": "특수교육교사",
  "badges": [
   "degree",
   "selection"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "특수교육 관련 학과·교육대학원 → 특수교사 자격. 공립은 임용시험",
  "evidence": "특수교사가 되기 위해서는 4년제 대학의 특수교육 관련 학과나 교육대학원 특수교육전공, 특수교육대학원 등을 졸업하여야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "304003": {
  "title": "보건교사",
  "badges": [
   "degree",
   "selection"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "간호학과 + 교직 이수(간호사 면허·보건교사 자격) → 공립은 임용시험",
  "evidence": "간호사가 되려면 정규대학 간호학과(4년제)나 간호전문대학(3년제)의 간호학과를 졸업하고 간호사 국가시험을 통해 간호사 면허증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "212201": {
  "title": "초등학교교사",
  "badges": [
   "degree",
   "selection"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "교육대학(또는 초등교육과) → 초등 정교사 자격 → 공립은 임용시험",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "213001": {
  "title": "유치원교사",
  "badges": [
   "degree",
   "selection"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "유아교육과 → 유치원 정교사 자격 → 공립은 임용시험, 사립은 기관별",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "231101": {
  "title": "사회복지사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "지정 교과목·현장실습 이수로 2급, 1급은 국가시험(학점은행제 가능)",
  "evidence": "사회복지가사 되기 위해서는 대학에서 사회복지학을 전공하거나, 학점은행제, 평생교육원 등에서 필요한 수업을 이수하여 자격을 취득하여야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "232101": {
  "title": "보육교사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "보육 관련 지정 교과목(17과목 51학점) 또는 보육교사교육원 이수 → 자격",
  "evidence": "보육교사가 되기 위해서는 대학에서 보건복지부령으로 정하는 보육 관련 교과목(17과목, 51학점)을 대학에서 이수하거나 대학원 또는 보육교사 관련 교육훈련시설(보육교사교육원)의 과정을 이수하여 보육교사 자격증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "307501": {
  "title": "간호조무사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "지정 교육기관(학원) 이수 → 국가시험",
  "evidence": "간호조무사가 되기 위해서는 간호조무사 자격증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "307101": {
  "title": "응급구조사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "응급구조학과 또는 양성기관 과정 → 국가시험",
  "evidence": "응급구조사가 되기 위해서는 전문대학이나 대학에서 응급구조학을 전공하거나 응급구조사 양성기관에서 개설하는 과정을 이수해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "307601": {
  "title": "안마사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "none",
   "experience": false,
   "other": [
    "eligibility"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "시각장애인만 자격 가능(법정) — 지정 기관 2년 교육",
  "evidence": "안마사가 되기 위해서는 안마사 자격을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "413201": {
  "title": "사서",
  "badges": [
   "license",
   "selection"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "selection",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "문헌정보학과·사서교육원 이수 → 사서 자격. 공공도서관은 사서직 공무원 시험, 공립학교 사서교사는 임용",
  "evidence": "사서가 되기 위해서는 전문대학, 대학 및 사서교육원 등에서 관련 교육을 이수하고 사서자격증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "231301": {
  "title": "청소년지도사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "청소년지도사 자격시험(급수별 학력·경력 응시 요건)",
  "evidence": "2급은 청소년관련 분야 학사 학위 취득자 및 전문대학 졸업자로 실무경력이 3년 이상인 자, 그리고 3급은 청소년관련 분야의 전문대학 학위 취득자 및 고등학교 졸업자로 실무경력이 3년 이상인 자 등이 시험에 응시할 수 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "511201": {
  "title": "미용사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "미용사(일반) 국가기술자격 — 없으면 영업할 수 없음",
  "evidence": "미용사로 종사하기 위해서는 공중위생법상 미용사 자격을 취득해야 하므로 관련 기술과 이론을 배우고 자격증을 취득하는 것이 필요하다",
  "source": "고용24 직업정보(되는 길)"
 },
 "511101": {
  "title": "이용사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "이용사 자격 + 면허 — 없으면 영업할 수 없음",
  "evidence": "이용사로 종사하기 위해서는 공중위생법상 한국산업인력공단에서 실시하는 이용사 자격을 취득해야 하며, 본인의 이용실을 개설할 때는 반드시 시?도지사의 면허를 발급받아야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "511302": {
  "title": "네일아티스트",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "미용사(네일) 자격 — 없으면 영업할 수 없음",
  "evidence": "그러나, 기존에는 미용사(일반) 자격증을 취득해야만 영업을 할 수 있었으나, 2015년 4월 이후부터는 미용사(네일) 자격증을 취득한 사람만이 미용업(손톱·발톱) 영업신고를 할 수 있도록 변경되었다",
  "source": "고용24 직업정보(되는 길)"
 },
 "511301": {
  "title": "피부 및 체형관리사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "미용사(피부) 자격 — 없으면 영업할 수 없음",
  "evidence": "2008년에 미용사(피부) 국가자격이 신설되어 피부관리사로 활동하려면 미용사(피부) 자격증을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "704001": {
  "title": "건설 및 채굴기계운전원",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "기종별 운전기능사 + 건설기계조종사 면허",
  "evidence": "건설 및 채굴기계운전원이 되기 위해서는 반드시 국가기술자격법에 따른 관련 기술자격(기능사)을 취득하고 적성검사에 합격한 후, 건설기계 종류별로 주소지 관할 시장·군수 또는 구청장으로부터 ‘건설기계조종사면허’를 발급받아야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "623001": {
  "title": "크레인·호이스트운전원",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "기종별 자격(교육 이수)",
  "evidence": "이들 교육과정을 이수한 후 기종별로 관련 자격을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "623002": {
  "title": "지게차운전원",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "지게차운전기능사(3톤 미만은 교육 12시간으로 면허)",
  "evidence": "이들 교육과정을 이수한 후 기종별로 관련 자격을 취득해야 운전원으로 종사할 수 있으며, 3톤 미만의 지게차는 소정의 교육(이론 6시간, 실기 6시간)을 이수하면 면허증(3톤 미만 건설기계조종사 면허)을 발급받을 수 있다",
  "source": "고용24 직업정보(되는 길)"
 },
 "621301": {
  "title": "철도·전동차기관사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "지정 교육기관 이수 → 철도차량운전면허(필기·기능) + 신체·적성검사",
  "evidence": "철도 및 지하철기관사가 되기 위한 학력 제한은 없으며 철도안전법에 따라 적성검사 및 신체검사 등에 합격하고 철도차량운전면허 지정 교육훈련기관(한국철도공사 철도인력개발원, 서울메트로, 부산교통공사, 우송대학교, 한국교통대학교, 동양대학교)에서 면허종류 및 관련 분야 경력에 따라 소정의 교육을 이수한 후 국가에서 시행하는 철도차량운전면허시험(필기시험 및 기능시험)에 합격하면 철도차량운전면허를 부",
  "source": "고용24 직업정보(되는 길)"
 },
 "621201": {
  "title": "선장 및 항해사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "해기사 면허(해양계 학교·승선 경력) — 면허 유지 교육 필요",
  "evidence": "선장 및 항해사가 되기 위해서는 해양수산부가 지정한 교육기관인 관련 고등학교 및 대학교를 졸업하면 유리하다",
  "source": "고용24 직업정보(되는 길)"
 },
 "621203": {
  "title": "선박기관사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "해기사 면허(해양계 학교·승선 경력) — 면허 유지 교육 필요",
  "evidence": "선박기관사가 되기 위해서는 국토해양부가 지정한 교육기관인 관련 고등학교 및 대학교를 졸업하면 유리하다",
  "source": "고용24 직업정보(되는 길)"
 },
 "624301": {
  "title": "선박갑판원",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "none",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "선원수첩(만 18세 이상, 기초안전교육)",
  "evidence": "선박갑판원이 되려면 수산계 고등학교의 항해 관련과를 졸업하거나 선원법에 의한 선원수첩을 소지해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "622101": {
  "title": "택시운전원",
  "badges": [
   "license",
   "experience"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": true,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "운전면허 + 운전경력 1년 → 택시운전 자격시험",
  "evidence": "「여객자동차 운수사업법」에 따라 택시운전을 하고자 하는 자는 해당 지역에서 시행되는 시험에 합격하여 자격을 취득하여야\n한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "622201": {
  "title": "버스운전원",
  "badges": [
   "license",
   "experience"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": true,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "1종 대형면허 + 운전경력 1년 → 버스운전 자격시험",
  "evidence": "버스운전원이 되는 데 학력제한은 없으며 1종 대형자동차운전면허를 소지해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "622304": {
  "title": "화물차·특수차운전원",
  "badges": [
   "license",
   "experience"
  ],
  "conditions": {
   "education": "none",
   "training": "none",
   "exam": "license",
   "experience": true,
   "other": [],
   "entry": "direct"
  },
  "weight": "light",
  "note": "운전면허 + 운전경력 1~2년 → 화물운송종사 자격",
  "evidence": "사업용(영업용)화물자동차를 운전하기 위해서는 반드시 화물운송종사자격을 취득해야 한다",
  "source": "고용24 직업정보(되는 길)"
 },
 "140101": {
  "title": "건축가(건축설계사)",
  "badges": [
   "license",
   "experience"
  ],
  "conditions": {
   "education": "major",
   "training": "none",
   "exam": "license",
   "experience": true,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "건축학(인증 5년제) 등 → 건축사사무소 실무수련 3~4년 → 건축사시험",
  "evidence": "건축설계사(건축사)가 되기 위해서는 대학교 건축학과(5년제)나 건축공학과(4년제), 전문대학 건축과(2~3년제) 또는 건축전문대학원을 졸업한 후, 건축사사무소에 취업하여 건축사보로서 일정 기간 실무 경력을 쌓은 후 건축사(대한건축사협회에서 시험 주관, 국토교통부에서 자격 발급) 자격을 취득하는 것이 일반적이다",
  "source": "고용24 직업정보(되는 길)"
 },
 "621101": {
  "title": "항공기조종사",
  "badges": [
   "license",
   "experience"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": true,
   "other": [
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "조종사 자격증명(비행시간 요건) + 항공신체검사",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "621102": {
  "title": "헬리콥터조종사",
  "badges": [
   "license",
   "experience"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": true,
   "other": [
    "physical"
   ],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "회전익 조종사 자격증명(비행시간) + 신체검사",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "621401": {
  "title": "항공교통관제사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "항공교통관제사 자격증명(지정 교육 + 시험)",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "621403": {
  "title": "철도교통관제사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "철도교통관제 자격증명",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "621402": {
  "title": "선박교통관제사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "해기사 등 응시 요건 + 관제 교육",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "705901": {
  "title": "점화·발파·화약관리원",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "화약류 관리·취급 자격",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 },
 "306601": {
  "title": "임상심리사",
  "badges": [
   "license"
  ],
  "conditions": {
   "education": "none",
   "training": "designated",
   "exam": "license",
   "experience": false,
   "other": [],
   "entry": "direct"
  },
  "weight": "heavy",
  "note": "정신건강임상심리사·임상심리사 자격(수련 + 시험)",
  "evidence": "",
  "source": "제도 지식(근거 문장 없음)"
 }
}
