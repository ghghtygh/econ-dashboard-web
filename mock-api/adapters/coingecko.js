/**
 * CoinGecko Public API Adapter
 * Free tier – no API key required, rate limit: ~30 calls/min
 *
 * Docs: https://www.coingecko.com/en/api/documentation
 */

const BASE = 'https://api.coingecko.com/api/v3'

// CoinGecko id → our indicator id mapping
const COIN_MAP = {
  bitcoin:  { id: 4, symbol: 'BTC' },
  ethereum: { id: 7, symbol: 'ETH' },
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${url}`)
  return res.json()
}

/**
 * Fetch current prices for all tracked coins.
 * Returns Map<indicatorId, { value, change }>
 */
export async function fetchCurrentPrices() {
  const ids = Object.keys(COIN_MAP).join(',')
  const data = await fetchJSON(
    `${BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  )
  const result = new Map()
  for (const [coinId, meta] of Object.entries(COIN_MAP)) {
    const entry = data[coinId]
    if (entry) {
      result.set(meta.id, {
        value: entry.usd,
        change: entry.usd_24h_change != null
          ? Math.round(entry.usd_24h_change * 100) / 100
          : null,
      })
    }
  }
  return result
}

/**
 * Fetch daily OHLC history for a single coin (up to 90 days free).
 * Returns array of IndicatorData-shaped objects.
 *
 * @param {number} indicatorId
 * @param {string} coinId - e.g. 'bitcoin'
 * @param {number} days
 */
export async function fetchHistoricalPrices(indicatorId, coinId, days = 90) {
  const data = await fetchJSON(
    `${BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
  )
  const prices = data.prices ?? []
  const result = []
  for (let i = 0; i < prices.length; i++) {
    const [ts, value] = prices[i]
    const prev = i > 0 ? prices[i - 1][1] : value
    const change = prev ? ((value - prev) / prev) * 100 : 0
    result.push({
      id: i + 1,
      indicatorId,
      date: new Date(ts).toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      open: null, high: null, low: null, close: null, volume: null,
      change: Math.round(change * 100) / 100,
    })
  }
  return result
}

export const COINS = Object.entries(COIN_MAP).map(([coinId, meta]) => ({ coinId, ...meta }))
