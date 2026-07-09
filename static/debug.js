console.warn('debug.js loaded');
document.getElementById('info-debug').innerText = 'Running in debug mode';

// Make sure all elements are somewhat presentable
const logo = document.getElementById('logo');
logo.src = 'assets/42berlin.png';

const bubbleImg = document.getElementById('bubble-image-placeholder');
bubbleImg.style.backgroundImage = 'url(assets/bubble-img.png)';

const message = document.getElementById('message');
message.innerText = 'This is a test message that could have been set up in /usr/share/42/berlin.conf';

// Network status dot starts online
document.getElementById('info-network').classList.add('online');

// Show the brightness control (no real lightdm in debug)
const brightnessControl = document.getElementById('brightness-control');
if (brightnessControl) {
	brightnessControl.style.display = 'inline-flex';
	document.getElementById('brightness-button').addEventListener('click', (e) => {
		e.stopPropagation();
		brightnessControl.classList.toggle('open');
	});
	document.addEventListener('click', (e) => {
		if (!brightnessControl.contains(e.target)) brightnessControl.classList.remove('open');
	});
}

const examModeProjects = document.getElementById('exam-mode-projects');
examModeProjects.innerText = 'Exam Rank 00, Exam Rank 01, Exam Rank 02, non-existing debug exams';

const lockedAgo = document.getElementById('active-user-session-locked-ago');
lockedAgo.innerText = 'Automated logout in 42 minutes';

// Show the default user avatar on the lock screen (the real UI sets this from the user's .face)
document.getElementById('active-user-session-avatar').src = 'assets/default-user.png';

// Show the animated gradient background (the default when no wallpaper image is set)
document.getElementById('gradient-bg').style.display = 'block';

// Add options container
const optionsContainer = document.createElement('div');
optionsContainer.id = 'screen-switcher';
optionsContainer.style.position = 'fixed';
optionsContainer.style.bottom = '48px';
optionsContainer.style.left = '0';
optionsContainer.style.width = '100%';
optionsContainer.style.textAlign = 'center';
optionsContainer.style.zIndex = '9000';
document.body.appendChild(optionsContainer);

// Screen switcher
const screenSwitcherContainer = document.createElement('div');
screenSwitcherContainer.style.marginTop = '8px';
optionsContainer.appendChild(screenSwitcherContainer);
function switchScreen(screenId) {
	const screens = document.querySelectorAll('main > form');
		screens.forEach(screen => {
			screen.style.display = 'none';
		});

		const selectedScreen = document.getElementById(screenId);
		selectedScreen.style.display = 'block';

		logo.style.display = (screenId === 'lock-form') ? 'none' : 'block';
		document.body.classList.toggle('lock-screen', screenId === 'lock-form');

		// Show/hide header buttons based on screen
		updateHeaderButtonsForScreen(screenId);

		// Make sure the correct input field is checked
		const selectedInput = document.getElementById(`radio-${screenId}`);
		selectedInput.checked = true;
}
function addScreenSwitchOption(screenName, screenId) {
	const screenSwitcherInput = document.createElement('input');
	screenSwitcherInput.type = 'radio';
	screenSwitcherInput.name = 'screen';
	screenSwitcherInput.value = screenId;
	screenSwitcherInput.id = `radio-${screenId}`;

	const screenSwitcherLabel = document.createElement('label');
	screenSwitcherLabel.textContent = screenName;
	screenSwitcherLabel.htmlFor = `radio-${screenId}`;
	screenSwitcherLabel.style.marginRight = '8px';

	screenSwitcherContainer.appendChild(screenSwitcherInput);
	screenSwitcherContainer.appendChild(screenSwitcherLabel);

	screenSwitcherInput.addEventListener('change', () => {
		switchScreen(screenId);
	});
}
addScreenSwitchOption('Login screen', 'login-form');
addScreenSwitchOption('Lock screen', 'lock-form');
addScreenSwitchOption('Exam mode', 'exam-form');
switchScreen('login-form');

