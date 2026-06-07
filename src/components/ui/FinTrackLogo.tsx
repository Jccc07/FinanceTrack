import React from 'react'

interface FinTrackLogoProps {
  /** Size of the mark square in px */
  markSize?: number
  /** Font size of the wordmark text in px */
  wordSize?: number
  /** Gap between mark and wordmark */
  gap?: number
}

/**
 * FinTrack brand logo — rising bars mark + Syne/DM Sans wordmark.
 * Drop-in replacement wherever the old Wallet icon + text was used.
 */
export function FinTrackLogo({ markSize = 36, wordSize = 18, gap = 9 }: FinTrackLogoProps) {
  const r = Math.round(markSize * 0.278)  // border-radius scales with size

  // Bar dimensions scale relative to markSize
  const padH = Math.round(markSize * 0.222)  // horizontal padding inside mark
  const padB = Math.round(markSize * 0.167)  // bottom padding
  const barW = Math.round(markSize * 0.167)  // each bar width
  const barGap = Math.round(markSize * 0.083)
  const innerW = markSize - padH * 2
  // 3 bars: short, mid, tall — heights as fractions of inner available space
  const innerH = markSize - padB - Math.round(markSize * 0.167)
  const heights = [
    Math.round(innerH * 0.40),
    Math.round(innerH * 0.65),
    Math.round(innerH * 0.90),
  ]
  // x positions for each bar (left-aligned within padH)
  const totalBarsW = barW * 3 + barGap * 2
  const barsStartX = Math.round((markSize - totalBarsW) / 2)
  const barY = (h: number) => markSize - padB - h

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {/* Mark */}
      <svg
        width={markSize}
        height={markSize}
        viewBox={`0 0 ${markSize} ${markSize}`}
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect width={markSize} height={markSize} rx={r} fill="#6366F1" />
        {/* Bar 1 — short */}
        <rect
          x={barsStartX}
          y={barY(heights[0])}
          width={barW}
          height={heights[0]}
          rx={Math.max(2, Math.round(barW * 0.35))}
          fill="rgba(255,255,255,0.65)"
        />
        {/* Bar 2 — mid */}
        <rect
          x={barsStartX + barW + barGap}
          y={barY(heights[1])}
          width={barW}
          height={heights[1]}
          rx={Math.max(2, Math.round(barW * 0.35))}
          fill="rgba(255,255,255,0.82)"
        />
        {/* Bar 3 — tall, full white */}
        <rect
          x={barsStartX + (barW + barGap) * 2}
          y={barY(heights[2])}
          width={barW}
          height={heights[2]}
          rx={Math.max(2, Math.round(barW * 0.35))}
          fill="#ffffff"
        />
      </svg>

      {/* Wordmark */}
      <span aria-label="FinTrack" style={{ lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: wordSize,
            letterSpacing: '-0.5px',
            color: '#A5B4FC',
          }}
        >
          Fin
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: wordSize,
            letterSpacing: '-0.3px',
            color: '#F8FAFC',
          }}
        >
          Track
        </span>
      </span>
    </div>
  )
}