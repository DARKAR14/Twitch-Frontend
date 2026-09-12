# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

DarkOps serves Twitch broadcasters and their moderators while they operate and maintain a live channel. Broadcasters need administrative control; moderators need fast, permission-aware access to the operational tools assigned to them.

## Product Purpose

DarkOps brings channel editing, clips, moderation activity, chat controls, music requests, community utilities, permissions, and Twitch integrations into one role-aware control center. Success means the team can see current channel state and complete routine live-operations tasks without moving between disconnected tools.

## Positioning

The product combines broadcaster and moderator workflows in a single real-time workspace, with Twitch authentication, role-aware navigation, granular moderator visibility, and live channel events.

## Operating Context

The product is used during live-stream operations and routine channel administration. It communicates with a backend through authenticated API requests and Socket.IO events, and surfaces Twitch stream state, channel changes, moderation activity, team access, media requests, and community records.

## Capabilities and Constraints

- Preserve the current React and Vite application structure, routes, role checks, permissions, API behavior, and Socket.IO behavior.
- Preserve all existing product features and Spanish interface copy unless a small accessibility clarification is needed.
- The public login route authenticates through Twitch. The dashboard is protected and adapts its navigation and content to broadcaster and moderator permissions.
- The Spotify overlay route remains publicly accessible for streaming software.
- The redesign applies across the entire frontend, including login, dashboard shell, panels, controls, tables, states, and responsive behavior.

## Brand Commitments

- Product name: DarkOps, with the existing `DARKOps` wordmark treatment.
- Twitch remains the authentication and platform context.
- The replacement visual world is explicitly pinned to a monochrome, Apple-inspired liquid-glass language: black and graphite fields, translucent sculpted surfaces, restrained white highlights, precise typography, and purposeful motion.
- The login page uses an animated abstract liquid-glass background consistent with the supplied visual reference.
- Avoid falling back to the incumbent purple-neon grid aesthetic or generic blur-only glassmorphism.

## Evidence on Hand

- The existing implementation in `src/` is the source of truth for product behavior, routes, roles, permissions, states, and Spanish copy.
- The user supplied a visual reference for the intended login composition and material treatment.
- No testimonials, customer logos, commercial metrics, or other marketing proof are available and none should be invented.

## Product Principles

- Keep live operational state immediately legible.
- Make role and permission boundaries clear without adding friction.
- Preserve familiar control behavior while unifying every surface visually.
- Use motion and glass material to communicate depth and state, never to obscure tasks.
- Keep the workspace responsive and usable during high-attention live sessions.

## Accessibility & Inclusion

Respect reduced-motion preferences, maintain visible keyboard focus, preserve semantic controls, and keep text and status contrast legible over translucent surfaces.
