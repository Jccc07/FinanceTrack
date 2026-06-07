import React from 'react'
import { getAccountLogo } from '@/constants/accountLogos'

interface AccountLogoIconProps {
  accountName: string
  colorHex?: string
  size?: number
  borderRadius?: number
}

export function AccountLogoIcon({ accountName, colorHex, size = 38, borderRadius = 10 }: AccountLogoIconProps) {
  const { logo, bg, color, isEmoji } = getAccountLogo(accountName, colorHex)
  return (
    <div style={{
      width: size, height: size, borderRadius, flexShrink: 0,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: isEmoji ? size * 0.45 : (logo.length > 2 ? size * 0.28 : size * 0.36),
      fontWeight: 800, color, letterSpacing: '-0.5px',
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
    }}>
      {logo}
    </div>
  )
}