// Add toggle to simulate when the computer goes offline
const offlineToggle = document.createElement('input');
const offlineLabel = document.createElement('label');
offlineToggle.type = 'checkbox';
offlineToggle.id = 'offline-toggle';
offlineToggle.name = 'offline';
optionsContainer.appendChild(offlineToggle);
offlineLabel.textContent = 'Offline mode';
offlineLabel.htmlFor = 'offline-toggle';
offlineLabel.style.marginRight = '24px';
optionsContainer.appendChild(offlineLabel);

toggleOfflineMode = () => {
	const offline = offlineToggle.checked;
	document.getElementById('offline-message').style.display = offline ? 'flex' : 'none';

	const net = document.getElementById('info-network');
	net.classList.toggle('online', !offline);
	net.classList.toggle('offline', offline);

	// Mirror production: block the login form while offline
	['login', 'password', 'login-button'].forEach((id) => {
		const el = document.getElementById(id);
		if (el) el.disabled = offline;
	});

	if (offline) {
		// Unfocus so the spacebar goes to the game and not, e.g., the offline checkbox
		if (document.activeElement) document.activeElement.blur();
	} else {
		document.getElementById('game-frame').style.display = 'none'; // hide the game when back online
	}
};
offlineToggle.addEventListener('change', toggleOfflineMode);

// Spacebar shows the dino game as a window below the offline text (mirrors production)
document.addEventListener('keydown', (e) => {
	if (e.key === ' ' && offlineToggle.checked) {
		const gameFrame = document.getElementById('game-frame');
		if (gameFrame.style.display === 'none' || gameFrame.style.display === '') {
			gameFrame.style.display = 'block';
			// Load the game fresh while visible so it initializes at the correct resolution
			gameFrame.addEventListener('load', () => gameFrame.focus(), { once: true });
			gameFrame.src = 'game/index.html?t=' + Date.now();
		}
	}
});

// Add toggle to enable video
const videoToggle = document.createElement('input');
const videoLabel = document.createElement('label');
videoToggle.type = 'checkbox';
videoToggle.id = 'video-toggle';
videoToggle.name = 'video';
optionsContainer.appendChild(videoToggle);
videoLabel.textContent = 'Video';
videoLabel.htmlFor = 'video-toggle';
videoLabel.style.marginRight = '24px';
optionsContainer.appendChild(videoLabel);

toggleVideo = () => {
	if (videoToggle.checked) {
		document.getElementById('background-video').style.display = 'block';
	} else {
		document.getElementById('background-video').style.display = 'none';
	}
};
videoToggle.addEventListener('change', toggleVideo);

// Add a fake calendar event from the template in HTML
// Unfortunately these are not clickable without the proper UI toolkit
const calendarEventTemplate = document.getElementById('intra-calendar-event-template');
for (let i = 0; i < 5; i++) {
	const calendarEvent = calendarEventTemplate.content.cloneNode(true);
	document.getElementById('intra-calendar').appendChild(calendarEvent);
}

// Open the detail dialog for a calendar-event element (mirrors CalendarUI)
function openDebugEventDialog(eventElement) {
	const dialog = document.createElement('dialog');
	dialog.classList.add('calendar-event-dialog');
	dialog.setAttribute('data-event-kind', eventElement.getAttribute('data-event-kind') ?? 'event');

	const closeButton = document.createElement('button');
	closeButton.classList.add('dialog-close-button');
	closeButton.innerHTML = '&times;';
	dialog.appendChild(closeButton);

	const contents = document.createElement('div');
	contents.classList.add('event-dialog-contents');
	dialog.appendChild(contents);
	for (const child of eventElement.children) {
		contents.appendChild(child.cloneNode(true));
	}

	contents.addEventListener('click', (ev) => ev.stopPropagation());
	dialog.addEventListener('click', () => { dialog.close(); dialog.remove(); });

	document.body.appendChild(dialog);
	dialog.showModal();
}
function addDebugEventDialog(eventElement) {
	eventElement.style.cursor = 'pointer';
	eventElement.addEventListener('click', () => openDebugEventDialog(eventElement));
}
document.querySelectorAll('#intra-calendar .calendar-event').forEach(addDebugEventDialog);

