---
name: DarkOps
description: A live Twitch operations console carved from black optical glass.
colors:
  canvas-deep: "#050506"
  canvas-login: "#030304"
  glass-base: "rgba(255, 255, 255, 0.045)"
  glass-raised: "rgba(255, 255, 255, 0.075)"
  glass-strong: "rgba(255, 255, 255, 0.11)"
  field-well: "rgba(0, 0, 0, 0.27)"
  rim: "rgba(255, 255, 255, 0.12)"
  rim-strong: "rgba(255, 255, 255, 0.28)"
  optical-white: "#f4f4f5"
  silver: "#bfc0c4"
  text-secondary: "#b9b9be"
  text-tertiary: "#77777f"
  control-silver: "#dadadd"
  control-silver-deep: "#a8a8ac"
  ink-on-silver: "#111113"
  success: "#91d6ad"
  danger: "#ff7c88"
  caution: "#d7c68d"
  info: "#acd5de"
typography:
  brand-display:
    fontFamily: "Oxanium, Manrope, sans-serif"
    fontSize: "clamp(48px, 5.2vw, 72px)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(27px, 2.4vw, 38px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.06em"
  mono:
    fontFamily: "SFMono-Regular, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  media: "5px"
  compact: "8px"
  field: "10px"
  control: "11px"
  panel-sm: "13px"
  panel: "18px"
  auth-control: "17px"
  auth-panel: "36px"
  pill: "999px"
spacing:
  2xs: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "34px"
  shell-gutter: "52px"
components:
  button-primary:
    backgroundColor: "{colors.control-silver}"
    textColor: "{colors.ink-on-silver}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 17px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.glass-base}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "34px"
  button-auth:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.optical-white}"
    typography: "{typography.body}"
    rounded: "{rounded.auth-control}"
    padding: "0 24px"
    height: "72px"
    width: "100%"
  input:
    backgroundColor: "{colors.field-well}"
    textColor: "{colors.optical-white}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 13px"
    height: "44px"
    width: "100%"
  glass-card:
    backgroundColor: "{colors.glass-base}"
    textColor: "{colors.optical-white}"
    rounded: "{rounded.panel}"
    padding: "20px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "39px"
    width: "100%"
  nav-item-active:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.optical-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "39px"
    width: "100%"
  status-chip:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
---

# Design System: DarkOps

## Overview

**Creative North Star: "The Black Optical Command Deck"**

DarkOps is an Operate-mode control surface for Twitch broadcasters and moderators. It feels machined from black optical glass: graphite fields carry quiet particulate depth, milky silver rims describe each layer, and a few concentrated caustic highlights make important surfaces feel sculpted instead of merely blurred. The interface refuses the incumbent purple-neon dashboard spectacle; its personality comes from precision, material behavior, and the contrast between still controls and one flowing current of light.

The public login is the ceremonial threshold: a centered access panel sits over the animated particle-light current and retains the compact `PANEL DE CONTROL` badge above the DARKOps wordmark. After authentication, every permission-aware route lives inside one continuous command shell with a topbar, an organized tool rail, and a broad page-specific task plane. Density is deliberate and operational; hierarchy must make live state and the next valid action legible at a glance.

**Key Characteristics:**

- Near-black and graphite canvases with translucent white glass layers.
- Silver rims, internal highlights, soft black falloff, and sparingly placed caustics.
- Manrope as the precise workhorse, with Oxanium reserved for the DARKOps identity.
- Restrained semantic color that reports real state instead of decorating the shell.
- One ambient particle-light current; controls and operational content remain crisp and still.
- Spanish interface copy, role-aware navigation, and honest loading, empty, offline, and unavailable states.

## Colors

The palette is monochrome first: small changes in white opacity build the glass hierarchy, while muted semantic hues appear only when the system has real status to communicate.

### Primary

- **Optical White** (`#f4f4f5`): Primary text, active navigation, key icons, and the brightest edge highlights.
- **Control Silver** (`#dadadd`): The luminous face of decisive primary actions; it grades toward **Control Silver Deep** (`#a8a8ac`) and always carries dark ink.

### Tertiary

- **Signal Green** (`#91d6ad`): Connected, successful, and genuinely live-positive state.
- **Signal Red** (`#ff7c88`): Disconnected, destructive, error, and live-broadcast urgency.
- **Muted Gold** (`#d7c68d`): Caution, privileged, or exceptional status when the feature already establishes that meaning.
- **Cool Information** (`#acd5de`): Technical information and system guidance, never a decorative accent.

