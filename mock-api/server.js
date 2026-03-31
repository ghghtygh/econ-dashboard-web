/**
 * Economic Dashboard API Server
 *
 * Data sources (priority order):
 *   1. Real external APIs when API keys are set in environment
 *   2. Generated mock data as fallback
 *
 * Environment variables:
 *   FRED_API_KEY          - FRED macro data (VIX, CPI, Treasury yields, etc.)
 *   ALPHA_VANTAGE_API_KEY - Equity & FX data (S&P 500, USD/KRW)
 *   (CoinGecko needs no key)
 */

import express from 'express'
import * as cache from './cache.js'
import * as coingecko from './adapters/coingecko.js'
import * as fred from './adapters/fred.js'
import * as av from './adapters/alphavantage.js'

const app = express()
app.use(express.json())

// ── TTLs ─────────────────────────────────────────────────────────────────────

const TTL = {
  PRICE:    5  * 60 * 1000,  // 5 min  – current prices
  HISTORY:  60 * 60 * 1000,  // 1 hour – historical series
}

// ── Response helpers ──────────────────────────────────────────────────────────

function ok(data) {
  return { success: true, data, error: undefined, timestamp: new Date().toISOString() }
}

function paged(content, page = 0, size = 20) {
  const start = page * size
  const slice = content.slice(start, start + size)
  return {
    content: slice,
    totalElements: content.length,
    totalPages: Math.ceil(content.length / size),
    size,
    number: page,
  }
}

// ── Mock data generators ──────────────────────────────────────────────────────

function generateTimeSeries(indicatorId, baseValue, volatility, days = 100) {
  const data = []
  let value = baseValue
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const prev = value
    value = Math.max(0.01, value + (Math.random() - 0.5) * volatility)
    const change = prev ? ((value - prev) / prev) * 100 : 0
    data.push({
      id: i + 1,
      indicatorId,
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      open: null, high: null, low: null, close: null, volume: null,
      change: Math.round(change * 100) / 100,
    })
  }
  return data
}