// Mock next-event countdown banner (clickable, opens the detail view)
const nextEvent = document.getElementById('next-event');
if (nextEvent) {
	nextEvent.style.display = 'flex';
	nextEvent.innerHTML =
		'<span class="next-event-label">Next up</span>' +
		'<span class="next-event-name">Community Meeting</span>' +
		'<span class="next-event-time">in 42 min</span>' +
		'<span class="next-event-location">📍 Cafe</span>';
	const mockEvent = calendarEventTemplate.content.firstElementChild.cloneNode(true);
	nextEvent.addEventListener('click', () => openDebugEventDialog(mockEvent));
}

// Enable the sign_in / unlock buttons as their fields are filled (mirrors production)
function wireSubmitButton(inputIds, buttonId) {
	const inputs = inputIds.map((id) => document.getElementById(id));
	const button = document.getElementById(buttonId);
	if (!button || inputs.some((i) => !i)) return;
	const update = () => { button.disabled = inputs.some((i) => i.value.trim() === ''); };
	inputs.forEach((i) => i.addEventListener('input', update));
	update();
}
wireSubmitButton(['login', 'password'], 'login-button');
wireSubmitButton(['active-user-session-password'], 'unlock-button');

// Maintenance-mode toggle (mirrors LOGIN=disabled)
const maintToggle = document.createElement('input');
const maintLabel = document.createElement('label');
maintToggle.type = 'checkbox';
maintToggle.id = 'maintenance-toggle';
optionsContainer.appendChild(maintToggle);
maintLabel.textContent = 'Maintenance';
maintLabel.htmlFor = 'maintenance-toggle';
maintLabel.style.marginRight = '24px';
optionsContainer.appendChild(maintLabel);
maintToggle.addEventListener('change', () => {
	const maint = document.getElementById('maintenance');
	if (maintToggle.checked) {
		document.querySelectorAll('main > form').forEach((f) => f.style.display = 'none');
		maint.style.display = 'flex';
	} else {
		maint.style.display = 'none';
		switchScreen('login-form');
	}
});

// Diagnostics panel preview (mock data), toggled by Ctrl+Alt+I or the button below
function toggleDebugDiagnostics() {
		const existing = document.getElementById('diagnostics-overlay');
		if (existing) { existing.remove(); return; }
		const rows = [
			['Hostname', 'c1r2s3'], ['Last user', 'jdoe'], ['IP', '10.15.100.42'], ['MAC', 'a4:83:e7:12:34:56'],
			['Uptime', 'up 3 hours, 12 minutes'],
			['Disk /', '61% (120G/200G)'], ['Greeter', 'codam-web-greeter v1.3.3'],
			['Config version', 'v0.1b'], ['Last data fetch', new Date().toLocaleString()],
			['Network', navigator.onLine ? 'online' : 'offline'],
		];
		const overlay = document.createElement('div');
		overlay.id = 'diagnostics-overlay';
		overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
		const panel = document.createElement('div');
		panel.className = 'diagnostics-panel';
		const title = document.createElement('h2');
		title.textContent = '// diagnostics';
		panel.appendChild(title);
		const table = document.createElement('div');
		table.className = 'diagnostics-table';
		rows.forEach(([k, v]) => {
			const kEl = document.createElement('span'); kEl.className = 'diag-key'; kEl.textContent = k;
			const vEl = document.createElement('span'); vEl.className = 'diag-val'; vEl.textContent = v;
			table.append(kEl, vEl);
		});
		panel.appendChild(table);
		const hint = document.createElement('p');
		hint.className = 'diagnostics-hint';
		hint.textContent = 'Ctrl+Alt+I or click outside to close';
		panel.appendChild(hint);
		overlay.appendChild(panel);
		document.body.appendChild(overlay);
}

document.addEventListener('keydown', (e) => {
	if (e.ctrlKey && e.altKey && (e.key === 'i' || e.key === 'I')) toggleDebugDiagnostics();
});

// Diagnostics toggle button (same as the Ctrl+Alt+I IT hotkey)
const diagButton = document.createElement('button');
diagButton.textContent = 'Diagnostics';
diagButton.style.marginLeft = '8px';
diagButton.addEventListener('click', toggleDebugDiagnostics);
optionsContainer.appendChild(diagButton);


