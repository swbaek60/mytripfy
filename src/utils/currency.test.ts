import {
  CURRENCIES,
  convertAmount,
  formatConverted,
  getCurrency,
  sumInCurrency,
} from './currency'

/** 실제 API 응답 모양(USD 기준). 일부 통화는 일부러 빼 두었다. */
const RATES = { USD: 1, KRW: 1350, EUR: 0.92, JPY: 155 }

describe('convertAmount', () => {
  it('같은 통화면 그대로 돌려준다', () => {
    expect(convertAmount(1000, 'KRW', 'KRW', RATES)).toBe(1000)
  })

  it('USD 를 경유해 환산한다', () => {
    // 13,500원 → 10 USD → 9.2 EUR
    expect(convertAmount(13_500, 'KRW', 'EUR', RATES)).toBeCloseTo(9.2, 10)
  })

  it('왕복 환산하면 원래 금액으로 돌아온다', () => {
    const toEur = convertAmount(50_000, 'KRW', 'EUR', RATES)!
    expect(convertAmount(toEur, 'EUR', 'KRW', RATES)).toBeCloseTo(50_000, 6)
  })

  it('환율을 모르면 null 을 준다', () => {
    // 이 부분이 예전에 ₩50,000 을 "$50,000" 로 표시하게 만든 버그였다.
    // 없는 환율을 1 로 취급하면 환산이 항등함수가 되어 버린다.
    expect(convertAmount(50_000, 'KRW', 'USD', { USD: 1 })).toBeNull()
    expect(convertAmount(50_000, 'USD', 'KRW', { USD: 1 })).toBeNull()
    expect(convertAmount(50_000, 'KRW', 'THB', RATES)).toBeNull()
  })

  it('환율이 0 이면 나눗셈이 무한이 되므로 환산하지 않는다', () => {
    expect(convertAmount(100, 'KRW', 'USD', { ...RATES, KRW: 0 })).toBeNull()
  })
})

describe('formatConverted', () => {
  it('환율을 알면 대상 통화로 표기한다', () => {
    expect(formatConverted(13_500, 'KRW', 'USD', RATES)).toBe('$10.00')
  })

  it('환율을 모르면 원래 통화로 정직하게 표기한다', () => {
    // 틀린 숫자를 대상 통화로 보여 주는 것보다 원래 금액을 보여 주는 게 낫다.
    expect(formatConverted(50_000, 'KRW', 'USD', { USD: 1 })).toBe('₩50,000')
  })

  it('금액이 없을 때만 대시로 표기한다', () => {
    expect(formatConverted(null, 'USD', 'USD', RATES)).toBe('—')
    expect(formatConverted(undefined, 'USD', 'USD', RATES)).toBe('—')
    expect(formatConverted(Number.NaN, 'USD', 'USD', RATES)).toBe('—')
  })

  it('0 은 무료라는 정보이므로 금액으로 표기한다', () => {
    expect(formatConverted(0, 'USD', 'USD', RATES)).toBe('$0.00')
  })

  it('소수점 자릿수는 통화 규칙을 따른다', () => {
    // 원·엔은 소수점을 쓰지 않는다.
    expect(formatConverted(1234.56, 'KRW', 'KRW', RATES)).toBe('₩1,235')
    expect(getCurrency('KRW').decimals).toBe(0)
    expect(getCurrency('KWD').decimals).toBe(3)
  })
})

describe('sumInCurrency', () => {
  it('여러 통화를 하나로 합산한다', () => {
    const { total, incomplete } = sumInCurrency(
      [
        { cost: 13_500, currency: 'KRW' }, // 10 USD
        { cost: 5, currency: 'USD' },
        { cost: 155, currency: 'JPY' }, // 1 USD
      ],
      'USD',
      RATES
    )
    expect(total).toBeCloseTo(16, 10)
    expect(incomplete).toBe(false)
  })

  it('통화가 비어 있으면 대상 통화로 적힌 것으로 본다', () => {
    const { total } = sumInCurrency([{ cost: 20 }, { cost: 5, currency: null }], 'USD', RATES)
    expect(total).toBe(25)
  })

  it('비용이 없는 항목은 건너뛴다', () => {
    const { total, incomplete } = sumInCurrency(
      [{ cost: null, currency: 'KRW' }, { cost: 0 }, { cost: 7, currency: 'USD' }],
      'USD',
      RATES
    )
    expect(total).toBe(7)
    expect(incomplete).toBe(false)
  })

  it('환산 못한 항목이 있으면 합계에서 빼고 incomplete 로 알린다', () => {
    const { total, incomplete } = sumInCurrency(
      [
        { cost: 10, currency: 'USD' },
        { cost: 500, currency: 'THB' }, // 환율 없음
      ],
      'USD',
      RATES
    )
    // 알 수 없는 항목을 원래 숫자 그대로 더하면 510 이 되어 크게 틀린다.
    expect(total).toBe(10)
    expect(incomplete).toBe(true)
  })

  it('빈 목록은 0 이고 완전하다', () => {
    expect(sumInCurrency([], 'USD', RATES)).toEqual({ total: 0, incomplete: false })
  })
})

describe('getCurrency', () => {
  it('모르는 코드는 USD 로 떨어진다', () => {
    expect(getCurrency('ZZZ').code).toBe('USD')
  })

  it('통화 코드가 중복되지 않는다', () => {
    const codes = CURRENCIES.map(c => c.code)
    expect(new Set(codes).size).toBe(codes.length)
  })
})