// Static indicator catalog
const INDICATORS = [
  { id: 1, name: 'VIX',             symbol: 'VIX',    category: 'STOCK',     unit: 'pts', source: 'CBOE/FRED',       description: 'CBOE Volatility Index',        createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'S&P 500',         symbol: 'SPX',    category: 'STOCK',     unit: 'pts', source: 'SP/AlphaVantage', description: 'S&P 500 Index (SPY ETF proxy)', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'USD/KRW',         symbol: 'USDKRW', category: 'FOREX',     unit: 'KRW', source: 'AlphaVantage',    description: 'US Dollar to Korean Won',      createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 4, name: 'Bitcoin',         symbol: 'BTC',    category: 'CRYPTO',    unit: 'USD', source: 'CoinGecko',       description: 'Bitcoin Price (USD)',          createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 5, name: 'US CPI YoY',      symbol: 'USCPI',  category: 'MACRO',     unit: '%',   source: 'BLS/FRED',        description: 'US Consumer Price Index YoY', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 6, name: 'US 10Y Treasury', symbol: 'US10Y',  category: 'MACRO',     unit: '%',   source: 'Fed/FRED',        description: 'US 10-Year Treasury Yield',   createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 7, name: 'Ethereum',        symbol: 'ETH',    category: 'CRYPTO',    unit: 'USD', source: 'CoinGecko',       description: 'Ethereum Price (USD)',         createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 8, name: 'Fed Funds Rate',  symbol: 'FFR',    category: 'MACRO',     unit: '%',   source: 'Fed/FRED',        description: 'Federal Funds Effective Rate', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 9, name: 'US Unemployment', symbol: 'UNRATE', category: 'MACRO',     unit: '%',   source: 'BLS/FRED',        description: 'US Unemployment Rate',        createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

// Fallback mock series generators (used when real API is unavailable)
const MOCK_SERIES = {
  1: () => generateTimeSeries(1, 18, 2),
  2: () => generateTimeSeries(2, 5200, 80),
  3: () => generateTimeSeries(3, 1340, 15),
  4: () => generateTimeSeries(4, 68000, 3000),
  5: () => generateTimeSeries(5, 3.2, 0.1),
  6: () => generateTimeSeries(6, 4.5, 0.15),
  7: () => generateTimeSeries(7, 3500, 150),
  8: () => generateTimeSeries(8, 5.33, 0.05),
  9: () => generateTimeSeries(9, 3.9, 0.1),
}

// ── Live data fetchers ────────────────────────────────────────────────────────

async function getSeriesData(id, from, to) {
  const cacheKey = `series:${id}:${from ?? ''}:${to ?? ''}`

  return cache.getOrFetch(cacheKey, TTL.HISTORY, async () => {
    switch (id) {
      // Crypto – CoinGecko (always available)
      case 4: return coingecko.fetchHistoricalPrices(4, 'bitcoin', 90)
      case 7: return coingecko.fetchHistoricalPrices(7, 'ethereum', 90)

      // Equity – Alpha Vantage
      case 2:
        if (av.isAvailable()) return av.fetchEquityDaily(2, 'SPY')
        break
      case 3:
        if (av.isAvailable()) return av.fetchForexDaily(3, 'USD', 'KRW')
        break

      // Macro – FRED
      case 1:
        if (fred.isAvailable()) return fred.fetchSeries('VIXCLS', 1, from, to)
        break
      case 5:
        if (fred.isAvailable()) return fred.fetchSeries('CPIAUCSL', 5, from, to)
        break
      case 6:
        if (fred.isAvailable()) return fred.fetchSeries('DGS10', 6, from, to)
        break
      case 8:
        if (fred.isAvailable()) return fred.fetchSeries('FEDFUNDS', 8, from, to)
        break
      case 9:
        if (fred.isAvailable()) return fred.fetchSeries('UNRATE', 9, from, to)
        break
    }

    console.log(`[data] indicator ${id}: using mock fallback (no API key or unrecognized id)`)
    return (MOCK_SERIES[id] ?? (() => generateTimeSeries(id, 100, 5)))()
  })
}

async function getCurrentPrices() {
  return cache.getOrFetch('prices:all', TTL.PRICE, async () => {
    const result = new Map()

    try {
      const coinPrices = await coingecko.fetchCurrentPrices()
      for (const [id, v] of coinPrices) result.set(id, v)
    } catch (err) {
      console.warn('[data] CoinGecko price fetch failed:', err.message)
    }

    if (av.isAvailable()) {
      for (const [symbol, indicatorId] of [['SPY', 2], ['USDKRW', 3]]) {
        try {
          const q = await av.fetchLatestQuote(indicatorId, symbol)
          if (q) result.set(indicatorId, q)
        } catch (err) {
          console.warn(`[data] AV quote ${symbol} failed:`, err.message)
        }
      }
    }

    if (fred.isAvailable()) {
      for (const [seriesId, indicatorId] of [
        ['VIXCLS', 1], ['CPIAUCSL', 5], ['DGS10', 6], ['FEDFUNDS', 8], ['UNRATE', 9],
      ]) {
        try {
          const latest = await fred.fetchLatest(seriesId, indicatorId)
          if (latest) result.set(indicatorId, latest)
        } catch (err) {
          console.warn(`[data] FRED latest ${seriesId} failed:`, err.message)
        }
      }
    }

    return result
  })
}

// ── News ──────────────────────────────────────────────────────────────────────

const NEWS = [
  { id: 1, title: 'Fed Holds Rates Steady Amid Mixed Economic Data',    summary: 'The Federal Reserve held interest rates unchanged, citing uncertainty in inflation trajectory.',   url: 'https://example.com/1', source: 'Reuters',   author: 'Jane Smith',  imageUrl: null, category: 'MACRO',     publishedAt: new Date(Date.now() - 1  * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 2, title: 'S&P 500 Hits Record High on Tech Rally',             summary: 'Technology stocks led the S&P 500 to a new all-time high as earnings season beats expectations.',  url: 'https://example.com/2', source: 'Bloomberg', author: 'Tom Lee',     imageUrl: null, category: 'STOCK',     publishedAt: new Date(Date.now() - 2  * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 3, title: 'Bitcoin Surges Past $70,000',                        summary: 'Bitcoin reached a new milestone as institutional demand and ETF inflows continue.',               url: 'https://example.com/3', source: 'CoinDesk',  author: 'Alice Wang',  imageUrl: null, category: 'CRYPTO',    publishedAt: new Date(Date.now() - 3  * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 4, title: 'USD/KRW Falls as Korea Trade Surplus Widens',        summary: 'The Korean won strengthened as export data surprised to the upside.',                             url: 'https://example.com/4', source: 'Yonhap',    author: 'Kim MinJu',   imageUrl: null, category: 'FOREX',     publishedAt: new Date(Date.now() - 4  * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 5, title: 'US CPI Falls to 2.9%, Cooling Inflation Concerns',  summary: 'Headline inflation dropped below 3% for the first time in two years.',                           url: 'https://example.com/5', source: 'WSJ',       author: 'David Park',  imageUrl: null, category: 'MACRO',     publishedAt: new Date(Date.now() - 6  * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 6, title: 'Ethereum ETF Inflows Hit $500M in Single Day',       summary: 'Spot Ethereum ETFs attracted record inflows amid growing institutional interest.',               url: 'https://example.com/6', source: 'Decrypt',   author: 'S. Park',     imageUrl: null, category: 'CRYPTO',    publishedAt: new Date(Date.now() - 8  * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 7, title: 'Treasury Yields Climb on Strong Jobs Report',        summary: '10-year yields rose to 4.7% after payrolls beat estimates by 80K.',                             url: 'https://example.com/7', source: 'FT',        author: 'M. Jones',    imageUrl: null, category: 'MACRO',     publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 8, title: 'Gold Nears All-Time High on Safe-Haven Demand',      summary: 'Spot gold approached $2,400 as geopolitical tensions drove safe-haven buying.',                 url: 'https://example.com/8', source: 'Reuters',   author: 'K. Smith',    imageUrl: null, category: 'COMMODITY', publishedAt: new Date(Date.now() - 16 * 3600000).toISOString(), createdAt: new Date().toISOString() },
]

// ── Alerts ────────────────────────────────────────────────────────────────────

const alerts = []

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: process.env.APP_ENV || 'local',
    dataSources: {
      coingecko:    true,
      fred:         fred.isAvailable(),
      alphaVantage: av.isAvailable(),
    },
  })
})

app.get('/api/indicators', (req, res) => {
  const { category } = req.query
  const result = category ? INDICATORS.filter(i => i.category === category) : INDICATORS
  res.json(ok(result))
})

app.get('/api/indicators/categories', (_req, res) => {
  const cats = [...new Set(INDICATORS.map(i => i.category))]
  res.json(ok(cats))
})

app.get('/api/indicators/:id', (req, res) => {
  const indicator = INDICATORS.find(i => i.id === Number(req.params.id))
  if (!indicator) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Indicator not found' } })
  res.json(ok(indicator))
})

app.get('/api/indicators/:id/data', async (req, res) => {
  const id   = Number(req.params.id)
  const page = Number(req.query.page ?? 0)
  const size = Number(req.query.size ?? 100)
  const { from, to } = req.query

  try {
    const series = await getSeriesData(id, from, to)
    const filtered = series.filter(d => {
      if (from && d.date < from) return false
      if (to   && d.date > to)   return false
      return true
    })
    res.json(ok(paged(filtered, page, size)))
  } catch (err) {
    console.error(`[route] /api/indicators/${id}/data error:`, err.message)
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: err.message } })
  }
})

app.post('/api/indicators/series', async (req, res) => {
  const { indicatorIds = [], startDate, endDate } = req.body
  if (!Array.isArray(indicatorIds) || indicatorIds.length === 0) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'indicatorIds array required' } })
  }

  try {
    const results = {}
    await Promise.all(
      indicatorIds.map(async (id) => {
        const series = await getSeriesData(Number(id), startDate, endDate)
        results[id] = series.filter(d => {
          if (startDate && d.date < startDate) return false
          if (endDate   && d.date > endDate)   return false
          return true
        })
      })
    )
    res.json(ok(results))
  } catch (err) {
    console.error('[route] /api/indicators/series error:', err.message)
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: err.message } })
  }
})

