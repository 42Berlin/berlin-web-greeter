# Cinematic Premium Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium cinematic layer to the 42 Berlin webgreeter — boot animations, parallax, particles, auth choreography, and a session splash screen.

**Architecture:** Pure CSS animations + lightweight canvas particles + JS class toggles. No new dependencies. All animations respect `prefers-reduced-motion`. The session splash is a standalone HTML page launched in a borderless Chromium window.

**Tech Stack:** TypeScript, CSS @keyframes, Canvas 2D API, webpack (existing), Chromium (nody-greeter webview)

## Global Constraints

- Hardware: Dell AIO, 1080p (82-92 PPI), 16GB RAM, laptop GPU
- No new npm dependencies
- All animations must respect `prefers-reduced-motion: reduce`
- Build with `make` (webpack + CSS concatenation via Makefile)
- Test by opening `static/index.html` in browser or `nody-greeter --d` on target machine
- CSS files are concatenated by the Makefile into `static/greeter.css` — new CSS files must be added to the `static/greeter.css` target in the Makefile

---

### Task 1: Display Quality (Low-PPI Fix)

**Files:**
- Modify: `static/css/dark.css:39` (text-shadow variable)
- Modify: `static/css/styles.css` (font sizes, weights, smoothing)
- Modify: `client/ui.ts:29-30` (low-dpi class detection)

**Interfaces:**
- Produces: `low-dpi` class on `<body>` for CSS targeting

- [ ] **Step 1: Update text-shadow variable in dark.css**

In `static/css/dark.css`, change line 39:

```css
/* Before */
--text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);

/* After */
--text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
```

- [ ] **Step 2: Add font smoothing and low-DPI styles to styles.css**

Add at the top of the `html, body` rule in `static/css/styles.css` (after line 57):

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

Add a new section at the end of `static/css/styles.css`:

```css
/* Low-DPI adjustments for 1080p on large screens (82-92 PPI) */
body.low-dpi {
  font-size: 16px;
}

body.low-dpi .calendar-event-details {
  font-size: 13px;
  letter-spacing: 0.02em;
}

body.low-dpi .calendar-event-date-day,
body.low-dpi .calendar-event-date-month {
  font-size: 13px;
}

body.low-dpi .header-button {
  font-size: 13px;
}

body.low-dpi .next-event-label {
  font-size: 12px;
}

body.low-dpi .next-event-time,
body.low-dpi .next-event-location {
  font-size: 13px;
}

body.low-dpi #bubble-message {
  font-weight: 400;
}

body.low-dpi .diag-key,
body.low-dpi .diag-val {
  font-size: 14px;
}
```

- [ ] **Step 3: Add low-DPI detection in ui.ts**

In `client/ui.ts`, add at the end of the constructor (after the `applyHiDpiScaling()` call, around line 37):

```typescript
if (window.devicePixelRatio <= 1 && screen.width < 2560) {
  document.body.classList.add('low-dpi');
}
```

- [ ] **Step 4: Build and verify**

Run: `make`
Expected: Build completes without errors. Open `static/index.html` in a browser — text should render sharply. In DevTools, toggle `low-dpi` class on `<body>` to see the adjustments.

- [ ] **Step 5: Commit**

```bash
git add static/css/dark.css static/css/styles.css client/ui.ts
git commit -m "fix: improve text rendering on low-PPI displays (1080p 24-27in)"
```

---

### Task 2: Boot Sequence

**Files:**
- Create: `static/css/boot.css`
- Modify: `Makefile:71-73` (add boot.css to greeter.css concatenation)
- Modify: `static/index.html:8` (add boot.css link for dev mode)
- Modify: `client/main.ts:212-213` (add boot-active class on GreeterReady)

**Interfaces:**
- Consumes: nothing
- Produces: `.boot-active` class on `<body>`, boot CSS keyframes

- [ ] **Step 1: Create boot.css with keyframes and initial hidden states**

Create `static/css/boot.css`:

