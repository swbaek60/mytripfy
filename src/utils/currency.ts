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

// rates: { USD: 1, KRW: 1350, EUR: 0.92, ... } (모두 USD 기준)
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount
  const fromRate = rates[fromCurrency] ?? 1
  const toRate   = rates[toCurrency]   ?? 1
  // fromCurrency → USD → toCurrency
  return (amount / fromRate) * toRate
}

export function formatConverted(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): string {
  if (!amount) return '—'
  const converted = convertAmount(amount, fromCurrency, toCurrency, rates)
  return formatCurrency(converted, toCurrency)
}
