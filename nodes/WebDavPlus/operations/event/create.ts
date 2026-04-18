import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { DAVClient, DAVCalendar } from 'tsdav';
import { buildCreateEventData, generateSecureUID } from '../../helpers';
import { buildICalendarString } from '../../helpers/iCalendarParser';

/**
 * Create a new event in a calendar
 */
export async function eventCreate(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const calendarLocator = context.getNodeParameter('calendarUrl', i) as { value: string };
		const calendarUrl = calendarLocator.value;

		const calendars = await client.fetchCalendars();
		const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

		if (!calendar) {
			throw new Error(`Calendar not found: ${calendarUrl}`);
		}

		const eventData = buildCreateEventData(context, i);

		// Generate cryptographically secure UID
		const uid = generateSecureUID('n8n-webdavplus-event');
		const iCalString = buildICalendarString({
			uid,
			componentType: eventData.componentType,
			summary: eventData.summary,
			// VEVENT fields
			start: eventData.start,
			end: eventData.end,
			wholeDay: eventData.wholeDay,
			startTzid: eventData.startTzid,
			endTzid: eventData.endTzid,
			// VTODO fields
			due: eventData.due,
			priority: eventData.priority,
			percentComplete: eventData.percentComplete,
			// Shared fields
			description: eventData.description,
			location: eventData.location,
			status: eventData.status,
			recurrenceRule: eventData.recurrenceRule,
			alarms: eventData.alarms,
		});

		const filename = `${uid}.ics`;

		// Create the calendar object
		const result = await client.createCalendarObject({
			calendar,
			iCalString,
			filename,
		});

		returnData.push({
			json: {
				success: result.ok,
				uid,
				componentType: eventData.componentType,
				url: result.url,
			},
			pairedItem: { item: i },
		});
	}

	return returnData;
}
