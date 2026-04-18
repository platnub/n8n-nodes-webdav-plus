import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVCalendar } from 'tsdav';
import { parseICalendarEvent, type ParsedEvent } from '../../helpers/iCalendarParser';
import { eventToJson, isValidUID, findSubtasksRecursive } from '../../helpers';

/**
 * Get a specific event by UID
 */
export async function eventGet(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const calendarLocator = context.getNodeParameter('calendarUrl', i) as { value: string };
		const calendarUrl = calendarLocator.value;
		const eventUid = context.getNodeParameter('eventUid', i) as string;

		// Validate UID to prevent path traversal attacks
		if (!isValidUID(eventUid)) {
			throw new NodeOperationError(
				context.getNode(),
				'Invalid event UID format. UIDs must contain only alphanumeric characters, hyphens, dots, underscores, and @',
				{ itemIndex: i },
			);
		}

		// Get calendars to find the matching one
		const calendars = await client.fetchCalendars();
		const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

		if (!calendar) {
			throw new NodeOperationError(
				context.getNode(),
				`Calendar not found: ${calendarUrl}`,
				{ itemIndex: i },
			);
		}

		// Fetch all calendar objects and find the one with matching UID
		const calendarObjects = await client.fetchCalendarObjects({ calendar });

		let foundEvent = null;
		for (const obj of calendarObjects) {
			if (obj.data) {
				// Parse without filter to get both VEVENT and VTODO
				const parsedEvent = parseICalendarEvent(obj.data, obj.etag, obj.url);
				if (parsedEvent && parsedEvent.uid === eventUid) {
					foundEvent = parsedEvent;
					break;
				}
			}
		}

		if (!foundEvent) {
			throw new NodeOperationError(
				context.getNode(),
				`Event with UID "${eventUid}" not found`,
				{ itemIndex: i },
			);
		}

		// For VTODOs, optionally fetch and nest subtasks
		const includeSubtasks = context.getNodeParameter('includeSubtasks', i, true) as boolean;

		if (foundEvent.componentType === 'VTODO' && includeSubtasks) {
			// Parse all VTODOs to find subtasks
			const allTodos: ParsedEvent[] = [];
			for (const obj of calendarObjects) {
				if (obj.data) {
					const parsed = parseICalendarEvent(obj.data, obj.etag, obj.url, 'VTODO');
					if (parsed) allTodos.push(parsed);
				}
			}

			// Recursively find and nest subtasks
			foundEvent.subtasks = findSubtasksRecursive(foundEvent.uid, allTodos);
		}

		returnData.push({
			json: eventToJson(foundEvent),
			pairedItem: { item: i },
		});
	}

	return returnData;
}
