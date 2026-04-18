// Client factories
export { createCalDavClient, createCardDavClient } from './client';

// Event helpers
export { eventToJson, formatInTimezone } from './eventToJson';
export { buildCreateEventData, buildUpdateEventData } from './eventBuilder';
export type { CreateEventData, UpdateEventData } from './eventBuilder';

// iCalendar parser and builder
export { parseICalendarEvent, buildICalendarString } from './iCalendarParser';
export type { ParsedEvent, EventData, RecurrenceRule, Alarm } from './iCalendarParser';

// vCard parser and builder
export { parseVCard, buildVCardString, contactToJson } from './vCardParser';
export type { ParsedContact, ContactData, VCardAddress } from './vCardParser';

// Contact builder
export { buildCreateContactData, buildUpdateContactData } from './contactBuilder';
export type { CreateContactData, UpdateContactData } from './contactBuilder';

// Security helpers
export {
	generateSecureUID,
	isValidUID,
	validateServerUrl,
	escapeICalText,
	escapeVCardText,
} from './security';

// Validation helpers
export {
	isValidEmail,
	validateEmail,
	validateDateRange,
	isValidTimezone,
	validateTimezone,
	validateFieldLength,
	validateStringField,
	isResourceLocator,
	extractResourceLocatorValue,
	FIELD_LIMITS,
} from './validation';

// Resource helpers
export {
	findCalendarByUrl,
	findAddressBookByUrl,
	getCalendarUrl,
	getAddressBookUrl,
} from './resourceHelpers';

// Fuzzy matching helpers
export { levenshteinDistance, fuzzyMatch } from './fuzzyMatch';

// Subtask hierarchy helpers
export {
	buildTaskHierarchy,
	findSubtasksRecursive,
	searchTasksRecursive,
	flattenHierarchy,
	getParentChain,
} from './subtaskHierarchy';
export type { HierarchyResult } from './subtaskHierarchy';
