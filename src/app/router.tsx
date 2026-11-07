import { createHashRouter, Navigate } from 'react-router'
import type { RouteHandle } from './stack'
import { AppShell } from './AppShell'
import { Splash } from '@/features/onboarding/Splash'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { Setup } from '@/features/onboarding/Setup'
import { Home } from '@/features/home/Home'
import { Profile } from '@/features/home/Profile'
import { NewTrip } from '@/features/trip/NewTrip'
import { Dates } from '@/features/trip/Dates'
import { Preferences } from '@/features/trip/Preferences'
import { TripScreen } from '@/features/trip/TripScreen'
import { TravelWindow } from '@/features/trip/TravelWindow'
import { CustomDates } from '@/features/trip/CustomDates'
import { Vote } from '@/features/trip/Vote'
import { Locked } from '@/features/trip/Locked'
import { Join } from '@/features/join/Join'
import { DestinationPicker, OriginPicker, ProfileCityPicker, SetupCityPicker, SuggestPicker } from '@/features/search/Pickers'
import { DesignSystem } from '@/features/dev/DesignSystem'

/* Screen map. Hash URLs (#/trip/abc) so the prototype works on any static host and inside a
   preview frame. `handle.presentation` = how the screen arrives (push | modal | none);
   `handle.statusBar` = light content over dark screens. Names follow docs/screens.md. */
const push: RouteHandle = { presentation: 'push' }
const modal: RouteHandle = { presentation: 'modal' }
const tab: RouteHandle = { presentation: 'none' }
const navy: RouteHandle = { presentation: 'push', statusBar: 'light' }

export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Splash />, handle: { presentation: 'none', statusBar: 'light' } satisfies RouteHandle },
      { path: '/onboarding', element: <Onboarding />, handle: tab },
      { path: '/setup', element: <Setup />, handle: tab },
      { path: '/setup/city', element: <SetupCityPicker />, handle: modal },

      { path: '/home', element: <Home />, handle: tab },
      { path: '/profile', element: <Profile />, handle: tab },
      { path: '/profile/city', element: <ProfileCityPicker />, handle: modal },
      { path: '/join', element: <Join />, handle: push },

      { path: '/new', element: <NewTrip />, handle: push },
      { path: '/new/destination', element: <DestinationPicker />, handle: modal },

      { path: '/trip/:id', element: <TripScreen />, handle: navy },
      { path: '/trip/:id/dates', element: <Dates />, handle: push },
      { path: '/trip/:id/dates/new', element: <Dates flow="new" />, handle: modal },
      { path: '/trip/:id/dates/origin', element: <OriginPicker />, handle: modal },
      { path: '/trip/:id/preferences', element: <Preferences />, handle: push },
      { path: '/trip/:id/preferences/new', element: <Preferences />, handle: push },
      { path: '/trip/:id/window', element: <TravelWindow />, handle: push },
      { path: '/trip/:id/window/calendar', element: <TravelWindow initialTab="calendar" />, handle: push },
      { path: '/trip/:id/window/custom', element: <CustomDates />, handle: push },
      { path: '/trip/:id/vote', element: <Vote />, handle: modal },
      { path: '/trip/:id/vote/suggest', element: <SuggestPicker />, handle: modal },
      { path: '/trip/:id/locked', element: <Locked />, handle: { presentation: 'modal', statusBar: 'light' } satisfies RouteHandle },

      { path: '/design', element: <DesignSystem />, handle: push },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
