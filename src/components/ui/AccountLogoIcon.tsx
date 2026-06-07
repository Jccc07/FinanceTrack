import React from 'react'
import { BrandLogo } from './BrandLogo'

interface AccountLogoIconProps {
  accountName: string
  colorHex?: string
  size?: number
  borderRadius?: number
}

export function AccountLogoIcon({ accountName, colorHex, size = 38, borderRadius = 10 }: AccountLogoIconProps) {
  return (
    <BrandLogo
      name={accountName}
      colorHex={colorHex ?? undefined}
      size={size}
      borderRadius={borderRadius}
      useAccountFallback
    />
  )
}