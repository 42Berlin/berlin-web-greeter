import { DataJson, Event42 } from "../data";
import { Data } from "../data";

// Which cursus's events to display per machine mode (MODE in /usr/share/42/berlin.conf,
// injected into data.json as `mode` by the fetcher). Unknown modes fall back to DEFAULT_CURSUS_ID.
const MODE_CURSUS_ID: { [mode: string]: number } = {
	default: 21, // 42cursus
	piscine: 9,  // C Piscine
};
const DEFAULT_CURSUS_ID = MODE_CURSUS_ID.default;

export class CalendarUI {
	private _calendar: HTMLDivElement;
	private _nextEvent: HTMLDivElement;

	public constructor(dataHolder: Data) {
		this._calendar = document.getElementById('intra-calendar') as HTMLDivElement;
		this._nextEvent = document.getElementById('next-event') as HTMLDivElement;
		this.populateCalendar();
		this._updateNextEvent();
		dataHolder.addDataChangeListener(this.populateCalendar.bind(this));
		dataHolder.addDataChangeListener(this._updateNextEvent.bind(this));
		// Keep the "in X min" countdown live even between data fetches
		setInterval(() => this._updateNextEvent(), 60 * 1000);
	}

	/**
	 * Show a live countdown to the soonest upcoming event/exam for this machine's cursus.
	 */
	private _updateNextEvent(dataJSON: DataJson | undefined = window.data.dataJson): void {
		if (!this._nextEvent) {
			return;
		}
		if (dataJSON === undefined) {
			this._nextEvent.style.display = 'none';
			return;
		}

		const now = Date.now();
		const cursusId = MODE_CURSUS_ID[dataJSON.mode] ?? DEFAULT_CURSUS_ID;

		// Merge cursus-filtered events and exams, keep the soonest one starting in the future
		const upcoming: Event42[] = dataJSON.events.filter((e) => e.cursus_ids.includes(cursusId));
		for (const exam of dataJSON.exams) {
			upcoming.push(Data.examToEvent(exam));
		}
		const next = upcoming
			.filter((e) => new Date(e.begin_at).getTime() > now)
			.sort((a, b) => new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime())[0];

		if (!next) {
			this._nextEvent.style.display = 'none';
			return;
		}

		const diffMin = Math.round((new Date(next.begin_at).getTime() - now) / 60000);
		const timeStr = diffMin < 60 ? `${diffMin} min` : `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;

		this._nextEvent.style.display = 'flex';
		this._nextEvent.replaceChildren(); // clear
		const label = document.createElement('span');
		label.className = 'next-event-label';
		label.textContent = 'Next up';
		const name = document.createElement('span');
		name.className = 'next-event-name';
		name.textContent = next.name; // textContent avoids any injection from event names
		const time = document.createElement('span');
		time.className = 'next-event-time';
		time.textContent = `in ${timeStr}`;
		this._nextEvent.append(label, name, time);

		if (next.location) {
			const location = document.createElement('span');
			location.className = 'next-event-location';
			location.textContent = `📍 ${next.location}`;
			this._nextEvent.append(location);
		}

		// Click the banner to open the same detailed-view dialog as a calendar event
		const nextEl = this._createEventElement(next);
		this._nextEvent.onclick = () => this._openEventDialog(nextEl);
	}

	private _estimateDuration(beginAt: Date, endAt: Date): string {
		const duration = endAt.getTime() - beginAt.getTime();

		const days = Math.floor(duration / 1000 / 60 / 60 / 24);
		const hours = Math.floor(duration / 1000 / 60 / 60);
		const minutes = Math.floor(duration / 1000 / 60);

		if (days > 1) {
			return `${days} days`;
		}
		else if (hours > 0) {
			return `About ${hours} hour${hours === 1 ? '' : 's'}`;
		}
		else if (minutes > 0) {
			return `About ${minutes} minute${minutes === 1 ? '' : 's'}`;
		}
		return "";
	}

	private _removeMarkdownSyntax(text: string): string {
		// Parse bold text
		text = text.replace(/\*\*(.*?)\*\*/g, '$1');

		// Parse italic text
		text = text.replace(/\*(.*?)\*/g, '$1');
		text = text.replace(/\_(.*?)\_/g, '$1');

		// Parse links
		text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');

		return text;
	}

	private populateCalendar(dataJSON: DataJson | undefined = window.data.dataJson): void {
		if (dataJSON === undefined) {
			this._destroyAllEvents();
			return;
		}
		// Only show events meant for the cursus tied to this machine's mode
		const cursusId = MODE_CURSUS_ID[dataJSON.mode] ?? DEFAULT_CURSUS_ID;

		const eventsForCalendar: HTMLDivElement[] = [];
		for (const event of dataJSON.events) {
			if (!event.cursus_ids.includes(cursusId)) {
				continue;
			}
			eventsForCalendar.push(this._createEventElement(event));
		}
		for (const exam of dataJSON.exams) {
			const event = Data.examToEvent(exam); // convert exam to event
			eventsForCalendar.push(this._createEventElement(event));
		}
		// Sort events by begin timestamp (mix exams and events)
		eventsForCalendar.sort((a, b) => {
			return parseInt(a.getAttribute("data-event-timestamp") ?? "0") - parseInt(b.getAttribute("data-event-timestamp") ?? "0");
		});
		this._destroyAllEvents();
		// Add all events; the calendar container scrolls if they don't all fit.
		for (const event of eventsForCalendar) {
			this._calendar.appendChild(event);
		}
	}

	private _destroyAllEvents(): void {
		const events = this._calendar.getElementsByClassName('calendar-event');
		while (events.length > 0) {
			events[0].remove();
		}
	}

	private _createEventElement(event: Event42): HTMLDivElement {
		// Parse dates
		const beginDate = new Date(event.begin_at);
		const endDate = new Date(event.end_at);

		// Main element
		const calendarEvent = document.createElement('div');
		calendarEvent.classList.add('calendar-event');
		calendarEvent.setAttribute("data-event-kind", (event.name.toLowerCase().includes("bocal q&a") ? "standup" : event.kind));
		calendarEvent.setAttribute("data-event-id", event.id.toString());
		calendarEvent.setAttribute("data-event-timestamp", beginDate.getTime().toString());

		// Date element
		const calendarEventDate = document.createElement('div');
		calendarEventDate.classList.add('calendar-event-date');
		calendarEvent.appendChild(calendarEventDate);

		const calendarEventDateDay = document.createElement('span');
		calendarEventDateDay.classList.add('calendar-event-date-day');
		calendarEventDateDay.innerText = beginDate.toLocaleString('en-NL', { weekday: 'short' });
		calendarEventDate.appendChild(calendarEventDateDay);

		const calendarEventDateDate = document.createElement('span');
		calendarEventDateDate.classList.add('calendar-event-date-date');
		calendarEventDateDate.innerText = beginDate.toLocaleString('en-NL', { day: 'numeric' });
		calendarEventDate.appendChild(calendarEventDateDate);

		const calendarEventDateMonth = document.createElement('span');
		calendarEventDateMonth.classList.add('calendar-event-date-month');
		calendarEventDateMonth.innerText = beginDate.toLocaleString('en-NL', { month: 'short' });
		calendarEventDate.appendChild(calendarEventDateMonth);

		// Event info
		const calendarEventWrapper = document.createElement('div');
		calendarEventWrapper.classList.add('calendar-event-wrapper');
		calendarEvent.appendChild(calendarEventWrapper);

		const calendarEventTitle = document.createElement('div');
		calendarEventTitle.classList.add('calendar-event-title');
		calendarEventTitle.innerText = event.name;
		calendarEventWrapper.appendChild(calendarEventTitle);

		const calendarEventDesc = document.createElement('div');
		calendarEventDesc.classList.add('calendar-event-description');
		calendarEventDesc.innerText = this._removeMarkdownSyntax(event.description);
		calendarEventWrapper.appendChild(calendarEventDesc);

		// Event details
		const calendarEventDetails = document.createElement('div');
		calendarEventDetails.classList.add('calendar-event-details');
		calendarEventWrapper.appendChild(calendarEventDetails);

		const calendarEventTime = document.createElement('span');
		calendarEventTime.classList.add('calendar-event-time');
		calendarEventTime.innerText = beginDate.toLocaleString('en-NL', { timeStyle: 'short' });
		calendarEventDetails.appendChild(calendarEventTime);

		const calendarEventDuration = document.createElement('span');
		calendarEventDuration.classList.add('calendar-event-duration');
		calendarEventDuration.innerText = this._estimateDuration(beginDate, endDate);
		calendarEventDetails.appendChild(calendarEventDuration);

		const calendarEventSpots = document.createElement('span');
		calendarEventSpots.classList.add('calendar-event-spots');
		calendarEventSpots.innerText = (event.max_people ? `${event.nbr_subscribers} / ${event.max_people}` : '');
		calendarEventDetails.appendChild(calendarEventSpots);

		const calendarEventLocation = document.createElement('span');
		calendarEventLocation.classList.add('calendar-event-location');
		calendarEventLocation.innerText = event.location ?? '';
		calendarEventDetails.appendChild(calendarEventLocation);

		// Add dialog to event
		this._addDialogToEvent(calendarEvent);

		return calendarEvent;
	}

	private _addDialogToEvent(eventElement: HTMLDivElement): void {
		eventElement.addEventListener('click', () => this._openEventDialog(eventElement));
	}

	/**
	 * Build and show the detailed-view dialog for a calendar-event element (cloning its contents).
	 */
	private _openEventDialog(eventElement: HTMLDivElement): void {
		// Create dialog
		const dialog = document.createElement('dialog');
		dialog.classList.add('calendar-event-dialog');
		dialog.setAttribute("data-event-kind", eventElement.getAttribute("data-event-kind") ?? "event");

		// Add close button
		const dialogCloseButton = document.createElement('button');
		dialogCloseButton.classList.add('dialog-close-button');
		dialogCloseButton.innerHTML = '&times;';
		dialog.appendChild(dialogCloseButton);

		// Create wrapper for contents (clone event element for data)
		const dialogContents = document.createElement('div');
		dialogContents.classList.add('event-dialog-contents');
		dialog.appendChild(dialogContents);
		for (const child of eventElement.children) {
			dialogContents.appendChild(child.cloneNode(true));
		}

		// Close and destroy dialog when clicked outside of it
		dialogContents.addEventListener('click', (ev) => {
			ev.stopPropagation();
		});
		dialog.addEventListener('click', (ev) => {
			dialog.close();
			dialog.remove();
		});

		// Show dialog right now
		document.body.appendChild(dialog);
		dialog.showModal();
	}
}
