// Maps brand/service name patterns to their logo domains for Logo.dev lookups.
// Usage: https://img.logo.dev/{domain}?token=pk_public&size=64&format=png

export interface BrandDomain {
  match: RegExp
  domain: string
}

export const BRAND_DOMAINS: BrandDomain[] = [

  // ── PH Banks ──────────────────────────────────────────────────────────────
  { match: /\bbdo\b|bdo\s?unibank/i,                          domain: 'bdo.com.ph' },
  { match: /bank\s?of\s?the\s?philippine\s?islands|\bbpi\b/i, domain: 'bpi.com.ph' },
  { match: /metrobank|metropolitan\s?bank/i,                  domain: 'metrobank.com.ph' },
  { match: /landbank|land\s?bank|lbp/i,                       domain: 'landbank.com' },
  { match: /philippine\s?national\s?bank|\bpnb\b/i,           domain: 'pnb.com.ph' },
  { match: /security\s?bank/i,                                domain: 'securitybank.com' },
  { match: /unionbank|union\s?bank/i,                         domain: 'unionbankph.com' },
  { match: /china\s?bank(ing)?|chinabank/i,                   domain: 'chinabank.ph' },
  { match: /eastwest(\s?bank)?|east\s?west\s?bank/i,          domain: 'eastwestbanker.com' },
  { match: /\brcbc\b/i,                                       domain: 'rcbc.com' },
  { match: /development\s?bank.*phil|\bdbp\b/i,               domain: 'dbp.ph' },
  { match: /maybank/i,                                        domain: 'maybank.com.ph' },
  { match: /hsbc/i,                                           domain: 'hsbc.com.ph' },
  { match: /\bcimb\b/i,                                       domain: 'cimbbank.com.ph' },
  { match: /tonik/i,                                          domain: 'tonikbank.com' },
  { match: /gotyme|go\s?tyme/i,                               domain: 'gotyme.com.ph' },
  { match: /maya\s?bank/i,                                    domain: 'maya.ph' },
  { match: /ownbank|own\s?bank/i,                             domain: 'ownbank.com.ph' },
  { match: /uno\s?(digital\s?)?bank|unobank/i,                domain: 'unobank.co' },
  { match: /maribank|mari\s?bank/i,                           domain: 'maribank.com' },

  // ── E-Wallets & Digital Payment ───────────────────────────────────────────
  { match: /gcash/i,                                          domain: 'gcash.com' },
  // Maya matched after Maya Bank to avoid conflict; both resolve the same domain
  { match: /\bmaya\b|paymaya/i,                               domain: 'maya.ph' },
  { match: /shopee\s?pay|spay/i,                              domain: 'shopee.ph' },
  { match: /grabpay|grab\s?pay/i,                             domain: 'grab.com' },
  { match: /coins\.ph|\bcoins\b/i,                            domain: 'coins.ph' },
  { match: /bayad(\s?center)?/i,                              domain: 'mybayad.com' },

  // ── Video Streaming ───────────────────────────────────────────────────────
  { match: /netflix/i,                                        domain: 'netflix.com' },
  { match: /disney\s?\+?(\s?plus)?/i,                         domain: 'disneyplus.com' },
  { match: /prime\s?video|amazon\s?prime/i,                   domain: 'primevideo.com' },
  { match: /\bmax\b(\s?hbo)?|hbo\s?max|hbo\s?go/i,           domain: 'max.com' },
  { match: /\bviu\b/i,                                        domain: 'viu.com' },
  { match: /iqiyi|iqi\s?yi/i,                                 domain: 'iq.com' },
  { match: /wetv|we\s?tv/i,                                   domain: 'wetv.vip' },
  { match: /youtube\s?premium/i,                              domain: 'youtube.com' },

  // ── Music Streaming ───────────────────────────────────────────────────────
  { match: /spotify/i,                                        domain: 'spotify.com' },
  { match: /apple\s?music/i,                                  domain: 'music.apple.com' },
  { match: /youtube\s?music/i,                                domain: 'music.youtube.com' },

  // ── Productivity & Cloud ──────────────────────────────────────────────────
  { match: /google\s?one/i,                                   domain: 'one.google.com' },
  { match: /microsoft\s?365|office\s?365|ms\s?365/i,         domain: 'microsoft.com' },
  { match: /dropbox/i,                                        domain: 'dropbox.com' },
  { match: /canva/i,                                          domain: 'canva.com' },
  { match: /chatgpt|openai/i,                                 domain: 'openai.com' },
  { match: /claude|anthropic/i,                               domain: 'anthropic.com' },

  // ── Gaming ────────────────────────────────────────────────────────────────
  { match: /xbox(\s?game\s?pass)?|game\s?pass/i,              domain: 'xbox.com' },
  { match: /playstation\s?(plus|now|network)|\bps\s?plus\b|psn/i, domain: 'playstation.com' },
  { match: /nintendo(\s?switch\s?online)?/i,                  domain: 'nintendo.com' },

  // ── Electricity Billers ───────────────────────────────────────────────────
  { match: /meralco/i,                                        domain: 'meralco.com.ph' },
  { match: /visayan\s?electric|veco/i,                        domain: 'visayanelectric.com' },
  { match: /davao\s?light|dlpc/i,                             domain: 'davaolightpower.com' },
  { match: /cebu\s?(electric|elec|coop)|cebeco/i,             domain: 'cebeco2.com' },

  // ── Water Billers ─────────────────────────────────────────────────────────
  { match: /manila\s?water/i,                                 domain: 'manilawater.com' },
  { match: /maynilad/i,                                       domain: 'mayniladwater.com.ph' },
  { match: /primewater|prime\s?water/i,                       domain: 'primewater.com.ph' },

  // ── Internet / ISP ────────────────────────────────────────────────────────
  { match: /\bpldt\b/i,                                       domain: 'pldt.com' },
  { match: /smart\s?(communications?|bro|fiber)?/i,           domain: 'smart.com.ph' },
  { match: /globe(\s?telecom|\s?fiber|\s?broadband)?/i,       domain: 'globe.com.ph' },
  { match: /converge(\s?ict)?/i,                              domain: 'convergeict.com' },
  { match: /\bdito\b(\s?telecommunity)?/i,                    domain: 'dito.ph' },
  { match: /sky\s?(cable|broadband|fiber)?/i,                 domain: 'mysky.com.ph' },
  { match: /eastern\s?communications?/i,                      domain: 'eastern.com.ph' },

  // ── Mobile / Postpaid (telco sub-brands) ─────────────────────────────────
  // Globe and Smart already matched above; these catch the sub-brands
  { match: /\btnt\b|talk\s?n\s?text/i,                        domain: 'smart.com.ph' },  // TNT is under Smart/PLDT
  { match: /\btm\b|touch\s?mobile/i,                          domain: 'globe.com.ph' },   // TM is under Globe
  { match: /sun\s?(cellular)?/i,                              domain: 'smart.com.ph' },   // Sun is under Smart/PLDT

]

/**
 * Given a brand/account/entry name, returns the best-guess domain for logo lookup.
 * Returns null if no match found.
 */
export function getBrandDomain(name: string): string | null {
  for (const entry of BRAND_DOMAINS) {
    if (entry.match.test(name)) return entry.domain
  }
  return null
}

/**
 * Returns the Logo.dev URL for a given domain.
 */
export function getLogoUrl(domain: string): string {
  return `https://img.logo.dev/${domain}?token=pk_public&size=64&format=png`
}