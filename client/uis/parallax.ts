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
