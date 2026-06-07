import React, { useState } from 'react'
import { getBrandDomain } from '@/constants/brandDomains'
import { getAccountLogo } from '@/constants/accountLogos'

interface BrandLogoProps {
  name: string
  colorHex?: string
  size?: number
  borderRadius?: number
  useAccountFallback?: boolean
}

type ImgState = 'clearbit' | 'favicon' | 'tile'

/**
 * Tries to show a real brand logo.
 * Tier 1: Clearbit Logo API  (high-quality PNG, free, no key)
 * Tier 2: Google favicon CDN (lower-res but very reliable)
 * Tier 3: Letter/emoji tile  (always works)
 */
export function BrandLogo({
  name,
  colorHex,
  size = 38,
  borderRadius = 10,
  useAccountFallback = false,
}: BrandLogoProps) {
  const domain = getBrandDomain(name)
  const [imgState, setImgState] = useState<ImgState>(domain ? 'clearbit' : 'tile')

  const fallback = getAccountLogo(name, colorHex ?? '#6366F1')

  const tileStyle: React.CSSProperties = {
    width: size, height: size, borderRadius, flexShrink: 0,
    background: fallback.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: fallback.isEmoji
      ? size * 0.45
      : fallback.logo.length > 2 ? size * 0.28 : size * 0.36,
    fontWeight: 800,
    color: fallback.color,
    letterSpacing: '-0.5px',
    fontFamily: 'var(--font-body)',
    overflow: 'hidden',
  }

  if (!domain || imgState === 'tile') {
    return <div style={tileStyle}>{fallback.logo}</div>
  }

  const src =
    imgState === 'clearbit'
      ? `https://logo.clearbit.com/${domain}`
      : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

  return (
    <div style={{
      width: size, height: size, borderRadius, flexShrink: 0,
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      boxSizing: 'border-box',
    }}>
      <img
        src={src}
        alt={name}
        onError={() => {
          if (imgState === 'clearbit') setImgState('favicon')
          else setImgState('tile')
        }}
        style={{
          width: imgState === 'favicon' ? '60%' : '72%',
          height: imgState === 'favicon' ? '60%' : '72%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}