// Add file picker for wallpaper
const wallpaperPicker = document.createElement('input');
wallpaperPicker.type = 'file';
wallpaperPicker.accept = 'image/*';
optionsContainer.appendChild(wallpaperPicker);
wallpaperPicker.addEventListener('change', () => {
	const file = wallpaperPicker.files[0];
	const reader = new FileReader();
	reader.onload = () => {
		// Picking a wallpaper switches from the gradient to the image, like the real WallpaperUI
		document.getElementById('gradient-bg').style.display = 'none';
		document.body.style.backgroundImage = `url(${reader.result})`;
	};
	reader.readAsDataURL(file);
});

// Add slider to change the background brightness
const brightnessFilter = document.createElement('div');
brightnessFilter.style.position = 'fixed';
brightnessFilter.style.top = '0';
brightnessFilter.style.left = '0';
brightnessFilter.style.width = '100%';
brightnessFilter.style.height = '100%';
brightnessFilter.style.backdropFilter = 'brightness(1)';
document.body.insertBefore(brightnessFilter, document.body.firstChild);

const brightnessSlider = document.createElement('input');
brightnessSlider.type = 'range';
brightnessSlider.min = '0';
brightnessSlider.max = '5';
brightnessSlider.step = '0.1';
brightnessSlider.value = '1';
brightnessSlider.title = 'Adjust wallpaper brightness';
optionsContainer.appendChild(brightnessSlider);
brightnessSlider.addEventListener('input', () => {
	brightnessFilter.style.backdropFilter = `brightness(${brightnessSlider.value})`;
});

// Add toggle to simulate caps lock for testing
const capsLockToggle = document.createElement('input');
const capsLockLabel = document.createElement('label');
capsLockToggle.type = 'checkbox';
capsLockToggle.id = 'capslock-toggle';
capsLockToggle.name = 'capslock';
optionsContainer.appendChild(capsLockToggle);
capsLockLabel.textContent = 'Simulate Caps Lock';
capsLockLabel.htmlFor = 'capslock-toggle';
capsLockLabel.style.marginRight = '24px';
optionsContainer.appendChild(capsLockLabel);

let capsLockSimulated = false;
capsLockToggle.addEventListener('change', () => {
	capsLockSimulated = capsLockToggle.checked;
	console.log('Caps lock simulation toggled:', capsLockSimulated);

	// Update all password field indicators immediately
	const passwordFields = [
		document.getElementById('password'),
		document.getElementById('active-user-session-password')
	];

	console.log('Found password fields:', passwordFields.length);

	passwordFields.forEach(field => {
		console.log('Checking field:', field ? field.id : 'null', 'has indicator:', !!field?._capsLockIndicator);
		if (field && field._capsLockIndicator) {
			console.log('Updating indicator for', field.id);
			toggleCapsLockIndicator(field._capsLockIndicator, capsLockSimulated);
		} else if (field) {
			console.log('Field', field.id, 'has no _capsLockIndicator property, setting up now');
			// If indicator doesn't exist, set it up now
			setupCapsLockDetection(field);
			// Then update it
			if (field._capsLockIndicator) {
				toggleCapsLockIndicator(field._capsLockIndicator, capsLockSimulated);
			}
		}
	});
});

// Override getModifierState globally for testing
const originalGetModifierState = KeyboardEvent.prototype.getModifierState;
KeyboardEvent.prototype.getModifierState = function(keyArg) {
	if (keyArg === 'CapsLock' && capsLockSimulated) {
		return true;
	}
	return originalGetModifierState.call(this, keyArg);
};

