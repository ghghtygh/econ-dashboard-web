export type NewsCategory = 'STOCK' | 'FOREX' | 'CRYPTO' | 'MACRO' | 'BOND' | 'COMMODITY'

export interface NewsArticle {
  id: number
  title: string
  summary: string | null
  url: string
  source: string | null
  author: string | null
  imageUrl: string | null
  category: NewsCategory
  publishedAt: string
  createdAt: string
}
