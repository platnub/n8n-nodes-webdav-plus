import { generateSecureUID, escapeICalText } from './security';

/**
 * Recurrence rule structure
 */
export interface RecurrenceRule {
	freq?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
	interval?: number;
	count?: number;
	until?: Date;
	byday?: string[];
}

/**
 * Alarm structure
 */
export interface Alarm {
	action: 'DISPLAY' | 'AUDIO' | 'EMAIL';
	trigger: string;
	description?: string;
	summary?: string;
	attendees?: string[];
}

/**
 * Parsed event structure (covers both VEVENT and VTODO)
 */
export interface ParsedEvent {
	uid: string;
	summary: string;
	start?: Date;
	end?: Date;
	description?: string;
	location?: string;
	status?: string;
	etag?: string;
	href?: string;
	wholeDay?: boolean;
	startTzid?: string;
	endTzid?: string;
	recurrenceRule?: RecurrenceRule;
	alarms?: Alarm[];
	// VTODO specific fields
	componentType?: 'VEVENT' | 'VTODO';
	due?: Date;
	dueTzid?: string;
	completed?: Date;
	percentComplete?: number;
	priority?: number;
	// Subtask relationship fields (VTODO specific)
	parentUid?: string;
	subtasks?: ParsedEvent[];
}

/**
 * Unfolds iCalendar content (handles line continuations)
 */
