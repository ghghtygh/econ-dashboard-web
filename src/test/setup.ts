import '@testing-library/jest-dom'
import { vi } from 'vitest'

// react-grid-layout mock
vi.mock('react-grid-layout', () => {
  const React = require('react')
  return {
    ResponsiveGridLayout: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'grid-layout' }, children),
  }
})

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
