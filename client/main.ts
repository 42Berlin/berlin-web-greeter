// Import local classes
import { Data } from './data';
import { UI } from './ui';
import { Authenticator } from './auth';
import { Idler } from './idler';

declare global {
	interface Window {
		data: Data;
		auth: Authenticator;
		ui: UI;
		idler: Idler;
		debugKeys: boolean;

		sleep(ms: number): Promise<void>;
		restartComputer(): boolean;
		brightness: {
			decrease: () => void;
			increase: () => void;
		};
		toggleDiagnostics(): void;
	}
}

// IT diagnostics panel: toggled with Ctrl+Alt+I. Shows machine facts gathered by the
// fetcher (data.json .diagnostics) plus live client-side facts.
window.toggleDiagnostics = () => {
	const existing = document.getElementById('diagnostics-overlay');
	if (existing) {
		existing.remove();
		return;
	}

	const diag = window.data.dataJson?.diagnostics;
	const fetchTime = window.data.dataJson?.fetch_time;
	const rows: [string, string][] = [
		['Hostname', window.data.hostname],
		['Last user', window.data.dataJson?.last_user || '—'],
		['IP', diag?.ip || '—'],
		['MAC', diag?.mac || '—'],
		['Uptime', diag?.uptime || '—'],
		['Disk /', diag?.disk || '—'],
		['Greeter', `${window.data.pkgName} v${window.data.pkgVersion}`],
		['Config version', diag?.config_version || '—'],
		['Last data fetch', fetchTime ? new Date(fetchTime).toLocaleString() : '—'],
		['Network', navigator.onLine ? 'online' : 'offline'],
	];

	const overlay = document.createElement('div');
	overlay.id = 'diagnostics-overlay';
	overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

	const panel = document.createElement('div');
	panel.className = 'diagnostics-panel';

	const title = document.createElement('h2');
	title.textContent = '// diagnostics';
	panel.appendChild(title);

	const table = document.createElement('div');
	table.className = 'diagnostics-table';
	for (const [key, value] of rows) {
		const k = document.createElement('span');
		k.className = 'diag-key';
		k.textContent = key;
		const v = document.createElement('span');
		v.className = 'diag-val';
		v.textContent = value;
		table.append(k, v);
	}
	panel.appendChild(table);

	const hint = document.createElement('p');
	hint.className = 'diagnostics-hint';
	hint.textContent = 'Ctrl+Alt+I or click outside to close';
	panel.appendChild(hint);

	overlay.appendChild(panel);
	document.body.appendChild(overlay);
};

// use with await window.sleep(1000); to sleep for 1 second
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
window.sleep = sleep;

// use with window.restartComputer(); to restart the computer
window.restartComputer = () => {
	try {
		if (!window.lightdm?.can_restart) {
			window.ui.setDebugInfo("Rebooting failed: lightdm.can_restart is false");
			return false;
		}

		window.lightdm?.restart();
		return true;
	}
	catch (err) {
		window.ui.setDebugInfo(`Rebooting failed: ${err}`);
		return false;
	}
};

window.brightness = {
	decrease: () => {
		if (!window.lightdm?.can_access_brightness) {
			window.ui.setDebugInfo('Brightness control failed: lightdm.can_access_brightness is false');
			return;
		}
		window.lightdm?.brightness_decrease(10);
	},
	increase: () => {
		if (!window.lightdm?.can_access_brightness) {
			window.ui.setDebugInfo('Brightness control failed: lightdm.can_access_brightness is false');
			return;
		}
		window.lightdm?.brightness_increase(10);
	}
};

// Topbar brightness control: a button that toggles a slider setting absolute brightness.
function setupBrightnessControl(): void {
	const control = document.getElementById('brightness-control');
	const button = document.getElementById('brightness-button');
	const slider = document.getElementById('brightness-slider') as HTMLInputElement | null;
	if (!control || !button || !slider) {
		return;
	}

	// Always show it in the topbar (can_access_brightness is unreliable on some
	// nody-greeter setups); the set below is a no-op if brightness isn't controllable.
	control.style.display = 'inline-flex';

	// Initialise the slider to the current brightness, if reported
	const current = window.lightdm?.brightness;
	if (typeof current === 'number' && current >= 0) {
		slider.value = String(current);
	}

	button.addEventListener('click', (e) => {
		e.stopPropagation();
		control.classList.toggle('open');
	});
	slider.addEventListener('input', () => {
		window.lightdm?.brightness_set(parseInt(slider.value, 10));
	});
	// Close the popover when clicking anywhere else
	document.addEventListener('click', (e) => {
		if (!control.contains(e.target as Node)) {
			control.classList.remove('open');
		}
	});
}

async function initGreeter(): Promise<void> {
	// Initialize local classes
	window.data = new Data();
	window.auth = new Authenticator();
	window.ui = new UI(window.data, window.auth);
	window.idler = new Idler(window.ui.isLockScreen);
	window.debugKeys = false;

	// Set up the topbar brightness control (only if this machine supports it)
	setupBrightnessControl();

	// Add reboot keybind to reboot on ctrl+alt+del
	// only when the lock screen is not shown
	document.addEventListener('keydown', (e) => {
		const isPasswordInput = (document.activeElement?.tagName === 'INPUT' && document.activeElement?.getAttribute('type') === 'password');
		if (window.debugKeys && !isPasswordInput) {
			window.ui.setDebugInfo(`Key pressed: ${e.code} (${e.key})${e.ctrlKey ? ' + Ctrl' : ''}${e.altKey ? ' + Alt' : ''}${e.shiftKey ? ' + Shift' : ''}${e.metaKey ? ' + Meta' : ''}`);
		}
		if (e.ctrlKey && e.altKey) { // Special keybinds
			switch (e.key) {
				case 'Delete': // Ctrl + Alt + Delete = reboot computer
					window.ui.setDebugInfo('Reboot requested through LightDM');
					window.restartComputer();
					break;
				case 'e': // Ctrl + Alt + E = override exam mode
					window.ui.setDebugInfo('Exam mode override enabled');
					window.ui.overrideExamMode();
					break;
				case 'd': // Ctrl + Alt + D = debug keys: show pressed key in debug info
					window.debugKeys = (window.debugKeys) ? false : true;
					window.ui.setDebugInfo(`Debug keys: ${(window.debugKeys ? 'enabled' : 'disabled')}`);
					return;
				case 'i': // Ctrl + Alt + I = IT diagnostics panel
					window.toggleDiagnostics();
					break;
			}
		}
		else { // Regular keybinds
			switch (e.key) {
				case 'BrightnessDown': // Brightness down key
				case 'F1': // F1 = Decrease brightness (F1 and F14 are often the same key)
				case 'F14': // F14 = Decrease brightness (on some keyboards, e.g. Cherry)
					window.brightness.decrease();
					break;
				case 'BrightnessUp': // Brightness up key
				case 'F2': // F2 = Increase brightness (F2 and F15 are often the same key)
				case 'F15': // F15 = Increase brightness (on some keyboards, e.g. Cherry)
					window.brightness.increase();
					break;
			}
		}
	});
}

window.addEventListener("GreeterReady", () => {
	initGreeter();
});
