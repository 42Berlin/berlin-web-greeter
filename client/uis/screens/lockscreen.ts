import { Authenticator, AuthenticatorEvents } from "../../auth";
import { LightDMUser, ThemeUtils, lightdm } from "nody-greeter-types";
import { UIScreen, UILockScreenElements } from "../screen";
import { UI } from "../../ui";

const PATH_LOCK_TIMESTAMP_PREFIX = '/tmp/codam_web_greeter_lock_timestamp';

export class LockScreenUI extends UIScreen {
	public readonly _form: UILockScreenElements;
	private readonly _activeSession: LightDMUser;
	private _isExamMode: boolean = false;
	private _lockedTime: Date | null = null;
	protected _events: AuthenticatorEvents = {
		authenticationStart: () => {
			this._disableForm();
		},
		authenticationComplete: () => {
			// TODO: Add a loading animation here
		},
		authenticationFailure: () => {
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

	public constructor(auth: Authenticator, activeSession: LightDMUser) {
		super(auth);

		this._activeSession = activeSession;
		this._form = {
			form: document.getElementById('lock-form') as HTMLFormElement,
			avatar: document.getElementById('active-user-session-avatar') as HTMLImageElement,
			displayName: document.getElementById('active-user-session-display-name') as HTMLHeadingElement,
			loginName: document.getElementById('active-user-session-login-name') as HTMLHeadingElement,
			lockedTimeAgo: document.getElementById('active-user-session-locked-ago') as HTMLSpanElement,
			passwordInput: document.getElementById('active-user-session-password') as HTMLInputElement,
			unlockButton: document.getElementById('unlock-button') as HTMLButtonElement,
		} as UILockScreenElements;

		this._initForm();

		// Check when the screen was locked every minute (delete the lock_timestamp file in /tmp to prevent the automated logout)
		setInterval(this._getAndSetLockedTimestamp.bind(this), 60000);
		this._getAndSetLockedTimestamp();
	}

	protected _initForm(): void {
		const form = this._form as UILockScreenElements;

		// Populate lock screen data
		if (this._activeSession.username === "exam") {
			// The exam user is a special case, we don't want to show the password input field. Just use the default password "exam"
			this._isExamMode = true;
			form.avatar.style.display = "none";
			form.displayName.innerText = "Exam in progress";
			form.loginName.innerText = "Click the arrow below to resume your exam.";
			form.loginName.style.marginTop = UI.getPadding(); // Add some padding for readability
			form.passwordInput.value = "exam";
			form.passwordInput.style.display = "none";
			this._enableOrDisableSubmitButton();
		}
		else {
			form.avatar.addEventListener('error', () => {
				console.warn(`Failed to load avatar for user ${this._activeSession.username}`);
				form.avatar.src = "assets/default-user.png"; // Load fallback image
			});
			if (window.data.userImage.exists) {
				// Show the user's avatar from the /tmp folder
				form.avatar.src = window.data.userImage.path;
			}
			else if (this._activeSession.image) {
				// This image always fails to load due to permissions issues
				// The greeter does not have access to the user's home folder...
				form.avatar.src = this._activeSession.image;
			}
			else if (window.data.userDefaultImage.exists) {
				form.avatar.src = window.data.userDefaultImage.path;
			}
			form.displayName.innerText = this._activeSession.display_name ?? this._activeSession.username;
			form.loginName.innerText = this._activeSession.username;
		}

		// Update the time remaining timer every 10 seconds
		setInterval(this._lockedTimer.bind(this), 10000);

		// This event gets called when the user clicks the unlock button or submits the lock screen form in any other way
		form.form.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			this._auth.login(this._activeSession.username, form.passwordInput.value);
		});

		// Only enable the login button when both the login and password fields are filled in
		form.passwordInput.addEventListener('input', () => {
			this._enableOrDisableSubmitButton();
		});

		// Add caps lock detection for password field (skip for exam mode)
		if (!this._isExamMode) {
			this._setupCapsLockDetection(form.passwordInput);
		}

		// Setup header reboot button (skip for exam mode)
		if (!this._isExamMode) {
			this._setupHeaderRebootButton();
		}
	}

