import type { IDataObject } from 'n8n-workflow';
import type { ParsedEvent } from './iCalendarParser';

/**
 * Formats a UTC Date to a local time string in the specified timezone
 * Returns ISO-like format: YYYY-MM-DDTHH:mm:ss (without Z, representing local time)
 */
export function formatInTimezone(date: Date | undefined, tzid: string | undefined): string | undefined {
	if (!date) return undefined;

	// If no timezone specified, return UTC
	if (!tzid) {
		return date.toISOString();
	}

	try {
		// Format the date in the specified timezone
		const formatter = new Intl.DateTimeFormat('sv-SE', {
			timeZone: tzid,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});

		// Format returns "YYYY-MM-DD HH:mm:ss", convert to ISO-like format
		const formatted = formatter.format(date);
		return formatted.replace(' ', 'T');
	} catch {
		// If timezone is invalid, fall back to UTC
		return date.toISOString();
	}
}

/**
 * Converts a ParsedEvent to a JSON-safe IDataObject
 * Handles both VEVENT and VTODO components
 */
export function eventToJson(event: ParsedEvent): IDataObject {
	const json: IDataObject = {
		uid: event.uid,
		componentType: event.componentType || 'VEVENT',
		summary: event.summary,
		// UTC timestamps (original behavior)
		start: event.start?.toISOString(),
		end: event.end?.toISOString(),
		// Local time in original timezone
		startLocal: formatInTimezone(event.start, event.startTzid),
		endLocal: formatInTimezone(event.end, event.endTzid),
		description: event.description,
		location: event.location,
		status: event.status,
		etag: event.etag,
		href: event.href,
		wholeDay: event.wholeDay,
		startTzid: event.startTzid,
		endTzid: event.endTzid,
		recurrenceRule: event.recurrenceRule as unknown as IDataObject,
		alarms: event.alarms as unknown as IDataObject[],
	};

	// Add VTODO specific fields if present
	if (event.componentType === 'VTODO') {
		if (event.due) {
			json.due = event.due.toISOString();
			json.dueLocal = formatInTimezone(event.due, event.dueTzid);
			json.dueTzid = event.dueTzid;
		}
		if (event.completed) {
			json.completed = event.completed.toISOString();
		}
		if (event.percentComplete !== undefined) {
			json.percentComplete = event.percentComplete;
		}
		if (event.priority !== undefined) {
			json.priority = event.priority;
		}
		// Subtask relationship
		if (event.parentUid) {
			json.parentUid = event.parentUid;
		}
		// Nested subtasks (recursively converted)
		if (event.subtasks && event.subtasks.length > 0) {
			json.subtasks = event.subtasks.map((sub) => eventToJson(sub));
		}
	}

	return json;
}
