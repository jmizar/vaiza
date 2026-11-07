import { useParams } from 'react-router'
import { t } from '@/copy'
import { CITIES } from '@/data/cities'
import { DESTINATIONS } from '@/data/destinations'
import { useBack } from '@/app/stack'
import { useApp } from '@/store/app'
import { useDrafts } from '@/store/drafts'
import { SearchScreen, type SearchItem } from '@/ui/SearchList'

/* Every search in the app is the same Figma screen (search pill + rows). These wrappers only
   decide the list and where the pick goes. Presented as modals; closing returns to the form. */
const cityItems: SearchItem[] = CITIES.map((c) => ({ id: c.id, name: c.name, code: c.countryCode }))
const destinationItems: SearchItem[] = DESTINATIONS.map((d) => ({ id: d.id, name: d.name, code: d.countryCode, detail: d.country }))

export function SetupCityPicker() {
  const back = useBack('/setup')
  const setSetup = useDrafts((s) => s.setSetup)
  return (
    <SearchScreen
      label={t.setup.searchCity}
      placeholder={t.setup.searchCity}
      items={cityItems}
      onClose={() => back()}
      onPick={(c) => {
        setSetup({ cityId: c.id })
        back()
      }}
    />
  )
}

export function ProfileCityPicker() {
  const back = useBack('/profile')
  const profile = useApp((s) => s.profile)
  const saveProfile = useApp((s) => s.saveProfile)
  return (
    <SearchScreen
      label={t.setup.searchCity}
      placeholder={t.setup.searchCity}
      items={cityItems}
      onClose={() => back()}
      onPick={(c) => {
        saveProfile({ name: profile?.name ?? '', cityId: c.id })
        back()
      }}
    />
  )
}

export function OriginPicker() {
  const { id = '' } = useParams()
  const back = useBack(`/trip/${id}/dates`)
  const setDates = useDrafts((s) => s.setDates)
  return (
    <SearchScreen
      label={t.dates.searchOrigin}
      placeholder={t.dates.searchOrigin}
      items={cityItems}
      onClose={() => back()}
      onPick={(c) => {
        setDates(id, { cityId: c.id })
        back()
      }}
    />
  )
}

export function DestinationPicker() {
  const back = useBack('/new')
  const setNewTrip = useDrafts((s) => s.setNewTrip)
  return (
    <SearchScreen
      label={t.newTrip.searchDestination}
      placeholder={t.newTrip.searchDestination}
      items={destinationItems}
      onClose={() => back()}
      onPick={(d) => {
        setNewTrip({ destinationId: d.id })
        back()
      }}
    />
  )
}

export function SuggestPicker() {
  const { id = '' } = useParams()
  const back = useBack(`/trip/${id}/vote`)
  const addCandidate = useApp((s) => s.addCandidate)
  return (
    <SearchScreen
      label={t.newTrip.searchDestination}
      placeholder={t.newTrip.searchDestination}
      items={destinationItems}
      onClose={() => back()}
      onPick={(d) => {
        addCandidate(id, d.id)
        back()
      }}
    />
  )
}