```css
/* Boot sequence: staggered entrance animations triggered by .boot-active on <body> */

/* Initial hidden states — elements start invisible and offset */
body.boot-pending header {
  opacity: 0;
  transform: translateY(-20px);
}

body.boot-pending #logo-wrapper {
  opacity: 0;
  transform: translateY(-30px);
}

body.boot-pending main form {
  opacity: 0;
  transform: translateY(20px);
}

body.boot-pending .calendar-event {
  opacity: 0;
  transform: translateX(30px);
}

body.boot-pending #next-event {
  opacity: 0;
  transform: translateX(30px);
}

body.boot-pending footer {
  opacity: 0;
  transform: translateY(20px);
}

body.boot-pending #gradient-bg {
  opacity: 0;
}

/* Keyframes */
@keyframes bootFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bootSlideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bootSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bootSlideRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes bootSpringDown {
  0% { opacity: 0; transform: translateY(-30px); }
  70% { opacity: 1; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes bootSpringRight {
  0% { opacity: 0; transform: translateX(30px); }
  70% { opacity: 1; transform: translateX(-4px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* Active boot animations */
body.boot-active #gradient-bg {
  animation: bootFadeIn 800ms ease-out forwards;
}

body.boot-active header {
  animation: bootSlideDown 400ms cubic-bezier(0.34, 1.56, 0.64, 1) 300ms forwards;
}

body.boot-active #logo-wrapper {
  animation: bootSpringDown 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 500ms forwards;
}

body.boot-active main form {
  animation: bootSlideUp 400ms ease-out 800ms forwards;
}

body.boot-active .calendar-event:nth-child(1) { animation: bootSlideRight 300ms ease-out 1000ms forwards; }
body.boot-active .calendar-event:nth-child(2) { animation: bootSlideRight 300ms ease-out 1100ms forwards; }
body.boot-active .calendar-event:nth-child(3) { animation: bootSlideRight 300ms ease-out 1200ms forwards; }
body.boot-active .calendar-event:nth-child(4) { animation: bootSlideRight 300ms ease-out 1300ms forwards; }
body.boot-active .calendar-event:nth-child(5) { animation: bootSlideRight 300ms ease-out 1400ms forwards; }
body.boot-active .calendar-event:nth-child(6) { animation: bootSlideRight 300ms ease-out 1500ms forwards; }
body.boot-active .calendar-event:nth-child(7) { animation: bootSlideRight 300ms ease-out 1600ms forwards; }
body.boot-active .calendar-event:nth-child(8) { animation: bootSlideRight 300ms ease-out 1700ms forwards; }

body.boot-active #next-event {
  animation: bootSpringRight 400ms cubic-bezier(0.34, 1.56, 0.64, 1) 1500ms forwards;
}

body.boot-active footer {
  animation: bootSlideUp 300ms ease-out 1200ms forwards;
}

/* Lock screen: skip logo and calendar, faster sequence */
body.boot-pending.lock-screen .calendar-event,
body.boot-pending.lock-screen #next-event {
  opacity: 1;
  transform: none;
}

body.boot-active.lock-screen main form {
  animation: bootSlideUp 400ms ease-out 400ms forwards;
}

/* Reduced motion: collapse to a single fade */
@media (prefers-reduced-motion: reduce) {
  body.boot-pending header,
  body.boot-pending #logo-wrapper,
  body.boot-pending main form,
  body.boot-pending .calendar-event,
  body.boot-pending #next-event,
  body.boot-pending footer,
  body.boot-pending #gradient-bg {
    transform: none;
  }

  body.boot-active header,
  body.boot-active #logo-wrapper,
  body.boot-active main form,
  body.boot-active .calendar-event,
  body.boot-active #next-event,
  body.boot-active footer,
  body.boot-active #gradient-bg {
    animation: bootFadeIn 200ms ease-out forwards !important;
  }
}
```

- [ ] **Step 2: Add boot.css to the Makefile concatenation**

In `Makefile`, change the `static/greeter.css` target (lines 71-73):

```makefile
# Before
static/greeter.css:
	echo "@import 'css/fonts.css';" > "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/styles.css';" >> "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/dark.css';" >> "$(ROOT_DIR)/static/greeter.css"

# After
static/greeter.css:
	echo "@import 'css/fonts.css';" > "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/boot.css';" >> "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/styles.css';" >> "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/dark.css';" >> "$(ROOT_DIR)/static/greeter.css"
```

- [ ] **Step 3: Add boot.css link in index.html for dev mode**

In `static/index.html`, add after line 8 (after the `styles.css` link):

