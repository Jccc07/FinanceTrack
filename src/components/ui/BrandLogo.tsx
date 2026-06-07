import React, { useState } from 'react'
import { getBrandDomain, getLogoUrl } from '@/constants/brandDomains'
import { getAccountLogo } from '@/constants/accountLogos'

interface BrandLogoProps {
  /** The name to match against (account name, recurring entry name, etc.) */
  name: string
  /** Fallback color hex for the initials tile */
  colorHex?: string
  size?: number
  borderRadius?: number
  /** If true, uses getAccountLogo for the text fallback (bank/e-wallet style) */
  useAccountFallback?: boolean
}

/**
 * Tries to show a real brand logo via Logo.dev.
 * Falls back to the existing letter/emoji tile if no domain match or image fails.
 */
export function BrandLogo({
  name,
  colorHex,
  size = 38,
  borderRadius = 10,
  useAccountFallback = false,
}: BrandLogoProps) {
  const domain = getBrandDomain(name)
  const [imgFailed, setImgFailed] = useState(false)

  const showImg = !!domain && !imgFailed

  // ── Fallback tile (initials / emoji) ─────────────────────────────────────
  const fallback = useAccountFallback
    ? getAccountLogo(name, colorHex)
    : (() => {
        // For recurring entries: try account logos first, else use initials
        const acct = getAccountLogo(name, colorHex)
        // getAccountLogo always returns something; only treat it as a "real" match
        // if it found a known brand (bg !== the generic indigo fallback we'd generate)
        const isGenericFallback = !colorHex && acct.logo === name.slice(0, 2).toUpperCase()
        return isGenericFallback
          ? { logo: name.slice(0, 2).toUpperCase(), bg: colorHex ?? '#6366F1', color: '#fff', isEmoji: false }
          : acct
      })()

  const tileStyle: React.CSSProperties = {
    width: size, height: size, borderRadius, flexShrink: 0,
    background: fallback.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: fallback.isEmoji
      ? size * 0.45
      : (fallback.logo.length > 2 ? size * 0.28 : size * 0.36),
    fontWeight: 800, color: fallback.color, letterSpacing: '-0.5px',
    fontFamily: 'var(--font-body)', overflow: 'hidden',
  }

  if (showImg) {
    return (
      <div style={{
        width: size, height: size, borderRadius, flexShrink: 0,
        background: 'var(--bg2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', border: '1px solid var(--border)',
      }}>
        <img
          src={getLogoUrl(domain)}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{ width: size * 0.72, height: size * 0.72, objectFit: 'contain' }}
        />
      </div>
    )
  }

  return <div style={tileStyle}>{fallback.logo}</div>
}