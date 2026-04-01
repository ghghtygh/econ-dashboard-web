import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { errorBus } from '@/lib/errorBus'
import api, { indicatorApi, newsApi, dashboardApi } from '@/services/api'

function wrap<T>(data: T) {
  return { success: true, data, timestamp: new Date().toISOString() }
}

function emptyPaged() {
  return { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 }
}

describe('api 인터셉터 - 에러 핸들링', () => {
  let emittedMessages: string[]
  let unsubscribe: () => void

  beforeEach(() => {
    emittedMessages = []
    unsubscribe = errorBus.subscribe((msg) => emittedMessages.push(msg))
  })

  afterEach(() => {
    unsubscribe()
  })

  it('401 응답 시 인증 오류 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 401 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('인증이 필요합니다. 다시 로그인해주세요.')
  })

  it('403 응답 시 권한 오류 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 403 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('접근 권한이 없습니다.')
  })

  it('404 응답 시 데이터 없음 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 404 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('요청한 데이터를 찾을 수 없습니다.')
  })

  it('429 응답 시 요청 제한 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 429 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
  })

  it('400 응답 시 클라이언트 오류 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 400 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('요청 오류가 발생했습니다 (400).')
  })

  it('422 응답 시 클라이언트 오류 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 422 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('요청 오류가 발생했습니다 (422).')
  })

  it('500 응답 시 서버 오류 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 500 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('서버 오류가 발생했습니다 (500). 잠시 후 다시 시도해주세요.')
  })

  it('503 응답 시 서버 오류 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({}, { status: 503 })),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('서버 오류가 발생했습니다 (503). 잠시 후 다시 시도해주세요.')
  })

  it('네트워크 에러 시 연결 불가 메시지를 emit한다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.error()),
    )
    await expect(api.get('/indicators')).rejects.toThrow()
    expect(emittedMessages[0]).toBe('네트워크에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.')
  })

  it('성공 응답 시 errorBus에 아무것도 emit하지 않는다', async () => {
    server.use(
      http.get('/api/indicators', () => HttpResponse.json({ success: true, data: [] })),
    )
    const res = await api.get('/indicators')
    expect(res.status).toBe(200)
    expect(emittedMessages).toHaveLength(0)
  })
})

describe('indicatorApi', () => {
  it('getAll: category 없이 호출하면 params 없이 요청한다', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/indicators', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(wrap([]))
      }),
    )
    await indicatorApi.getAll()
    expect(capturedUrl).not.toContain('category')
  })

  it('getAll: category 있으면 쿼리 파라미터 포함한다', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/indicators', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(wrap([]))
      }),
    )
    await indicatorApi.getAll('STOCK')
    expect(capturedUrl).toContain('category=STOCK')
  })

  it('getById: 올바른 경로로 요청한다', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/indicators/:id', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(wrap({ id: 42, name: 'Test', symbol: 'TST', category: 'STOCK', unit: 'pts', source: 'test', description: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }))
      }),
    )
    await indicatorApi.getById('42')
    expect(capturedUrl).toContain('/indicators/42')
  })

  it('getData: from/to 파라미터를 포함한다', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/indicators/:id/data', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(wrap(emptyPaged()))
      }),
    )
    await indicatorApi.getData('1', '2024-01-01', '2024-12-31')
    expect(capturedUrl).toContain('from=2024-01-01')
    expect(capturedUrl).toContain('to=2024-12-31')
  })
})

describe('newsApi', () => {
  it('getList: 기본 page=0, size=20으로 요청한다', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/news', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(wrap(emptyPaged()))
      }),
    )
    await newsApi.getList()
    expect(capturedUrl).toContain('page=0')
    expect(capturedUrl).toContain('size=20')
  })

  it('getList: category가 있으면 쿼리에 포함한다', async () => {
    let capturedUrl = ''
    server.use(
      http.get('/api/news', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(wrap(emptyPaged()))
      }),
    )
    await newsApi.getList('MACRO', 1, 10)
    expect(capturedUrl).toContain('category=MACRO')
    expect(capturedUrl).toContain('page=1')
    expect(capturedUrl).toContain('size=10')
  })
})

describe('dashboardApi', () => {
  it('saveWidgets: POST /dashboard/widgets로 요청한다', async () => {
    let capturedBody: unknown
    server.use(
      http.post('/api/dashboard/widgets', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true, data: null })
      }),
    )
    await dashboardApi.saveWidgets([{ id: 'w1' }])
    expect(capturedBody).toEqual([{ id: 'w1' }])
  })
})