// Add caps lock detection to password fields in debug mode
function setupCapsLockDetection(passwordInput) {
	console.log('Setting up caps lock detection for:', passwordInput.id);
	const capsLockIndicator = createCapsLockIndicator(passwordInput);
	let currentCapsLockState = false;

	const checkCapsLock = (event) => {
		const isCapsLockOn = capsLockSimulated || event.getModifierState('CapsLock');
		currentCapsLockState = event.getModifierState('CapsLock'); // Track real state separately
		console.log('Caps lock state:', isCapsLockOn, '(simulated:', capsLockSimulated, ')');
		toggleCapsLockIndicator(capsLockIndicator, isCapsLockOn);
	};

	// Listen for caps lock changes globally (document level) and track state
	const globalCapsLockCheck = (event) => {
		currentCapsLockState = event.getModifierState('CapsLock');
		// Only update indicator if password field is focused
		if (document.activeElement === passwordInput) {
			const isCapsLockOn = capsLockSimulated || currentCapsLockState;
			console.log('Global caps lock check:', isCapsLockOn, '(simulated:', capsLockSimulated, ')');
			toggleCapsLockIndicator(capsLockIndicator, isCapsLockOn);
		}
	};

	// Add global listeners for caps lock detection
	document.addEventListener('keydown', globalCapsLockCheck);
	document.addEventListener('keyup', globalCapsLockCheck);

	// Check caps lock state on focus (use tracked state or simulation)
	passwordInput.addEventListener('focus', () => {
		console.log('Password field focused, checking caps lock state');
		const isCapsLockOn = capsLockSimulated || currentCapsLockState;
		console.log('Focus caps lock state:', isCapsLockOn, '(tracked:', currentCapsLockState, 'simulated:', capsLockSimulated, ')');
		toggleCapsLockIndicator(capsLockIndicator, isCapsLockOn);
	});

	// Also listen on the password field itself
	passwordInput.addEventListener('keydown', checkCapsLock);
	passwordInput.addEventListener('keyup', checkCapsLock);

	// Hide indicator when field loses focus (unless simulated is on)
	passwordInput.addEventListener('blur', () => {
		console.log('Password field lost focus');
		if (!capsLockSimulated) {
			console.log('Hiding indicator (not simulated)');
			toggleCapsLockIndicator(capsLockIndicator, false);
		}
	});

	// Initialize caps lock state by triggering a check when any key is pressed
	const initializeCapsLock = (event) => {
		currentCapsLockState = event.getModifierState('CapsLock');
		console.log('Initialized caps lock state:', currentCapsLockState);
		// Remove this one-time listener after first keypress
		document.removeEventListener('keydown', initializeCapsLock);
	};
	document.addEventListener('keydown', initializeCapsLock, { once: true });

	// Store reference for global updates
	passwordInput._capsLockIndicator = capsLockIndicator;
}

function createCapsLockIndicator(passwordInput) {
	console.log('Creating caps lock indicator for:', passwordInput.id);
	
	// Create wrapper container
	const wrapper = document.createElement('div');
	wrapper.className = 'password-input-wrapper';
	
	// Replace the password input with the wrapper
	passwordInput.parentNode.insertBefore(wrapper, passwordInput);
	wrapper.appendChild(passwordInput);
	
	// Create indicator
	const indicator = document.createElement('div');
	indicator.className = 'caps-lock-indicator';
	indicator.textContent = '⇪';
	indicator.style.display = 'none';
	
	// Add indicator to wrapper
	wrapper.appendChild(indicator);
	
	console.log('Caps lock indicator created and inserted');
	return indicator;
}

function toggleCapsLockIndicator(indicator, show) {
	console.log('Toggling caps lock indicator:', show);
	indicator.style.display = show ? 'block' : 'none';
}

// Setup caps lock detection for both password fields
const loginPasswordField = document.getElementById('password');
const lockPasswordField = document.getElementById('active-user-session-password');

console.log('Setting up caps lock detection...');
console.log('Login field found:', !!loginPasswordField);
console.log('Lock field found:', !!lockPasswordField);

if (loginPasswordField) {
	setupCapsLockDetection(loginPasswordField);
}
if (lockPasswordField) {
	setupCapsLockDetection(lockPasswordField);
}

// Setup header buttons for debug mode
setupHeaderButtons();