	// Returns true if the login button is disabled, false otherwise
	protected _enableOrDisableSubmitButton(): boolean {
		const form = this._form as UILockScreenElements;
		const buttonDisabled = form.passwordInput.value === "" && this._isExamMode === false; // Always enable in exam mode
		form.unlockButton.disabled = buttonDisabled;
		return buttonDisabled;
	}

	protected _wigglePasswordInput(clearInput: boolean = true): void {
		const passwordInput = (this._form as UILockScreenElements).passwordInput;
		passwordInput.classList.add('wiggle');
		passwordInput.addEventListener('keydown', () => {
			passwordInput.classList.remove('wiggle');
		}, { once: true });

		if (clearInput) {
			passwordInput.value = "";
			passwordInput.focus();
			this._enableOrDisableSubmitButton();
		}
	}

	protected _getInputToFocusOn(): HTMLInputElement {
		return (this._form as UILockScreenElements).passwordInput;
	}

	public get lockedTime(): Date | null {
		return this._lockedTime;
	}

	private _getScreenLockedTimestamp(login: string): Promise<Date> {
		return new Promise((resolve, reject) => {
			fetch(`${PATH_LOCK_TIMESTAMP_PREFIX}_${login}`)
				.then(response => response.text())
				.then(text => {
					// Get the first word from the text file
					const timestamp = text.split(' ')[0];
					resolve(new Date(parseInt(timestamp) * 1000));
				})
				.catch(() => {
					reject();
				});
		});
	}

	private _getAndSetLockedTimestamp(): void {
		this._getScreenLockedTimestamp(this._activeSession.username)
			.then((timestamp: Date) => {
				this._lockedTime = timestamp;
				this._lockedTimer(); // run once immediately, after this the interval will take care of updating the timer
			})
			.catch(() => {
				// Unable to get the screen locked timestamp, prevent automated logout by setting the locked time to null
				this._lockedTime = null;
			});
	}

	private _lockedTimer(): void {
		if (!this._lockedTime) {
			// Unsure when the screen was locked, no automated logout possible
			return;
		}

		const logoutAfter = 90; // minutes
		const lockedMinutesAgo = (Date.now() - this._lockedTime.getTime()) / 1000 / 60;
		const timeRemaining = logoutAfter - lockedMinutesAgo;
		if (timeRemaining <= 0.25) {
			this._disableForm();
			this._form.lockedTimeAgo.innerText = "Automated logout in progress...";
			if (timeRemaining < -5) { // Give it a 5 minute grace period
				// Add debug text indicating the systemd service might have failed or was not installed
				window.ui.setDebugInfo("Automated logout appears to take a while. Is the systemd idling service from codam-web-greeter installed and enabled?");
				this._enableForm(); // Allow the user to just unlock the screen again
			}
		}
		else {
			const flooredTime = Math.floor(timeRemaining);
			this._form.lockedTimeAgo.innerText = "Automated logout in " + flooredTime.toString() + " minute" + (flooredTime === 1 ? "" : "s");
		}
	}

