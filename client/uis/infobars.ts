export interface UIInfoElements {
	hostname: HTMLSpanElement;
	version: HTMLSpanElement;
	clock: HTMLSpanElement;
	date: HTMLSpanElement;
	network: HTMLSpanElement;
	debug: HTMLSpanElement;
}

export class InfoBarsUI {
	private _infoElements: UIInfoElements;

	public constructor() {
		this._infoElements = {
			hostname: document.getElementById('info-hostname') as HTMLSpanElement,
			version: document.getElementById('info-version') as HTMLSpanElement,
			clock: document.getElementById('info-clock') as HTMLSpanElement,
			date: document.getElementById('info-date') as HTMLSpanElement,
			network: document.getElementById('info-network') as HTMLSpanElement,
			debug: document.getElementById('info-debug') as HTMLSpanElement,
		};

		this._populateInfoElements();
	}

	public setDebugInfo(info: string): void {
		this._infoElements.debug.innerText = info;
		console.debug("Changed text in debug info: ", info);
	}

	private _populateInfoElements(): void {
		// Populate debug info
		this._infoElements.debug.innerText = '';
		window.addEventListener('error', (event: ErrorEvent) => {
			this._infoElements.debug.innerText += event.error + '\n';
		});

		// Populate version info
		this._infoElements.version.innerText = window.data.pkgName + " v" + window.data.pkgVersion;

		// Populate hostname info
		const hostname = window.data.hostname.endsWith(".42berlin.de") ? window.data.hostname.slice(0, -".42berlin.de".length) : window.data.hostname;
		this._infoElements.hostname.innerText = hostname;

		// Populate clock element
		this._updateClock();
		setInterval(() => this._updateClock(), 1000);

		// Network status dot (green online / red offline)
		this._setNetworkStatus(navigator.onLine);
		window.addEventListener('online', () => this._setNetworkStatus(true));
		window.addEventListener('offline', () => this._setNetworkStatus(false));
	}

	private _setNetworkStatus(online: boolean): void {
		this._infoElements.network.textContent = '';
		this._infoElements.network.classList.toggle('online', online);
		this._infoElements.network.classList.toggle('offline', !online);
		this._infoElements.network.title = online ? 'Online' : 'Offline';
	}

	private _updateClock(): void {
		const now: Date = new Date();
		this._infoElements.date.innerText = now.toLocaleString('en-NL', { dateStyle: 'medium' });
		this._infoElements.clock.innerText = now.toLocaleString('en-NL', { timeStyle: 'short' });
	}
}