function unfoldICalendar(icalString: string): string {
	return icalString.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

/**
 * Parses an iCalendar date-time string
 * Handles formats: 20231225T120000Z, 20231225T120000, 20231225
 */
function parseICalDateTime(value: string, _tzid?: string): { date: Date; wholeDay: boolean } {
	// Remove any remaining parameters
	const cleanValue = value.replace(/^[^:]*:/, '');

	// Check if this is a whole day event (DATE only, no time)
	if (/^\d{8}$/.test(cleanValue)) {
		const year = parseInt(cleanValue.substring(0, 4), 10);
		const month = parseInt(cleanValue.substring(4, 6), 10) - 1;
		const day = parseInt(cleanValue.substring(6, 8), 10);
		return { date: new Date(Date.UTC(year, month, day)), wholeDay: true };
	}

	// Parse full datetime
	const match = cleanValue.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
	if (!match) {
		return { date: new Date(cleanValue), wholeDay: false };
	}

	const [, year, month, day, hour, minute, second, utc] = match;
	const y = parseInt(year, 10);
	const m = parseInt(month, 10) - 1;
	const d = parseInt(day, 10);
	const h = parseInt(hour, 10);
	const min = parseInt(minute, 10);
	const s = parseInt(second, 10);

	if (utc) {
		return { date: new Date(Date.UTC(y, m, d, h, min, s)), wholeDay: false };
	}

	// Local time - create date assuming local timezone
	return { date: new Date(y, m, d, h, min, s), wholeDay: false };
}

/**
 * Extracts TZID from a property line like DTSTART;TZID=Europe/Berlin:20231225T120000
 */
function extractTzid(line: string): string | undefined {
	const match = line.match(/TZID=([^:;]+)/i);
	return match ? match[1] : undefined;
}

/**
 * Extracts VALUE type from a property line
 */
function extractValueType(line: string): string | undefined {
	const match = line.match(/VALUE=([^:;]+)/i);
	return match ? match[1] : undefined;
}

/**
 * Parses RRULE string into RecurrenceRule object
 */
function parseRRule(rruleValue: string): RecurrenceRule {
	const rule: RecurrenceRule = {};
	const parts = rruleValue.split(';');

	for (const part of parts) {
		const [key, value] = part.split('=');
		switch (key.toUpperCase()) {
			case 'FREQ':
				rule.freq = value as RecurrenceRule['freq'];
				break;
			case 'INTERVAL':
				rule.interval = parseInt(value, 10);
				break;
			case 'COUNT':
				rule.count = parseInt(value, 10);
				break;
			case 'UNTIL':
				rule.until = parseICalDateTime(value).date;
				break;
			case 'BYDAY':
				rule.byday = value.split(',');
				break;
		}
	}

	return rule;
}

/**
 * Parses a VALARM component
 */
function parseVAlarm(alarmLines: string[]): Alarm {
	const alarm: Alarm = {
		action: 'DISPLAY',
		trigger: '-PT15M',
	};

	for (const line of alarmLines) {
		if (line.startsWith('ACTION:')) {
			alarm.action = line.substring(7).trim() as Alarm['action'];
		} else if (line.startsWith('TRIGGER')) {
			const colonIndex = line.indexOf(':');
			if (colonIndex !== -1) {
				alarm.trigger = line.substring(colonIndex + 1).trim();
			}
		} else if (line.startsWith('DESCRIPTION:')) {
			alarm.description = line.substring(12).trim();
		} else if (line.startsWith('SUMMARY:')) {
			alarm.summary = line.substring(8).trim();
		} else if (line.startsWith('ATTENDEE:')) {
			if (!alarm.attendees) alarm.attendees = [];
			alarm.attendees.push(line.substring(9).trim());
		}
	}

	return alarm;
}

/**
 * Unescapes iCalendar text values
 */
function unescapeICalText(text: string): string {
	return text
		.replace(/\\n/gi, '\n')
		.replace(/\\,/g, ',')
		.replace(/\\;/g, ';')
		.replace(/\\\\/g, '\\');
}

/**
 * Parses raw iCalendar string into a ParsedEvent object
 * Supports both VEVENT and VTODO components
 * @param componentFilter - Optional filter: 'VEVENT', 'VTODO', or undefined for both
 */
export function parseICalendarEvent(
	iCalString: string,
	etag?: string,
	href?: string,
	componentFilter?: 'VEVENT' | 'VTODO',
): ParsedEvent | null {
	const unfolded = unfoldICalendar(iCalString);
	const lines = unfolded.split(/\r?\n/);

	const event: ParsedEvent = {
		uid: '',
		summary: '',
		etag,
		href,
	};

	let inComponent = false;
	let inVAlarm = false;
	let currentAlarmLines: string[] = [];
	const alarms: Alarm[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line === 'BEGIN:VEVENT') {
			if (componentFilter && componentFilter !== 'VEVENT') continue;
			inComponent = true;
			event.componentType = 'VEVENT';
			continue;
		}
		if (line === 'BEGIN:VTODO') {
			if (componentFilter && componentFilter !== 'VTODO') continue;
			inComponent = true;
			event.componentType = 'VTODO';
			continue;
		}
		if (line === 'END:VEVENT' || line === 'END:VTODO') {
			inComponent = false;
			continue;
		}
		if (line === 'BEGIN:VALARM') {
			inVAlarm = true;
			currentAlarmLines = [];
			continue;
		}
		if (line === 'END:VALARM') {
			if (currentAlarmLines.length > 0) {
				alarms.push(parseVAlarm(currentAlarmLines));
			}
			inVAlarm = false;
			continue;
		}

		if (inVAlarm) {
			currentAlarmLines.push(line);
			continue;
		}

		if (!inComponent) continue;

		// Parse VEVENT/VTODO properties
		if (line.startsWith('UID:')) {
			event.uid = line.substring(4).trim();
		} else if (line.startsWith('SUMMARY:')) {
			event.summary = unescapeICalText(line.substring(8).trim());
		} else if (line.startsWith('DESCRIPTION:')) {
			event.description = unescapeICalText(line.substring(12).trim());
		} else if (line.startsWith('LOCATION:')) {
			event.location = unescapeICalText(line.substring(9).trim());
		} else if (line.startsWith('STATUS:')) {
			event.status = line.substring(7).trim();
		} else if (line.startsWith('DTSTART')) {
			const tzid = extractTzid(line);
			const valueType = extractValueType(line);
			const colonIndex = line.indexOf(':');
			if (colonIndex !== -1) {
				const value = line.substring(colonIndex + 1).trim();
				const parsed = parseICalDateTime(value, tzid);
				event.start = parsed.date;
				event.wholeDay = valueType === 'DATE' || parsed.wholeDay;
				event.startTzid = tzid;
			}
		} else if (line.startsWith('DTEND')) {
			const tzid = extractTzid(line);
			const colonIndex = line.indexOf(':');
			if (colonIndex !== -1) {
				const value = line.substring(colonIndex + 1).trim();
				const parsed = parseICalDateTime(value, tzid);
				event.end = parsed.date;
				event.endTzid = tzid;
			}
		} else if (line.startsWith('DUE')) {
			// VTODO specific: DUE date
			const tzid = extractTzid(line);
			const colonIndex = line.indexOf(':');
			if (colonIndex !== -1) {
				const value = line.substring(colonIndex + 1).trim();
				const parsed = parseICalDateTime(value, tzid);
				event.due = parsed.date;
				event.dueTzid = tzid;
				// If no end date set, use DUE as end for consistency
				if (!event.end) {
					event.end = parsed.date;
					event.endTzid = tzid;
				}
			}
		} else if (line.startsWith('COMPLETED:')) {
			// VTODO specific: Completion date
			const value = line.substring(10).trim();
			const parsed = parseICalDateTime(value);
			event.completed = parsed.date;
		} else if (line.startsWith('PERCENT-COMPLETE:')) {
			// VTODO specific: Percent complete
			event.percentComplete = parseInt(line.substring(17).trim(), 10);
		} else if (line.startsWith('PRIORITY:')) {
			// VTODO specific: Priority (1-9, 1 highest)
			event.priority = parseInt(line.substring(9).trim(), 10);
		} else if (line.startsWith('RELATED-TO')) {
			// VTODO subtask relationship: RELATED-TO;RELTYPE=PARENT:parent-uid
			const reltypeMatch = line.match(/RELTYPE=([^:;]+)/i);
			const reltype = reltypeMatch ? reltypeMatch[1].toUpperCase() : 'PARENT';
			if (reltype === 'PARENT') {
				const colonIndex = line.indexOf(':');
				if (colonIndex !== -1) {
					event.parentUid = line.substring(colonIndex + 1).trim();
				}
			}
		} else if (line.startsWith('RRULE:')) {
			event.recurrenceRule = parseRRule(line.substring(6).trim());
		}
	}

	// If we had a filter and no matching component was found, return null
	if (componentFilter && !event.componentType) {
		return null;
	}

	// Default to VEVENT if no component type was set (for backward compatibility)
	if (!event.componentType) {
		event.componentType = 'VEVENT';
	}

	if (alarms.length > 0) {
		event.alarms = alarms;
	}

	return event;
}


