import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import type { RecurrenceRule, Alarm } from './iCalendarParser';

/**
 * Event data structure for create operations (supports both VEVENT and VTODO)
 */
export interface CreateEventData {
	componentType: 'VEVENT' | 'VTODO';
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
	parentUid?: string;
	// Shared fields
	description?: string;
	location?: string;
	status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED' | 'NEEDS-ACTION' | 'COMPLETED' | 'IN-PROCESS';
	recurrenceRule?: RecurrenceRule;
	alarms?: Alarm[];
}

/**
 * Event data structure for update operations (requires identifiers)
 */
export interface UpdateEventData extends CreateEventData {
	uid: string;
	href: string;
	etag: string;
}

/**
 * Builds base event data from node parameters (shared logic)
 */
function buildBaseEventData(
	context: IExecuteFunctions,
	itemIndex: number,
): CreateEventData {
	const componentType = context.getNodeParameter('createComponentType', itemIndex, 'VEVENT') as 'VEVENT' | 'VTODO';
	const summary = context.getNodeParameter('summary', itemIndex) as string;
	const additionalFields = context.getNodeParameter('additionalFields', itemIndex) as IDataObject;
	const recurrence = context.getNodeParameter('recurrence', itemIndex) as IDataObject;
	const alarmsData = context.getNodeParameter('alarms', itemIndex) as IDataObject;

	const eventData: CreateEventData = {
		componentType,
		summary,
	};

	if (componentType === 'VEVENT') {
		// VEVENT: Start and End dates are required
		const startStr = context.getNodeParameter('start', itemIndex, '') as string;
		const endStr = context.getNodeParameter('end', itemIndex, '') as string;
		if (startStr) eventData.start = new Date(startStr);
		if (endStr) eventData.end = new Date(endStr);

		if (additionalFields.wholeDay !== undefined) {
			eventData.wholeDay = additionalFields.wholeDay as boolean;
		}
		if (additionalFields.startTzid) {
			eventData.startTzid = additionalFields.startTzid as string;
		}
		if (additionalFields.endTzid) {
			eventData.endTzid = additionalFields.endTzid as string;
		}
	} else {
		// VTODO: Due date, priority, percent complete
		const dueStr = context.getNodeParameter('due', itemIndex, '') as string;
		if (dueStr) eventData.due = new Date(dueStr);

		if (additionalFields.dueTzid) {
			eventData.dueTzid = additionalFields.dueTzid as string;
		}

		const priority = context.getNodeParameter('priority', itemIndex, 0) as number;
		if (priority > 0) eventData.priority = priority;

		const percentComplete = context.getNodeParameter('percentComplete', itemIndex, 0) as number;
		if (percentComplete > 0) eventData.percentComplete = percentComplete;

		// Parent task UID for subtask relationships
		const parentTaskUid = context.getNodeParameter('parentTaskUid', itemIndex, '') as string;
		if (parentTaskUid) eventData.parentUid = parentTaskUid;
	}

	// Add additional fields (shared)
	if (additionalFields.description) {
		eventData.description = additionalFields.description as string;
	}
	if (additionalFields.location) {
		eventData.location = additionalFields.location as string;
	}
	if (additionalFields.status) {
		eventData.status = additionalFields.status as CreateEventData['status'];
	}

	// Add recurrence rule
	if (recurrence.rule) {
		const rule = recurrence.rule as IDataObject;
		const recurrenceRule: RecurrenceRule = {};

		if (rule.freq) recurrenceRule.freq = rule.freq as RecurrenceRule['freq'];
		if (rule.interval) recurrenceRule.interval = rule.interval as number;
		if (rule.count && (rule.count as number) > 0) {
			recurrenceRule.count = rule.count as number;
		}
		if (rule.until) recurrenceRule.until = new Date(rule.until as string);
		if (rule.byday && (rule.byday as string[]).length > 0) {
			recurrenceRule.byday = rule.byday as string[];
		}

		eventData.recurrenceRule = recurrenceRule;
	}

	// Add alarms
	if (alarmsData.alarm && Array.isArray(alarmsData.alarm)) {
		eventData.alarms = (alarmsData.alarm as IDataObject[]).map((alarm) => {
			const action = alarm.action as string;
			if (action === 'EMAIL') {
				return {
					action: 'EMAIL' as const,
					trigger: alarm.trigger as string,
					description: alarm.description as string,
					summary: alarm.summary as string,
					attendees: (alarm.attendees as string)?.split(',').map((a) => a.trim()) || [],
				};
			} else if (action === 'AUDIO') {
				return {
					action: 'AUDIO' as const,
					trigger: alarm.trigger as string,
				};
			} else {
				return {
					action: 'DISPLAY' as const,
					trigger: alarm.trigger as string,
					description: alarm.description as string,
				};
			}
		});
	}

	return eventData;
}

/**
 * Builds event data for create operation
 */
export function buildCreateEventData(
	context: IExecuteFunctions,
	itemIndex: number,
): CreateEventData {
	return buildBaseEventData(context, itemIndex);
}

/**
 * Builds event data for update operation (includes uid, href, etag)
 */
export function buildUpdateEventData(
	context: IExecuteFunctions,
	itemIndex: number,
): UpdateEventData {
	const baseData = buildBaseEventData(context, itemIndex);
	
	return {
		...baseData,
		uid: context.getNodeParameter('eventUid', itemIndex) as string,
		href: context.getNodeParameter('eventHref', itemIndex) as string,
		etag: context.getNodeParameter('eventEtag', itemIndex) as string,
	};
}
