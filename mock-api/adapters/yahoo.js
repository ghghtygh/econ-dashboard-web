/**
 * Yahoo Finance Adapter (unofficial API — no API key required)
 *
 * Endpoint: https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
 * Supports: global indices (^KS11, ^KQ11, ^DJI, ^IXIC, etc.)
 *
 * Note: This uses Yahoo Finance's public chart endpoint.
 * No authentication required, but rate limits apply.
 */

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

async function fetchJSON(symbol, params = {}) {
  const defaultParams = {
    interval: '1d',
    range: '6mo',
    includePrePost: false,
    events: 'div,splits',
  }
  const merged = { ...defaultParams, ...params }
  const url = `${BASE}/${encodeURIComponent(symbol)}?${new URLSearchParams(merged)}`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0',
    },
  })
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status} for ${symbol}`)
  const json = await res.json()
  if (json.chart?.error) throw new Error(`Yahoo Finance error: ${json.chart.error.description}`)
  return json
}

/**
 * Fetch daily historical close prices for a Yahoo Finance symbol.
 * Returns array of IndicatorData-shaped objects sorted oldest→newest.
 *
 * @param {number} indicatorId
 * @param {string} symbol       - e.g. '^KS11', '^KQ11'
 * @param {number} [limit=120]
 */
export async function fetchIndexDaily(indicatorId, symbol, limit = 120) {
  const json = await fetchJSON(symbol, { interval: '1d', range: '6mo' })

  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`No chart data for symbol ${symbol}`)

  const timestamps = result.timestamp ?? []
  const closes     = result.indicators?.quote?.[0]?.close ?? []

  if (timestamps.length === 0) throw new Error(`Empty series for ${symbol}`)

  const entries = timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: closes[i] }))
    .filter(e => e.close != null && e.close > 0)
    .slice(-limit)

  return entries.map((e, i) => {
    const prev   = i > 0 ? entries[i - 1].close : e.close
    const change = prev ? ((e.close - prev) / prev) * 100 : 0
    return {
      id: i + 1,
      indicatorId,
      date:   e.date,
      value:  Math.round(e.close * 100) / 100,
      open:   null,
      high:   null,
      low:    null,
      close:  Math.round(e.close * 100) / 100,
      volume: null,
      change: Math.round(change * 100) / 100,
    }
  })
}

/**
 * Fetch the latest quote for a Yahoo Finance symbol.
 * Returns { indicatorId, value, change } or null.
 *
 * @param {number} indicatorId
 * @param {string} symbol
 */
export async function fetchLatestQuote(indicatorId, symbol) {
  const json = await fetchJSON(symbol, { interval: '1d', range: '5d' })

  const result = json.chart?.result?.[0]
  if (!result) return null

  const closes = result.indicators?.quote?.[0]?.close ?? []
  const validCloses = closes.filter(c => c != null && c > 0)
  if (validCloses.length === 0) return null

  const latest = validCloses[validCloses.length - 1]
  const prev   = validCloses.length > 1 ? validCloses[validCloses.length - 2] : latest
  const change = prev ? ((latest - prev) / prev) * 100 : 0

  return {
    indicatorId,
    value:  Math.round(latest * 100) / 100,
    change: Math.round(change * 100) / 100,
  }
}
