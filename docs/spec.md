# Vaiza product spec (MVP)

Source of truth for what to build. Figma board names are in *italics*; exports land in
`design/frames/<board>/`. Items marked **[gap]** are not designed yet (see `design-gaps.md`).

## Core idea
Stop the WhatsApp chaos. Each friend adds **when** they can travel, **where from**, their **budget**
(private) and **what they like**. Vaiza finds the longest stretch of **consecutive** days the group
shares, suggests destinations that fit everyone's flight time, budget and tastes, the group votes,
and the booking hub pre-fills flights (per person, from their own city), stays and activities.

Two journeys, chosen implicitly by the "Where are you going? (optional)" field on New trip:
- **Journey A (no destination yet):** Trip created → Dates & preferences → Voting destination → Booking hub
- **Journey B (destination known):** Trip created → Destination → Dates & preferences → Booking hub

Roles: **organizer** (created the trip; locks dates and destination, can add proxy members) and
**member**. A **proxy member** is someone not on the app whose dates the organizer enters.

## M1: First launch and home

**Splash** (*Splash Screen*): navy background, logo, "vaiza", subcopy **[gap: copy]**. Shows ~1s
on first open, then Onboarding (first time) or Home.
- AC: honours Reduce Motion (no logo animation); never shows if the app opened from an invite link
  for an existing user.

**Onboarding 1–3** (*Onboarding*): illustration, title, body, page dots, Next / Get started.
- Copy: "Find the date." / "Find the place." / "Enjoy the trip." (bodies as in Figma).
- AC: swipe or Next to advance; dots announce "Page 1 of 3"; Get started → Set up.
  Motion: illustration fades/slides in, dot morphs to pill.

**Set up** (*User Details*): "Let's set you up". Name ("How should your friends see you"), city
(searchable list, country code + name; helper "Used to calculate flight times from your city to
destinations."). "Save details" disabled until both are filled.
- AC: creates an anonymous account + profile. City search filters as you type (accent-insensitive).
  Keyboard "Go" submits when valid.

**Home** (*Home*): "Hi {name}! Where do you wanna go?" + MY TRIPS.
- States: empty (Start a new trip / Join an existing trip), list with trip cards, FAB menu open.
- Trip card: icon (flag once destination locked), name, members count, city once locked, status chip:
  **Draft** (only the organizer and they haven't added dates), **Voting** (dates or destination
  still being decided), **Ready** (destination + dates locked).
- Bottom bar: Home / Profile pill + "+" FAB (Start a new trip / Join an existing trip).
- AC: cards stagger in; FAB menu springs up with a dimmed backdrop; tap outside closes.

**Profile** (*Profile*): avatar initials, name, "Beta Tester" badge, editable name and city,
YOUR TIMELINE (Trips created, Countries visited, Trip partners), app version. Gear → Settings **[gap]**.

## M2: Real trips

**New trip** (*New Trip*): trip name (+ preset chips: Bachelors Party!, Summer 2027, 27' Ski Trip,
Pablo's Birthday!), "Where are you going? (optional)" destination search, info card "Not sure where
to go? No problem…". Create trip.
- AC: creates the trip (Journey A or B), then asks the organizer for their dates.

**Dates** (*New Trip → Dates*): "When can you travel?" Traveling from (defaults to home city,
changeable), Maximum trip duration (select), month calendar with tap or drag to select days,
"Select all {Month}" / "Deselect all", counter chip "{n} days ×". Skip (top right) leaves the trip as Draft.
- AC: drag-select works with touch and mouse; each day is a button with an accessible name
  ("12 July, available"); month navigation; Next is disabled with 0 days.

**Preferences** (*New Trip → Preferences*): PICK A DAILY BUDGET ($ Budget <$60/day, $$ Moderate
$60–120, $$$ Premium $120–200, ∞ No limit) + ACTIVITIES (optional): Beach, Mountain, Culture, Relax,
Gastronomy, Nightlife, Shopping, Adventure, Ski. "Save Preferences".
- AC: budget is stored privately (only you can read it; the group sees counts only).

**Trip screen** (*Trip Screen - Journey A / B*): navy header (back, name, members, destination for B,
"…" menu **[gap]**), TRAVEL WINDOW card once any window exists ("Jul 12 – 18, 2026 · Provisional ·
7 days · 3/3"), TRIP STATUS stepper, MEMBERS list, sticky primary action.
- Stepper sub-lines follow the Figma component *Trip status - Journey A/B* (e.g. "1 of 3 responded ·
  Add yours", "All in · Organizer deciding", "Locked 🔒").
- Members: avatar, name ("(you)", "(proxy)"), city, days count or "Waiting"/"Add dates"; pencil on
  yours (edit), eye on others (detail **[gap]**).
- Primary action by state: Add your dates → Lock travel dates (organizer) → Vote destination →
  Lock destination (organizer).
- AC: updates live (Realtime) when someone joins, adds dates or votes; no manual refresh.

**Invite & join** **[gap: designs]**: share link + 6-letter code; join with code from Home; opening
an invite link in a browser leads through Set up straight into the trip.

## M3: Decide

**Travel window** (*Trip Window - Best matches / Group dates*): segmented control Best matches /
Group calendar, "Hint" button.
- Best matches: up to 3 windows from `engine.findWindows` ("Best" tag, "3/3 members", dates, days).
  If not everyone has responded: notice "Based on 2 of 3 members…".
- Organizer view: windows are selectable (radio) + "or Add custom dates" + "Lock dates 🔒".
- Hint sheet "Travel upgrade opportunity": `engine.upgradeHints` ("If they shift their dates
  2 days, the overlap window grows to 9 days") + "See group calendar".
- Group calendar: days everyone is free in green, per-member coloured dots + legend.
- Add custom dates (organizer): calendar that overrides everyone's selection for this trip.
- AC: member view says "Waiting on organizer to lock the dates".

**Voting** (*Trip Voting - List View (MVP)* and *Confirm Vote*): "Where do you want to go?",
SUGGESTED DESTINATIONS (n): flag, name, "78% match · ~$85/day", 👍 / 👎 toggles.
Admin also sees "Add custom location · Suggest another destination". "Confirm your vote" + "Reset selection".
- Suggestions come from `engine.suggestDestinations` for the locked window, stored as the ballot.
- **[gap]** destination detail, results after voting, vote progress, organizer decision, waiting state.
- AC: thumbs have a 44px hit area, `aria-pressed`, a pop + light haptic on select.

**Success** (*Success Screen*): reveal of the chosen destination (flag, name, dates, members)
with confetti; then the trip becomes Ready.
- AC: shown once per member; Reduce Motion → no confetti, simple fade.

## M4: Book & polish

**Booking hub** (*Success Screen*, right): flag header, TRAVEL WINDOW, BOOKING HUB (Flights,
Accommodation: Booking.com / Airbnb / Expedia, Activities, Extras), BUDGET & PLANNING (Budget per
person, Day to day plans), MEMBERS.
- Flights: one deep link per member from their own city and dates (Aviasales/Skyscanner).
- Stays/activities: deep links pre-filled with destination, dates, group size.
- Links open externally and are disclosed as partner links once affiliate IDs exist.
- **[gap]** which sections are MVP; day-to-day plans proposed for later.

**Polish:** installable PWA (icon, splash, Add to Home Screen prompt on iOS), Spanish copy,
accessibility audit, motion pass, empty/error/loading states.

## Later (v1.1+)
Flight price estimates during voting (Travelpayouts cached fares), swipe voting (*Trip Voting -
Swipe View*), push notifications, AI itineraries, sign-in to keep trips across devices, store apps.