// Header button management functions
function setupHeaderButtons() {
	console.log('Setting up header buttons for debug mode');
	
	const rebootButton = document.getElementById('reboot-button');
	const logoutButton = document.getElementById('logout-button');
	
	if (rebootButton) {
		rebootButton.addEventListener('click', async () => {
			const confirmed = await showConfirmDialog('Are you sure you want to reboot the system? (Debug mode - no actual reboot)');
			if (confirmed) {
				alert('Reboot triggered in debug mode - no actual system reboot');
			}
		});
		console.log('Reboot button event listener added');
	}
	
	if (logoutButton) {
		logoutButton.addEventListener('click', async () => {
			const confirmed = await showConfirmDialog('Are you sure you want to log out? (Debug mode)');
			if (confirmed) {
				console.log('Logout button clicked in debug mode');
				
				// In debug mode, show information about loginctl command
				const debugUsername = 'debug-user'; // In real mode, this would be the actual username
				const loginctlMsg = `Debug mode: In production, this would call loginctl terminate-user ${debugUsername} to terminate the user session.`;
				alert(loginctlMsg);
				console.log(loginctlMsg);
				
				// Switch to login screen for visual feedback
				switchScreen('login-form');
				
				// Show logo again (similar to what logoutActiveSession does)
				const logo = document.getElementById('logo');
				if (logo) {
					logo.style.display = 'block';
				}
				
				console.log('Debug logout completed - switched to login screen');
			}
		});
		console.log('Logout button event listener added');
	}
}

function updateHeaderButtonsForScreen(screenId) {
	const rebootButton = document.getElementById('reboot-button');
	const logoutButton = document.getElementById('logout-button');
	
	console.log('Updating header buttons for screen:', screenId);
	
	// Hide all buttons first
	if (rebootButton) rebootButton.style.display = 'none';
	if (logoutButton) logoutButton.style.display = 'none';
	
	// Show reboot button only on login screen (hidden on lock and exam)
	if (screenId === 'login-form') {
		if (rebootButton) {
			rebootButton.style.display = 'inline-block';
		}
	}
	// No buttons shown for lock screen or exam mode
}

// Custom confirmation dialog function
function showConfirmDialog(message, onConfirm, onCancel) {
	return new Promise((resolve) => {
		// Native <dialog> + showModal(): traps focus and inerts the background
		const dialog = document.createElement('dialog');
		dialog.className = 'confirm-dialog';

		const content = document.createElement('div');
		content.className = 'confirm-dialog-content';

		const messageEl = document.createElement('div');
		messageEl.className = 'confirm-dialog-message';
		messageEl.textContent = message;

		const buttonsEl = document.createElement('div');
		buttonsEl.className = 'confirm-dialog-buttons';

		let result = false;
		const close = () => {
			dialog.close();
			dialog.remove();
			(result ? onConfirm : onCancel)?.();
			resolve(result);
		};

		const cancelBtn = document.createElement('button');
		cancelBtn.className = 'confirm-dialog-button';
		cancelBtn.type = 'button';
		cancelBtn.textContent = 'Cancel';
		cancelBtn.addEventListener('click', () => { result = false; close(); });

		const confirmBtn = document.createElement('button');
		confirmBtn.className = 'confirm-dialog-button primary';
		confirmBtn.type = 'button';
		confirmBtn.textContent = 'Confirm';
		confirmBtn.addEventListener('click', () => { result = true; close(); });

		dialog.addEventListener('cancel', (e) => { e.preventDefault(); result = false; close(); });

		buttonsEl.appendChild(cancelBtn);
		buttonsEl.appendChild(confirmBtn);
		content.appendChild(messageEl);
		content.appendChild(buttonsEl);
		dialog.appendChild(content);

		document.body.appendChild(dialog);
		dialog.showModal();
		confirmBtn.focus();
	});
}

// ── Premium layer features for debug preview ──

// Low-DPI detection
if (window.devicePixelRatio <= 1 && screen.width < 2560) {
	document.body.classList.add('low-dpi');
}

// Boot sequence: trigger the staggered entrance animation
document.body.classList.add('boot-pending');
requestAnimationFrame(() => {
	document.body.classList.remove('boot-pending');
	document.body.classList.add('boot-active');
	setTimeout(() => {
		document.body.classList.remove('boot-active');
	}, 2000);
});