```html
<link rel="stylesheet" href="css/boot.css" />
```

- [ ] **Step 4: Add boot class toggle in main.ts**

In `client/main.ts`, modify the `GreeterReady` listener (lines 212-213):

```typescript
// Before
window.addEventListener("GreeterReady", () => {
	initGreeter();
});

// After
window.addEventListener("GreeterReady", () => {
	document.body.classList.add('boot-pending');
	initGreeter();
	requestAnimationFrame(() => {
		document.body.classList.remove('boot-pending');
		document.body.classList.add('boot-active');
		setTimeout(() => {
			document.body.classList.remove('boot-active');
		}, 2500);
	});
});
```

- [ ] **Step 5: Build and verify**

Run: `make`
Expected: Build completes. Open `static/index.html` — elements should animate in with staggered timing. Add `boot-pending` class to `<body>` in DevTools, then swap to `boot-active` to replay.

- [ ] **Step 6: Commit**

```bash
git add static/css/boot.css static/index.html client/main.ts Makefile
git commit -m "feat: add cinematic boot sequence with staggered entrance animations"
```

---

### Task 3: Mouse Parallax

**Files:**
- Create: `client/uis/parallax.ts`
- Modify: `client/main.ts:158-163` (instantiate parallax in initGreeter)
- Modify: `static/css/styles.css` (add parallax transform rules)

**Interfaces:**
- Consumes: `window.ui.isLockScreen` (from existing UI class)
- Produces: CSS custom properties `--mx` and `--my` on `:root`

- [ ] **Step 1: Create parallax.ts**

Create `client/uis/parallax.ts`:

```typescript
export class Parallax {
	private _rafId: number = 0;
	private _targetX: number = 0;
	private _targetY: number = 0;
	private _active: boolean;

	public constructor(isLockScreen: boolean) {
		this._active = !isLockScreen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!this._active) return;

		document.documentElement.style.setProperty('--mx', '0');
		document.documentElement.style.setProperty('--my', '0');

		document.addEventListener('mousemove', this._onMouseMove);
	}

	private _onMouseMove = (e: MouseEvent): void => {
		if (document.activeElement?.tagName === 'INPUT') return;

		const cx = window.innerWidth / 2;
		const cy = window.innerHeight / 2;
		this._targetX = (e.clientX - cx) / cx;
		this._targetY = (e.clientY - cy) / cy;

		if (!this._rafId) {
			this._rafId = requestAnimationFrame(this._apply);
		}
	};

	private _apply = (): void => {
		this._rafId = 0;
		document.documentElement.style.setProperty('--mx', this._targetX.toFixed(3));
		document.documentElement.style.setProperty('--my', this._targetY.toFixed(3));
	};
}
```

- [ ] **Step 2: Add parallax transform rules to styles.css**

Add at the end of `static/css/styles.css`:

```css
/* Parallax depth layers (driven by --mx/--my from parallax.ts) */
#gradient-bg {
  transform: translate(calc(var(--mx, 0) * -20px), calc(var(--my, 0) * -20px));
  will-change: transform;
}

#logo-wrapper,
main {
  transform: translate(calc(var(--mx, 0) * 5px), calc(var(--my, 0) * 5px));
  will-change: transform;
}
```

- [ ] **Step 3: Instantiate parallax in main.ts**

In `client/main.ts`, add the import at the top (after line 7):

```typescript
import { Parallax } from './uis/parallax';
```

In `initGreeter()`, add after `setupBrightnessControl()` (around line 167):

```typescript
new Parallax(window.ui.isLockScreen);
```

- [ ] **Step 4: Build and verify**

Run: `make`
Expected: Build completes. Open `static/index.html` — move the mouse around, background should shift subtly opposite to cursor, foreground shifts with cursor. Focus an input field and verify parallax stops.

- [ ] **Step 5: Commit**

```bash
git add client/uis/parallax.ts client/main.ts static/css/styles.css
git commit -m "feat: add subtle mouse parallax for depth effect"
```

---

### Task 4: Particle Field

**Files:**
- Create: `client/uis/particles.ts`
- Modify: `static/index.html` (add canvas element)
- Modify: `client/main.ts` (instantiate particles)
- Modify: `static/css/styles.css` (canvas positioning)

