import type { INodeExecutionData, IDataObject } from 'n8n-workflow';
import type { DAVClient } from 'tsdav';

/**
 * Get all calendars from the CalDAV server
 */
export async function calendarGetAll(client: DAVClient): Promise<INodeExecutionData[]> {
	const calendars = await client.fetchCalendars();

	return calendars.map((calendar) => {
		// Parse timezone ID from VTIMEZONE component if present
		let timezoneId: string | undefined;
		if (calendar.timezone) {
			const tzidMatch = calendar.timezone.match(/TZID:([^\r\n]+)/);
			if (tzidMatch) {
				timezoneId = tzidMatch[1];
			}
		}

		return {
			json: {
				url: calendar.url,
				displayName: calendar.displayName,
				description: calendar.description,
				calendarColor: calendar.calendarColor,
				timezone: timezoneId,
			} as IDataObject,
		};
	});
}