app.get('/api/prices', async (_req, res) => {
  try {
    const prices = await getCurrentPrices()
    res.json(ok(Object.fromEntries(prices)))
  } catch (err) {
    console.error('[route] /api/prices error:', err.message)
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: err.message } })
  }
})

app.get('/api/news', (req, res) => {
  const { category } = req.query
  const page = Number(req.query.page ?? 0)
  const size = Number(req.query.size ?? 20)
  const result = category ? NEWS.filter(n => n.category === category) : NEWS
  res.json(ok(paged(result, page, size)))
})

app.get('/api/news/:id', (req, res) => {
  const article = NEWS.find(n => n.id === Number(req.params.id))
  if (!article) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } })
  res.json(ok(article))
})

app.get('/api/alerts', (_req, res) => res.json(ok(alerts)))
app.post('/api/alerts', (req, res) => {
  const alert = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() }
  alerts.push(alert)
  res.status(201).json(ok(alert))
})
app.delete('/api/alerts/:id', (req, res) => {
  const idx = alerts.findIndex(a => a.id === Number(req.params.id))
  if (idx !== -1) alerts.splice(idx, 1)
  res.json(ok(null))
})

app.get('/api/calendar', (_req, res) => {
  function offsetDay(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }
  const events = [
    { id: 1, title: 'FOMC Meeting',      date: offsetDay(3),  importance: 'HIGH',   country: 'US', actual: null, forecast: 'Hold', previous: 'Hold' },
    { id: 2, title: 'US CPI Release',    date: offsetDay(7),  importance: 'HIGH',   country: 'US', actual: null, forecast: '3.1%', previous: '3.2%' },
    { id: 3, title: 'Korea GDP Q1',      date: offsetDay(14), importance: 'MEDIUM', country: 'KR', actual: null, forecast: '0.5%', previous: '0.4%' },
    { id: 4, title: 'US Jobs Report',    date: offsetDay(5),  importance: 'HIGH',   country: 'US', actual: null, forecast: '200K', previous: '187K' },
    { id: 5, title: 'ECB Rate Decision', date: offsetDay(10), importance: 'HIGH',   country: 'EU', actual: null, forecast: 'Hold', previous: '4.5%' },
  ]
  res.json(ok(paged(events)))
})

