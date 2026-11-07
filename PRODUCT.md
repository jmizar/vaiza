# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios (delivered as a mobile-first web app / PWA first; wrapped for the App Store and Google Play later)

## Stack

React 19 + TypeScript + Vite, Tailwind v4 tokens, Motion, Supabase. See CLAUDE.md.

## Users

Friend groups of 3–10 people, mostly 22–35, often spread across different cities (Erasmus alumni,
young professionals, people who moved abroad). One person is usually the organiser; the others are
low-commitment invitees who open a WhatsApp link and will drop at the first bit of friction.

## Product Purpose

Replace the endless WhatsApp thread about a group trip. Everyone adds when they can travel, where
they're flying from, a private budget and what they like; Vaiza finds the longest stretch of days
everyone shares, suggests destinations that fit everyone's flight time, budget and tastes, the group
votes, and a booking hub pre-fills flights (per person) and stays. Success: a group goes from
"we should do a trip" to locked dates and destination within a week.

## Positioning

The only tool for the pre-decision phase of group travel: Doodle does dates only, Wanderlog and
TripIt start after the destination is decided. Vaiza's distinct ideas: consecutive-day matching,
per-person origin and flight time, private budgets, and "if Gabriel frees 2 days you get 9" hints.

## Operating Context

Used on phones, in short bursts, usually right after a WhatsApp message. Invitees arrive by link,
often inside WhatsApp's in-app browser. The organiser returns several times over a few days.

## Capabilities and Constraints

- Free to run: Supabase free tier, Cloudflare Pages, no paid APIs. Flight prices later via
  Travelpayouts cached data (estimates, not quotes).
- Accounts are anonymous (name + city); no email at sign-up.
- Colours and visual design are owned by Jaime (designer): flag accessibility issues, never recolour.
- Budgets are private; the group only sees counts.

## Brand Commitments

Calm, friendly, a bit playful ("Where do you wanna go?"). iOS-native feel inspired by Liquid Glass:
light surfaces, soft shadows, floating glass controls, one warm orange gradient for primary actions,
navy for trip headers. Motion is gentle and purposeful. Avoid: busy travel-brochure clutter, stock
photo overload, dark patterns, hype copy.

## Evidence on Hand

Earlier prototype tested with real friend groups. Main feedback: after the group agreed a
destination, flights turned out pricier than expected, so people wanted to change dates, which
undermines the point. Price estimates during voting are planned for v1.1.

## Product Principles

1. The invitee's path must be near-zero effort: link → name + city → dates → done.
2. Always show what's needed next, and from whom.
3. Honest status: "provisional", "based on 2 of 3", "estimate".
4. The organiser decides; the app recommends.

## Accessibility & Inclusion

WCAG 2.2 AA for all text and controls except brand colours explicitly flagged by the designer.
44pt touch targets, VoiceOver-friendly calendar and voting, Reduce Motion and Reduce Transparency
respected. English first, Spanish next.
