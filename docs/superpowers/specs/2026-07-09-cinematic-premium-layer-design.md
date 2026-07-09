# Cinematic Premium Layer — Design Spec

**Date:** 2026-07-09
**Project:** berlin-web-greeter (42 Berlin login/lock screen)
**Goal:** Make the greeter feel premium — cinematic, polished, alive — on Dell AIO machines (1080p, 24"/27", dedicated GPU).

---

## Context

The greeter already has a strong visual foundation: terminal-aesthetic login, glassmorphic header/footer, animated liquid gradient, Intra calendar, exam/maintenance modes. This spec adds a coordinated premium layer on top without disrupting existing functionality.

**Hardware target:** Dell AIO, 1080p (82-92 PPI), 16GB RAM, laptop-class dedicated GPU, Chromium-based nody-greeter.

---

## 1. Display Quality (Low-PPI Fix)

**Problem:** 1080p on 27" = ~82 PPI. Current CSS uses tiny font sizes (`small`, `x-small`, `0.7rem`), thin weights (`font-weight: 200`), and blurry `text-shadow: 0 0 5px` — all of which look pixelated/soft on low-PPI screens.

### Changes

| What | Current | New |
|------|---------|-----|
| Minimum font size | `x-small` (~10px) | 13px floor |
| Font weight floor | 200 (bubble-message) | 400 minimum |
| Text shadow | `0 0 5px rgba(0,0,0,0.5)` | `0 1px 2px rgba(0,0,0,0.5)` |
| Font smoothing | Not set | `-webkit-font-smoothing: antialiased` on body |
| Small text letter-spacing | Default | `letter-spacing: 0.02em` on text ≤14px |

### Low-DPI Detection

Add a `low-dpi` class on `<body>` when `window.devicePixelRatio <= 1 && screen.width < 2560`. CSS can target `.low-dpi` for additional adjustments without affecting HiDPI machines.

### Files touched

- `static/css/styles.css` — font size/weight/shadow adjustments
- `static/css/dark.css` — text-shadow variable update
- `client/ui.ts` — add low-dpi class detection in constructor

---

## 2. Boot Sequence

The 3 seconds after the screen turns on. The biggest WOW moment.

### Timeline

| Delay | Element | Animation | Duration | Easing |
|-------|---------|-----------|----------|--------|
| 0.0s | Background gradient | Fade in from black | 800ms | ease-out |
| 0.3s | Header bar | Slide down from top + fade in | 400ms | spring (overshoot) |
| 0.5s | Logo | Glide down from above + fade in | 500ms | spring (slight overshoot) |
| 0.8s | Login form | Rise up 20px + fade in | 400ms | ease-out |
| 1.0s | Calendar events | Cascade from right, staggered | 100ms/item | ease-out |
| 1.2s | Footer | Slide up from bottom + fade in | 300ms | ease-out |
| 1.5s | "Next up" banner | Slide in from right + gentle bounce | 400ms | spring |

### Implementation

- All elements start with `opacity: 0` and a transform offset (set via CSS)
- A `.boot-active` class on `<body>` (added by JS after `GreeterReady`) triggers all animations via `animation-delay`
- After all animations complete (~2.5s), remove `.boot-active` and set elements to their normal state
- Pure CSS `@keyframes`, no JS animation library

### Lock screen variant

Skip logo and calendar. Background fade + header slide + lock form rise. Total ~1s.

### Reduced motion

All boot animations collapse to a single 200ms fade-in when `prefers-reduced-motion: reduce` is set.

### Files

- `static/css/boot.css` — new file, all boot keyframes and delays
- `client/main.ts` — add `.boot-active` class on `GreeterReady`
- `static/index.html` — add `<link>` for boot.css

---

## 3. Mouse Parallax

Subtle depth illusion when the user moves the mouse.

### Behavior

- Background gradient (`#gradient-bg`) moves **opposite** to cursor at 2% of displacement
- Foreground content (login form, logo) moves **with** cursor at 0.5% displacement
- Creates depth: background feels far, foreground feels close

### Implementation

- Single `mousemove` listener on `document`
- Sets CSS custom properties `--mx` and `--my` on `:root`
- Background and foreground elements reference these via `transform: translate(calc(var(--mx) * -2px), calc(var(--my) * -2px))`
- Throttled to `requestAnimationFrame`
- Disabled when any `<input>` is focused (no jank while typing)
- Disabled on lock screen and when `prefers-reduced-motion` is set

### Performance

GPU-accelerated `transform` only — no layout/paint. Negligible CPU cost.

### Files

- `client/uis/parallax.ts` — new file (~40 lines)
- `client/main.ts` — instantiate parallax in `initGreeter`
- `static/css/styles.css` — add `transform` rules referencing `--mx`/`--my`

---

## 4. Particle Field

Sparse, slow-moving dots on a canvas overlay — ambient atmosphere.

### Visual

