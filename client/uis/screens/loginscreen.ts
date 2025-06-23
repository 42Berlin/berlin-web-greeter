import { Authenticator, AuthenticatorEvents } from "../../auth";
import { UILoginElements, UIScreen } from "../screen";

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
		// const form = this._form as UILoginElements;
		const isOnline = navigator.onLine;
		const offlineMessage = document.getElementById('offline-message');
	
		// form.loginInput.disabled = !isOnline;
		// form.passwordInput.disabled = !isOnline;
		// form.loginButton.disabled = !isOnline || this._enableOrDisableSubmitButton();
	
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
				// return;
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
}
