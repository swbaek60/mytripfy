import { buildKlookUrl, buildViatorUrl, getChallengeAffiliateLinks } from './affiliate'

describe('buildKlookUrl', () => {
  it('검색어를 인코딩해 넣는다', () => {
    const url = new URL(buildKlookUrl('Great Barrier Reef'))
    expect(url.searchParams.get('query')).toBe('Great Barrier Reef')
  })

  it('검색어의 특수문자를 이스케이프한다', () => {
    // 인코딩이 빠지면 검색어가 다른 파라미터로 새어 나간다.
    const raw = buildKlookUrl('a&b=c#d')
    expect(raw).not.toContain('a&b=c#d')
    expect(new URL(raw).searchParams.get('query')).toBe('a&b=c#d')
  })

  it('국가 코드를 대문자로 붙인다', () => {
    expect(new URL(buildKlookUrl('reef', 'au')).searchParams.get('country')).toBe('AU')
  })

  it('국가 코드가 없으면 파라미터를 넣지 않는다', () => {
    expect(new URL(buildKlookUrl('reef')).searchParams.has('country')).toBe(false)
    expect(new URL(buildKlookUrl('reef', null)).searchParams.has('country')).toBe(false)
  })

  it('제휴·추적 파라미터를 항상 붙인다', () => {
    const url = new URL(buildKlookUrl('reef'))
    expect(url.searchParams.get('aid')).toBeTruthy()
    expect(url.searchParams.get('utm_source')).toBe('mytripfy')
    expect(url.searchParams.get('utm_medium')).toBe('affiliate')
  })
})

describe('buildViatorUrl', () => {
  it('검색어와 파트너 ID 를 넣는다', () => {
    const url = new URL(buildViatorUrl('  Colosseum  '))
    expect(url.searchParams.get('text')).toBe('Colosseum')
    expect(url.searchParams.get('pid')).toBeTruthy()
  })
})

describe('getChallengeAffiliateLinks', () => {
  it('액티비티 카테고리에는 두 제공자 링크를 준다', () => {
    const links = getChallengeAffiliateLinks('Angkor Wat', 'attractions', 'KH')
    expect(links.map(l => l.provider)).toEqual(['klook', 'viator'])
  })

  it('예약과 무관한 카테고리에는 링크를 만들지 않는다', () => {
    // 음식·나라 목록에 투어 예약 링크를 붙이면 맥락에 맞지 않는다.
    expect(getChallengeAffiliateLinks('Pad Thai', 'foods')).toEqual([])
    expect(getChallengeAffiliateLinks('Japan', 'countries')).toEqual([])
  })

  it('제목이 비면 링크를 만들지 않는다', () => {
    expect(getChallengeAffiliateLinks('   ', 'attractions')).toEqual([])
    expect(getChallengeAffiliateLinks(', ,', 'attractions')).toEqual([])
  })

  it('제목의 쉼표를 공백으로 바꿔 검색어를 만든다', () => {
    const [klook] = getChallengeAffiliateLinks('Paris, France', 'attractions')
    expect(new URL(klook.url).searchParams.get('query')).toBe('Paris France')
  })

  it('라벨 키가 제공자와 짝이 맞는다', () => {
    const links = getChallengeAffiliateLinks('Angkor Wat', 'attractions')
    expect(links).toEqual([
      expect.objectContaining({ provider: 'klook', labelKey: 'affiliateKlook' }),
      expect.objectContaining({ provider: 'viator', labelKey: 'affiliateViator' }),
    ])
  })
})
