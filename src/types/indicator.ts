import { z } from 'zod'

// --- Zod 스키마 ---

export const indicatorCategorySchema = z.enum(['STOCK', 'FOREX', 'CRYPTO', 'MACRO', 'BOND', 'COMMODITY'])

const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    error: apiErrorSchema.optional(),
    timestamp: z.string(),
  })
}

export const indicatorSchema = z.object({
  id: z.number(),
  name: z.string(),
  symbol: z.string(),
  category: indicatorCategorySchema,
  unit: z.string(),
  source: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const indicatorDataSchema = z.object({
  id: z.number(),
  indicatorId: z.number(),
  date: z.string(),
  value: z.number(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  volume: z.number().nullable(),
  change: z.number().nullable(),
})

export function pagedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    content: z.array(itemSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    size: z.number(),
    number: z.number(),
  })
}

export const chartTypeSchema = z.enum(['line', 'bar', 'area', 'candlestick', 'number'])

export const dashboardWidgetSchema = z.object({
  id: z.string(),
  indicatorId: z.number(),
  chartType: chartTypeSchema,
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  title: z.string().optional(),
  color: z.string().optional(),
  dateRange: z.enum(['1D', '1W', '1M', '3M', '1Y']).optional(),
})

// --- TypeScript 타입 (Zod에서 추론) ---

export type IndicatorCategory = z.infer<typeof indicatorCategorySchema>

export type ApiResponse<T> = {
  success: boolean
  data: T
  error?: { code: string; message: string }
  timestamp: string
}

export type Indicator = z.infer<typeof indicatorSchema>
export type IndicatorData = z.infer<typeof indicatorDataSchema>

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type ChartType = z.infer<typeof chartTypeSchema>
export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>
