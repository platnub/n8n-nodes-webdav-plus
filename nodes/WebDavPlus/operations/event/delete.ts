import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVCalendarObject } from 'tsdav';
import { isValidUID } from '../../helpers';

/**
 * Delete an event from a calendar
 */
export async function eventDelete(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const calendarLocator = context.getNodeParameter('calendarUrl', i) as { value: string };
		const calendarUrl = calendarLocator.value;
		const eventUid = context.getNodeParameter('eventUid', i) as string;
		const eventEtag = context.getNodeParameter('eventEtag', i, '') as string;

		// Validate UID to prevent path traversal attacks
		if (!isValidUID(eventUid)) {
			throw new NodeOperationError(
				context.getNode(),
				'Invalid event UID format. UIDs must contain only alphanumeric characters, hyphens, dots, underscores, and @',
				{ itemIndex: i },
			);
		}

		// Build the calendar object for deletion
		const calendarObject: DAVCalendarObject = {
			url: `${calendarUrl.replace(/\/$/, '')}/${eventUid}.ics`,
			etag: eventEtag || undefined,
			data: '',
		};

		await client.deleteCalendarObject({
			calendarObject,
		});

		returnData.push({
			json: {
				success: true,
				uid: eventUid,
				deleted: true,
			},
			pairedItem: { item: i },
		});
	}

	return returnData;
}
