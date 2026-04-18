import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVCalendar, DAVCalendarObject } from 'tsdav';
import { parseICalendarEvent, type ParsedEvent } from '../../helpers/iCalendarParser';
import {
	eventToJson,
	formatInTimezone,
	fuzzyMatch,
	buildTaskHierarchy,
	searchTasksRecursive,
} from '../../helpers';

/**
 * Builds CalDAV filter for fetching specific component types (VEVENT or VTODO)
 * This overrides tsdav's default VEVENT-only filter
 */
function buildComponentFilter(
	componentName: 'VEVENT' | 'VTODO',
	timeRange?: { start: string; end: string }
): object[] {
	const formatDate = (date: string) =>
		new Date(date).toISOString().slice(0, 19).replace(/[-:.]/g, '') + 'Z';

	return [{
		'comp-filter': {
			_attributes: { name: 'VCALENDAR' },
			'comp-filter': {
				_attributes: { name: componentName },
				...(timeRange ? {
					'time-range': {
						_attributes: {
							start: formatDate(timeRange.start),
							end: formatDate(timeRange.end),
						},
					},
				} : {}),
			},
		},
	}];
}

/**
 * Tests if a value matches using regex, fuzzy matching, or substring search
 */
function testMatch(
	value: string | undefined,
	filterLower: string,
	searchPattern: RegExp | null,
	fuzzyTolerance: number,
): boolean {
	if (!value) return false;
	if (searchPattern) {
		return searchPattern.test(value);
	}
	if (fuzzyTolerance > 0) {
		return fuzzyMatch(value, filterLower, fuzzyTolerance);
	}
	return value.toLowerCase().includes(filterLower);
}

/**
 * Checks if an event matches the filter query in the specified fields
 * @param event - The parsed event to check
 * @param filterLower - Pre-lowercased and trimmed filter query for performance
 * @param searchFields - Array of field names to search in
 * @param searchPattern - Optional regex pattern for advanced matching
 * @param fuzzyTolerance - Levenshtein distance tolerance for fuzzy matching
 */
