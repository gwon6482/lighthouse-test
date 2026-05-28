export type ProjectCategory = 'qualification' | 'knowledge' | 'skill' | 'portfolio'
export type Priority = 'high' | 'normal' | 'low'
export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일'

export interface WeekCurriculum {
  week: number
  title: string
  items: string[]
}

export interface Project {
  id: string
  category: ProjectCategory
  name: string
  goal: string
  days: DayOfWeek[]
  duration: number
  priority: Priority
  notification: boolean
  missedNotification: boolean
  notificationTime: string
  memo: string
  source?: string
  field?: string
  level?: string
  weeks?: number
  description?: string
  tags?: string[]
  likes?: number
  views?: number
  curriculum?: WeekCurriculum[]
}

export interface Routine {
  id: string
  name: string
  days: DayOfWeek[]
  duration: number
  notificationTime: string
  notification: boolean
  memo: string
}

export interface TimelineSlot {
  month: string
  projects: Project[]
}

export interface TimelineItem {
  projectId: string
  projectName: string
  category: ProjectCategory
  date: string
}

export interface TimelineMonth {
  label: string
  items: TimelineItem[]
}

export interface CareerPlan {
  id: string
  name: string
  targetJob: string
  author: string
  duration: string
  description: string
  tags: string[]
  likes: number
  views: number
  routineCount: number
  projects: Project[]
  timeline: TimelineMonth[]
}

export interface DraftPlan {
  planId: string | null
  name: string
  targetJob: string
  projects: Project[]
  routines: Routine[]
  startDate: string
  endDate: string
  reviewDay: DayOfWeek | ''  // 주간리뷰 요일. 일주일의 끝이자 시작. 미설정이면 ''
  timeline: TimelineMonth[]
}
