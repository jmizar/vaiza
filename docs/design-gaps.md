# Design gaps (Figma to-do for Jaime)

Screens or states the build needs that aren't in Figma yet. The full, prioritised version (with
statuses Jaime ticks) is the design audit doc: https://claude.ai/artifact/UuWjGetLMeYKZqLNx7xCRN Until a gap is designed, the builder
ships a plain, clearly marked placeholder and lists it in the review card. Tick when designed.

## Voting & results (needed for M3)
- [ ] **Destination detail** (tap a card): why it fits the group ("Beach + Culture (Gabriel, Pablo)"),
      within budget for 3/4, flight time from each person's city, good season. (Data ready: `engine.scoreDestination().reasons`.)
- [ ] **Results after I confirm my vote:** ranked list, 👍/👎 counts, who voted what (avatars), my vote, can I still change it.
- [ ] **Vote progress on trip screen:** "2 of 3 voted", who's missing, "Remind them" (shares to WhatsApp).
- [ ] **Organizer decision:** "Everyone voted · Pick destination", top result preselected, tie state, lock confirmation.
- [ ] **Member waiting state:** "Waiting for John to pick".
- [ ] **Final reveal for everyone** the first time they open after the destination is locked.

## Joining (needed for M2)
- [ ] **Invite sheet** ("Add members"): share link, copy 6-letter code, WhatsApp message preview.
- [ ] **Invite link landing** in a browser: "John invited you to Summer escape" → set up → straight into "Add your dates".
- [ ] **Join with code** (Home → Join an existing trip) + errors: wrong code, already a member.
- [ ] **Add proxy member:** organizer adds someone not on the app (name, city, dates).

## Trip management & edge cases (M2–M3)
- [ ] **Trip "…" menu:** rename, copy invite link, remove member, leave trip, delete trip.
- [ ] **Member detail** (eye icon): what others see (budget always private).
- [ ] **Edit my dates/preferences** after submitting; what's locked once dates lock.
- [ ] **Empty/error states:** no common dates (hints as the way out), nobody answered yet, loading skeletons, offline, search with no results.

## Smaller
- [ ] **Settings** (gear on Profile): notifications, language, beta feedback, privacy, delete my data.
- [ ] **Booking hub scope:** which sections are MVP (proposal: flights per member, stays, activities, budget per person; day-to-day plans later).
- [ ] **Web:** laptop layout (centred phone column is enough) + iPhone "Add to Home Screen" prompt.
- [ ] **Copy:** splash subcopy still "Subcopy goes here".
- [ ] **Confirm:** climate & regions preferences dropped on purpose (old prototype had them).
- [ ] **Confirm:** display currency: Figma shows $, data is in €.

## Added by the 7 Nov design audit
- [ ] **Late joiner:** arrives after dates lock: "Can you make 12–18 July?" Yes/No.
- [ ] **Keep your trips:** optional email link / Apple sign-in after the first trip (iPhone storage isolation).
- [ ] **Nothing fits:** no destination matches budget or flight time, with options to widen.
- [ ] **Organiser hand-over** when the organiser leaves or goes quiet; "Plan without Pablo" for ghosts.
- [ ] **Booking hub:** "I've booked my flight" tick per member; add to calendar; share summary.
- [ ] **Hints inline** on the travel window with an "Ask Gabriel" share button.
- [ ] **Home chips as next actions:** Add your dates / Vote now / Waiting for 2 / Ready; unread dot.
- [ ] **Scrolling multi-month calendar** with connected ranges; past days disabled.
- [ ] **Lock confirmations + Unlock** for dates and destination.
- [ ] **Settings:** add a "Reduce transparency" switch (Safari can't detect the iOS setting).
