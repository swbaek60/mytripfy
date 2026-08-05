import { RATE_LIMITS, rateLimit } from './rate-limit'

/** 테스트마다 다른 키를 써서 모듈 수준 카운터가 서로 섞이지 않게 한다. */
let seq = 0
const key = (name: string) => `test:${name}:${seq++}`

describe('rateLimit', () => {
  it('첫 호출은 통과하고 남은 횟수를 준다', () => {
    expect(rateLimit(key('first'), 3, 60_000)).toEqual({
      ok: true,
      remaining: 2,
      retryAfterSeconds: 0,
    })
  })

  it('허용 횟수까지 통과하고 그 다음부터 막는다', () => {
    const k = key('limit')
    expect(rateLimit(k, 3, 60_000).ok).toBe(true)
    expect(rateLimit(k, 3, 60_000).ok).toBe(true)
    expect(rateLimit(k, 3, 60_000)).toEqual({ ok: true, remaining: 0, retryAfterSeconds: 0 })
    expect(rateLimit(k, 3, 60_000).ok).toBe(false)
  })

  it('막힌 뒤에도 계속 막혀 있다', () => {
    const k = key('stay-blocked')
    for (let i = 0; i < 5; i++) rateLimit(k, 2, 60_000)
    expect(rateLimit(k, 2, 60_000).ok).toBe(false)
  })

  it('막을 때 재시도 대기 시간을 알려 준다', () => {
    const k = key('retry-after')
    rateLimit(k, 1, 60_000)
    const blocked = rateLimit(k, 1, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
    // 60초 윈도우이므로 1초 이상 60초 이하가 나와야 한다.
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60)
  })

  it('키가 다르면 서로 영향이 없다', () => {
    const a = key('isolated-a')
    const b = key('isolated-b')
    rateLimit(a, 1, 60_000)
    expect(rateLimit(a, 1, 60_000).ok).toBe(false)
    expect(rateLimit(b, 1, 60_000).ok).toBe(true)
  })

  it('윈도우가 지나면 카운터가 초기화된다', async () => {
    const k = key('window-reset')
    expect(rateLimit(k, 1, 20).ok).toBe(true)
    expect(rateLimit(k, 1, 20).ok).toBe(false)
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(rateLimit(k, 1, 20).ok).toBe(true)
  })

  it('막힌 상태에서도 대기 시간은 1초 미만으로 내려가지 않는다', () => {
    const k = key('min-retry')
    rateLimit(k, 1, 50)
    const blocked = rateLimit(k, 1, 50)
    // 남은 시간이 50ms 여도 Retry-After: 0 을 주면 클라이언트가 즉시 재시도한다.
    if (!blocked.ok) expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1)
  })
})

describe('RATE_LIMITS 프리셋', () => {
  it('모든 프리셋이 양수 값이다', () => {
    for (const [name, preset] of Object.entries(RATE_LIMITS)) {
      expect(preset.limit).toBeGreaterThan(0)
      expect(preset.windowMs).toBeGreaterThan(0)
      expect(`${name} limit`).toBeTruthy()
    }
  })

  it('비용이 큰 작업일수록 더 엄격하다', () => {
    // 이메일 발송은 평판 리스크가 있으므로 일반 쓰기보다 훨씬 촘촘해야 한다.
    const perMinute = (p: { limit: number; windowMs: number }) => p.limit / (p.windowMs / 60_000)
    expect(perMinute(RATE_LIMITS.email)).toBeLessThan(perMinute(RATE_LIMITS.paidApi))
    expect(perMinute(RATE_LIMITS.paidApi)).toBeLessThan(perMinute(RATE_LIMITS.write))
    expect(perMinute(RATE_LIMITS.write)).toBeLessThan(perMinute(RATE_LIMITS.autosave))
  })
})
