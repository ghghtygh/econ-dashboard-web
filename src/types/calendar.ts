export type EventImportance = 'high' | 'medium' | 'low'
export type EventStatus = 'upcoming' | 'completed'

export interface EconomicEvent {
  id: string
  title: string
  date: string
  time?: string
  importance: EventImportance
  category: string
  description: string
  actual?: string
  forecast?: string
  previous?: string
  status: EventStatus
}
