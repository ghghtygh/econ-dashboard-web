import express from 'express'

const app = express()
app.use(express.json())

// ── Indicator types & data ────────────────────────────────────────────────────

const indicators = [
  { id: 1, name: 'VIX', symbol: 'VIX', category: 'STOCK', unit: 'pts', source: 'CBOE', description: 'CBOE Volatility Index', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'S&P 500', symbol: 'SPX', category: 'STOCK', unit: 'pts', source: 'SP', description: 'S&P 500 Index', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'USD/KRW', symbol: 'USDKRW', category: 'FOREX', unit: 'KRW', source: 'BOK', description: 'US Dollar to Korean Won', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 4, name: 'Bitcoin', symbol: 'BTC', category: 'CRYPTO', unit: 'USD', source: 'CoinGecko', description: 'Bitcoin Price USD', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 5, name: 'US CPI YoY', symbol: 'USCPI', category: 'MACRO', unit: '%', source: 'BLS', description: 'US Consumer Price Index YoY', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 6, name: 'US 10Y Treasury', symbol: 'US10Y', category: 'MACRO', unit: '%', source: 'Fed', description: 'US 10-Year Treasury Yield', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

function generateTimeSeries(baseValue, volatility, days = 90) {
  const data = []
  let value = baseValue
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const prev = value
    value = Math.max(0.01, value + (Math.random() - 0.5) * volatility)
    const change = ((value - prev) / prev) * 100
    data.push({
      id: i,
      indicatorId: 1,
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      open: null, high: null, low: null, close: null, volume: null,
      change: Math.round(change * 100) / 100,
    })
  }
  return data
}

const seriesMap = {
  1: generateTimeSeries(18, 2),      // VIX
  2: generateTimeSeries(5200, 80),   // SPX
  3: generateTimeSeries(1340, 15),   // USDKRW
  4: generateTimeSeries(68000, 3000), // BTC
  5: generateTimeSeries(3.2, 0.1),   // CPI
  6: generateTimeSeries(4.5, 0.15),  // 10Y
}

const news = [
  { id: 1, title: 'Fed Holds Rates Steady Amid Mixed Economic Data', summary: 'The Federal Reserve held interest rates unchanged, citing uncertainty in inflation trajectory.', url: 'https://example.com/1', source: 'Reuters', author: 'Jane Smith', imageUrl: null, category: 'MACRO', publishedAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 2, title: 'S&P 500 Hits Record High on Tech Rally', summary: 'Technology stocks led the S&P 500 to a new all-time high as earnings season beats expectations.', url: 'https://example.com/2', source: 'Bloomberg', author: 'Tom Lee', imageUrl: null, category: 'STOCK', publishedAt: new Date(Date.now() - 7200000).toISOString(), createdAt: new Date().toISOString() },
  { id: 3, title: 'Bitcoin Surges Past $70,000', summary: 'Bitcoin reached a new milestone as institutional demand and ETF inflows continue.', url: 'https://example.com/3', source: 'CoinDesk', author: 'Alice Wang', imageUrl: null, category: 'CRYPTO', publishedAt: new Date(Date.now() - 10800000).toISOString(), createdAt: new Date().toISOString() },
  { id: 4, title: 'USD/KRW Falls as Korea Trade Surplus Widens', summary: 'The Korean won strengthened as export data surprised to the upside.', url: 'https://example.com/4', source: 'Yonhap', author: 'Kim MinJu', imageUrl: null, category: 'FOREX', publishedAt: new Date(Date.now() - 14400000).toISOString(), createdAt: new Date().toISOString() },
]

// ── Response wrappers ─────────────────────────────────────────────────────────

function ok(data) {
  return { success: true, data, error: undefined, timestamp: new Date().toISOString() }
}

function paged(content, page = 0, size = 20) {
  const start = page * size
  const slice = content.slice(start, start + size)
  return { content: slice, totalElements: content.length, totalPages: Math.ceil(content.length / size), size, number: page }
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: process.env.APP_ENV || 'local' }))

app.get('/api/indicators', (req, res) => {
  const { category } = req.query
  const result = category ? indicators.filter(i => i.category === category) : indicators
  res.json(ok(result))
})

app.get('/api/indicators/categories', (_req, res) => {
  res.json(ok(['STOCK', 'FOREX', 'CRYPTO', 'MACRO']))
})

app.get('/api/indicators/:id', (req, res) => {
  const indicator = indicators.find(i => i.id === Number(req.params.id))
  if (!indicator) return res.status(404).json({ success: false, error: 'Not found' })
  res.json(ok(indicator))
})

app.get('/api/indicators/:id/data', (req, res) => {
  const id = Number(req.params.id)
  const series = seriesMap[id] || generateTimeSeries(100, 5)
  const page = Number(req.query.page || 0)
  const size = Number(req.query.size || 20)
  res.json(ok(paged(series, page, size)))
})

app.get('/api/news', (req, res) => {
  const { category } = req.query
  const result = category ? news.filter(n => n.category === category) : news
  const page = Number(req.query.page || 0)
  const size = Number(req.query.size || 20)
  res.json(ok(paged(result, page, size)))
})

// ── Alerts (stub) ─────────────────────────────────────────────────────────────

const alerts = []
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

// ── Economic calendar (stub) ───────────────────────────────────────────────────

app.get('/api/calendar', (_req, res) => {
  const events = [
    { id: 1, title: 'FOMC Meeting', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], importance: 'HIGH', country: 'US', actual: null, forecast: 'Hold', previous: 'Hold' },
    { id: 2, title: 'US CPI Release', date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], importance: 'HIGH', country: 'US', actual: null, forecast: '3.1%', previous: '3.2%' },
    { id: 3, title: 'Korea GDP Q1', date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], importance: 'MEDIUM', country: 'KR', actual: null, forecast: '0.5%', previous: '0.4%' },
  ]
  res.json(ok(paged(events)))
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Mock API running on :${PORT} [${process.env.APP_ENV || 'local'}]`))
