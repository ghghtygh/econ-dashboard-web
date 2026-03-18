# Econ Dashboard Web

경제 지표 대시보드 서비스의 프론트엔드 애플리케이션입니다.
React 19 + Vite 기반으로, Grafana 스타일의 위젯 기반 대시보드 UI를 제공합니다.

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| Framework | React | 19.2 |
| Build | Vite | 7.3 |
| Language | TypeScript | 5.9 |
| CSS | TailwindCSS | 4.2 |
| State | Zustand (persist) | 5.0 |
| Server State | TanStack React Query | 5.90 |
| Charts | Recharts | 3.8 |
| HTTP | Axios | 1.13 |
| Icons | Lucide React | 0.577 |
| Date | date-fns | 4.1 |

## 프로젝트 구조

```
web/src/
├── components/
│   ├── charts/
│   │   └── LineChart.tsx           # Recharts 기반 라인 차트
│   ├── dashboard/
│   │   └── IndicatorCard.tsx       # 지표 카드 (가격, 변동률)
│   └── layout/
│       └── Header.tsx              # 상단 헤더
├── pages/
│   └── DashboardPage.tsx           # 메인 대시보드 (목업 데이터)
├── services/
│   └── api.ts                      # Axios 인스턴스 + API 함수 정의
├── store/
│   └── dashboardStore.ts           # Zustand 스토어 (위젯/지표 상태)
├── types/
│   └── indicator.ts                # 타입 정의 (Indicator, Widget 등)
├── lib/
│   └── utils.ts                    # cn() 유틸리티
├── App.tsx                         # 앱 루트 (React Query Provider)
└── main.tsx                        # 엔트리 포인트
```

## 시작하기

### 사전 준비

- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
cd web
npm install
npm run dev
```

개발 서버: `http://localhost:5173`

### 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 기타 스크립트

```bash
npm run lint      # ESLint 실행
npm run preview   # 빌드 결과 미리보기
```

## 주요 설정

| 항목 | 값 |
|------|-----|
| 개발 서버 | localhost:5173 |
| API 프록시 | `/api` -> `localhost:8080` |
| React Query staleTime | 5분 |
| Zustand persist | localStorage (key: `econ-dashboard`) |

## 화면 구성

```
┌──────────────────────────────────────────────────────────┐
│  [BarChart2] Econ Dashboard             경제 지표 대시보드  │  <- Header
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [LayoutDashboard] 대시보드                               │
│                                                          │
│  주요 지표                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ KOSPI   │ │ S&P 500 │ │ USD/KRW │ │ Bitcoin │ ...   │  <- IndicatorCard x6
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                          │
│  차트                                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │          백엔드 API 연동 후 차트가 표시됩니다        │   │  <- 플레이스홀더
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 주요 컴포넌트

### Header
상단 네비게이션 바. 프로젝트 로고와 제목을 표시합니다.

### IndicatorCard
경제 지표 요약 카드. 카테고리, 현재 가격, 변동률 등을 표시합니다.

### LineChart
Recharts 기반 시계열 라인 차트. 지표 데이터를 시각화합니다.

### DashboardPage
메인 대시보드 페이지. IndicatorCard 그리드와 차트 영역으로 구성됩니다.

## 상태 관리

- **Zustand**: 클라이언트 상태 (위젯 배치, 사용자 설정). localStorage에 persist.
- **React Query**: 서버 상태 (API 데이터). 5분 staleTime 적용.

## 현재 구현 상태

| 기능 | 상태 |
|------|------|
| 기본 레이아웃 (Header, DashboardPage) | 완료 |
| 지표 카드 컴포넌트 (IndicatorCard) | 완료 |
| 차트 컴포넌트 (LineChart) | 완료 |
| 상태 관리 (Zustand + React Query) | 완료 |
| API 클라이언트 (Axios) | 완료 |
| 백엔드 API 연동 | 미완료 |
| 드래그 앤 드롭 위젯 | 미구현 |
| 추가 차트 타입 | 미구현 |
| 반응형 레이아웃 | 미구현 |

## 확장 계획

```
web/src/
├── components/
│   ├── charts/         # LineChart, BarChart, AreaChart, CandlestickChart
│   ├── dashboard/      # IndicatorCard, WidgetGrid, WidgetEditor
│   ├── layout/         # Header, Sidebar, Footer
│   └── ui/             # 공통 UI (Button, Modal, Dropdown, Toast)
├── pages/
│   ├── DashboardPage   # 메인 대시보드
│   ├── ExplorePage     # 지표 탐색/검색
│   ├── SettingsPage    # 설정
│   └── NewsPage        # 경제 뉴스
├── hooks/              # 커스텀 훅 (useIndicator, useWebSocket 등)
├── services/           # API 클라이언트
├── store/              # Zustand 스토어
├── types/              # TypeScript 타입
└── lib/                # 유틸리티
```
