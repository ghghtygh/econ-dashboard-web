import type { EconomicEvent } from '@/types/calendar'

/** 주요 경제 이벤트 — 학습용 상세 설명 포함 */
export const ECONOMIC_EVENTS: EconomicEvent[] = [
  // ── 1월 ──
  {
    id: 'fomc-2026-01',
    title: 'FOMC 금리 결정',
    date: '2026-01-28',
    time: '03:00',
    importance: 'high',
    category: 'FOMC',
    description:
      '연방공개시장위원회(FOMC)는 연 8회 회의를 열어 기준금리를 결정합니다. 금리 변경은 달러, 채권, 주식 등 모든 자산에 영향을 미칩니다.',
    actual: '4.25%',
    forecast: '4.25%',
    previous: '4.50%',
    status: 'completed',
  },
  {
    id: 'bok-2026-01',
    title: '한국은행 기준금리 결정',
    date: '2026-01-16',
    time: '10:00',
    importance: 'high',
    category: 'BOK',
    description:
      '한국은행 금융통화위원회는 연 8회 기준금리를 결정합니다. 한국 원화 가치, 부동산 시장, 가계 대출 금리에 직접적인 영향을 줍니다.',
    actual: '2.75%',
    forecast: '2.75%',
    previous: '3.00%',
    status: 'completed',
  },

  // ── 2월 ──
  {
    id: 'nfp-2026-02',
    title: '미국 비농업 고용지표 (NFP)',
    date: '2026-02-06',
    time: '22:30',
    importance: 'high',
    category: '고용',
    description:
      '비농업 고용지표(Non-Farm Payrolls)는 매월 첫째 금요일에 발표되며, 농업을 제외한 신규 고용 수를 보여줍니다. 경기 건전성을 가늠하는 핵심 지표로 연준 통화정책에 큰 영향을 미칩니다.',
    actual: '+18.7만',
    forecast: '+17.5만',
    previous: '+21.3만',
    status: 'completed',
  },
  {
    id: 'cpi-2026-02',
    title: '미국 소비자물가지수 (CPI)',
    date: '2026-02-12',
    time: '22:30',
    importance: 'high',
    category: 'CPI',
    description:
      '소비자물가지수(CPI)는 소비자가 구매하는 상품·서비스의 가격 변동을 측정합니다. 인플레이션의 대표 지표로, 연준의 금리 결정에 가장 중요한 데이터 중 하나입니다.',
    actual: '2.8% YoY',
    forecast: '2.9% YoY',
    previous: '2.9% YoY',
    status: 'completed',
  },
  {
    id: 'ecb-2026-02',
    title: 'ECB 금리 결정',
    date: '2026-02-06',
    time: '21:45',
    importance: 'high',
    category: 'ECB',
    description:
      '유럽중앙은행(ECB)은 유로존 20개국의 통화정책을 결정합니다. ECB의 금리 결정은 유로화 가치와 유럽 경제 전반에 영향을 미치며, 글로벌 자금 흐름에도 파급됩니다.',
    actual: '2.75%',
    forecast: '2.75%',
    previous: '3.00%',
    status: 'completed',
  },

  // ── 3월 ──
  {
    id: 'ism-pmi-2026-03',
    title: 'ISM 제조업 PMI',
    date: '2026-03-02',
    time: '00:00',
    importance: 'medium',
    category: 'PMI',
    description:
      'ISM 제조업 구매관리자지수(PMI)는 제조업 경기를 선행적으로 보여주는 지표입니다. 50 이상이면 확장, 미만이면 수축을 의미합니다. 신규주문, 고용, 생산 등 세부 항목도 중요합니다.',
    actual: '50.3',
    forecast: '49.8',
    previous: '49.2',
    status: 'completed',
  },
  {
    id: 'nfp-2026-03',
    title: '미국 비농업 고용지표 (NFP)',
    date: '2026-03-06',
    time: '22:30',
    importance: 'high',
    category: '고용',
    description:
      '3월 고용보고서는 봄철 고용 시장의 방향성을 제시합니다. 실업률, 평균 시급 상승률도 함께 발표되어 임금 인플레이션 압력을 가늠할 수 있습니다.',
    actual: '+20.1만',
    forecast: '+19.0만',
    previous: '+18.7만',
    status: 'completed',
  },
  {
    id: 'cpi-2026-03',
    title: '미국 소비자물가지수 (CPI)',
    date: '2026-03-11',
    time: '22:30',
    importance: 'high',
    category: 'CPI',
    description:
      '근원 CPI(식품·에너지 제외)는 일시적 변동을 제거하여 기저 물가 추세를 보여줍니다. 연준이 특히 주목하는 지표이며, 시장 변동성이 매우 큽니다.',
    actual: '2.7% YoY',
    forecast: '2.8% YoY',
    previous: '2.8% YoY',
    status: 'completed',
  },
  {
    id: 'fomc-2026-03',
    title: 'FOMC 금리 결정',
    date: '2026-03-18',
    time: '03:00',
    importance: 'high',
    category: 'FOMC',
    description:
      '3월 FOMC는 경제전망요약(SEP)과 점도표(dot plot)를 함께 발표합니다. 위원들의 향후 금리 경로 전망을 확인할 수 있어 시장에 미치는 영향이 특히 큽니다.',
    actual: '4.25%',
    forecast: '4.25%',
    previous: '4.25%',
    status: 'completed',
  },
  {
    id: 'gdp-2026-03',
    title: '미국 4분기 GDP 확정치',
    date: '2026-03-26',
    time: '22:30',
    importance: 'medium',
    category: 'GDP',
    description:
      '국내총생산(GDP)은 한 나라의 경제 규모와 성장률을 보여주는 가장 포괄적인 지표입니다. 속보치→잠정치→확정치 순으로 발표되며, 확정치에서 큰 수정이 있으면 시장이 반응합니다.',
    actual: '2.4%',
    forecast: '2.3%',
    previous: '2.8%',
    status: 'completed',
  },

  // ── 4월 ──
  {
    id: 'ism-pmi-2026-04',
    title: 'ISM 제조업 PMI',
    date: '2026-04-01',
    time: '00:00',
    importance: 'medium',
    category: 'PMI',
    description:
      '4월 ISM PMI는 2분기 경기 방향을 가늠하는 첫 번째 선행지표입니다. 제조업 활동의 확장·수축 여부가 향후 산업생산, 고용에 선행 신호를 제공합니다.',
    forecast: '50.5',
    previous: '50.3',
    status: 'upcoming',
  },
  {
    id: 'nfp-2026-04',
    title: '미국 비농업 고용지표 (NFP)',
    date: '2026-04-03',
    time: '22:30',
    importance: 'high',
    category: '고용',
    description:
      '4월 고용보고서는 1분기 전체 노동시장 흐름을 마무리하는 데이터입니다. 고용 증가세가 둔화될 경우 연준의 금리 인하 기대가 높아질 수 있습니다.',
    forecast: '+18.0만',
    previous: '+20.1만',
    status: 'upcoming',
  },
  {
    id: 'cpi-2026-04',
    title: '미국 소비자물가지수 (CPI)',
    date: '2026-04-14',
    time: '22:30',
    importance: 'high',
    category: 'CPI',
    description:
      '봄철 CPI는 계절적 가격 변동(에너지, 의류 등)의 영향을 받을 수 있습니다. 3개월 연환산 근원 CPI 추세가 연준 목표(2%)에 수렴하는지 확인이 중요합니다.',
    forecast: '2.6% YoY',
    previous: '2.7% YoY',
    status: 'upcoming',
  },
  {
    id: 'ecb-2026-04',
    title: 'ECB 금리 결정',
    date: '2026-04-16',
    time: '21:45',
    importance: 'high',
    category: 'ECB',
    description:
      '유럽 경제 회복 속도와 인플레이션 둔화 추이에 따라 ECB의 추가 금리 인하 여부가 결정됩니다. 라가르드 총재의 기자회견에서 향후 통화정책 방향에 대한 힌트를 얻을 수 있습니다.',
    forecast: '2.50%',
    previous: '2.75%',
    status: 'upcoming',
  },
  {
    id: 'pce-2026-04',
    title: '미국 PCE 물가지수',
    date: '2026-04-30',
    time: '22:30',
    importance: 'high',
    category: 'PCE',
    description:
      '개인소비지출(PCE) 물가지수는 연준이 공식적으로 선호하는 인플레이션 지표입니다. CPI보다 포괄적인 소비 범위를 반영하며, 근원 PCE 2%가 연준의 목표치입니다.',
    forecast: '2.5% YoY',
    previous: '2.6% YoY',
    status: 'upcoming',
  },

  // ── 5월 ──
  {
    id: 'fomc-2026-05',
    title: 'FOMC 금리 결정',
    date: '2026-05-06',
    time: '03:00',
    importance: 'high',
    category: 'FOMC',
    description:
      '5월 FOMC는 1분기 경제 데이터를 종합 평가하는 회의입니다. 성명서의 문구 변화(특히 "추가 인상", "당분간 유지" 등)가 시장 방향성을 결정합니다.',
    forecast: '4.00%',
    previous: '4.25%',
    status: 'upcoming',
  },
  {
    id: 'bok-2026-05',
    title: '한국은행 기준금리 결정',
    date: '2026-05-28',
    time: '10:00',
    importance: 'high',
    category: 'BOK',
    description:
      '한국은행은 국내 경기 둔화와 가계부채 관리 사이에서 균형을 잡아야 합니다. 미국 연준과의 금리 차이가 원/달러 환율에 미치는 영향도 고려합니다.',
    forecast: '2.50%',
    previous: '2.75%',
    status: 'upcoming',
  },

  // ── 6월 ──
  {
    id: 'gdp-2026-06',
    title: '미국 1분기 GDP 잠정치',
    date: '2026-06-25',
    time: '22:30',
    importance: 'medium',
    category: 'GDP',
    description:
      '1분기 GDP 잠정치는 속보치 이후 추가 데이터를 반영한 수정치입니다. 소비·투자·정부지출·순수출 각 항목의 기여도를 분석하면 경기 흐름을 입체적으로 이해할 수 있습니다.',
    forecast: '2.1%',
    previous: '2.4%',
    status: 'upcoming',
  },
]

export const EVENT_CATEGORY_COLORS: Record<string, string> = {
  FOMC: '#378ADD',
  CPI: '#E24B4A',
  '고용': '#1D9E75',
  GDP: '#7F77DD',
  PCE: '#EF9F27',
  PMI: '#F59E0B',
  ECB: '#6366F1',
  BOK: '#EC4899',
}

export const IMPORTANCE_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: '매우 중요', color: '#E24B4A' },
  medium: { label: '중요', color: '#EF9F27' },
  low: { label: '참고', color: '#94a3b8' },
}
