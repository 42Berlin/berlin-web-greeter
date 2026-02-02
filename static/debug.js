console.warn('debug.js loaded');
document.getElementById('info-debug').innerText = 'Running in debug mode';

// Make sure all elements are somewhat presentable
const logo = document.getElementById('logo');
logo.src = 'assets/42berlin.png';

const bubbleBkgImg = document.getElementById('bubble-bg-placeholder');
bubbleBkgImg.style.backgroundImage = 'url(assets/bubble-bg.png)';

const bubbleImg = document.getElementById('bubble-image-placeholder');
bubbleImg.style.backgroundImage = 'url(assets/bubble-img.png)';

const message = document.getElementById('message');
message.innerText = 'This is a test message that could have been set up in /usr/share/42/berlin.conf';

const examModeProjects = document.getElementById('exam-mode-projects');
examModeProjects.innerText = 'Exam Rank 00, Exam Rank 01, Exam Rank 02, non-existing debug exams';

const lockedAgo = document.getElementById('active-user-session-locked-ago');
lockedAgo.innerText = 'Automated logout in 42 minutes';

// Load the default wallpaper
document.body.style.backgroundImage = "url(assets/default-wallpaper.png)";

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
	if (offlineToggle.checked) {
		document.getElementById('offline-img-placeholder').style.backgroundImage = 'url(assets/offline.gif)';
		document.getElementById('offline-message').style.display = 'block';
	} else {
		document.getElementById('offline-message').style.display = 'none';
	}
};
offlineToggle.addEventListener('change', toggleOfflineMode);

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


// Add file picker for wallpaper
const wallpaperPicker = document.createElement('input');
wallpaperPicker.type = 'file';
wallpaperPicker.accept = 'image/*';
optionsContainer.appendChild(wallpaperPicker);
wallpaperPicker.addEventListener('change', () => {
	const file = wallpaperPicker.files[0];
	const reader = new FileReader();
	reader.onload = () => {
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
	indicator.textContent = '⇧';
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
	
	// Show reboot button for both login and lock screens
	if (screenId === 'login-form' || screenId === 'lock-form') {
		if (rebootButton) {
			rebootButton.style.display = 'inline-block';
			console.log('Showing reboot button for', screenId);
		}
	}
	// No buttons shown for exam mode
}

// Custom confirmation dialog function
function showConfirmDialog(message, onConfirm, onCancel) {
	return new Promise((resolve) => {
		// Create dialog container
		const dialog = document.createElement('div');
		dialog.className = 'confirm-dialog';
		
		// Create dialog content
		const content = document.createElement('div');
		content.className = 'confirm-dialog-content';
		
		// Create message
		const messageEl = document.createElement('div');
		messageEl.className = 'confirm-dialog-message';
		messageEl.textContent = message;
		
		// Create buttons container
		const buttonsEl = document.createElement('div');
		buttonsEl.className = 'confirm-dialog-buttons';
		
		// Create Cancel button
		const cancelBtn = document.createElement('button');
		cancelBtn.className = 'confirm-dialog-button';
		cancelBtn.textContent = 'Cancel';
		cancelBtn.addEventListener('click', () => {
			document.body.removeChild(dialog);
			if (onCancel) onCancel();
			resolve(false);
		});
		
		// Create Confirm button
		const confirmBtn = document.createElement('button');
		confirmBtn.className = 'confirm-dialog-button primary';
		confirmBtn.textContent = 'Confirm';
		confirmBtn.addEventListener('click', () => {
			document.body.removeChild(dialog);
			if (onConfirm) onConfirm();
			resolve(true);
		});
		
		// Assemble dialog
		buttonsEl.appendChild(cancelBtn);
		buttonsEl.appendChild(confirmBtn);
		content.appendChild(messageEl);
		content.appendChild(buttonsEl);
		dialog.appendChild(content);
		
		// Add to DOM
		document.body.appendChild(dialog);
		
		// Focus confirm button
		confirmBtn.focus();
		
		// Handle ESC key
		const handleEsc = (e) => {
			if (e.key === 'Escape') {
				document.body.removeChild(dialog);
				document.removeEventListener('keydown', handleEsc);
				if (onCancel) onCancel();
				resolve(false);
			}
		};
		document.addEventListener('keydown', handleEsc);
	});
}

