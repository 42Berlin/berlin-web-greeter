import { Authenticator, AuthenticatorEvents } from "../../auth";
import { UILoginElements, UIScreen } from "../screen";
import { lightdm } from "nody-greeter-types";

export class LoginScreenUI extends UIScreen {
	public readonly _form: UILoginElements;
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

	public constructor(auth: Authenticator) {
		super(auth);

		this._form = {
			form: document.getElementById('login-form') as HTMLFormElement,
			loginInput: document.getElementById('login') as HTMLInputElement,
			passwordInput: document.getElementById('password') as HTMLInputElement,
			loginButton: document.getElementById('login-button') as HTMLButtonElement,
		} as UILoginElements;

		this._initForm();
	}

	protected _toggleFormBasedOnNetwork(): void {
		const isOnline = navigator.onLine;
		const offlineMessage = document.getElementById('offline-message');

		if (offlineMessage) {
			offlineMessage.style.display = isOnline ? "none" : "block";
		}
	}

	protected _showOfflineMessage(show: boolean): void {
		const offlineMessage = document.getElementById('offline-message');
		if (offlineMessage) {
			offlineMessage.style.display = show ? "block" : "none";
		}
	}

	protected _toggleDarkFilter(show: boolean): void {
		const darkFilter = document.getElementById('dark-filter');
		if (darkFilter) {
			darkFilter.style.display = show ? 'block' : 'none';
		}
	}

	protected _startGame(): void {
		const gameFrame = document.getElementById('game-frame') as HTMLIFrameElement;
		gameFrame.style.visibility = 'visible';  // Show the iframe to start the game
		gameFrame.focus();
		console.log("Game frame focused:", document.activeElement === gameFrame);
		gameFrame.contentWindow?.addEventListener('keydown', this._handleKeydown_esc);
	}

	protected _stopGame(): void {
		const gameFrame = document.getElementById('game-frame') as HTMLIFrameElement;
		gameFrame.style.visibility = 'hidden';   // Hide the iframe to stop the game
		gameFrame.blur();
		gameFrame.contentWindow?.removeEventListener('keydown', this._handleKeydown_esc);
	}

	// Event handler for the keydown event when offline
	private _handleKeydown_esc = (event: KeyboardEvent) => {
		event.stopPropagation();
		event.preventDefault();
		const gameFrame = document.getElementById('game-frame') as HTMLIFrameElement;
		console.log("Key pressed: ", event.key);
		// Handle key events inside the game iframe when it is focused
		if (gameFrame.style.visibility === 'visible' && gameFrame === document.activeElement) {
			if (event.key === 'Escape') {
				// Handle ESC key to stop the game when the iframe is focused
				console.log("Escape pressed inside game frame");
				this._stopGame();
				this._toggleDarkFilter(false);
				this._showOfflineMessage(true);
			}
			else {
				return;
			}
		}
	};

	private _handleKeydown = (event: KeyboardEvent) => {
		const gameFrame = document.getElementById('game-frame') as HTMLIFrameElement;
		console.log("Key pressed: ", event.key);

		if (event.key === ' ' && !navigator.onLine) {
			this._toggleDarkFilter(true);
			this._showOfflineMessage(false);
			this._startGame();  // Start the game when offline
		}
	};

	protected _initForm(): void {
		const form = this._form as UILoginElements;

		// // Disable form if offline
		this._toggleFormBasedOnNetwork();

		// Track if keydown listener is already added
        let keydownListenerAdded = false;

		// Listen for network changes
        window.addEventListener('online', () => {
            this._toggleFormBasedOnNetwork();  // Update form status on network reconnect
            this._showOfflineMessage(false);  // Hide offline message when online
			this._stopGame();
			this._toggleDarkFilter(false);
			if (keydownListenerAdded) {
                window.removeEventListener('keydown', this._handleKeydown);
                keydownListenerAdded = false; // Remove the listener when online
            }
        });
        window.addEventListener('offline', () => {
            this._toggleFormBasedOnNetwork();  // Update form status on network disconnect
            this._showOfflineMessage(true);   // Show offline message when offline
			if (!keydownListenerAdded) {
                window.addEventListener('keydown', this._handleKeydown);
                keydownListenerAdded = true;  // Add the listener only once when offline
            }
        });

		// This event gets called when the user clicks the login button or submits the login form in any other way
		(this._form as UILoginElements).form.addEventListener('submit', (event: Event) => {
			event.preventDefault();
			if (!navigator.onLine) {
				this._showOfflineMessage(true);
				return;
			}
			this._auth.login(form.loginInput.value, form.passwordInput.value);
		});

		// Only enable the login button when both the login and password fields are filled in
		form.loginInput.addEventListener('input', () => {
			this._enableOrDisableSubmitButton();
		});
		form.passwordInput.addEventListener('input', () => {
			this._enableOrDisableSubmitButton();
		});

		// Add caps lock detection for password field
		this._setupCapsLockDetection(form.passwordInput);

		// Event listener for 'Enter' key navigation
		form.loginInput.addEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault(); // Prevent form submission
				form.passwordInput.focus(); // Move focus to password field
			}
		});

		form.passwordInput.addEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault(); // Prevent form submission
				if (!this._enableOrDisableSubmitButton()) {
					form.form.dispatchEvent(new Event('submit')); // Submit the form if fields are filled
				}
			}
		});

		// Setup header reboot button
		this._setupHeaderRebootButton();
	}

	// Returns true if the login button is disabled, false otherwise
	protected _enableOrDisableSubmitButton(): boolean {
		const form = this._form as UILoginElements;
		const buttonDisabled = form.loginInput.value.trim() === "" || form.passwordInput.value === "";
		form.loginButton.disabled = buttonDisabled;
		return buttonDisabled;
	}

	protected _wigglePasswordInput(clearInput: boolean = true): void {
		const passwordInput = (this._form as UILoginElements).passwordInput;
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
		const form = this._form as UILoginElements;
		if (form.loginInput.value.trim() === "") {
			return form.loginInput;
		}
		return form.passwordInput;
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
			// Show the reboot button when login screen is active
			rebootButton.style.display = 'inline-block';
			
			// Remove any existing event listeners to prevent conflicts
			rebootButton.onclick = null;
			
			// Add event listener
			rebootButton.addEventListener('click', (event: Event) => {
				event.preventDefault();
				console.log('Reboot button clicked from login screen');
				this._handleReboot();
			});
		}
	}

	private async _handleReboot(): Promise<void> {
		const confirmed = await this._showConfirmDialog('Are you sure you want to reboot the system?');
		if (confirmed) {
			console.log('Reboot confirmed, proceeding with reboot');
			
			// Use lightdm.restart() if available, otherwise fallback to alert
			if (typeof lightdm !== 'undefined' && lightdm.restart) {
				console.log('Calling lightdm.restart()');
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
		// Hide reboot button when login screen is hidden
		const rebootButton = document.getElementById('reboot-button') as HTMLButtonElement;
		if (rebootButton) {
			rebootButton.style.display = 'none';
		}
	}
}