/**
 * Formats a Date to iCalendar format
 */
function formatICalDateTime(date: Date, tzid?: string, wholeDay?: boolean): string {
	if (wholeDay) {
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');
		return `${year}${month}${day}`;
	}

	if (tzid) {
		// Format in local time with TZID
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hour = String(date.getHours()).padStart(2, '0');
		const minute = String(date.getMinutes()).padStart(2, '0');
		const second = String(date.getSeconds()).padStart(2, '0');
		return `${year}${month}${day}T${hour}${minute}${second}`;
	}

	// UTC format
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	const hour = String(date.getUTCHours()).padStart(2, '0');
	const minute = String(date.getUTCMinutes()).padStart(2, '0');
	const second = String(date.getUTCSeconds()).padStart(2, '0');
	return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Generates a cryptographically secure UID for new events
 * Uses crypto.randomBytes() for security
 */
function generateUID(): string {
	return generateSecureUID('n8n-webdavplus-event');
}

/**
 * Event data for building iCalendar strings (supports both VEVENT and VTODO)
 */
export interface EventData {
	uid?: string;
	componentType?: 'VEVENT' | 'VTODO';
	summary: string;
	// VEVENT fields
	start?: Date;
	end?: Date;
	startTzid?: string;
	endTzid?: string;
	wholeDay?: boolean;
	// VTODO fields
	due?: Date;
	dueTzid?: string;
	priority?: number;
	percentComplete?: number;
	// Shared fields
	description?: string;
	location?: string;
	status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED' | 'NEEDS-ACTION' | 'COMPLETED' | 'IN-PROCESS';
	recurrenceRule?: RecurrenceRule;
	alarms?: Alarm[];
	// Subtask relationship (VTODO specific)
	parentUid?: string;
}

/**
 * Builds an iCalendar string from event data (supports both VEVENT and VTODO)
 */
export function buildICalendarString(eventData: EventData): string {
	const lines: string[] = [];
	const uid = eventData.uid || generateUID();
	const componentType = eventData.componentType || 'VEVENT';

	lines.push('BEGIN:VCALENDAR');
	lines.push('VERSION:2.0');
	lines.push('PRODID:-//n8n-webdavplus//EN');
	lines.push(`BEGIN:${componentType}`);
	lines.push(`UID:${uid}`);
	lines.push(`DTSTAMP:${formatICalDateTime(new Date())}`);

	if (componentType === 'VEVENT') {
		// VEVENT: Start and End dates
		if (eventData.start) {
			if (eventData.wholeDay) {
				lines.push(`DTSTART;VALUE=DATE:${formatICalDateTime(eventData.start, undefined, true)}`);
			} else if (eventData.startTzid) {
				lines.push(`DTSTART;TZID=${eventData.startTzid}:${formatICalDateTime(eventData.start, eventData.startTzid)}`);
			} else {
				lines.push(`DTSTART:${formatICalDateTime(eventData.start)}`);
			}
		}

		if (eventData.end) {
			if (eventData.wholeDay) {
				lines.push(`DTEND;VALUE=DATE:${formatICalDateTime(eventData.end, undefined, true)}`);
			} else if (eventData.endTzid) {
				lines.push(`DTEND;TZID=${eventData.endTzid}:${formatICalDateTime(eventData.end, eventData.endTzid)}`);
			} else {
				lines.push(`DTEND:${formatICalDateTime(eventData.end)}`);
			}
		}
	} else {
		// VTODO: Due date, priority, percent complete
		if (eventData.due) {
			if (eventData.dueTzid) {
				lines.push(`DUE;TZID=${eventData.dueTzid}:${formatICalDateTime(eventData.due, eventData.dueTzid)}`);
			} else {
				lines.push(`DUE:${formatICalDateTime(eventData.due)}`);
			}
		}

		if (eventData.priority !== undefined && eventData.priority > 0) {
			lines.push(`PRIORITY:${eventData.priority}`);
		}

		if (eventData.percentComplete !== undefined && eventData.percentComplete > 0) {
			lines.push(`PERCENT-COMPLETE:${eventData.percentComplete}`);
		}

		// Subtask relationship
		if (eventData.parentUid) {
			lines.push(`RELATED-TO;RELTYPE=PARENT:${eventData.parentUid}`);
		}
	}

	lines.push(`SUMMARY:${escapeICalText(eventData.summary)}`);

	if (eventData.description) {
		lines.push(`DESCRIPTION:${escapeICalText(eventData.description)}`);
	}
	if (eventData.location) {
		lines.push(`LOCATION:${escapeICalText(eventData.location)}`);
	}
	if (eventData.status) {
		lines.push(`STATUS:${eventData.status}`);
	}

	// Recurrence rule
	if (eventData.recurrenceRule) {
		const rruleParts: string[] = [];
		const rule = eventData.recurrenceRule;

		if (rule.freq) rruleParts.push(`FREQ=${rule.freq}`);
		if (rule.interval && rule.interval > 1) rruleParts.push(`INTERVAL=${rule.interval}`);
		if (rule.count) rruleParts.push(`COUNT=${rule.count}`);
		if (rule.until) rruleParts.push(`UNTIL=${formatICalDateTime(rule.until)}`);
		if (rule.byday && rule.byday.length > 0) rruleParts.push(`BYDAY=${rule.byday.join(',')}`);

		if (rruleParts.length > 0) {
			lines.push(`RRULE:${rruleParts.join(';')}`);
		}
	}

	// Alarms
	if (eventData.alarms) {
		for (const alarm of eventData.alarms) {
			lines.push('BEGIN:VALARM');
			lines.push(`ACTION:${alarm.action}`);
			lines.push(`TRIGGER:${alarm.trigger}`);

			if (alarm.description) {
				lines.push(`DESCRIPTION:${escapeICalText(alarm.description)}`);
			}
			if (alarm.summary) {
				lines.push(`SUMMARY:${escapeICalText(alarm.summary)}`);
			}
			if (alarm.attendees) {
				for (const attendee of alarm.attendees) {
					// Sanitize attendee email - remove any special characters that could break iCalendar
					const sanitizedAttendee = attendee.replace(/[<>]/g, '').trim();
					if (sanitizedAttendee) {
						// Ensure mailto: prefix for email attendees
						if (sanitizedAttendee.includes('@') && !sanitizedAttendee.toLowerCase().startsWith('mailto:')) {
							lines.push(`ATTENDEE:mailto:${sanitizedAttendee}`);
						} else {
							lines.push(`ATTENDEE:${sanitizedAttendee}`);
						}
					}
				}
			}

			lines.push('END:VALARM');
		}
	}

	lines.push(`END:${componentType}`);
	lines.push('END:VCALENDAR');

	return lines.join('\r\n');
}
