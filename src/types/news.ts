import { z } from 'zod'

export const newsCategorySchema = z.enum(['STOCK', 'FOREX', 'CRYPTO', 'MACRO', 'BOND', 'COMMODITY'])

export const newsArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  summary: z.string().nullable(),
  url: z.string(),
  source: z.string().nullable(),
  author: z.string().nullable(),
  imageUrl: z.string().nullable(),
  category: newsCategorySchema,
  publishedAt: z.string(),
  createdAt: z.string(),
})

export type NewsCategory = z.infer<typeof newsCategorySchema>
export type NewsArticle = z.infer<typeof newsArticleSchema>
