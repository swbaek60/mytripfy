import { buildInvitePath, buildInviteUrl, normalizeReferralCode } from './referral'

describe('normalizeReferralCode', () => {
  it('대소문자를 통일한다', () => {
    expect(normalizeReferralCode('AbCd12')).toBe('abcd12')
  })

  it('앞뒤 공백을 지운다', () => {
    expect(normalizeReferralCode('  abcd  ')).toBe('abcd')
  })

  it('영숫자가 아닌 문자를 제거한다', () => {
    expect(normalizeReferralCode('ab-cd_12')).toBe('abcd12')
  })

  it('경로·스크립트 문자를 흘리지 않는다', () => {
    // 정규화된 코드는 URL 경로에 그대로 들어가므로 구분자가 남으면 안 된다.
    expect(normalizeReferralCode('../../etc/passwd')).toBe('etcpasswd')
    expect(normalizeReferralCode('<script>xx</script>')).toBe('scriptxxscript')
  })

  it('길이 범위를 벗어나면 거부한다', () => {
    expect(normalizeReferralCode('abc')).toBeNull()
    expect(normalizeReferralCode('a'.repeat(17))).toBeNull()
  })

  it('경계 길이는 허용한다', () => {
    expect(normalizeReferralCode('abcd')).toBe('abcd')
    expect(normalizeReferralCode('a'.repeat(16))).toBe('a'.repeat(16))
  })

  it('제거 후 남는 길이로 판정한다', () => {
    // 눈으로는 8자지만 영숫자는 3자뿐이므로 거부해야 한다.
    expect(normalizeReferralCode('a-b-c---')).toBeNull()
  })

  it('빈 값은 null 이다', () => {
    expect(normalizeReferralCode(null)).toBeNull()
    expect(normalizeReferralCode(undefined)).toBeNull()
    expect(normalizeReferralCode('')).toBeNull()
    expect(normalizeReferralCode('   ')).toBeNull()
  })
})

describe('buildInviteUrl', () => {
  it('로케일과 코드가 들어간 초대 경로를 만든다', () => {
    expect(buildInvitePath('ko', 'abcd12')).toBe('/ko/invite/abcd12')
  })

  it('추적 파라미터가 붙은 절대 URL 을 만든다', () => {
    const url = new URL(buildInviteUrl('ko', 'abcd12'))
    expect(url.origin).toBe('https://www.mytripfy.com')
    expect(url.pathname).toBe('/ko/invite/abcd12')
    expect(url.searchParams.get('utm_source')).toBe('referral')
    expect(url.searchParams.get('utm_campaign')).toBe('invite')
  })

  it('오리진을 바꿔 쓸 수 있다', () => {
    expect(buildInviteUrl('en', 'abcd12', 'http://localhost:3000')).toContain(
      'http://localhost:3000/en/invite/abcd12'
    )
  })
})
