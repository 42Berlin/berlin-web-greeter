import { Authenticator, AuthenticatorEvents } from "../../auth";
import { UIScreen, UIExamModeElements } from "../screen";
import { LoginScreenUI } from "./loginscreen";
import { ExamForHost } from "../../data";

export class ExamModeUI extends UIScreen {
	public static readonly EXAM_USERNAME: string = 'exam';
	public static readonly EXAM_PASSWORD: string = 'exam';

	public readonly _form: UIExamModeElements;
	private _examMode: boolean = false;
	private _examIds: number[] = [];
	private _loginScreen: LoginScreenUI;
	protected _events: AuthenticatorEvents = {
		authenticationStart: () => {
			this._disableForm();
		},
		authenticationComplete: () => {
			// TODO: add loading animation here
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

	public constructor(auth: Authenticator, loginUI: LoginScreenUI) {
		super(auth);

		// Keep a reference to the login screen so that we can show it when the exam is over
		this._loginScreen = loginUI;

		this._form = {
			form: document.getElementById('exam-form') as HTMLFormElement,
			examStartButton: document.getElementById('exam-mode-start-button') as HTMLButtonElement,
		} as UIExamModeElements;

		this._initForm();
	}

	/**
	 * Enable exam mode for a list of exams currently ongoing (usually just 1).
	 * If the array of exams is empty, nothing will happen.
	 */
	public enableExamMode(exams: ExamForHost[]): void {
		if (exams.length === 0) {
			return;
		}
		document.body.classList.add('exam-mode');
		this._examMode = true;
		this._examIds = exams.map((exam) => exam.id);
		this._populateData(exams);
		this._loginScreen.hideForm();
		this.showForm();
	}

	/**
	 * Disable exam mode and show the default login screen instead.
	 */
	public disableExamMode(): void {
		this._examMode = false;
		document.body.classList.remove('exam-mode');
		this._examIds = [];
		this._populateData([]);
		this.hideForm();
		this._loginScreen.showForm();
	}

	/**
	 * Get whether the exam mode screen is currently displayed.
	 */
	public get examMode(): boolean {
		return this._examMode;
	}

	/**
	 * Get the ids of the exams that are currently displayed on the exam mode screen.
	 */
	public get examIds(): number[] {
		return this._examIds;
	}

	protected _initForm(): void {
		const form = this._form as UIExamModeElements;

		// This event gets called when the user clicks the unlock button or submits the lock screen form in any other way
		form.examStartButton.addEventListener('click', (event: Event) => {
			event.preventDefault();
			if (this._examMode) {
				this._auth.login(ExamModeUI.EXAM_USERNAME, ExamModeUI.EXAM_PASSWORD);
			}
		});
	}

	private _populateData(examsToPopulate: ExamForHost[]): void {
		// No dynamic data to populate — the exam form is static text now.
		// Kept as a no-op for the enable/disable lifecycle.
	}

	// Returns true if the exam-start button is disabled, false otherwise
	protected _enableOrDisableSubmitButton(): boolean {
		const form = this._form as UIExamModeElements;
		form.examStartButton.disabled = false; // Always enable the button
		return false;
	}

	protected _wigglePasswordInput(clearInput: boolean = true): void {
		// This should never happen. Display an error in the debug info bar.
		const message = `Failed to login with username "${ExamModeUI.EXAM_USERNAME}" and password "${ExamModeUI.EXAM_PASSWORD}" to start an exam session`;

		window.ui.setDebugInfo(message);
		console.error(message);
	}

	protected _getInputToFocusOn(): HTMLButtonElement | null {
		return null; // Don't focus on any input field, there are none.
		// There is a button we could focus on but then pressing enter/space will trigger the button even when the display is blanking
	}
}
