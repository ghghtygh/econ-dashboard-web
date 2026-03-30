/**
 * 지표별 학습 정보 — 툴팁 및 학습 패널에서 사용
 * symbol 기준으로 매칭, 없으면 category fallback
 */

export interface ThresholdLevel {
  level: number
  label: string
  severity: 'safe' | 'warning' | 'danger'
}

export interface IndicatorDescription {
  definition: string
  importance: string
  related: string[]
  /** 주요 임계값 (학습용) */
  thresholds?: ThresholdLevel[]
  /** 해석 가이드: "이 지표가 오르면 ___" */
  interpretation?: string
  /** 학습 팁 */
  learnMore?: string
}

/** symbol → 설명 */
export const INDICATOR_DESCRIPTIONS: Record<string, IndicatorDescription> = {
  // ── STOCK ──
  '^GSPC': {
    definition: '미국 대형주 500개로 구성된 시가총액 가중 지수',
    importance: '미국 주식시장의 대표 벤치마크로, 글로벌 투자 심리의 바로미터',
    related: ['NASDAQ', 'VIX', 'US 10Y Treasury'],
    interpretation: 'S&P 500이 상승하면 미국 경제 낙관론이 확산되고, 위험자산 선호가 강해집니다.',
    learnMore: '시가총액 가중 방식이므로 Apple, Microsoft 등 대형주의 영향이 큽니다.',
  },
  '^IXIC': {
    definition: '나스닥 거래소 상장 종목 전체를 포함하는 지수',
    importance: '기술주 중심 구성으로, IT·성장주 흐름을 대표',
    related: ['S&P 500', 'SOX (반도체)', 'US 10Y Treasury'],
    interpretation: '기술주 실적과 성장 기대에 민감합니다. 금리 상승 시 하락 압력을 받습니다.',
  },
  '^KS11': {
    definition: '한국 유가증권시장(KOSPI) 전 종목 시가총액 가중 지수',
    importance: '한국 경제와 수출 기업 체력을 반영하는 핵심 지표',
    related: ['USD/KRW', 'KOSDAQ', 'Korea Base Rate'],
    interpretation: '반도체·자동차 등 수출 산업과 원/달러 환율에 큰 영향을 받습니다.',
  },
  '^KQ11': {
    definition: '코스닥 시장에 상장된 종목들의 시가총액 가중 지수',
    importance: '중소형주·기술주 중심으로, 코스피보다 변동성이 크고 성장주 흐름을 반영',
    related: ['KOSPI', 'USD/KRW', 'NASDAQ'],
    interpretation: '바이오·IT 등 성장 산업의 기대감을 반영하며, 개인 투자자 참여 비율이 높습니다.',
  },
  '^DJI': {
    definition: '미국 우량 대형주 30개로 구성된 가격 가중 지수',
    importance: '130년 이상의 역사를 가진 미국 증시의 상징적 지표',
    related: ['S&P 500', 'NASDAQ', 'Russell 2000'],
    interpretation: '가격 가중 방식이라 고가 종목의 영향이 큽니다. 산업재·금융주 비중이 높습니다.',
    learnMore: '30개 종목만 포함하므로 시장 전체를 대표하기엔 한계가 있지만, 시장 심리의 바로미터로 사용됩니다.',
  },
  '^RUT': {
    definition: '미국 소형주 2000개로 구성된 Russell 2000 지수',
    importance: '소형주 건전성은 내수 경제의 바로미터로, 경기 순환의 선행 신호',
    related: ['S&P 500', 'Russell 1000', 'US GDP'],
    interpretation: '소형주는 내수 의존도가 높아 미국 경제 전망에 더 민감하게 반응합니다.',
    learnMore: 'Russell 2000이 대형주 대비 강세이면 경기 확장 초기, 약세이면 경기 후반부 신호일 수 있습니다.',
  },

  // ── FOREX ──
  'EURUSD=X': {
    definition: '유로 1단위를 미국 달러로 표시한 환율',
    importance: '세계 최대 거래량의 환율 쌍으로, 달러 강세/약세의 기준',
    related: ['USD/KRW', 'DXY (달러 인덱스)', 'ECB 기준금리'],
    interpretation: '유로 강세(수치 상승)는 달러 약세를 의미하며, 미국 수출 기업에 유리합니다.',
  },
  'USDKRW=X': {
    definition: '미국 달러 1단위를 원화로 표시한 환율',
    importance: '한국 수출입 비용과 외국인 투자 흐름에 직접 영향',
    related: ['KOSPI', 'US 10Y Treasury', 'Korea Base Rate'],
    interpretation: '환율 상승(원화 약세)은 수출 기업에 유리하지만, 수입 물가 상승으로 인플레이션 압력이 됩니다.',
    thresholds: [
      { level: 1200, label: '안정 구간', severity: 'safe' },
      { level: 1300, label: '주의 구간', severity: 'warning' },
      { level: 1400, label: '위험 구간 (외환위기 우려)', severity: 'danger' },
    ],
  },

  // ── CRYPTO ──
  'bitcoin': {
    definition: '최초의 탈중앙화 디지털 화폐',
    importance: '암호화폐 시장의 기준이자, 위험자산 선호도의 지표',
    related: ['Ethereum', 'NASDAQ', 'Gold'],
    interpretation: '비트코인 상승은 위험자산 선호(Risk-on) 심리를 반영합니다. 금과 역상관인 경우가 많습니다.',
  },
  'ethereum': {
    definition: '스마트 컨트랙트 플랫폼 이더리움의 기본 토큰',
    importance: 'DeFi·NFT 생태계의 기반으로, 블록체인 기술 채택의 척도',
    related: ['Bitcoin', 'NASDAQ', 'US 10Y Treasury'],
    interpretation: 'ETH/BTC 비율이 높아지면 알트코인 시장 강세(알트 시즌)를 나타냅니다.',
  },

  // ── MACRO ──
  'CPIAUCSL': {
    definition: '소비자가 구매하는 상품·서비스의 가격 변동을 측정 (전년 동월 대비 %)',
    importance: '인플레이션의 핵심 지표로, 금리 정책에 직접적 영향',
    related: ['PCE', 'Fed Funds Rate', 'US 10Y Treasury'],
    thresholds: [
      { level: 2, label: 'Fed 목표치 (안정)', severity: 'safe' },
      { level: 3, label: '주의 구간', severity: 'warning' },
      { level: 5, label: '고인플레이션 (긴축 가능성 높음)', severity: 'danger' },
    ],
    interpretation: 'CPI 상승 → Fed 금리 인상 가능성 → 채권 가격 하락, 주식 밸류에이션 하락 압력',
    learnMore: '근원 CPI(Core CPI)는 변동성 큰 식품·에너지를 제외하여 기저 물가 흐름을 파악합니다.',
  },
  'UNRATE': {
    definition: '노동 인구 중 일자리를 구하고 있지만 취업하지 못한 비율',
    importance: '경기 상태를 직접 반영하는 후행 지표이자 Fed 듀얼 맨데이트의 한 축',
    related: ['CPI', 'GDP', 'Fed Funds Rate'],
    thresholds: [
      { level: 4, label: '완전 고용에 가까운 수준', severity: 'safe' },
      { level: 5, label: '경기 둔화 신호', severity: 'warning' },
      { level: 7, label: '경기 침체 수준', severity: 'danger' },
    ],
    interpretation: '실업률 급등은 경기 침체 신호이며, Fed의 금리 인하 근거가 됩니다.',
    learnMore: 'U-3(공식 실업률)보다 U-6(광의 실업률)가 더 포괄적인 노동시장 상태를 보여줍니다.',
  },
  'PCEPI': {
    definition: '개인소비지출 물가지수 — Fed가 선호하는 인플레이션 지표',
    importance: 'CPI보다 소비 패턴 변화를 반영하며, Fed 통화정책의 공식 기준',
    related: ['CPI', 'Fed Funds Rate', 'GDP'],
    thresholds: [
      { level: 2, label: 'Fed 목표치 (안정)', severity: 'safe' },
      { level: 2.5, label: '목표 초과 (주의)', severity: 'warning' },
      { level: 4, label: '긴축 압력 강함', severity: 'danger' },
    ],
    interpretation: 'PCE가 2% 이상이면 Fed는 금리를 유지하거나 인상할 유인이 있습니다.',
    learnMore: 'Core PCE(근원 PCE)는 식품·에너지 제외 수치로, FOMC 성명서에 직접 인용됩니다.',
  },
  'ISM_PMI': {
    definition: 'ISM 제조업 구매관리자지수 — 제조업 경기 확장/수축을 측정',
    importance: '50 기준으로 확장/수축을 판단하는 핵심 선행 지표',
    related: ['GDP', 'S&P 500', '실업률'],
    thresholds: [
      { level: 55, label: '강한 확장', severity: 'safe' },
      { level: 50, label: '확장/수축 기준선', severity: 'warning' },
      { level: 45, label: '뚜렷한 수축 (경기 침체 우려)', severity: 'danger' },
    ],
    interpretation: 'PMI > 50이면 제조업 확장, < 50이면 수축입니다. GDP 성장률과 밀접한 관계가 있습니다.',
    learnMore: '서비스 PMI도 함께 보면 경제 전체의 건강 상태를 더 정확히 파악할 수 있습니다.',
  },
  'UMCSENT': {
    definition: '미시간대학교가 소비자 설문으로 측정하는 경기 체감 지수',
    importance: '소비 심리는 GDP의 70%를 차지하는 소비 지출의 선행 지표',
    related: ['소비자 신뢰지수', 'CPI', 'S&P 500'],
    thresholds: [
      { level: 80, label: '긍정적 심리', severity: 'safe' },
      { level: 65, label: '주의 구간', severity: 'warning' },
      { level: 50, label: '극도로 비관적 (소비 위축 우려)', severity: 'danger' },
    ],
    interpretation: '소비자심리 하락 → 소비 지출 감소 → 경기 둔화 가능성 증가',
    learnMore: '1966년 이후 데이터가 축적되어 있어 장기 트렌드 비교에 유용합니다.',
  },
  'GDP': {
    definition: '일정 기간 한 나라에서 생산된 재화·서비스의 총 시장 가치',
    importance: '경제 성장의 가장 포괄적인 척도',
    related: ['실업률', 'CPI', 'S&P 500'],
    thresholds: [
      { level: 3, label: '건강한 성장', severity: 'safe' },
      { level: 1, label: '둔화', severity: 'warning' },
      { level: 0, label: '경기 침체 (2분기 연속 마이너스)', severity: 'danger' },
    ],
    interpretation: 'GDP 성장률 하락 → 기업 실적 악화 → 주식시장 하락 압력',
  },
  'BOK_BASE_RATE': {
    definition: '한국은행이 설정하는 기준금리',
    importance: '대출·예금 금리의 기준이며, 부동산·주식 등 자산 가격에 영향',
    related: ['USD/KRW', 'KOSPI', 'US CPI'],
    interpretation: '기준금리 인상 → 대출 금리 상승 → 소비·투자 위축 → 물가 안정 효과',
    learnMore: '한국은행 금통위는 연 8회 기준금리를 결정합니다.',
  },

  // ── BOND ──
  '^TNX': {
    definition: '미국 10년 만기 국채의 시장 수익률',
    importance: '무위험 수익률의 기준으로, 주식 밸류에이션과 모기지 금리에 영향',
    related: ['US 2Y Treasury', 'S&P 500', 'Gold'],
    thresholds: [
      { level: 3, label: '중립적 수준', severity: 'safe' },
      { level: 4, label: '긴축적 (주식 부담)', severity: 'warning' },
      { level: 5, label: '매우 긴축적', severity: 'danger' },
    ],
    interpretation: '10년물 금리 상승 → 주식 할인율 상승 → 성장주 밸류에이션 하락 압력',
    learnMore: '10Y-2Y 스프레드(장단기 금리차)는 경기 침체의 대표 선행 지표입니다.',
  },
  '^IRX': {
    definition: '미국 2년 만기 국채의 시장 수익률',
    importance: 'Fed 금리 기대를 반영하며, 장단기 금리차(스프레드) 계산에 사용',
    related: ['US 10Y Treasury', 'Fed Funds Rate', 'USD/KRW'],
    interpretation: '2년물은 시장의 향후 Fed 금리 경로 기대를 반영합니다.',
  },
  'T10Y2Y': {
    definition: '미국 10년물 국채 수익률에서 2년물 수익률을 뺀 값',
    importance: '수익률 곡선 역전(마이너스)은 경기 침체의 가장 신뢰도 높은 선행 지표',
    related: ['US 10Y Treasury', 'US 2Y Treasury', 'Fed Funds Rate'],
    thresholds: [
      { level: 1, label: '정상적 곡선 (경기 확장)', severity: 'safe' },
      { level: 0, label: '평탄화 (경기 후반부)', severity: 'warning' },
      { level: -0.5, label: '역전 (경기 침체 경고)', severity: 'danger' },
    ],
    interpretation: '역전(음수) → 단기 금리 > 장기 금리 → 시장이 향후 금리 인하(경기 침체)를 예상',
    learnMore: '1960년대 이후 모든 미국 경기 침체 전에 역전이 발생했습니다. 역전 후 침체까지 평균 12~18개월.',
  },
  'KR10Y': {
    definition: '한국 10년 만기 국채의 시장 수익률',
    importance: '한국 채권시장의 기준 금리로, 대출금리와 자산시장에 영향',
    related: ['BOK 기준금리', 'KOSPI', 'USD/KRW'],
    interpretation: '한국 국채 금리 상승 → 채권 가격 하락, 대출 금리 상승, 부동산 시장 부담',
  },

  // ── COMMODITY ──
  'GC=F': {
    definition: '국제 금 선물 가격 (트로이온스 기준, USD)',
    importance: '안전자산의 대표로, 인플레이션 헤지 및 지정학 리스크 지표',
    related: ['US 10Y Treasury', 'DXY', 'Silver'],
    interpretation: '금 가격 상승 → 불확실성 증가 또는 인플레이션 기대 상승 신호',
    learnMore: '금은 실질금리(명목금리 - 인플레이션)와 강한 역상관 관계를 가집니다.',
  },
  'CL=F': {
    definition: 'WTI 원유 선물 가격 (배럴 기준, USD)',
    importance: '에너지 비용의 기준으로, 인플레이션과 경제 활동 수준을 반영',
    related: ['CPI', 'S&P 500', '천연가스'],
    thresholds: [
      { level: 60, label: '저유가 (소비자 유리)', severity: 'safe' },
      { level: 80, label: '중립', severity: 'warning' },
      { level: 100, label: '고유가 (인플레이션 압력)', severity: 'danger' },
    ],
    interpretation: '유가 상승 → 운송·제조 비용 증가 → CPI 상승 → 금리 인상 압력',
  },
  'NG=F': {
    definition: '천연가스 선물 가격 (MMBtu 기준, USD)',
    importance: '난방·발전 비용의 핵심 변수로, 계절성이 강한 원자재',
    related: ['원유', 'CPI', '유틸리티 섹터'],
    interpretation: '천연가스 가격 상승 → 전기·난방비 상승 → CPI에 반영',
    learnMore: '겨울철(11~2월) 수요 증가로 계절적 가격 패턴이 뚜렷합니다.',
  },
  'HG=F': {
    definition: '구리 선물 가격 (파운드 기준, USD)',
    importance: '"Dr. Copper"라 불리며, 글로벌 경기 선행 지표로 활용',
    related: ['중국 PMI', '건설 지표', '글로벌 GDP'],
    interpretation: '구리 가격 상승 → 건설·제조업 활황 → 글로벌 경기 확장 신호',
    learnMore: '구리는 건설·전자·자동차 등 광범위하게 사용되어 경기 민감도가 매우 높습니다.',
  },
  'ZW=F': {
    definition: '밀 선물 가격 (부셸 기준, USD)',
    importance: '주요 곡물로서 식량 가격과 신흥국 물가에 직접 영향',
    related: ['콩', 'CPI', '지정학 리스크'],
    interpretation: '밀 가격 급등 → 식품 물가 상승 → 신흥국 사회 불안 가능성',
    learnMore: '우크라이나·러시아가 세계 밀 수출의 약 30%를 차지합니다.',
  },
  'ZS=F': {
    definition: '콩(대두) 선물 가격 (부셸 기준, USD)',
    importance: '사료·식용유의 핵심 원료로, 농산물 시장의 벤치마크',
    related: ['밀', '옥수수', '브라질 헤알'],
    interpretation: '콩 가격은 남미 작황과 중국 수요에 큰 영향을 받습니다.',
  },

  // ── 시장 심리 지표 ──
  '^VIX': {
    definition: 'S&P 500 옵션의 내재 변동성으로 산출한 "공포 지수"',
    importance: '시장 불확실성과 투자자 공포 수준을 실시간으로 반영',
    related: ['S&P 500', 'Put/Call Ratio', '금'],
    thresholds: [
      { level: 15, label: '낮은 변동성 (안도)', severity: 'safe' },
      { level: 20, label: '보통 (경계)', severity: 'warning' },
      { level: 30, label: '높은 공포 (시장 불안)', severity: 'danger' },
    ],
    interpretation: 'VIX 급등 → 주식시장 급락 가능성. 단, VIX가 극단적으로 높을 때는 역발상 매수 기회일 수 있습니다.',
    learnMore: 'VIX는 향후 30일간의 예상 변동성을 나타냅니다. "공포 지수"라는 별명이 있습니다.',
  },
  'FEAR_GREED': {
    definition: '7개 시장 지표를 종합하여 0(극도의 공포)~100(극도의 탐욕)으로 표시',
    importance: '투자 심리의 극단을 포착하여 역발상 투자 타이밍에 활용',
    related: ['VIX', 'S&P 500', 'Put/Call Ratio'],
    thresholds: [
      { level: 25, label: '극도의 공포 (매수 기회?)', severity: 'danger' },
      { level: 45, label: '공포', severity: 'warning' },
      { level: 55, label: '중립', severity: 'safe' },
      { level: 75, label: '탐욕', severity: 'warning' },
      { level: 90, label: '극도의 탐욕 (과열 주의)', severity: 'danger' },
    ],
    interpretation: '"남들이 두려워할 때 탐욕을, 남들이 탐욕스러울 때 두려움을" — 워런 버핏',
    learnMore: 'CNN에서 발표하며, VIX·Put/Call·정크본드 스프레드·모멘텀·시장 폭 등 7개 하위 지표로 구성됩니다.',
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