	private _setupCapsLockDetection(passwordInput: HTMLInputElement): void {
		const capsLockIndicator = this._createCapsLockIndicator(passwordInput);
		let currentCapsLockState = false;

		const checkCapsLock = (event: KeyboardEvent) => {
			const isCapsLockOn = event.getModifierState('CapsLock');
			currentCapsLockState = isCapsLockOn;
			this._toggleCapsLockIndicator(capsLockIndicator, isCapsLockOn);
		};

		// Listen for caps lock changes globally (document level) and track state
		const globalCapsLockCheck = (event: KeyboardEvent) => {
			currentCapsLockState = event.getModifierState('CapsLock');
			// Only update indicator if password field is focused
			if (document.activeElement === passwordInput) {
				this._toggleCapsLockIndicator(capsLockIndicator, currentCapsLockState);
			}
		};

		// Add global listeners for caps lock detection
		document.addEventListener('keydown', globalCapsLockCheck);
		document.addEventListener('keyup', globalCapsLockCheck);

		// Also listen on the password field itself
		passwordInput.addEventListener('keydown', checkCapsLock);
		passwordInput.addEventListener('keyup', checkCapsLock);

		// Show indicator when field gains focus (use tracked state)
		passwordInput.addEventListener('focus', () => {
			this._toggleCapsLockIndicator(capsLockIndicator, currentCapsLockState);
		});

		// Hide indicator when field loses focus
		passwordInput.addEventListener('blur', () => {
			this._toggleCapsLockIndicator(capsLockIndicator, false);
		});

		// Initialize caps lock state by triggering a check when any key is pressed
		const initializeCapsLock = (event: KeyboardEvent) => {
			currentCapsLockState = event.getModifierState('CapsLock');
			// Remove this one-time listener after first keypress
			document.removeEventListener('keydown', initializeCapsLock);
		};
		document.addEventListener('keydown', initializeCapsLock, { once: true });
	}

	private _createCapsLockIndicator(passwordInput: HTMLInputElement): HTMLElement {
		// Create wrapper container
		const wrapper = document.createElement('div');
		wrapper.className = 'password-input-wrapper';

		// Replace the password input with the wrapper
		passwordInput.parentNode?.insertBefore(wrapper, passwordInput);
		wrapper.appendChild(passwordInput);

		// Create indicator
		const indicator = document.createElement('div');
		indicator.className = 'caps-lock-indicator';
		indicator.textContent = '⇧';
		indicator.style.display = 'none';

		// Add indicator to wrapper
		wrapper.appendChild(indicator);

		return indicator;
	}

	private _toggleCapsLockIndicator(indicator: HTMLElement, show: boolean): void {
		indicator.style.display = show ? 'block' : 'none';
	}

	private _setupHeaderRebootButton(): void {
		const rebootButton = document.getElementById('reboot-button') as HTMLButtonElement;
		if (rebootButton) {
			// Show the reboot button when lock screen is active
			rebootButton.style.display = 'inline-block';

			// Remove any existing event listeners to prevent conflicts
			rebootButton.onclick = null;

			// Add event listener
			rebootButton.addEventListener('click', (event: Event) => {
				event.preventDefault();
				console.log('Reboot button clicked from lock screen');
				this._handleReboot();
			});
		}
	}

	private async _handleReboot(): Promise<void> {
		const username = this._activeSession.username;
		const confirmed = await this._showConfirmDialog(`Are you sure you want to reboot the system? This will terminate the session for user "${username}" and restart the computer.`);
		if (confirmed) {
			console.log('Reboot confirmed, proceeding with system reboot');
			
			// Use lightdm.restart() to reboot the system, which cleanly terminates all sessions
			if (typeof lightdm !== 'undefined' && lightdm.restart) {
				console.log('Calling lightdm.restart() to reboot system and terminate user session');
				lightdm.restart();
			} else {
				console.log('lightdm.restart not available');
				alert('Reboot functionality not available in this environment');
			}
		} else {
			console.log('Reboot cancelled by user');
		}
	}

	private _showConfirmDialog(message: string): Promise<boolean> {
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
				resolve(false);
			});

			// Create Confirm button
			const confirmBtn = document.createElement('button');
			confirmBtn.className = 'confirm-dialog-button primary';
			confirmBtn.textContent = 'Confirm';
			confirmBtn.addEventListener('click', () => {
				document.body.removeChild(dialog);
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
			const handleEsc = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					document.body.removeChild(dialog);
					document.removeEventListener('keydown', handleEsc);
					resolve(false);
				}
			};
			document.addEventListener('keydown', handleEsc);
		});
	}

	public hideForm(): void {
		super.hideForm();
		// Hide reboot button when lock screen is hidden
		const rebootButton = document.getElementById('reboot-button') as HTMLButtonElement;
		if (rebootButton) {
			rebootButton.style.display = 'none';
		}
	}
}