### Neutral

- **Deep Canvas** (`#050506`): Authenticated shell background and the base behind every translucent surface.
- **Login Void** (`#030304`): The slightly deeper public-login field behind the particle-light current.
- **Base Glass** (`rgba(255, 255, 255, 0.045)`): Default card and control surface.
- **Raised Glass** (`rgba(255, 255, 255, 0.075)`): Hover, compact controls, and visibly raised layers.
- **Strong Glass** (`rgba(255, 255, 255, 0.11)`): Selected or emphasized translucent layers.
- **Field Well** (`rgba(0, 0, 0, 0.27)`): Recessed form controls.
- **Milky Rim** (`rgba(255, 255, 255, 0.12)`): Default borders and separators.
- **Strong Rim** (`rgba(255, 255, 255, 0.28)`): Focused, selected, or high-contrast edges.
- **Secondary Silver Text** (`#b9b9be`): Supporting copy, field labels, and non-primary controls.
- **Tertiary Graphite Text** (`#77777f`): Timestamps, metadata, section labels, and explicit unavailable state.
- **Ink on Silver** (`#111113`): Text and icons on luminous silver controls.

### Named Rules

**The Light-Is-the-Accent Rule.** White light and silver contrast are the brand accent. Do not reintroduce purple neon, chromatic grid glow, or broad color washes.

**The Semantic Color Is Evidence Rule.** Green, red, gold, and cyan appear only when backed by connection, validation, platform, warning, or status data. Their rarity preserves meaning.

**The Real Data or Named Absence Rule.** Metrics, people, thumbnails, avatars, album art, categories, and activity rows come from the backend or Twitch/Spotify URLs. When data is missing, show `—`, a truthful fallback identity, or an explicit loading, empty, offline, disconnected, or unavailable state; never fabricate a convincing record.

## Typography

**Display Font:** Oxanium (with Manrope and sans-serif fallbacks)
**Body Font:** Manrope (with system-ui and sans-serif fallbacks)
**Label/Mono Font:** Manrope for labels; SFMono-Regular with Consolas and monospace fallbacks for timestamps and technical values

**Character:** Manrope keeps a dense operations surface calm, contemporary, and highly legible. Oxanium contributes a controlled technical edge only to the DARKOps brand and the oversized login identity, preventing the rest of the application from becoming theatrical.

### Hierarchy

- **Brand Display** (700, `clamp(48px, 5.2vw, 72px)`, 0.94): The DARKOps login wordmark only; use tight negative tracking and split `DARK` from the dimmer `Ops` treatment.
- **Headline** (700, `clamp(27px, 2.4vw, 38px)`, 1.08): Page titles that introduce each authenticated task plane.
- **Title** (700, `15px`, approximately 1.2): Card headings and compact section anchors.
- **Body** (400, `14px`, 1.55): Instructions, descriptions, form content, and page subtitles; long explanatory copy stays near the implemented 680px maximum.
- **Label** (600–800, `9px`–`12px`, `0.05em`–`0.11em`): Navigation groups, statuses, roles, field labels, and metadata. Uppercase and wide tracking are reserved for compact operational tags.
- **Mono** (400, `10px`, 1.3): Timestamps, queue positions, codes, and compact machine-derived values.

### Named Rules

**The Workhorse First Rule.** Use Manrope for all operational reading and interaction. Oxanium is an identity accent, not a general display face.

**The Compact Label Rule.** Uppercase tracking belongs to small badges such as `PANEL DE CONTROL`, roles, and status labels; never apply it to paragraphs, form values, or long navigation text.

## Layout

The authenticated shell is a two-column grid beneath a continuous topbar. On desktop the topbar is 76px high and spans the viewport; the fixed tool rail is 288px wide, can collapse to 82px, and the task plane fills the remaining width. Main content is capped at 1680px and uses a responsive horizontal gutter (`clamp(24px, 3.2vw, 52px)`). Each page begins with its own heading and subtitle, then places controls, real-data KPIs, tables, lists, or split work areas according to the job instead of repeating a generic card grid.

At 1260px, four-column KPI strips become two columns, dual task planes stack, and clip grids reduce to two columns. At 980px, the topbar becomes 68px high and the rail becomes an off-canvas drawer (`min(310px, 86vw)`) with a dimmed scrim. At 720px, dense grids become a single column, cards tighten from 20px to 16px padding, nonessential topbar labels hide, and the drawer exposes a visible account block and `Salir` action. The login has its own 680px refinement: the sculpted panel tightens from a 36px to a 28px radius while preserving its centered composition and top-left brand.