**Interfaces:**
- Consumes: `window.ui.isLockScreen`, `#gradient-bg` display state
- Produces: animated `<canvas>` overlay

- [ ] **Step 1: Add canvas element to index.html**

In `static/index.html`, add after the `#gradient-bg` div (after line 15):

```html
<canvas id="particle-canvas"></canvas>
```

- [ ] **Step 2: Add canvas CSS to styles.css**

Add at the end of `static/css/styles.css`:

```css
#particle-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  display: none;
}
```

- [ ] **Step 3: Create particles.ts**

Create `client/uis/particles.ts`:

```typescript
interface Dot {
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
	color: string;
	opacity: number;
}

const COLORS = ['#99A3EB', '#00FFF2', '#E018A3'];
const DOT_COUNT = 50;
const LINE_DIST = 150;

export class ParticleField {
	private _canvas: HTMLCanvasElement;
	private _ctx: CanvasRenderingContext2D;
	private _dots: Dot[] = [];
	private _rafId: number = 0;
	private _active: boolean;

	public constructor(isLockScreen: boolean) {
		this._canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
		this._ctx = this._canvas.getContext('2d')!;
		this._active = !isLockScreen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!this._active) return;

		this._resize();
		window.addEventListener('resize', this._resize);
		document.addEventListener('visibilitychange', this._onVisibility);

		for (let i = 0; i < DOT_COUNT; i++) {
			this._dots.push({
				x: Math.random() * this._canvas.width,
				y: Math.random() * this._canvas.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				r: 2 + Math.random() * 2,
				color: COLORS[Math.floor(Math.random() * COLORS.length)],
				opacity: 0.15 + Math.random() * 0.15,
			});
		}

		this._checkAndStart();
		window.data.addDataChangeListener(() => this._checkAndStart());
	}

	private _resize = (): void => {
		this._canvas.width = window.innerWidth;
		this._canvas.height = window.innerHeight;
	};

	private _onVisibility = (): void => {
		if (document.hidden) {
			cancelAnimationFrame(this._rafId);
			this._rafId = 0;
		} else {
			this._checkAndStart();
		}
	};

	private _checkAndStart(): void {
		const gradientBg = document.getElementById('gradient-bg');
		const shouldShow = gradientBg && gradientBg.style.display !== 'none' && getComputedStyle(gradientBg).display !== 'none';
		this._canvas.style.display = shouldShow ? 'block' : 'none';
		if (shouldShow && !this._rafId) {
			this._rafId = requestAnimationFrame(this._tick);
		} else if (!shouldShow && this._rafId) {
			cancelAnimationFrame(this._rafId);
			this._rafId = 0;
		}
	}

	private _tick = (): void => {
		const w = this._canvas.width;
		const h = this._canvas.height;
		this._ctx.clearRect(0, 0, w, h);

		for (const d of this._dots) {
			d.x += d.vx;
			d.y += d.vy;
			if (d.x < 0) d.x += w;
			if (d.x > w) d.x -= w;
			if (d.y < 0) d.y += h;
			if (d.y > h) d.y -= h;

			this._ctx.beginPath();
			this._ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
			this._ctx.fillStyle = d.color;
			this._ctx.globalAlpha = d.opacity;
			this._ctx.fill();
		}

		this._ctx.globalAlpha = 0.06;
		this._ctx.strokeStyle = '#99A3EB';
		this._ctx.lineWidth = 1;
		for (let i = 0; i < this._dots.length; i++) {
			for (let j = i + 1; j < this._dots.length; j++) {
				const dx = this._dots[i].x - this._dots[j].x;
				const dy = this._dots[i].y - this._dots[j].y;
				if (dx * dx + dy * dy < LINE_DIST * LINE_DIST) {
					this._ctx.beginPath();
					this._ctx.moveTo(this._dots[i].x, this._dots[i].y);
					this._ctx.lineTo(this._dots[j].x, this._dots[j].y);
					this._ctx.stroke();
				}
			}
		}
		this._ctx.globalAlpha = 1;

		this._rafId = requestAnimationFrame(this._tick);
	};
}
```

- [ ] **Step 4: Instantiate particles in main.ts**

In `client/main.ts`, add the import at the top (after the parallax import):

```typescript
import { ParticleField } from './uis/particles';
```

In `initGreeter()`, add after the `new Parallax(...)` line:

```typescript
new ParticleField(window.ui.isLockScreen);
```

- [ ] **Step 5: Build and verify**

Run: `make`
Expected: Build completes. Open `static/index.html` — faint colored dots should drift slowly across the background. In DevTools, hide `#gradient-bg` (`display: none`) and verify particles disappear too.

- [ ] **Step 6: Commit**

```bash
git add client/uis/particles.ts client/main.ts static/index.html static/css/styles.css
git commit -m "feat: add ambient particle field with brand-colored dots and connecting lines"
```

---

### Task 5: Auth Choreography

**Files:**
- Create: `static/css/auth.css`
- Modify: `Makefile` (add auth.css to greeter.css concatenation)
- Modify: `static/index.html` (add auth.css link for dev mode)
- Modify: `client/uis/screens/loginscreen.ts:7-25` (wire auth animation classes)
- Modify: `client/uis/screens/lockscreen.ts:13-31` (wire auth animation classes)

**Interfaces:**
- Consumes: `AuthenticatorEvents.authenticationStart`, `authenticationComplete`, `authenticationFailure`
- Produces: CSS classes `.auth-loading`, `.auth-success`, `.auth-failure` on form elements

- [ ] **Step 1: Create auth.css**

Create `static/css/auth.css`:

```css
/* Auth choreography: login/unlock animation states */

/* Spinner: three pulsing dots replacing button text */
@keyframes authDotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}

.auth-spinner {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.auth-spinner span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-cyan);
  animation: authDotPulse 1.2s ease-in-out infinite;
}

.auth-spinner span:nth-child(2) { animation-delay: 0.15s; }
.auth-spinner span:nth-child(3) { animation-delay: 0.3s; }

/* Loading state: inputs fade out upward */
form.auth-loading input {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
  pointer-events: none;
}

form.auth-loading button {
  pointer-events: none;
}

/* Success state: ripple expanding from button */
@keyframes authRipple {
  0% { transform: scale(0); opacity: 0.6; }
  100% { transform: scale(4); opacity: 0; }
}

@keyframes authCheckmark {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

form.auth-success button {
  position: relative;
  border-color: var(--c-cyan);
  background: var(--c-cyan);
  color: var(--c-void);
  pointer-events: none;
}

form.auth-success button::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: var(--radius-pill);
  border: 2px solid var(--c-cyan);
  animation: authRipple 400ms ease-out forwards;
}

form.auth-success .auth-checkmark {
  display: inline-block;
  color: var(--c-void);
  font-size: 1.2em;
  animation: authCheckmark 300ms ease-out forwards;
}

/* Failure state: inputs slide back in */
form.auth-failure input {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

/* Lock screen: avatar ring pulse on success */
@keyframes avatarPulse {
  0% { box-shadow: 0 0 24px rgba(153, 163, 235, 0.35); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 242, 0.6); }
  100% { box-shadow: 0 0 24px rgba(153, 163, 235, 0.35); }
}

form.auth-success #active-user-session-avatar {
  border-color: var(--c-cyan);
  animation: avatarPulse 600ms ease-in-out;
}

/* Reduced motion: instant state changes */
@media (prefers-reduced-motion: reduce) {
  .auth-spinner span { animation: none; opacity: 1; }
  form.auth-loading input { transition: none; }
  form.auth-success button::after { animation: none; }
  form.auth-success .auth-checkmark { animation: none; }
  form.auth-failure input { transition: none; }
  form.auth-success #active-user-session-avatar { animation: none; }
}
```

- [ ] **Step 2: Add auth.css to Makefile concatenation**

In `Makefile`, update the `static/greeter.css` target to include auth.css:

```makefile
static/greeter.css:
	echo "@import 'css/fonts.css';" > "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/boot.css';" >> "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/auth.css';" >> "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/styles.css';" >> "$(ROOT_DIR)/static/greeter.css"
	echo "@import 'css/dark.css';" >> "$(ROOT_DIR)/static/greeter.css"
```

- [ ] **Step 3: Add auth.css link in index.html for dev mode**

In `static/index.html`, add after the boot.css link:

```html
<link rel="stylesheet" href="css/auth.css" />
```

- [ ] **Step 4: Wire auth animations in loginscreen.ts**

