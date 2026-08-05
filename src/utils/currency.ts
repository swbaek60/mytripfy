export interface Currency {
  code: string
  symbol: string
  name: string
  decimals: number
}

export const CURRENCIES: Currency[] = [
  // 주요 기축통화
  { code: 'USD', symbol: '$',   name: 'US Dollar',             decimals: 2 },
  { code: 'EUR', symbol: '€',   name: 'Euro',                  decimals: 2 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',         decimals: 2 },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc',           decimals: 2 },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',       decimals: 2 },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',     decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar',    decimals: 2 },
  // 아시아
  { code: 'KRW', symbol: '₩',   name: 'Korean Won',            decimals: 0 },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',          decimals: 0 },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',          decimals: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar',      decimals: 2 },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar',         decimals: 0 },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',      decimals: 2 },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit',     decimals: 2 },
  { code: 'THB', symbol: '฿',   name: 'Thai Baht',             decimals: 0 },
  { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong',       decimals: 0 },
  { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah',     decimals: 0 },
  { code: 'PHP', symbol: '₱',   name: 'Philippine Peso',       decimals: 2 },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',          decimals: 0 },
  { code: 'PKR', symbol: '₨',   name: 'Pakistani Rupee',       decimals: 0 },
  { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka',      decimals: 0 },
  { code: 'NPR', symbol: '₨',   name: 'Nepalese Rupee',        decimals: 0 },
  { code: 'LKR', symbol: '₨',   name: 'Sri Lankan Rupee',      decimals: 0 },
  { code: 'MMK', symbol: 'K',   name: 'Myanmar Kyat',          decimals: 0 },
  { code: 'KHR', symbol: '៛',   name: 'Cambodian Riel',        decimals: 0 },
  { code: 'MNT', symbol: '₮',   name: 'Mongolian Tögrög',      decimals: 0 },
  // 중동 / 아프리카
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',            decimals: 2 },
  { code: 'SAR', symbol: '﷼',   name: 'Saudi Riyal',           decimals: 2 },
  { code: 'QAR', symbol: '﷼',   name: 'Qatari Riyal',          decimals: 2 },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar',         decimals: 3 },
  { code: 'BHD', symbol: '.د.ب',name: 'Bahraini Dinar',        decimals: 3 },
  { code: 'JOD', symbol: 'JD',  name: 'Jordanian Dinar',       decimals: 3 },
  { code: 'TRY', symbol: '₺',   name: 'Turkish Lira',          decimals: 2 },
  { code: 'ILS', symbol: '₪',   name: 'Israeli New Shekel',    decimals: 2 },
  { code: 'EGP', symbol: '£',   name: 'Egyptian Pound',        decimals: 2 },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand',    decimals: 2 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',       decimals: 0 },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',        decimals: 2 },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi',        decimals: 2 },
  { code: 'MAD', symbol: 'DH',  name: 'Moroccan Dirham',       decimals: 2 },
  // 유럽 (비유로)
  { code: 'SEK', symbol: 'kr',  name: 'Swedish Krona',         decimals: 2 },
  { code: 'NOK', symbol: 'kr',  name: 'Norwegian Krone',       decimals: 2 },
  { code: 'DKK', symbol: 'kr',  name: 'Danish Krone',          decimals: 2 },
  { code: 'PLN', symbol: 'zł',  name: 'Polish Zloty',          decimals: 2 },
  { code: 'CZK', symbol: 'Kč',  name: 'Czech Koruna',          decimals: 2 },
  { code: 'HUF', symbol: 'Ft',  name: 'Hungarian Forint',      decimals: 0 },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu',          decimals: 2 },
  { code: 'HRK', symbol: 'kn',  name: 'Croatian Kuna',         decimals: 2 },
  { code: 'RSD', symbol: 'din', name: 'Serbian Dinar',         decimals: 0 },
  { code: 'BGN', symbol: 'лв',  name: 'Bulgarian Lev',         decimals: 2 },
  { code: 'UAH', symbol: '₴',   name: 'Ukrainian Hryvnia',     decimals: 2 },
  { code: 'GEL', symbol: '₾',   name: 'Georgian Lari',         decimals: 2 },
  // 아메리카
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso',          decimals: 2 },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',        decimals: 2 },
  { code: 'ARS', symbol: '$',   name: 'Argentine Peso',        decimals: 2 },
  { code: 'CLP', symbol: '$',   name: 'Chilean Peso',          decimals: 0 },
  { code: 'COP', symbol: '$',   name: 'Colombian Peso',        decimals: 0 },
  { code: 'PEN', symbol: 'S/',  name: 'Peruvian Sol',          decimals: 2 },
  { code: 'CRC', symbol: '₡',   name: 'Costa Rican Colón',     decimals: 0 },
]

export function getCurrency(code: string): Currency {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0]
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const cur = getCurrency(currencyCode)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: cur.decimals,
      maximumFractionDigits: cur.decimals,
    }).format(amount)
  } catch {
    const rounded = cur.decimals === 0 ? Math.round(amount) : amount.toFixed(cur.decimals)
    return `${cur.symbol}${rounded}`
  }
}

/**
 * 금액을 다른 통화로 환산한다. `rates` 는 USD 기준 환율표다.
 * (예: `{ USD: 1, KRW: 1350, EUR: 0.92 }`)
 *
 * 필요한 환율이 표에 없으면 환산할 수 없으므로 `null` 을 준다. 예전에는 없는 환율을
 * 1 로 취급했는데, 그러면 환율을 아직 못 받아온 상태에서 ₩50,000 짜리 가이드 비용이
 * "$50,000" 로 표시됐다. 값을 만들어 내는 것보다 모른다고 말하는 게 낫다.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number | null {
  if (fromCurrency === toCurrency) return amount
  const fromRate = rates[fromCurrency]
  const toRate = rates[toCurrency]
  if (!fromRate || !toRate) return null
  // fromCurrency → USD → toCurrency
  return (amount / fromRate) * toRate
}

/**
 * 환산해서 표기한다. 환율을 모르면 원래 통화로 정직하게 보여 준다.
 * 금액이 없을 때(null·undefined·NaN)만 '—' 다. 0 은 "무료" 라는 정보이므로 그대로 쓴다.
 */
export function formatConverted(
  amount: number | null | undefined,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—'
  const converted = convertAmount(amount, fromCurrency, toCurrency, rates)
  return converted === null
    ? formatCurrency(amount, fromCurrency)
    : formatCurrency(converted, toCurrency)
}

export interface CostEntry {
  cost?: number | null
  currency?: string | null
}

export interface ConvertedTotal {
  /** 환산에 성공한 항목만 더한 합계. */
  total: number
  /** 환율을 몰라 합계에서 빠진 항목이 있으면 true. */
  incomplete: boolean
}

/**
 * 여러 통화로 적힌 비용을 한 통화로 합산한다.
 *
 * 환율을 모르는 항목은 빼고 더하되, 빠진 게 있으면 `incomplete` 로 알린다.
 * 합계를 보여 주는 쪽에서 "대략" 표시를 붙일 수 있어야 실제보다 적은 금액을
 * 확정된 총액처럼 내보이지 않는다.
 */
export function sumInCurrency(
  entries: readonly CostEntry[],
  toCurrency: string,
  rates: Record<string, number>
): ConvertedTotal {
  let total = 0
  let incomplete = false
  for (const entry of entries) {
    if (!entry.cost) continue
    const converted = convertAmount(entry.cost, entry.currency || toCurrency, toCurrency, rates)
    if (converted === null) incomplete = true
    else total += converted
  }
  return { total, incomplete }
}