**The Hierarchy Before Telemetry Rule.** On the live dashboard, the page heading and subtitle always precede the KPI strip. This pinned order is part of the reading model, not an optional composition.

**The Account Must Remain Reachable Rule.** Desktop keeps account identity and sign-out in the topbar. Mobile may simplify that topbar only because the drawer presents both account identity and `Salir` visibly.

**The Page Owns Its Plane Rule.** Preserve the shared shell but let each route choose the layout its task requires: editor/history split, dense log, queue, table, search flow, permission matrix, or media grid.

## Elevation & Depth

Depth is a hybrid of translucent tonal layering and restrained shadow. Glass surfaces combine a low-opacity white gradient, a one-pixel silver rim, an inset top highlight, a soft black shadow below, and occasional narrow caustic streaks. The login panel is the deepest sculpted object; authenticated cards are calmer, and controls sit either raised on silver or recessed into a dark field well. Generic blur-only glassmorphism is insufficient: backdrop blur always needs an edge, a luminance gradient, and a clear relationship to the canvas.

### Shadow Vocabulary

- **Shell Float** (`inset 0 1px rgba(255,255,255,0.16), 0 10px 40px rgba(0,0,0,0.32)`): Keeps the continuous topbar above the task plane.
- **Operational Glass** (`inset 0 1px rgba(255,255,255,0.13), 0 18px 54px rgba(0,0,0,0.28)`): Standard depth for cards, KPI cells, and reusable glass containers.
- **Deep Popover** (`inset 0 1px rgba(255,255,255,0.14), 0 28px 80px rgba(0,0,0,0.66)`): Floating menus and notification layers that must clear dense content.
- **Sculpted Login** (`0 36px 90px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.48), inset 1px 0 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.18)`): The public access panel only.
- **Focused Field** (`0 0 0 3px rgba(255,255,255,0.055), inset 0 1px rgba(255,255,255,0.08)`): Keyboard and text-entry focus without chromatic glow.

**The Depth Comes From Optics Rule.** Use rim contrast, internal highlight, blur, and shadow as one material recipe. Never substitute a generic translucent rectangle with a large blur.

**The Still Controls, Moving Atmosphere Rule.** Default state transitions are brief (150–180ms), drawer movement is 220ms, and the login panel enters in 720ms with an ease-out curve. The long-running particle current, caustic drift, live pulse, Spotify vinyl, and spectrum stay behind or beside content and stop under `prefers-reduced-motion: reduce`; reduced motion must leave a complete still composition.

## Shapes

DarkOps uses nested rounded geometry with a clear size hierarchy. Operational cards use a gently sculpted 18px radius; small panels and list containers use 12–14px; navigation and primary controls use 11px; fields use 10px; compact media can fall to 5–8px. The login panel alone expands to 36px to feel like a single optical object, with 17px internal controls and a 27px inset rim. Pills use a fully rounded 999px shape for statuses, roles, and compact filters, while avatars, live dots, the vinyl, and progress handles are circular.

**The Nested Radius Rule.** Inner controls must be visibly tighter than their containing panel. Reserve the 36px silhouette for the login object and use 999px only when the content is truly pill-like.

## Components

### Buttons

- **Shape:** Operational actions use compact 11px corners and a minimum height of 42px; the login authentication action uses a more sculpted 17px radius and 72px desktop height.
- **Primary:** A silver vertical gradient carries dark ink, a bright inset top edge, and full-width treatment inside forms. It lifts by 1px on hover and returns to the baseline on active.
- **Hover / Focus:** Hover brightens or strengthens the rim in 160–180ms. Keyboard focus is always a visible two-pixel near-white outline with 3–4px offset; it never relies on a color shift alone.
- **Secondary:** Refresh, download, dismiss, and quiet actions use low-opacity glass, a milky border, secondary text, and a 34px minimum height.
- **Disabled:** Disabled controls retain their footprint but use reduced brightness/opacity and `not-allowed`; they cannot look actionable.

### Chips

- **Style:** Roles, live state, counts, and segmented filters are compact pills with 9–12px type, restrained tracking, a thin rim, and either neutral glass or a semantic tint.
- **State:** Active tabs use a brighter glass gradient, inset highlight, and white label. Semantic chips inherit color from real status; role chips on login are descriptive, not clickable controls.

### Cards / Containers