In `client/uis/screens/loginscreen.ts`, replace the `_events` object (lines 7-25):

```typescript
protected _events: AuthenticatorEvents = {
  authenticationStart: () => {
    this._disableForm();
    this._showAuthLoading();
  },
  authenticationComplete: () => {
    this._showAuthSuccess();
  },
  authenticationFailure: () => {
    this._showAuthFailure();
    this._enableForm();
    this._wigglePasswordInput();
  },
  errorMessage: (message: string) => {
    alert(message);
    window.ui.setDebugInfo(message);
  },
  infoMessage: (message: string) => {
    alert(message);
  },
};
```

Add these private methods to the `LoginScreenUI` class:

```typescript
private _showAuthLoading(): void {
  const form = this._form.form;
  form.classList.add('auth-loading');
  const button = this._form.loginButton;
  button.innerHTML = '<span class="auth-spinner"><span></span><span></span><span></span></span>';
}

private _showAuthSuccess(): void {
  const form = this._form.form;
  form.classList.remove('auth-loading');
  form.classList.add('auth-success');
  const button = this._form.loginButton;
  button.innerHTML = '<span class="auth-checkmark">✓</span>';
}

private _showAuthFailure(): void {
  const form = this._form.form;
  form.classList.remove('auth-loading', 'auth-success');
  form.classList.add('auth-failure');
  const button = this._form.loginButton;
  button.innerHTML = 'sign_in<span class="term-arrow">&rarr;</span>';
  setTimeout(() => {
    form.classList.remove('auth-failure');
  }, 400);
}
```

- [ ] **Step 5: Wire auth animations in lockscreen.ts**

In `client/uis/screens/lockscreen.ts`, replace the `_events` object (lines 13-31):

```typescript
protected _events: AuthenticatorEvents = {
  authenticationStart: () => {
    this._disableForm();
    this._showAuthLoading();
  },
  authenticationComplete: () => {
    this._showAuthSuccess();
  },
  authenticationFailure: () => {
    this._showAuthFailure();
    this._enableForm();
    this._wigglePasswordInput();
  },
  errorMessage: (message: string) => {
    alert(message);
    window.ui.setDebugInfo(message);
  },
  infoMessage: (message: string) => {
    alert(message);
  },
};
```

Add these private methods to the `LockScreenUI` class:

```typescript
private _showAuthLoading(): void {
  const form = (this._form as UILockScreenElements).form;
  form.classList.add('auth-loading');
  const button = (this._form as UILockScreenElements).unlockButton;
  button.innerHTML = '<span class="auth-spinner"><span></span><span></span><span></span></span>';
}

private _showAuthSuccess(): void {
  const form = (this._form as UILockScreenElements).form;
  form.classList.remove('auth-loading');
  form.classList.add('auth-success');
  const button = (this._form as UILockScreenElements).unlockButton;
  button.innerHTML = '<span class="auth-checkmark">✓</span>';
}

private _showAuthFailure(): void {
  const form = (this._form as UILockScreenElements).form;
  form.classList.remove('auth-loading', 'auth-success');
  form.classList.add('auth-failure');
  const button = (this._form as UILockScreenElements).unlockButton;
  button.innerHTML = 'unlock<span class="term-arrow">&rarr;</span>';
  setTimeout(() => {
    form.classList.remove('auth-failure');
  }, 400);
}
```

- [ ] **Step 6: Build and verify**

Run: `make`
Expected: Build completes. Open `static/index.html` — manually add `auth-loading` class to `#login-form` in DevTools to see the spinner, then swap to `auth-success` for the checkmark + ripple.

- [ ] **Step 7: Commit**

```bash
git add static/css/auth.css static/index.html Makefile client/uis/screens/loginscreen.ts client/uis/screens/lockscreen.ts
git commit -m "feat: add auth choreography with spinner, checkmark, and ripple animations"
```

---

### Task 6: Session Splash Screen

**Files:**
- Create: `splash/index.html`
- Create: `splash/splash.css`
- Create: `splash/splash.js`
- Create: `splash/launcher.sh`
- Modify: `Makefile` (add splash to install target)

**Interfaces:**
- Consumes: progress lines from `/tmp/42-session-splash` (protocol: `status:message`)
- Produces: fullscreen splash window that auto-closes on `done`

- [ ] **Step 1: Create splash/index.html**