// ── Dashboard widgets ─────────────────────────────────────────────────────────

const widgetStore = new Map()

app.get('/api/dashboard/widgets', (req, res) => {
  const userId = req.headers['x-user-id'] || 'default'
  res.json(ok(widgetStore.get(userId) ?? []))
})
app.post('/api/dashboard/widgets', (req, res) => {
  const userId = req.headers['x-user-id'] || 'default'
  widgetStore.set(userId, req.body)
  res.json(ok(req.body))
})
app.put('/api/dashboard/widgets/:id', (req, res) => {
  const userId  = req.headers['x-user-id'] || 'default'
  const widgets = widgetStore.get(userId) ?? []
  const idx     = widgets.findIndex(w => w.id === req.params.id)
  if (idx !== -1) widgets[idx] = { ...widgets[idx], ...req.body }
  else            widgets.push({ id: req.params.id, ...req.body })
  widgetStore.set(userId, widgets)
  res.json(ok(widgets[idx !== -1 ? idx : widgets.length - 1]))
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Economic Dashboard API running on :${PORT} [${process.env.APP_ENV || 'local'}]`)
  console.log('Data sources:')
  console.log('  CoinGecko    → always on (BTC, ETH)')
  console.log(`  FRED         → ${fred.isAvailable() ? 'ACTIVE (FRED_API_KEY set)' : 'mock fallback (FRED_API_KEY not set)'}`)
  console.log(`  AlphaVantage → ${av.isAvailable()   ? 'ACTIVE (ALPHA_VANTAGE_API_KEY set)' : 'mock fallback (ALPHA_VANTAGE_API_KEY not set)'}`)
})