- **Corner Style:** Standard cards use the 18px panel radius; KPI cards use 16px and nested list containers use 12–13px.
- **Background:** A faint white radial highlight over a low-opacity linear glass layer, never an opaque gray slab.
- **Shadow Strategy:** Use Operational Glass at rest; interactive media cards may lift by 2px and strengthen the rim on hover.
- **Border:** One-pixel milky rim with a narrow bright caustic on selected top edges.
- **Internal Padding:** 20px desktop and 16px on narrow screens, with 12–16px for compact rows.

### Inputs / Fields

- **Style:** Recessed black well, one-pixel translucent rim, 10px corners, 44px minimum height, and 13px horizontal padding.
- **Focus:** The well lightens slightly, the rim strengthens, and a neutral three-pixel focus halo appears.
- **Error / Disabled:** Errors use Signal Red with text, border, and an explicit message. Disabled fields or actions retain legibility and clearly suppress interaction.

### Navigation

The desktop rail groups routes under small uppercase labels and exposes only items allowed by role and permission checks. Items are 39px high with 17px authored inline SVGs, neutral text at rest, a faint glass hover, and a sculpted active state with a silver rim, inner highlight, shadow, and one-pixel caustic. At 980px the same information architecture moves into a drawer; selecting a route closes it, and the scrim is a semantic button that also closes it.

### Status, Loading, Empty, and Unavailable States

Connection, live/offline state, success, warning, failure, loading, empty results, and missing values are first-class component states. Spinners use the neutral rim with a white leading edge; empty states use tertiary text and, where useful, a restrained 40px stroke icon. Use `—` for an unavailable scalar and concise Spanish copy for an unavailable collection or system state. Do not convert missing data into zero unless the backend meaning is truly zero.

### Liquid Backdrop

The login's signature canvas draws deterministic particles and two or three flowing silver Bézier ribbons over a black haze. Particle count drops on narrow screens, animation pauses when the document is hidden, and reduced motion renders one stable frame. It is ambient and `aria-hidden`; it must never carry information or interfere with the access panel.

### Spotify Overlay

The public streaming overlay is a wide container-responsive glass widget with real Spotify track metadata, real album art when available, a grayscale cover, vinyl silhouette, progress bar, and restrained spectrum. When playback data or art is unavailable, it must identify the waiting/inactive state plainly; the fallback art is a labeled absence, never fictional cover artwork or a fabricated playing track.

### SVG Icons

Use authored inline SVG, normally on a 24×24 viewBox and sized to 16–24px in the interface. Operational icons use `fill="none"`, `stroke="currentColor"`, rounded visual geometry, and a normalized 1.5–2 stroke weight; filled marks are reserved for platform identities such as Twitch and Spotify. Icons inherit text or semantic state color, decorative icons are hidden from assistive technology, and icon-only buttons always have an accessible name. Do not use icon fonts, emoji as a substitute for a new system icon, package-dependent glyphs, or external image URLs for controls.

**The Working Control Rule.** A visible action must have a real handler and, where required, working backend behavior. Do not add speculative controls, fake toggles, decorative search, or permissions that the product cannot execute.

## Do's and Don'ts

### Do:

- **Do** keep the dashboard heading and subtitle before its KPI strip.
- **Do** retain the `PANEL DE CONTROL` badge above the login wordmark.
- **Do** use real backend/Twitch/Spotify data and explicit unavailable states; treat `—`, offline copy, empty-state copy, and labeled fallbacks as designed outcomes.
- **Do** preserve the continuous topbar and desktop rail, then move the complete navigation plus visible account/sign-out into the mobile drawer.
- **Do** use semantic color sparingly and pair it with text, shape, or icon evidence.
- **Do** honor `prefers-reduced-motion: reduce` for canvas, transitions, pulses, spinners, vinyl, and spectrum animation.
- **Do** keep inline SVG icons visually consistent, current-color driven, accessible, and free of package runtime dependencies.

### Don't:

- **Don't** revive purple-neon grids, broad colored glows, or generic gaming-dashboard spectacle.
- **Don't** build glass from opacity and blur alone; every raised surface needs a deliberate rim, luminance gradient, and depth relationship.
- **Don't** invent metrics, users, clips, avatars, covers, activity, status, permissions, or successful outcomes.
- **Don't** show a control without a real capability, permission path, and interaction state.
- **Don't** hide account identity or `Salir` when the topbar compresses on mobile.
- **Don't** let ambient motion obscure copy, shift controls continuously, or survive reduced-motion preferences.
- **Don't** use external icon images, icon fonts, or mixed stroke systems for operational controls.