- 40-60 dots, 2-4px radius, opacity 0.15-0.3
- Brand palette colors: lilac (#99A3EB), cyan (#00FFF2), fuchsia (#E018A3) — randomly assigned
- Drift speed: 0.2-0.5px per frame in random directions
- Faint connecting lines between dots within 150px of each other (opacity 0.05-0.1)
- Dots wrap around screen edges

### Implementation

- `<canvas>` element, `position: fixed`, z-index between background and UI
- ~80 lines of vanilla JS, `requestAnimationFrame` loop
- Pauses on `visibilitychange` (tab hidden)
- Only renders when the animated gradient background is active (not on wallpaper images)
- Canvas sized to `window.innerWidth × innerHeight`, resizes on window resize

### Disabled on

- Lock screen
- `prefers-reduced-motion`
- When a wallpaper image is showing (detected via `#gradient-bg` display state)

### Files

- `client/uis/particles.ts` — new file (~80 lines)
- `client/main.ts` — instantiate particles in `initGreeter`
- `static/index.html` — add `<canvas id="particle-canvas">`

---

## 5. Auth Choreography

The login interaction feels satisfying — premium app, not a form submission.

### Login flow

1. **Submit** → button text fades out, replaced by 3-dot CSS spinner (pulsing dots)
2. **Auth in progress** → input fields fade out upward (200ms), form shrinks to just the spinner
3. **Success** → spinner morphs to a checkmark (✓), cyan ripple expands from button center (400ms), screen fades to white (200ms) before session starts
4. **Failure** → spinner morphs back to arrow, inputs slide back in from above, password field does existing wiggle + red flash

### Lock screen unlock

Same flow but simpler: avatar gets a cyan ring pulse on success, password field slides up and fades out.

### Implementation

- CSS `@keyframes` for: spinner (3 pulsing dots), checkmark (SVG path draw), ripple (expanding circle)
- JS class toggles on the form element: `.auth-loading`, `.auth-success`, `.auth-failure`
- Hooks into existing `AuthenticatorEvents` callbacks in `loginscreen.ts` and `lockscreen.ts`:
  - `authenticationStart` → add `.auth-loading`
  - `authenticationComplete` → swap to `.auth-success`
  - `authenticationFailure` → swap to `.auth-failure`, then remove after animation

### Files

- `static/css/auth.css` — new file, all auth animation keyframes and state classes
- `client/uis/screens/loginscreen.ts` — wire up class toggles in event callbacks
- `client/uis/screens/lockscreen.ts` — same for lock screen
- `static/index.html` — add `<link>` for auth.css

---

## 6. Session Splash Screen

Replaces the old terminal-style hook script window with a premium splash matching the greeter's visual language.

### Visual

- Fullscreen borderless window, same void background + animated gradient
- Centered: user avatar (from `~/.face`), username in Space Mono
- Progress steps appear with terminal typing effect:
  ```
  > mounting your home...
  ✓ mounted
  > loading your profile...
  ✓ ready
  ```
- Each completed step gets a cyan checkmark
- Auto-fades out (500ms) and closes when the hook signals "done"

### Architecture

```
splash/
├── index.html        # Splash page
├── splash.css        # Styles (reuses greeter design tokens)
├── splash.js         # Reads progress, renders steps
└── launcher.sh       # Opens splash in borderless Chromium
```

- **Communication:** Hook script writes progress lines to `/tmp/42-session-splash` (a named pipe or regular file). Splash JS polls the file via `fetch()` every 200ms.
- **Protocol:** Each line is `status:message` (e.g., `progress:mounting your home...`, `done:ready`, `error:something failed`)
- **Launcher:** `launcher.sh` opens Chromium with `--kiosk --app=file:///path/to/splash/index.html --no-sandbox` before the desktop environment loads
- **Auto-close:** On receiving `done`, splash waits 500ms, fades out, then calls `window.close()`
- **Timeout:** If no `done` signal within 30 seconds, splash auto-closes (safety net)

### Styling

Reuses the greeter's CSS variables (`--c-void`, `--c-cyan`, `--c-lilac`, `--font-code`, `--radius-card`), fonts, and color palette. Same terminal aesthetic.

### Files

- `splash/` — new directory with the above files
- `systemd/` — updated or new service to launch the splash before the desktop session

---

## Out of Scope

- Time-aware ambient color shifting (dropped per user preference)
- WebGL/shader backgrounds (greeter webview reliability concerns)
- Animation framework/abstraction layer (over-engineering for this scope)

---

## Accessibility

All animations respect `prefers-reduced-motion: reduce`:
- Boot sequence → single 200ms fade
- Parallax → disabled
- Particles → disabled
- Auth choreography → instant state changes, no morphing

---

## New Files Summary

| File | Purpose |
|------|---------|
| `static/css/boot.css` | Boot sequence keyframes |
| `static/css/auth.css` | Auth animation states |
| `client/uis/parallax.ts` | Mouse parallax controller |
| `client/uis/particles.ts` | Canvas particle field |
| `splash/index.html` | Session splash page |
| `splash/splash.css` | Session splash styles |
| `splash/splash.js` | Session splash logic |
| `splash/launcher.sh` | Borderless Chromium launcher |

## Modified Files Summary

| File | Changes |
|------|---------|
| `static/index.html` | Add canvas element, link new CSS files |
| `static/css/styles.css` | Font size/weight/shadow fixes, parallax transform rules |
| `static/css/dark.css` | Sharper text-shadow variable |
| `client/main.ts` | Boot class toggle, instantiate parallax + particles |
| `client/ui.ts` | Low-DPI class detection |
| `client/uis/screens/loginscreen.ts` | Auth animation class toggles |
| `client/uis/screens/lockscreen.ts` | Auth animation class toggles |