// Particle field
(function initParticles() {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const canvas = document.getElementById('particle-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	const COLORS = ['#99A3EB', '#00FFF2'];
	const DOT_COUNT = 50;
	const LINE_DIST = 150;
	const dots = [];
	let particleEnabled = true;

	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}
	resize();
	window.addEventListener('resize', resize);

	for (let i = 0; i < DOT_COUNT; i++) {
		dots.push({
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			vx: (Math.random() - 0.5) * 0.5,
			vy: (Math.random() - 0.5) * 0.5,
			r: 2 + Math.random() * 2,
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			opacity: 0.15 + Math.random() * 0.15,
		});
	}

	function shouldShow() {
		const g = document.getElementById('gradient-bg');
		return g && g.style.display !== 'none' && getComputedStyle(g).display !== 'none';
	}

	function tick() {
		if (!shouldShow() || !particleEnabled) {
			canvas.style.display = 'none';
			requestAnimationFrame(tick);
			return;
		}
		canvas.style.display = 'block';
		const w = canvas.width, h = canvas.height;
		ctx.clearRect(0, 0, w, h);
		for (const d of dots) {
			d.x += d.vx; d.y += d.vy;
			if (d.x < 0) d.x += w; if (d.x > w) d.x -= w;
			if (d.y < 0) d.y += h; if (d.y > h) d.y -= h;
			ctx.beginPath();
			ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
			ctx.fillStyle = d.color;
			ctx.globalAlpha = d.opacity;
			ctx.fill();
		}
		ctx.globalAlpha = 0.06;
		ctx.strokeStyle = '#99A3EB';
		ctx.lineWidth = 1;
		for (let i = 0; i < dots.length; i++) {
			for (let j = i + 1; j < dots.length; j++) {
				const dx = dots[i].x - dots[j].x;
				const dy = dots[i].y - dots[j].y;
				if (dx * dx + dy * dy < LINE_DIST * LINE_DIST) {
					ctx.beginPath();
					ctx.moveTo(dots[i].x, dots[i].y);
					ctx.lineTo(dots[j].x, dots[j].y);
					ctx.stroke();
				}
			}
		}
		ctx.globalAlpha = 1;
		requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);

	// Particle toggle
	const particleToggle = document.createElement('input');
	particleToggle.type = 'checkbox';
	particleToggle.id = 'particle-toggle';
	particleToggle.checked = true;
	particleToggle.style.marginLeft = '12px';
	const particleLabel = document.createElement('label');
	particleLabel.textContent = 'Particles';
	particleLabel.htmlFor = 'particle-toggle';
	particleLabel.style.marginLeft = '4px';
	particleToggle.addEventListener('change', () => {
		particleEnabled = particleToggle.checked;
	});
	optionsContainer.appendChild(particleToggle);
	optionsContainer.appendChild(particleLabel);
})();

// Auth choreography demo button
const authDemoBtn = document.createElement('button');
authDemoBtn.textContent = 'Auth Demo';
authDemoBtn.style.marginLeft = '8px';
authDemoBtn.addEventListener('click', () => {
	const form = document.querySelector('main > form[style*="block"]') || document.getElementById('login-form');
	if (!form) return;
	const button = form.querySelector('button[type="submit"]');
	if (!button) return;

	form.classList.add('auth-loading');
	button.innerHTML = '<span class="auth-spinner"><span></span><span></span><span></span></span>';

	setTimeout(() => {
		form.classList.remove('auth-loading');
		form.classList.add('auth-success');
		button.innerHTML = '<span class="auth-checkmark">✓</span>';

		setTimeout(() => {
			form.classList.remove('auth-success');
			const isLock = form.id === 'lock-form';
			button.innerHTML = (isLock ? 'unlock' : 'sign_in') + '<span class="term-arrow">&rarr;</span>';
			form.querySelectorAll('input').forEach(i => { i.style.opacity = ''; i.style.transform = ''; });
		}, 1500);
	}, 1500);
});
optionsContainer.appendChild(authDemoBtn);

