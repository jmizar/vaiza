/* Desktop preview only: draws the iOS status bar and home indicator so screens read like the
   Figma frames. On a real phone the OS draws these and we use safe-area insets instead. */
export function StatusBar({ tone }: { tone: 'dark' | 'light' }) {
  const c = tone === 'light' ? '#FFFFFF' : '#000000'
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 flex h-11 items-center justify-between px-6 pl-8"
      style={{ zIndex: 'var(--z-device)' as unknown as number, color: c }}
    >
      <span className="text-md font-medium tracking-tight">9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="18" height="10" viewBox="0 0 18 10" fill={c}>
          <rect x="0" y="6" width="3" height="4" rx="1" />
          <rect x="5" y="4" width="3" height="6" rx="1" />
          <rect x="10" y="2" width="3" height="8" rx="1" />
          <rect x="15" y="0" width="3" height="10" rx="1" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill={c}>
          <path d="M7.5 2.2c2 0 3.8.8 5.2 2.1l1.1-1.1A8.8 8.8 0 0 0 7.5.6 8.8 8.8 0 0 0 1.2 3.2l1.1 1.1A7.3 7.3 0 0 1 7.5 2.2Zm0 3.2c1.1 0 2.1.4 2.9 1.1l1.1-1.1a5.7 5.7 0 0 0-8 0l1.1 1.1c.8-.7 1.8-1.1 2.9-1.1Zm0 3.1-1.5 1.5L7.5 11 9 10l-1.5-1.5Z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} opacity=".35" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c} />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill={c} opacity=".4" />
        </svg>
      </span>
    </div>
  )
}

export function HomeIndicator({ tone }: { tone: 'dark' | 'light' }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center" style={{ zIndex: 'var(--z-device)' as unknown as number }}>
      <span className="h-[5px] w-[134px] rounded-full" style={{ background: tone === 'light' ? '#FFFFFF' : '#000000' }} />
    </div>
  )
}
