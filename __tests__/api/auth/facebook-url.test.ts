/**
 * GET /api/auth/facebook-url 동작 검증.
 * 에이전트가 `npm test`로 실행해 확인할 수 있음.
 *
 * (환경 변수가 있을 때 200/HTML 반환은 Next 런타임에서 process.env 접근 방식 때문에
 * Jest에서 재현이 어려우므로, env 없을 때 500만 단위 테스트하고, 실제 플로우는 E2E 또는 수동으로 검증)
 */

describe('GET /api/auth/facebook-url', () => {
  it('env 없으면 500 + error 메시지', async () => {
    jest.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_ANON_KEY = ''
    const { GET } = require('@/app/api/auth/facebook-url/route')
    const res = await GET(new Request('https://example.com/api/auth/facebook-url?locale=en'))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain('NEXT_PUBLIC_SUPABASE_URL')
  })
})
