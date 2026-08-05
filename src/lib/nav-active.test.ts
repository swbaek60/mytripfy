import { activeHref, stripLocale } from './nav-active'

describe('stripLocale', () => {
  it('로케일 접두사를 떼어낸다', () => {
    expect(stripLocale('/ko/challenges', 'ko')).toBe('/challenges')
  })

  it('로케일 루트는 슬래시가 된다', () => {
    expect(stripLocale('/ko', 'ko')).toBe('/')
  })

  it('하이픈이 있는 로케일도 처리한다', () => {
    expect(stripLocale('/pt-BR/guides', 'pt-BR')).toBe('/guides')
    expect(stripLocale('/zh-TW', 'zh-TW')).toBe('/')
  })

  it('접두사가 세그먼트 전체와 맞아야 떼어낸다', () => {
    // `/kor` 은 `/ko` 로 시작하지만 다른 세그먼트다.
    expect(stripLocale('/kor/guides', 'ko')).toBe('/kor/guides')
  })

  it('다른 로케일 경로는 건드리지 않는다', () => {
    expect(stripLocale('/ja/guides', 'ko')).toBe('/ja/guides')
  })
})

describe('activeHref', () => {
  const NAV = ['/', '/challenges', '/challenges/feed', '/companions', '/guides']

  it('가장 구체적인 후보 하나만 활성으로 고른다', () => {
    // includes() 로 판별하면 /challenges 와 /challenges/feed 가 동시에 활성이 된다.
    expect(activeHref('/ko/challenges/feed', 'ko', NAV)).toBe('/challenges/feed')
  })

  it('상위 경로에서는 상위 항목이 활성이다', () => {
    expect(activeHref('/ko/challenges', 'ko', NAV)).toBe('/challenges')
  })

  it('하위 경로는 상위 항목을 활성으로 유지한다', () => {
    expect(activeHref('/ko/challenges/foods', 'ko', NAV)).toBe('/challenges')
  })

  it('홈은 정확히 일치할 때만 활성이다', () => {
    expect(activeHref('/ko', 'ko', NAV)).toBe('/')
    expect(activeHref('/ko/guides', 'ko', NAV)).toBe('/guides')
  })

  it('세그먼트 경계를 넘어 걸리지 않는다', () => {
    // `/guides` 가 `/guides-archive` 에 걸리면 안 된다.
    expect(activeHref('/ko/guides-archive', 'ko', NAV)).toBeNull()
  })

  it('맞는 후보가 없으면 null 이다', () => {
    expect(activeHref('/ko/settings', 'ko', ['/challenges', '/guides'])).toBeNull()
  })

  it('쿼리스트링이 붙은 후보도 경로로 비교한다', () => {
    expect(activeHref('/ko/guides', 'ko', ['/guides?sort=new'])).toBe('/guides?sort=new')
  })

  it('후보 목록 순서에 결과가 좌우되지 않는다', () => {
    const reversed = [...NAV].reverse()
    expect(activeHref('/ko/challenges/feed', 'ko', reversed)).toBe('/challenges/feed')
  })
})
