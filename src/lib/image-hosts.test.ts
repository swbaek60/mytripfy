import { IMAGE_HOSTNAMES, IMAGE_REMOTE_PATTERNS, isOptimizableImageUrl } from './image-hosts'

describe('isOptimizableImageUrl', () => {
  it('앱 내부 경로는 허용한다', () => {
    expect(isOptimizableImageUrl('/hero-travel-together.jpg')).toBe(true)
  })

  it('허용 목록의 정확한 호스트를 허용한다', () => {
    expect(isOptimizableImageUrl('https://img.clerk.com/abc.png')).toBe(true)
    expect(isOptimizableImageUrl('https://lh3.googleusercontent.com/a/x=s96')).toBe(true)
  })

  it('와일드카드는 서브도메인에만 적용된다', () => {
    expect(isOptimizableImageUrl('https://abcd.supabase.co/storage/v1/x.png')).toBe(true)
    // 와일드카드가 도메인 자체를 허용하면 안 된다.
    expect(isOptimizableImageUrl('https://supabase.co/x.png')).toBe(false)
  })

  it('접미사만 흉내낸 호스트를 거른다', () => {
    // endsWith 만 쓰면 통과해 버리는 형태들. 점 경계를 지켜야 한다.
    expect(isOptimizableImageUrl('https://evilsupabase.co/x.png')).toBe(false)
    expect(isOptimizableImageUrl('https://notclerk.com/x.png')).toBe(false)
  })

  it('허용 호스트를 앞에 붙인 다른 도메인을 거른다', () => {
    expect(isOptimizableImageUrl('https://abcd.supabase.co.attacker.com/x.png')).toBe(false)
    expect(isOptimizableImageUrl('https://img.clerk.com.attacker.com/x.png')).toBe(false)
  })

  it('https 가 아니면 거른다', () => {
    expect(isOptimizableImageUrl('http://img.clerk.com/a.png')).toBe(false)
    expect(isOptimizableImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false)
    expect(isOptimizableImageUrl('javascript:alert(1)')).toBe(false)
  })

  it('빈 값과 잘못된 URL 은 거른다', () => {
    expect(isOptimizableImageUrl(null)).toBe(false)
    expect(isOptimizableImageUrl(undefined)).toBe(false)
    expect(isOptimizableImageUrl('')).toBe(false)
    expect(isOptimizableImageUrl('not a url')).toBe(false)
  })
})

describe('IMAGE_REMOTE_PATTERNS', () => {
  it('next.config 에 넘길 패턴이 호스트 목록과 1:1 로 맞는다', () => {
    // 두 값이 갈라지면 런타임에 "hostname is not configured" 오류가 난다.
    expect(IMAGE_REMOTE_PATTERNS).toHaveLength(IMAGE_HOSTNAMES.length)
    expect(IMAGE_REMOTE_PATTERNS.map(p => p.hostname)).toEqual([...IMAGE_HOSTNAMES])
    expect(IMAGE_REMOTE_PATTERNS.every(p => p.protocol === 'https')).toBe(true)
  })
})
