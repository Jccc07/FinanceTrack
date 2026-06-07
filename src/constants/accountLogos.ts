// Account logos/icons for known PH banks and e-wallets
// Returns an SVG string or emoji fallback

export interface AccountLogo {
  match: RegExp
  logo: string   // emoji or short text used as logo
  bg: string     // background color
  color: string  // text/icon color
}

// Ordered by specificity (more specific first)
export const ACCOUNT_LOGOS: AccountLogo[] = [
  // E-wallets
  { match: /gcash/i,        logo: 'G',   bg: '#007AFF', color: '#fff' },
  { match: /maya|paymaya/i, logo: 'M',   bg: '#00C896', color: '#fff' },
  { match: /grabpay/i,      logo: 'GP',  bg: '#00B14F', color: '#fff' },
  { match: /shopee\s?pay|spay/i, logo: 'S', bg: '#EE4D2D', color: '#fff' },
  { match: /lazada\s?wallet|laz/i, logo: 'L', bg: '#0F146D', color: '#fff' },
  { match: /coins\.ph|coins/i, logo: '₿', bg: '#F7931A', color: '#fff' },
  { match: /paypal/i,       logo: 'PP',  bg: '#003087', color: '#fff' },
  // Banks
  { match: /bdo/i,          logo: 'BDO', bg: '#005BAA', color: '#fff' },
  { match: /bpi/i,          logo: 'BPI', bg: '#CC0000', color: '#fff' },
  { match: /metrobank/i,    logo: 'MB',  bg: '#FFD700', color: '#1a1a1a' },
  { match: /pnb/i,          logo: 'PNB', bg: '#003B7A', color: '#fff' },
  { match: /landbank|lbp/i, logo: 'LBP', bg: '#006400', color: '#fff' },
  { match: /dbp/i,          logo: 'DBP', bg: '#0038A8', color: '#fff' },
  { match: /security\s?bank|secbank/i, logo: 'SB', bg: '#CC0000', color: '#fff' },
  { match: /rcbc/i,         logo: 'RCBC', bg: '#FFD700', color: '#1a1a1a' },
  { match: /unionbank|union\s?bank/i, logo: 'UB', bg: '#FF6200', color: '#fff' },
  { match: /chinabank|china\s?bank/i, logo: 'CB', bg: '#B22222', color: '#fff' },
  { match: /eastwest/i,     logo: 'EW',  bg: '#007055', color: '#fff' },
  { match: /pbcom/i,        logo: 'PBC', bg: '#002D62', color: '#fff' },
  { match: /allbank/i,      logo: 'AB',  bg: '#D4A017', color: '#fff' },
  { match: /cimb/i,         logo: 'CB',  bg: '#FF0000', color: '#fff' },
  { match: /tonik/i,        logo: 'T',   bg: '#6B21A8', color: '#fff' },
  { match: /seabank/i,      logo: 'SE',  bg: '#00A7E1', color: '#fff' },
  { match: /gotyme|go\s?tyme/i, logo: 'GT', bg: '#FF5F00', color: '#fff' },
  { match: /uno\s?bank|unobank/i, logo: 'UNO', bg: '#1A1A2E', color: '#fff' },
  { match: /maribank|mari/i, logo: 'MB', bg: '#04A563', color: '#fff' },
  // Generic type fallbacks
  { match: /cash/i,         logo: '₱',   bg: '#16A34A', color: '#fff' },
  { match: /credit/i,       logo: '💳',  bg: '#6366F1', color: '#fff' },
  { match: /savings/i,      logo: '🏦',  bg: '#0EA5E9', color: '#fff' },
]

export function getAccountLogo(accountName: string, fallbackColor?: string): {
  logo: string; bg: string; color: string; isEmoji: boolean
} {
  for (const entry of ACCOUNT_LOGOS) {
    if (entry.match.test(accountName)) {
      return { logo: entry.logo, bg: entry.bg, color: entry.color, isEmoji: entry.logo.startsWith('₱') || entry.logo === '💳' || entry.logo === '🏦' }
    }
  }
  // Fallback: first 2 chars of name
  const initials = accountName.slice(0, 2).toUpperCase()
  return { logo: initials, bg: fallbackColor ?? '#6366F1', color: '#fff', isEmoji: false }
}
