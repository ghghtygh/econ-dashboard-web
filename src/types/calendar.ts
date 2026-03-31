import { z } from 'zod'

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

export const economicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time: z.string().optional(),
  importance: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  description: z.string(),
  actual: z.string().optional(),
  forecast: z.string().optional(),
  previous: z.string().optional(),
  status: z.enum(['upcoming', 'completed']),
})

export const economicEventListSchema = z.array(economicEventSchema)
