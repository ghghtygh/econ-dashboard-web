/**
 * Alpha Vantage API Adapter
 * Free tier – 25 requests/day (standard), 5 requests/minute
 * Get a free key at: https://www.alphavantage.co/support/#api-key
 *
 * Docs: https://www.alphavantage.co/documentation/
 */

const BASE = 'https://www.alphavantage.co/query'

function apiKey() {
  return process.env.ALPHA_VANTAGE_API_KEY
}

async function fetchJSON(params) {
  const url = `${BASE}?${new URLSearchParams({ ...params, apikey: apiKey() })}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`AlphaVantage ${res.status}`)
  const json = await res.json()
  if (json['Note'] || json['Information']) {
    throw new Error(`AlphaVantage rate limit: ${json['Note'] || json['Information']}`)
  }
  return json
}

/**
 * Fetch daily adjusted close for an equity/ETF (SPY as S&P 500 proxy).
 * Returns array of IndicatorData-shaped objects sorted oldest→newest.
 *
 * @param {number} indicatorId
 * @param {string} symbol      - e.g. 'SPY'
 * @param {number} [limit=100]
 */
export async function fetchEquityDaily(indicatorId, symbol, limit = 100) {
  if (!apiKey()) throw new Error('ALPHA_VANTAGE_API_KEY not set')

  const json = await fetchJSON({
    function: 'TIME_SERIES_DAILY_ADJUSTED',
    symbol,
    outputsize: 'compact',  // last 100 data points (compact) vs full
  })

  const series = json['Time Series (Daily)']
  if (!series) throw new Error(`No data for symbol ${symbol}`)

  const entries = Object.entries(series)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)

  return entries.map(([date, ohlcv], i) => {
    const close = parseFloat(ohlcv['5. adjusted close'])
    const open  = parseFloat(ohlcv['1. open'])
    const high  = parseFloat(ohlcv['2. high'])
    const low   = parseFloat(ohlcv['3. low'])
    const vol   = parseFloat(ohlcv['6. volume'])
    const prev  = i > 0 ? parseFloat(entries[i - 1][1]['5. adjusted close']) : close
    const change = prev ? ((close - prev) / prev) * 100 : 0
    return {
      id: i + 1,
      indicatorId,
      date,
      value:  Math.round(close * 100) / 100,
      open:   Math.round(open  * 100) / 100,
      high:   Math.round(high  * 100) / 100,
      low:    Math.round(low   * 100) / 100,
      close:  Math.round(close * 100) / 100,
      volume: vol,
      change: Math.round(change * 100) / 100,
    }
  })
}

/**
 * Fetch daily FX close rate.
 * Returns array of IndicatorData-shaped objects sorted oldest→newest.
 *
 * @param {number} indicatorId
 * @param {string} fromSymbol  - e.g. 'USD'
 * @param {string} toSymbol    - e.g. 'KRW'
 * @param {number} [limit=100]
 */
export async function fetchForexDaily(indicatorId, fromSymbol, toSymbol, limit = 100) {
  if (!apiKey()) throw new Error('ALPHA_VANTAGE_API_KEY not set')

  const json = await fetchJSON({
    function: 'FX_DAILY',
    from_symbol: fromSymbol,
    to_symbol:   toSymbol,
    outputsize:  'compact',
  })

  const key    = `Time Series FX (Daily)`
  const series = json[key]
  if (!series) throw new Error(`No FX data for ${fromSymbol}/${toSymbol}`)

  const entries = Object.entries(series)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)

  return entries.map(([date, ohlc], i) => {
    const close = parseFloat(ohlc['4. close'])
    const prev  = i > 0 ? parseFloat(entries[i - 1][1]['4. close']) : close
    const change = prev ? ((close - prev) / prev) * 100 : 0
    return {
      id: i + 1,
      indicatorId,
      date,
      value:  Math.round(close * 4) / 4,  // round to 0.25 for KRW
      open:   parseFloat(ohlc['1. open']),
      high:   parseFloat(ohlc['2. high']),
      low:    parseFloat(ohlc['3. low']),
      close:  Math.round(close * 4) / 4,
      volume: null,
      change: Math.round(change * 100) / 100,
    }
  })
}

/**
 * Fetch the most recent quote for a symbol.
 * Returns { value, change } or null.
 *
 * @param {number} indicatorId
 * @param {string} symbol
 */
export async function fetchLatestQuote(indicatorId, symbol) {
  if (!apiKey()) throw new Error('ALPHA_VANTAGE_API_KEY not set')

  const json = await fetchJSON({ function: 'GLOBAL_QUOTE', symbol })
  const quote = json['Global Quote']
  if (!quote || !quote['05. price']) return null

  const value  = parseFloat(quote['05. price'])
  const change = parseFloat(quote['10. change percent']?.replace('%', '') ?? '0')
  return { indicatorId, value: Math.round(value * 100) / 100, change: Math.round(change * 100) / 100 }
}

export function isAvailable() {
  return !!apiKey()
}