function matchesSearch(
	event: ParsedEvent,
	filterLower: string,
	searchFields: string[],
	searchPattern: RegExp | null,
	fuzzyTolerance: number,
): boolean {
	if (!filterLower && !searchPattern) return true;
	if (searchFields.length === 0) return true;

	// Check summary
	if (searchFields.includes('summary')) {
		if (testMatch(event.summary, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	// Check description
	if (searchFields.includes('description')) {
		if (testMatch(event.description, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	// Check location
	if (searchFields.includes('location')) {
		if (testMatch(event.location, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	return false;
}

/**
 * Checks if an event matches the status filter
 * @param event - The parsed event to check
 * @param statusFilter - Array of allowed statuses (empty = all)
 */
function matchesStatus(event: ParsedEvent, statusFilter: string[]): boolean {
	if (statusFilter.length === 0) return true;
	if (!event.status) return true; // Events without status pass the filter
	return statusFilter.includes(event.status);
}

/**
 * Creates output with only the selected fields
 */
function toSelectedFieldsJson(event: ParsedEvent, outputFields: string[]): IDataObject {
	// If 'all' is selected, return everything
	if (outputFields.includes('all')) {
		return eventToJson(event);
	}

	const result: IDataObject = {};

	if (outputFields.includes('uid')) result.uid = event.uid;
	if (outputFields.includes('summary')) result.summary = event.summary;
	if (outputFields.includes('description')) result.description = event.description;
	if (outputFields.includes('start')) {
		result.start = event.start?.toISOString();
		result.startLocal = formatInTimezone(event.start, event.startTzid);
		result.startTzid = event.startTzid;
	}
	if (outputFields.includes('end')) {
		result.end = event.end?.toISOString();
		result.endLocal = formatInTimezone(event.end, event.endTzid);
		result.endTzid = event.endTzid;
	}
	if (outputFields.includes('location')) result.location = event.location;
	if (outputFields.includes('status')) result.status = event.status;
	if (outputFields.includes('componentType')) result.componentType = event.componentType || 'VEVENT';
	if (outputFields.includes('recurrence')) result.recurrenceRule = event.recurrenceRule as unknown as IDataObject;
	if (outputFields.includes('alarms')) result.alarms = event.alarms as unknown as IDataObject[];
	if (outputFields.includes('etag')) result.etag = event.etag;
	if (outputFields.includes('href')) result.href = event.href;
	if (outputFields.includes('parentUid')) result.parentUid = event.parentUid;

	// Handle subtasks recursively
	if (event.subtasks && event.subtasks.length > 0) {
		result.subtasks = event.subtasks.map((sub) => toSelectedFieldsJson(sub, outputFields));
	}

	return result;
}

/**
 * Get all events from a calendar with optional filtering
 */
export async function eventGetAll(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const calendarLocator = context.getNodeParameter('calendarUrl', i) as { value: string };
		const calendarUrl = calendarLocator.value;
		const returnAll = context.getNodeParameter('returnAll', i) as boolean;
		const limit = returnAll ? 0 : (context.getNodeParameter('limit', i) as number);
		const componentType = context.getNodeParameter('componentType', i, 'VEVENT') as 'VEVENT' | 'VTODO' | 'BOTH';
		const fetchAllEvents = context.getNodeParameter('fetchAllEvents', i) as boolean;
		const outputFields = context.getNodeParameter('outputFields', i, ['uid', 'summary', 'description']) as string[];
		const filterQuery = context.getNodeParameter('filterQuery', i, '') as string;
		const filterLower = filterQuery.trim().toLowerCase(); // Cache for performance
		const searchFields = context.getNodeParameter('searchFields', i, ['summary', 'description']) as string[];
		const statusFilter = context.getNodeParameter('statusFilter', i, []) as string[];
		const useRegex = context.getNodeParameter('useRegex', i, false) as boolean;
		const fuzzyTolerance = useRegex
			? 0
			: (context.getNodeParameter('fuzzyTolerance', i, 0) as number);

		// Create regex pattern if enabled (with error handling)
		let searchPattern: RegExp | null = null;
		if (filterQuery && useRegex) {
			try {
				searchPattern = new RegExp(filterQuery, 'i'); // case-insensitive
			} catch {
				throw new NodeOperationError(context.getNode(), `Invalid regex pattern: ${filterQuery}`, {
					itemIndex: i,
				});
			}
		}

		// Get calendars to find the matching one
		const calendars = await client.fetchCalendars();
		const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

		if (!calendar) {
			throw new Error(`Calendar not found: ${calendarUrl}`);
		}

		// Build time range if applicable
		let timeRange: { start: string; end: string } | undefined;
		if (!fetchAllEvents) {
			const startDate = context.getNodeParameter('startDate', i, '') as string;
			const endDate = context.getNodeParameter('endDate', i, '') as string;
			if (startDate || endDate) {
				timeRange = {
					start: startDate || new Date().toISOString(),
					end: endDate || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
				};
			}
		}

		// Fetch calendar objects based on component type
		let calendarObjects: DAVCalendarObject[] = [];

		if (componentType === 'BOTH') {
			// Fetch both VEVENT and VTODO separately and merge
			const [events, todos] = await Promise.all([
				client.fetchCalendarObjects({
					calendar,
					filters: buildComponentFilter('VEVENT', timeRange),
					...(timeRange && { expand: true }),
				}),
				client.fetchCalendarObjects({
					calendar,
					filters: buildComponentFilter('VTODO', timeRange),
				}),
			]);
			calendarObjects = [...events, ...todos];
		} else {
			// Fetch specific component type (VEVENT or VTODO)
			calendarObjects = await client.fetchCalendarObjects({
				calendar,
				filters: buildComponentFilter(componentType, timeRange),
				...(componentType === 'VEVENT' && timeRange && { expand: true }),
			});
		}

		// Get hierarchy setting for VTODOs
		const includeSubtaskHierarchy = context.getNodeParameter(
			'includeSubtaskHierarchy',
			i,
			true,
		) as boolean;

		// Parse all events first
		const allParsedEvents: ParsedEvent[] = [];
		for (const obj of calendarObjects) {
			if (obj.data) {
				const parsedEvent = parseICalendarEvent(obj.data, obj.etag, obj.url);
				if (parsedEvent) {
					allParsedEvents.push(parsedEvent);
				}
			}
		}

		// Separate VEVENTs and VTODOs
		const vevents = allParsedEvents.filter((e) => e.componentType === 'VEVENT');
		const vtodos = allParsedEvents.filter((e) => e.componentType === 'VTODO');

		// Create match function for filtering
		const matchFn = (event: ParsedEvent) =>
			matchesSearch(event, filterLower, searchFields, searchPattern, fuzzyTolerance) &&
			matchesStatus(event, statusFilter);

		// Process VEVENTs (flat list, no hierarchy)
		const filteredEvents = vevents.filter(matchFn);

		// Process VTODOs with optional hierarchy
		let processedTasks: ParsedEvent[];
		if (includeSubtaskHierarchy && vtodos.length > 0) {
			// Build hierarchy first
			const { rootTasks, orphanedSubtasks } = buildTaskHierarchy(vtodos);

			// Apply search filter recursively (searches subtasks too)
			if (filterLower || searchPattern || statusFilter.length > 0) {
				processedTasks = searchTasksRecursive(rootTasks, matchFn);
			} else {
				processedTasks = rootTasks;
			}

			// Add orphaned subtasks (whose parents weren't found)
			const filteredOrphans = orphanedSubtasks.filter(matchFn);
			processedTasks = [...processedTasks, ...filteredOrphans];
		} else {
			// Flat mode - original behavior (includes subtasks as top-level items)
			processedTasks = vtodos.filter(matchFn);
		}

		// Combine and output results
		const combinedResults = [...filteredEvents, ...processedTasks];
		let count = 0;

		for (const item of combinedResults) {
			if (!returnAll && limit > 0 && count >= limit) {
				break;
			}

			const json = toSelectedFieldsJson(item, outputFields);
			returnData.push({
				json,
				pairedItem: { item: i },
			});
			count++;
		}
	}

	return returnData;
}
