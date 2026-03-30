/**
 * 지표별 학습 정보 — 툴팁에서 사용
 * symbol 기준으로 매칭, 없으면 category fallback
 */

export interface IndicatorDescription {
  definition: string
  importance: string
  related: string[]
}

/** symbol → 설명 */
export const INDICATOR_DESCRIPTIONS: Record<string, IndicatorDescription> = {
  // ── STOCK ──
  '^GSPC': {
    definition: '미국 대형주 500개로 구성된 시가총액 가중 지수',
    importance: '미국 주식시장의 대표 벤치마크로, 글로벌 투자 심리의 바로미터',
    related: ['NASDAQ', 'VIX', 'US 10Y Treasury'],
  },
  '^IXIC': {
    definition: '나스닥 거래소 상장 종목 전체를 포함하는 지수',
    importance: '기술주 중심 구성으로, IT·성장주 흐름을 대표',
    related: ['S&P 500', 'SOX (반도체)', 'US 10Y Treasury'],
  },
  '^KS11': {
    definition: '한국 유가증권시장(KOSPI) 전 종목 시가총액 가중 지수',
    importance: '한국 경제와 수출 기업 체력을 반영하는 핵심 지표',
    related: ['USD/KRW', 'KOSDAQ', 'Korea Base Rate'],
  },

  // ── FOREX ──
  'EURUSD=X': {
    definition: '유로 1단위를 미국 달러로 표시한 환율',
    importance: '세계 최대 거래량의 환율 쌍으로, 달러 강세/약세의 기준',
    related: ['USD/KRW', 'DXY (달러 인덱스)', 'ECB 기준금리'],
  },
  'USDKRW=X': {
    definition: '미국 달러 1단위를 원화로 표시한 환율',
    importance: '한국 수출입 비용과 외국인 투자 흐름에 직접 영향',
    related: ['KOSPI', 'US 10Y Treasury', 'Korea Base Rate'],
  },

  // ── CRYPTO ──
  'bitcoin': {
    definition: '최초의 탈중앙화 디지털 화폐',
    importance: '암호화폐 시장의 기준이자, 위험자산 선호도의 지표',
    related: ['Ethereum', 'NASDAQ', 'Gold'],
  },
  'ethereum': {
    definition: '스마트 컨트랙트 플랫폼 이더리움의 기본 토큰',
    importance: 'DeFi·NFT 생태계의 기반으로, 블록체인 기술 채택의 척도',
    related: ['Bitcoin', 'NASDAQ', 'US 10Y Treasury'],
  },

  // ── MACRO ──
  'CPIAUCSL': {
    definition: '소비자가 구매하는 상품·서비스의 가격 변동을 측정',
    importance: '인플레이션의 핵심 지표로, 금리 정책에 직접적 영향',
    related: ['PCE', 'Korea Base Rate', 'US 10Y Treasury'],
  },
  'GDP': {
    definition: '일정 기간 한 나라에서 생산된 재화·서비스의 총 시장 가치',
    importance: '경제 성장의 가장 포괄적인 척도',
    related: ['실업률', 'CPI', 'S&P 500'],
  },
  'BOK_BASE_RATE': {
    definition: '한국은행이 설정하는 기준금리',
    importance: '대출·예금 금리의 기준이며, 부동산·주식 등 자산 가격에 영향',
    related: ['USD/KRW', 'KOSPI', 'US CPI'],
  },

  // ── BOND ──
  '^TNX': {
    definition: '미국 10년 만기 국채의 시장 수익률',
    importance: '무위험 수익률의 기준으로, 주식 밸류에이션과 모기지 금리에 영향',
    related: ['US 2Y Treasury', 'S&P 500', 'Gold'],
  },
  '^IRX': {
    definition: '미국 2년 만기 국채의 시장 수익률',
    importance: 'Fed 금리 기대를 반영하며, 장단기 금리차(스프레드) 계산에 사용',
    related: ['US 10Y Treasury', 'Fed Funds Rate', 'USD/KRW'],
  },

  // ── COMMODITY ──
  'GC=F': {
    definition: '국제 금 선물 가격 (트로이온스 기준, USD)',
    importance: '안전자산의 대표로, 인플레이션 헤지 및 지정학 리스크 지표',
    related: ['US 10Y Treasury', 'DXY', 'Silver'],
  },
  'CL=F': {
    definition: 'WTI 원유 선물 가격 (배럴 기준, USD)',
    importance: '에너지 비용의 기준으로, 인플레이션과 경제 활동 수준을 반영',
    related: ['CPI', 'S&P 500', '천연가스'],
  },
}

/** category 기본 설명 (symbol 매칭 실패 시 fallback) */
export const CATEGORY_DESCRIPTIONS: Record<string, IndicatorDescription> = {
  STOCK: {
    definition: '기업 주식의 가격을 종합한 시장 지수',
    importance: '경제 건전성과 투자 심리를 반영',
    related: ['채권', '환율'],
  },
  FOREX: {
    definition: '두 통화 간의 교환 비율',
    importance: '국제 무역과 자본 흐름의 핵심 변수',
    related: ['금리', '무역수지'],
  },
  CRYPTO: {
    definition: '블록체인 기반의 디지털 자산',
    importance: '위험자산 선호도와 기술 채택의 지표',
    related: ['나스닥', '금리'],
  },
  MACRO: {
    definition: '국가 경제 전반의 건강을 측정하는 거시 지표',
    importance: '정부와 중앙은행의 정책 결정에 직접 영향',
    related: ['금리', 'GDP', 'CPI'],
  },
  BOND: {
    definition: '정부·기업이 발행한 채권의 수익률',
    importance: '금리 기대와 경제 전망을 반영하는 핵심 지표',
    related: ['기준금리', '주식', '인플레이션'],
  },
  COMMODITY: {
    definition: '원자재·에너지 등 실물 자산의 시장 가격',
    importance: '인플레이션, 공급망, 글로벌 수요를 반영',
    related: ['CPI', '환율'],
  },
}

export function getIndicatorDescription(symbol: string, category: string): IndicatorDescription {
  return INDICATOR_DESCRIPTIONS[symbol] ?? CATEGORY_DESCRIPTIONS[category] ?? {
    definition: '경제 지표',
    importance: '시장 동향 파악에 활용',
    related: [],
  }
}