Create `splash/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="splash.css" />
  <title>42 Berlin — Session Loading</title>
</head>
<body>
  <div id="gradient-bg"></div>
  <div id="splash-content">
    <img id="splash-avatar" src="" alt="" />
    <h2 id="splash-username"></h2>
    <div id="splash-steps"></div>
  </div>
  <script src="splash.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create splash/splash.css**

Create `splash/splash.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

:root {
  --c-void: #07040F;
  --c-cyan: #00FFF2;
  --c-lilac: #99A3EB;
  --c-fuchsia: #E018A3;
  --font-code: 'Space Mono', monospace;
  --radius-card: 16px;
  --color-text-primary: #EDEDED;
  --color-text-secondary: #BDBDBD;
}

*, *::after, *::before {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
  background-color: var(--c-void);
  color: var(--color-text-primary);
  font-family: var(--font-code);
  -webkit-font-smoothing: antialiased;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 500ms ease-out;
}

body.fade-out {
  opacity: 0;
}

#gradient-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background-color: #0d0820;
  pointer-events: none;
}

#gradient-bg::after {
  content: '';
  position: absolute;
  width: 180vw;
  height: 180vh;
  top: -40vh;
  left: -40vw;
  background: radial-gradient(ellipse at 50% 50%, rgba(153, 163, 235, 0.6) 0%, transparent 45%),
              radial-gradient(ellipse at 60% 40%, rgba(110, 40, 230, 0.7) 0%, transparent 65%);
  filter: blur(80px);
  transform-origin: 50% 50%;
  will-change: transform;
  animation: liquidFlow 18s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
}

@keyframes liquidFlow {
  0%   { transform: translate(-5%, -5%) scale(1.1, 1.4) rotate(0deg); }
  33%  { transform: translate(12%, -8%) scale(1.5, 0.9) rotate(35deg); }
  66%  { transform: translate(-10%, 12%) scale(0.9, 1.6) rotate(-25deg); }
  100% { transform: translate(8%, 15%) scale(1.6, 1.1) rotate(55deg); }
}

#splash-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

#splash-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid var(--c-lilac);
  box-shadow: 0 0 24px rgba(153, 163, 235, 0.35);
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
}

#splash-username {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--c-lilac);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

#splash-steps {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 320px;
}

.splash-step {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(6px);
  animation: stepIn 300ms ease-out forwards;
}

.splash-step.done {
  color: var(--c-cyan);
}

.splash-step.error {
  color: #FF2C2C;
}

@keyframes stepIn {
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  #gradient-bg::after { animation: none; }
  .splash-step { animation: none; opacity: 1; transform: none; }
  body.fade-out { transition: none; }
}
```

- [ ] **Step 3: Create splash/splash.js**

Create `splash/splash.js`:

```javascript
(function () {
  const POLL_INTERVAL = 200;
  const TIMEOUT_MS = 30000;
  const FADE_OUT_MS = 500;
  const PROGRESS_PATH = '/tmp/42-session-splash';

  const stepsEl = document.getElementById('splash-steps');
  const usernameEl = document.getElementById('splash-username');
  const avatarEl = document.getElementById('splash-avatar');

  const params = new URLSearchParams(window.location.search);
  const username = params.get('user') || '';
  usernameEl.textContent = username || 'loading...';

  if (username) {
    avatarEl.src = '/tmp/codam-web-greeter-user-avatar';
    avatarEl.addEventListener('error', function () {
      avatarEl.style.display = 'none';
    });
  } else {
    avatarEl.style.display = 'none';
  }

  let lastLength = 0;
  let done = false;

  function addStep(status, message) {
    const el = document.createElement('div');
    el.className = 'splash-step';
    if (status === 'done') {
      el.classList.add('done');
      el.textContent = '\u2713 ' + message;
    } else if (status === 'error') {
      el.classList.add('error');
      el.textContent = '\u2717 ' + message;
    } else {
      el.textContent = '> ' + message;
    }
    stepsEl.appendChild(el);
  }

  function closeSplash() {
    if (done) return;
    done = true;
    document.body.classList.add('fade-out');
    setTimeout(function () {
      window.close();
    }, FADE_OUT_MS);
  }

  function poll() {
    if (done) return;
    fetch(PROGRESS_PATH + '?t=' + Date.now())
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var lines = text.split('\n').filter(function (l) { return l.trim(); });
        for (var i = lastLength; i < lines.length; i++) {
          var colonIdx = lines[i].indexOf(':');
          if (colonIdx === -1) continue;
          var status = lines[i].substring(0, colonIdx).trim();
          var message = lines[i].substring(colonIdx + 1).trim();
          addStep(status, message);
          if (status === 'done') {
            setTimeout(closeSplash, 300);
            return;
          }
        }
        lastLength = lines.length;
      })
      .catch(function () {});
  }

  var pollTimer = setInterval(poll, POLL_INTERVAL);
  poll();

  setTimeout(function () {
    clearInterval(pollTimer);
    closeSplash();
  }, TIMEOUT_MS);
})();
```

- [ ] **Step 4: Create splash/launcher.sh**

Create `splash/launcher.sh`:

```bash
#!/usr/bin/env bash
# Launches the session splash screen in a borderless Chromium window.
# Usage: launcher.sh [username]
# The hook script should write progress lines to /tmp/42-session-splash
# Protocol: status:message (e.g., "progress:mounting your home...", "done:ready")

