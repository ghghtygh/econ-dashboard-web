/**
 * FRED (Federal Reserve Economic Data) API Adapter
 * Free – requires an API key from https://fred.stlouisfed.org/docs/api/api_key.html
 * Rate limit: 120 requests/minute
 *
 * Docs: https://fred.stlouisfed.org/docs/api/fred/
 */

const BASE = 'https://api.stlouisfed.org/fred'

// FRED series id → our indicator id mapping
export const SERIES_MAP = {
  VIXCLS:    { id: 1, name: 'VIX',              unit: 'pts'  },
  SP500:     { id: 2, name: 'S&P 500',           unit: 'pts'  },
  DEXKOUS:   { id: 3, name: 'USD/KRW',           unit: 'KRW'  },
  CPIAUCSL:  { id: 5, name: 'US CPI YoY',        unit: '%'    },
  DGS10:     { id: 6, name: 'US 10Y Treasury',   unit: '%'    },
  FEDFUNDS:  { id: 8, name: 'Fed Funds Rate',    unit: '%'    },
  UNRATE:    { id: 9, name: 'US Unemployment',   unit: '%'    },
}

function apiKey() {
  return process.env.FRED_API_KEY
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`FRED ${res.status}: ${url}`)
  return res.json()
}

/**
 * Fetch observations for a series within a date range.
 * Returns array of IndicatorData-shaped objects.
 *
 * @param {string} seriesId - e.g. 'VIXCLS'
 * @param {number} indicatorId
 * @param {string} [startDate] - YYYY-MM-DD, default 1 year ago
 * @param {string} [endDate]   - YYYY-MM-DD, default today
 */
export async function fetchSeries(seriesId, indicatorId, startDate, endDate) {
  const key = apiKey()
  if (!key) throw new Error('FRED_API_KEY not set')

  const start = startDate || offsetDate(-365)
  const end   = endDate   || today()

  const url =
    `${BASE}/series/observations` +
    `?series_id=${seriesId}` +
    `&observation_start=${start}` +
    `&observation_end=${end}` +
    `&file_type=json` +
    `&api_key=${key}`

  const json = await fetchJSON(url)
  const observations = (json.observations ?? []).filter(o => o.value !== '.')

  return observations.map((obs, i) => {
    const value = parseFloat(obs.value)
    const prev = i > 0 ? parseFloat(observations[i - 1].value) : value
    const change = prev ? ((value - prev) / prev) * 100 : 0
    return {
      id: i + 1,
      indicatorId,
      date: obs.date,
      value: Math.round(value * 10000) / 10000,
      open: null, high: null, low: null, close: null, volume: null,
      change: Math.round(change * 10000) / 10000,
    }
  })
}

/**
 * Fetch the most recent observation value for a series.
 * Returns { value, change, date } or null.
 */
export async function fetchLatest(seriesId, indicatorId) {
  const key = apiKey()
  if (!key) throw new Error('FRED_API_KEY not set')

  // fetch last 2 observations so we can compute change
  const url =
    `${BASE}/series/observations` +
    `?series_id=${seriesId}` +
    `&sort_order=desc` +
    `&limit=2` +
    `&file_type=json` +
    `&api_key=${key}`

  const json = await fetchJSON(url)
  const obs = (json.observations ?? []).filter(o => o.value !== '.')
  if (obs.length === 0) return null

  const latest = parseFloat(obs[0].value)
  const prior  = obs.length > 1 ? parseFloat(obs[1].value) : latest
  const change = prior ? ((latest - prior) / prior) * 100 : 0

  return {
    indicatorId,
    value:  Math.round(latest * 10000) / 10000,
    change: Math.round(change * 10000) / 10000,
    date:   obs[0].date,
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0]
}

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function isAvailable() {
  return !!apiKey()
}
