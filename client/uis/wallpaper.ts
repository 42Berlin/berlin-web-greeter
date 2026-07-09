import { GreeterImage } from "../data";

export class WallpaperUI {
	private _element: HTMLElement;
	private _blurFilter: HTMLElement;
	private _isLockScreen: boolean;
	private _defaultWallpaper: GreeterImage | null = null; // cached GreeterImage for the current default_wallpaper path

	public constructor(isLockScreen: boolean, wallpaperElement: HTMLElement | null = null) {
		this._element = wallpaperElement ?? document.body;
		this._blurFilter = document.getElementById('blur-filter') as HTMLElement;
		this._isLockScreen = isLockScreen;

		this.displayWallpaper();
		// The mode arrives with data.json (fetched async), so re-evaluate when it changes.
		window.data.addDataChangeListener(() => this.displayWallpaper());
	}

	public displayWallpaper(): boolean {
		const mode = window.data.dataJson?.mode ?? 'default';

		// Pick a wallpaper image, if any should be shown.
		let wallpaper: GreeterImage | null = null;
		if (this._isLockScreen) {
			this._blurFilter.style.display = 'block';
			// The lock screen always prefers the logged-in user's own wallpaper.
			if (window.data.userLockScreenWallpaper.exists) {
				wallpaper = window.data.userLockScreenWallpaper;
			}
		}
		if (wallpaper === null) {
			if (mode === 'exam') {
				// Exam mode: always use the animated gradient background, no wallpaper
				wallpaper = null;
			}
			else if (mode === 'default') {
				// Default mode: use GREETER_DEFAULT_WALLPAPER if set and present, else the animated gradient.
				const defaultWallpaper = this._getDefaultWallpaper(window.data.dataJson?.default_wallpaper ?? '');
				if (defaultWallpaper !== null && defaultWallpaper.exists) {
					wallpaper = defaultWallpaper;
				}
			}
			else if (window.data.loginScreenWallpaper.exists) {
				// Other modes (e.g. piscine) keep their own login wallpaper image.
				wallpaper = window.data.loginScreenWallpaper;
			}
		}

		const gradientBg = document.getElementById('gradient-bg');
		if (wallpaper !== null) {
			// Show the wallpaper image and hide the animated background.
			// (yes for some reason the file path just works without file://)
			// Actually, file:// will even cause the image to not load.
			this._element.style.backgroundImage = 'url("' + wallpaper.path + '")';
			if (gradientBg) gradientBg.style.display = 'none';
		}
		else {
			// No wallpaper image to show: use the animated "moving color" background.
			this._element.style.backgroundImage = 'none';
			if (gradientBg) gradientBg.style.display = 'block';
		}

		return true;
	}

	// Returns a GreeterImage for the given default_wallpaper path, only rebuilding
	// (and re-checking existence) when the configured path actually changes.
	private _getDefaultWallpaper(path: string): GreeterImage | null {
		if (path === '') {
			this._defaultWallpaper = null;
		}
		else if (this._defaultWallpaper === null || this._defaultWallpaper.path !== path) {
			this._defaultWallpaper = new GreeterImage(path);
		}
		return this._defaultWallpaper;
	}
}
