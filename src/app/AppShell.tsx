import { useCallback, useEffect, useState } from 'react'
import { StackNavigator } from './stack'
import { useAppHeight, useIsPreview } from '@/lib/viewport'
import { useApp } from '@/store/app'
import { HomeIndicator, StatusBar } from '@/ui/DeviceChrome'
import { Toaster } from '@/ui/Toast'
import { DemoPanel } from '@/features/dev/DemoPanel'

/* The app frame.
   Phone: the device fills the screen (full width, full visible height, OS safe areas).
   Desktop: the device is the widest phone (440px) centred on a white page, with a fake status
   bar and home indicator; the prototype controls sit beside it when there's room. */
const THEME_TOKEN = { light: '--color-navy', dark: '--color-canvas' } as const

export function AppShell() {
  useAppHeight()
  const preview = useIsPreview()
  const reduceTransparency = useApp((s) => s.reduceTransparency)
  const [top, setTop] = useState<{ statusBar: 'light' | 'dark'; pathname: string }>({ statusBar: 'dark', pathname: '/' })
  const onTopChange = useCallback((next: typeof top) => setTop(next), [])

  useEffect(() => {
    document.documentElement.dataset.reduceTransparency = String(reduceTransparency)
  }, [reduceTransparency])

  // Browser chrome colour follows the screen (iOS Safari / Android Chrome toolbars).
  useEffect(() => {
    const colour = getComputedStyle(document.documentElement).getPropertyValue(THEME_TOKEN[top.statusBar]).trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colour)
  }, [top.statusBar])

  return (
    <div className="app-stage">
      <div className="device" data-preview={preview}>
        <StackNavigator onTopChange={onTopChange} />
        <Toaster />
        {preview && (
          <>
            <StatusBar tone={top.statusBar === 'light' ? 'light' : 'dark'} />
            <HomeIndicator tone="dark" />
          </>
        )}
      </div>
      <DemoPanel pathname={top.pathname} />
    </div>
  )
}
