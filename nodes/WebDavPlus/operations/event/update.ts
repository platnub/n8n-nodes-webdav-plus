import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVCalendarObject } from 'tsdav';
import { buildUpdateEventData, isValidUID } from '../../helpers';
import { buildICalendarString } from '../../helpers/iCalendarParser';

/**
 * Update an existing event in a calendar
 */
export async function eventUpdate(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		// Build event data with identifiers (uid, href, etag)
		const eventData = buildUpdateEventData(context, i);

		// Validate UID to prevent path traversal attacks
		if (!isValidUID(eventData.uid)) {
			throw new NodeOperationError(
				context.getNode(),
				'Invalid event UID format. UIDs must contain only alphanumeric characters, hyphens, dots, underscores, and @',
				{ itemIndex: i },
			);
		}

		// Build iCalendar string with existing UID
		const iCalString = buildICalendarString({
			uid: eventData.uid,
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

		// Create the calendar object for update
		const calendarObject: DAVCalendarObject = {
			url: eventData.href,
			etag: eventData.etag,
			data: iCalString,
		};

		const result = await client.updateCalendarObject({
			calendarObject,
		});

		returnData.push({
			json: {
				success: result.ok,
				uid: eventData.uid,
				componentType: eventData.componentType,
				url: result.url,
			},
			pairedItem: { item: i },
		});
	}

	return returnData;
}
