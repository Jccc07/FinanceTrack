import React, { useState } from 'react'
import { getBrandDomain, getLogoUrl } from '@/constants/brandDomains'
import { getAccountLogo } from '@/constants/accountLogos'

interface BrandLogoProps {
  name: string
  colorHex?: string
  size?: number
  borderRadius?: number
  useAccountFallback?: boolean
}

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

  // Fallback tile
  const fallback = useAccountFallback
    ? getAccountLogo(name, colorHex)
    : getAccountLogo(name, colorHex ?? '#6366F1')

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

  if (showImg) {
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
          src={getLogoUrl(domain)}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{
            width: '72%',
            height: '72%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    )
  }

  return <div style={tileStyle}>{fallback.logo}</div>
}