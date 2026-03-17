/**
 * GET /api/auth/facebook-url 동작 검증.
 * 에이전트가 `npm test`로 실행해 같은 탭 이동 URL·redirect 응답을 확인할 수 있음.
 */

const NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
const NEXT_PUBLIC_ANON_KEY = 'test-anon-key'

describe('GET /api/auth/facebook-url', () => {
  const origEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...origEnv,
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: 'https://www.mytripfy.com',
    }
  })

  afterAll(() => {
    process.env = origEnv
  })

  it('redirect=1 이면 200 HTML + location.replace용 URL 포함', async () => {
    const { GET } = await import('@/app/api/auth/facebook-url/route')
    const url = `https://example.com/api/auth/facebook-url?locale=ko&redirect=1`
    const res = await GET(new Request(url))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()
    expect(html).toContain('location.replace')
    expect(html).toContain('provider=facebook')
    expect(html).toContain('auth/v1/authorize')
  })

  it('redirect 없으면 JSON으로 url 반환', async () => {
    const { GET } = await import('@/app/api/auth/facebook-url/route')
    const url = `https://example.com/api/auth/facebook-url?locale=ja`
    const res = await GET(new Request(url))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBeDefined()
    expect(json.url).toContain('provider=facebook')
    expect(json.url).toContain('auth/v1/authorize')
  })

  it('env 없으면 500 + error 메시지', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_ANON_KEY = ''
    jest.resetModules()
    const { GET } = await import('@/app/api/auth/facebook-url/route')
    const url = `https://example.com/api/auth/facebook-url?locale=en`
    const res = await GET(new Request(url))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})