SPLASH_DIR="$(dirname "$(readlink -f "$0")")"
USERNAME="${1:-}"

# Clear any previous progress file
: > /tmp/42-session-splash

# Find chromium or google-chrome
BROWSER=""
for bin in chromium-browser chromium google-chrome google-chrome-stable; do
  if command -v "$bin" &>/dev/null; then
    BROWSER="$bin"
    break
  fi
done

if [ -z "$BROWSER" ]; then
  echo "No Chromium-based browser found, skipping splash"
  exit 0
fi

URL="file://${SPLASH_DIR}/index.html"
[ -n "$USERNAME" ] && URL="${URL}?user=${USERNAME}"

exec "$BROWSER" \
  --kiosk \
  --app="$URL" \
  --no-sandbox \
  --disable-gpu-sandbox \
  --window-size=1920,1080 \
  2>/dev/null &
```

Make it executable:

```bash
chmod +x splash/launcher.sh
```

- [ ] **Step 5: Add splash to Makefile install target**

In `Makefile`, add to the `install` target (after the `cp -r` line, before the `bash` line):

```makefile
install: build
	install -dm755 $(THEME_DIR)/$(THEME_NAME)
	cp -r "$(ROOT_DIR)/dist"/* "$(THEME_DIR)/$(THEME_NAME)"
	cp -r "$(ROOT_DIR)/splash" "$(THEME_DIR)/$(THEME_NAME)/splash"
	chmod +x "$(THEME_DIR)/$(THEME_NAME)/splash/launcher.sh"
	bash "$(ROOT_DIR)/systemd/install.sh"
```

- [ ] **Step 6: Build and verify**

Run: `python3 -m http.server 8080 --directory splash &`
Open: `http://localhost:8080/index.html?user=testuser`
Expected: Splash shows with animated gradient, avatar placeholder, username "testuser". Create a test progress file:

```bash
echo "progress:mounting your home..." > /tmp/42-session-splash
sleep 1
echo -e "progress:mounting your home...\ndone:ready" > /tmp/42-session-splash
```

Expected: Steps appear with typing effect, then splash fades out.

- [ ] **Step 7: Commit**

```bash
git add splash/ Makefile
git commit -m "feat: add session splash screen to replace terminal hook window"
```

---

### Task 7: Final Integration Build

**Files:**
- All previously modified files

- [ ] **Step 1: Full build**

Run: `make clean && make`
Expected: Clean build with no errors.

- [ ] **Step 2: Verify all features together**

Open `static/index.html` in a browser. Check:
1. Boot sequence plays on load (staggered entrance)
2. Mouse parallax works (background shifts opposite to cursor)
3. Particles are visible and drifting
4. Auth choreography works (add `auth-loading` class to form)
5. Low-DPI class applies when toggled in DevTools

- [ ] **Step 3: Verify reduced motion**

In DevTools, enable "Emulate CSS media feature prefers-reduced-motion: reduce". Reload page. Verify:
- Boot sequence is a single fade
- No parallax
- No particles
- Auth state changes are instant

- [ ] **Step 4: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: final integration of cinematic premium layer"
```
