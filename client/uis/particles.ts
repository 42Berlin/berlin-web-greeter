interface Dot {
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
	color: string;
	opacity: number;
}

const COLORS = ['#99A3EB', '#00FFF2'];
const DOT_COUNT = 50;
const LINE_DIST = 150;

export class ParticleField {
	private _canvas: HTMLCanvasElement;
	private _ctx: CanvasRenderingContext2D;
	private _dots: Dot[] = [];
	private _rafId: number = 0;
	private _active: boolean;

	public constructor(isLockScreen: boolean) {
		this._canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
		this._ctx = this._canvas.getContext('2d')!;
		this._active = !isLockScreen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!this._active) return;

		this._resize();
		window.addEventListener('resize', this._resize);
		document.addEventListener('visibilitychange', this._onVisibility);

		for (let i = 0; i < DOT_COUNT; i++) {
			this._dots.push({
				x: Math.random() * this._canvas.width,
				y: Math.random() * this._canvas.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				r: 2 + Math.random() * 2,
				color: COLORS[Math.floor(Math.random() * COLORS.length)],
				opacity: 0.15 + Math.random() * 0.15,
			});
		}

		this._checkAndStart();
		window.data.addDataChangeListener(() => this._checkAndStart());
	}

	private _resize = (): void => {
		this._canvas.width = window.innerWidth;
		this._canvas.height = window.innerHeight;
	};

	private _onVisibility = (): void => {
		if (document.hidden) {
			cancelAnimationFrame(this._rafId);
			this._rafId = 0;
		} else {
			this._checkAndStart();
		}
	};

	private _checkAndStart(): void {
		const gradientBg = document.getElementById('gradient-bg');
		const shouldShow = gradientBg && gradientBg.style.display !== 'none' && getComputedStyle(gradientBg).display !== 'none';
		this._canvas.style.display = shouldShow ? 'block' : 'none';
		if (shouldShow && !this._rafId) {
			this._rafId = requestAnimationFrame(this._tick);
		} else if (!shouldShow && this._rafId) {
			cancelAnimationFrame(this._rafId);
			this._rafId = 0;
		}
	}

	private _tick = (): void => {
		const w = this._canvas.width;
		const h = this._canvas.height;
		this._ctx.clearRect(0, 0, w, h);

		for (const d of this._dots) {
			d.x += d.vx;
			d.y += d.vy;
			if (d.x < 0) d.x += w;
			if (d.x > w) d.x -= w;
			if (d.y < 0) d.y += h;
			if (d.y > h) d.y -= h;

			this._ctx.beginPath();
			this._ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
			this._ctx.fillStyle = d.color;
			this._ctx.globalAlpha = d.opacity;
			this._ctx.fill();
		}

		this._ctx.globalAlpha = 0.06;
		this._ctx.strokeStyle = '#99A3EB';
		this._ctx.lineWidth = 1;
		for (let i = 0; i < this._dots.length; i++) {
			for (let j = i + 1; j < this._dots.length; j++) {
				const dx = this._dots[i].x - this._dots[j].x;
				const dy = this._dots[i].y - this._dots[j].y;
				if (dx * dx + dy * dy < LINE_DIST * LINE_DIST) {
					this._ctx.beginPath();
					this._ctx.moveTo(this._dots[i].x, this._dots[i].y);
					this._ctx.lineTo(this._dots[j].x, this._dots[j].y);
					this._ctx.stroke();
				}
			}
		}
		this._ctx.globalAlpha = 1;

		this._rafId = requestAnimationFrame(this._tick);
	};
}
