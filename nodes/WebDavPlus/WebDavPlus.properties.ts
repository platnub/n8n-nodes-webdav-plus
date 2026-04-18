import type { INodeProperties } from 'n8n-workflow';

export const properties: INodeProperties[] = [
	// Resource selector - ordered: Address Book, Contact, Calendar, Event
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Address Book',
				value: 'addressBook',
			},
			{
				name: 'Contact',
				value: 'contact',
			},
			{
				name: 'Calendar',
				value: 'calendar',
			},
			{
				name: 'Event',
				value: 'event',
			},
		],
		default: 'event',
	},

	// Address Book Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['addressBook'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all address books from the server',
				action: 'Get all address books',
			},
		],
		default: 'getAll',
	},

	// Calendar Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['calendar'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all calendars from the server',
				action: 'Get all calendars',
			},
		],
		default: 'getAll',
	},

	// Contact Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new contact in an address book',
				action: 'Create a contact',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a contact by UID',
				action: 'Delete a contact',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a specific contact by UID',
				action: 'Get a contact',
			},
			{
				name: 'Query',
				value: 'getAll',
				description: 'Search and filter contacts from an address book',
				action: 'Query contacts',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing contact',
				action: 'Update a contact',
			},
		],
		default: 'getAll',
	},

	// Event Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['event'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new calendar event or task',
				action: 'Create an event',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a calendar event or task by UID',
				action: 'Delete an event',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a specific event or task by UID',
				action: 'Get an event',
			},
			{
				name: 'Query',
				value: 'getAll',
				description: 'Search and filter events from a calendar',
				action: 'Query events',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing event or task',
				action: 'Update an event',
			},
		],
		default: 'getAll',
	},

	// Calendar URL field - used by all event operations
	{
		displayName: 'Calendar',
		name: 'calendarUrl',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The calendar to work with',
		displayOptions: {
			show: {
				resource: ['event'],
			},
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a calendar...',
				typeOptions: {
					searchListMethod: 'getCalendars',
					searchable: true,
				},
			},
			{
				displayName: 'By URL',
				name: 'url',
				type: 'string',
				placeholder: '/calendars/user/calendar-id/',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^/.*',
							errorMessage: 'Calendar URL should start with /',
						},
					},
				],
			},
		],
	},

	// Address Book URL field - used by all contact operations
	{
		displayName: 'Address Book',
		name: 'addressBookUrl',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The address book to work with',
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select an address book...',
				typeOptions: {
					searchListMethod: 'getAddressBooks',
					searchable: true,
				},
			},
			{
				displayName: 'By URL',
				name: 'url',
				type: 'string',
				placeholder: '/addressbooks/user/contacts/',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^/.*',
							errorMessage: 'Address book URL should start with /',
						},
					},
				],
			},
		],
	},

	{
		displayName: 'Request Timeout (seconds)',
		name: 'requestTimeout',
		type: 'number',
		default: 60,
		required: true,
		description: 'The timeout for the request in seconds',
	},

	// Contact UID - for Get, Delete
	{
		displayName: 'Contact UID',
		name: 'contactUid',
		type: 'string',
		default: '',
		required: true,
		description: 'The unique identifier of the contact',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['get', 'delete'],
			},
		},
	},

	// Contact ETag - for Delete (optional)
	{
		displayName: 'Contact ETag',
		name: 'contactEtag',
		type: 'string',
		default: '',
		required: false,
		description: 'The ETag of the contact for safe deletion (returned from Get operations)',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['delete'],
			},
		},
	},

	// Contact fields for Update
	{
		displayName: 'Contact UID',
		name: 'contactUid',
		type: 'string',
		default: '',
		required: true,
		description: 'The unique identifier of the contact to update',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Contact Href',
		name: 'contactHref',
		type: 'string',
		default: '',
		required: true,
		placeholder: '/addressbooks/user/contacts/contact.vcf',
		description: 'The href path of the contact (returned from Get operations)',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Contact ETag',
		name: 'contactEtag',
		type: 'string',
		default: '',
		required: true,
		description: 'The ETag of the contact for safe update (returned from Get operations)',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['update'],
			},
		},
	},

	// Get All Contacts - Options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Include Photos',
		name: 'includePhotos',
		type: 'boolean',
		default: false,
		description: 'Whether to include contact photos in the output. Photos can be large and slow down the request.',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll', 'get'],
			},
		},
	},
	{
		displayName: 'Output Fields',
		name: 'outputFields',
		type: 'multiOptions',
		options: [
			{
				name: 'UID',
				value: 'uid',
				description: 'Unique identifier',
			},
			{
				name: 'Full Name',
				value: 'fullName',
				description: 'Full name of the contact',
			},
			{
				name: 'First Name',
				value: 'firstName',
				description: 'First name',
			},
			{
				name: 'Last Name',
				value: 'lastName',
				description: 'Last name',
			},
			{
				name: 'Email',
				value: 'email',
				description: 'Email addresses',
			},
			{
				name: 'Phone',
				value: 'phone',
				description: 'Phone numbers',
			},
			{
				name: 'Address',
				value: 'address',
				description: 'Postal addresses',
			},
			{
				name: 'Organization',
				value: 'organization',
				description: 'Organization/company',
			},
			{
				name: 'Title',
				value: 'title',
				description: 'Job title',
			},
			{
				name: 'Birthday',
				value: 'birthday',
				description: 'Birthday',
			},
			{
				name: 'Anniversary',
				value: 'anniversary',
				description: 'Anniversary date',
			},
			{
				name: 'Notes',
				value: 'notes',
				description: 'Notes/comments',
			},
			{
				name: 'ETag',
				value: 'etag',
				description: 'Version identifier for updates',
			},
			{
				name: 'Href',
				value: 'href',
				description: 'Resource path for updates',
			},
			{
				name: 'All Fields',
				value: 'all',
				description: 'Include all available fields',
			},
		],
		default: ['uid', 'fullName'],
		description: 'Which fields to include in the output',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Filter Query',
		name: 'filterQuery',
		type: 'string',
		default: '',
		placeholder: 'e.g. John or john@example.com',
		description: 'Filter by text match (case-insensitive). Supports regex and fuzzy matching.',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Use Regex',
		name: 'useRegex',
		type: 'boolean',
		default: false,
		description: 'Treat filter query as a regular expression pattern for advanced matching',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Fuzzy Tolerance',
		name: 'fuzzyTolerance',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: 0,
			maxValue: 5,
		},
		description:
			'Allow this many character differences (Levenshtein distance). 0 = exact match, 1 = one typo allowed, etc.',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
				useRegex: [false],
			},
		},
	},
	{
		displayName: 'Search In',
		name: 'searchFields',
		type: 'multiOptions',
		options: [
			{
				name: 'Name',
				value: 'name',
				description: 'Search in full name, first name, last name',
			},
			{
				name: 'Email',
				value: 'email',
				description: 'Search in all email addresses',
			},
			{
				name: 'Phone',
				value: 'phone',
				description: 'Search in all phone numbers',
			},
			{
				name: 'Organization',
				value: 'organization',
				description: 'Search in organization/company name',
			},
			{
				name: 'Notes',
				value: 'notes',
				description: 'Search in contact notes',
			},
			{
				name: 'Birthday',
				value: 'birthday',
				description: 'Search in birthday date (e.g., "1990" or "03-15")',
			},
			{
				name: 'Anniversary',
				value: 'anniversary',
				description: 'Search in anniversary date',
			},
		],
		default: ['name', 'email'],
		description: 'Which fields to search in when using filter query',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
	},

	// Create/Update Contact Fields
	{
		displayName: 'Full Name',
		name: 'fullName',
		type: 'string',
		default: '',
		required: true,
		description: 'The full name of the contact',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		description: 'The primary email address of the contact',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
	},

	// Additional Fields for Create/Update Contact
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				description: 'The first name of the contact',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				description: 'The last name of the contact',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'The phone number of the contact',
			},
			{
				displayName: 'Organization',
				name: 'organization',
				type: 'string',
				default: '',
				description: 'The organization/company of the contact',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The job title of the contact',
			},
			{
				displayName: 'Birthday',
				name: 'birthday',
				type: 'dateTime',
				default: '',
				description: 'The birthday of the contact',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Additional notes about the contact',
			},
			{
				displayName: 'Street Address',
				name: 'street',
				type: 'string',
				default: '',
				description: 'The street address of the contact',
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				description: 'The city of the contact',
			},
			{
				displayName: 'State/Region',
				name: 'region',
				type: 'string',
				default: '',
				description: 'The state or region of the contact',
			},
			{
				displayName: 'Postal Code',
				name: 'postalCode',
				type: 'string',
				default: '',
				description: 'The postal/zip code of the contact',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'The country of the contact',
			},
		],
	},

	// Event UID - for Get, Delete
	{
		displayName: 'Event UID',
		name: 'eventUid',
		type: 'string',
		default: '',
		required: true,
		description: 'The unique identifier of the event',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['get', 'delete'],
			},
		},
	},
	{
		displayName: 'Include Subtasks',
		name: 'includeSubtasks',
		type: 'boolean',
		default: true,
		description: 'For VTODOs: Automatically fetch and nest all subtasks recursively',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['get'],
			},
		},
	},

	// Event ETag - for Delete (optional, will auto-fetch if not provided)
	{
		displayName: 'Event ETag',
		name: 'eventEtag',
		type: 'string',
		default: '',
		required: false,
		description:
			'The ETag of the event for safe deletion (returned from Get operations). If not provided, will attempt to fetch it automatically.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['delete'],
			},
		},
	},

	// Event href - for Update
	{
		displayName: 'Event UID',
		name: 'eventUid',
		type: 'string',
		default: '',
		required: true,
		description: 'The unique identifier of the event to update',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Event Href',
		name: 'eventHref',
		type: 'string',
		default: '',
		required: true,
		placeholder: '/calendars/user/calendar-id/event.ics',
		description: 'The href path of the event (returned from Get operations)',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Event ETag',
		name: 'eventEtag',
		type: 'string',
		default: '',
		required: true,
		description: 'The ETag of the event for safe update (returned from Get operations)',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['update'],
			},
		},
	},

	// Get All Events - Options
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Output Fields',
		name: 'outputFields',
		type: 'multiOptions',
		options: [
			{
				name: 'UID',
				value: 'uid',
				description: 'Unique identifier',
			},
			{
				name: 'Summary (Title)',
				value: 'summary',
				description: 'Event/task title',
			},
			{
				name: 'Description',
				value: 'description',
				description: 'Full description',
			},
			{
				name: 'Start Date',
				value: 'start',
				description: 'Start date and time',
			},
			{
				name: 'End Date',
				value: 'end',
				description: 'End date and time',
			},
			{
				name: 'Location',
				value: 'location',
				description: 'Event location',
			},
			{
				name: 'Status',
				value: 'status',
				description: 'Event/task status',
			},
			{
				name: 'Component Type',
				value: 'componentType',
				description: 'VEVENT or VTODO',
			},
			{
				name: 'Recurrence',
				value: 'recurrence',
				description: 'Recurrence rule',
			},
			{
				name: 'Alarms',
				value: 'alarms',
				description: 'Alarm/reminder settings',
			},
			{
				name: 'ETag',
				value: 'etag',
				description: 'Version identifier for updates',
			},
			{
				name: 'Href',
				value: 'href',
				description: 'Resource path for updates',
			},
			{
				name: 'Parent Task UID',
				value: 'parentUid',
				description: 'UID of parent task (for subtasks)',
			},
			{
				name: 'All Fields',
				value: 'all',
				description: 'Include all available fields',
			},
		],
		default: ['uid', 'summary', 'description'],
		description: 'Which fields to include in the output',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Filter Query',
		name: 'filterQuery',
		type: 'string',
		default: '',
		placeholder: 'e.g. Meeting or project review',
		description: 'Filter by text match (case-insensitive). Supports regex and fuzzy matching.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Use Regex',
		name: 'useRegex',
		type: 'boolean',
		default: false,
		description: 'Treat filter query as a regular expression pattern for advanced matching',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Fuzzy Tolerance',
		name: 'fuzzyTolerance',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: 0,
			maxValue: 5,
		},
		description:
			'Allow this many character differences (Levenshtein distance). 0 = exact match, 1 = one typo allowed, etc.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
				useRegex: [false],
			},
		},
	},
	{
		displayName: 'Search In',
		name: 'searchFields',
		type: 'multiOptions',
		options: [
			{
				name: 'Title (Summary)',
				value: 'summary',
				description: 'Search in event/task title',
			},
			{
				name: 'Description',
				value: 'description',
				description: 'Search in event/task description',
			},
			{
				name: 'Location',
				value: 'location',
				description: 'Search in event location',
			},
		],
		default: ['summary', 'description'],
		description: 'Which fields to search in when using search query',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Filter by Status',
		name: 'statusFilter',
		type: 'multiOptions',
		options: [
			{
				name: 'Confirmed',
				value: 'CONFIRMED',
				description: 'Show confirmed events',
			},
			{
				name: 'Tentative',
				value: 'TENTATIVE',
				description: 'Show tentative events',
			},
			{
				name: 'Cancelled',
				value: 'CANCELLED',
				description: 'Show cancelled events',
			},
			{
				name: 'Needs Action',
				value: 'NEEDS-ACTION',
				description: 'Show tasks that need action',
			},
			{
				name: 'In Progress',
				value: 'IN-PROCESS',
				description: 'Show tasks in progress',
			},
			{
				name: 'Completed',
				value: 'COMPLETED',
				description: 'Show completed tasks',
			},
		],
		default: [],
		description: 'Only show events/tasks with these statuses (empty = show all)',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Component Type',
		name: 'componentType',
		type: 'options',
		options: [
			{
				name: 'Events (VEVENT)',
				value: 'VEVENT',
				description: 'Calendar events (meetings, appointments)',
			},
			{
				name: 'Tasks (VTODO)',
				value: 'VTODO',
				description: 'Tasks and to-dos (e.g., Nextcloud Tasks)',
			},
			{
				name: 'Both',
				value: 'BOTH',
				description: 'Fetch both events and tasks',
			},
		],
		default: 'VEVENT',
		description: 'The type of calendar component to fetch',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Include Subtask Hierarchy',
		name: 'includeSubtaskHierarchy',
		type: 'boolean',
		default: true,
		description:
			'For VTODOs: Nest subtasks under their parent tasks. If false, returns flat list with all tasks as top-level items.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
				componentType: ['VTODO', 'BOTH'],
			},
		},
	},
	{
		displayName: 'Fetch All Events',
		name: 'fetchAllEvents',
		type: 'boolean',
		default: false,
		description:
			'Whether to fetch all events regardless of date range. If false, fetches events from now to 3 weeks ahead by default.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		description: 'Start of the date range for fetching events',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
				fetchAllEvents: [false],
			},
		},
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		description: 'End of the date range for fetching events',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
				fetchAllEvents: [false],
			},
		},
	},

	// Create/Update Event Fields
	{
		displayName: 'Component Type',
		name: 'createComponentType',
		type: 'options',
		options: [
			{
				name: 'Event (VEVENT)',
				value: 'VEVENT',
				description: 'Calendar event (meeting, appointment)',
			},
			{
				name: 'Task (VTODO)',
				value: 'VTODO',
				description: 'Task or to-do item',
			},
		],
		default: 'VEVENT',
		description: 'The type of calendar component to create',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Summary',
		name: 'summary',
		type: 'string',
		default: '',
		required: true,
		description: 'The title of the event or task',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Start',
		name: 'start',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'The start date and time of the event',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
				createComponentType: ['VEVENT'],
			},
		},
	},
	{
		displayName: 'End',
		name: 'end',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'The end date and time of the event',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
				createComponentType: ['VEVENT'],
			},
		},
	},
	{
		displayName: 'Due Date',
		name: 'due',
		type: 'dateTime',
		default: '',
		description: 'The due date for the task (optional)',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
				createComponentType: ['VTODO'],
			},
		},
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		options: [
			{ name: 'None', value: 0 },
			{ name: 'High (1)', value: 1 },
			{ name: 'Medium (5)', value: 5 },
			{ name: 'Low (9)', value: 9 },
		],
		default: 0,
		description: 'Priority level for the task (1=highest, 9=lowest)',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
				createComponentType: ['VTODO'],
			},
		},
	},
	{
		displayName: 'Percent Complete',
		name: 'percentComplete',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 100,
		},
		default: 0,
		description: 'Percentage of task completion (0-100)',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
				createComponentType: ['VTODO'],
			},
		},
	},
	{
		displayName: 'Parent Task UID',
		name: 'parentTaskUid',
		type: 'string',
		default: '',
		placeholder: 'e.g., abc123-def456-ghi789',
		description: 'UID of the parent task to make this a subtask. Leave empty for root-level task.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
				createComponentType: ['VTODO'],
			},
		},
	},

	// Additional Fields for Create/Update
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'A detailed description of the event',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'The location of the event',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{
						name: 'Tentative',
						value: 'TENTATIVE',
					},
					{
						name: 'Confirmed',
						value: 'CONFIRMED',
					},
					{
						name: 'Cancelled',
						value: 'CANCELLED',
					},
				],
				default: 'CONFIRMED',
				description: 'The status of the event',
			},
			{
				displayName: 'Whole Day',
				name: 'wholeDay',
				type: 'boolean',
				default: false,
				description: 'Whether this is an all-day event',
			},
			{
				displayName: 'Start Timezone',
				name: 'startTzid',
				type: 'string',
				default: '',
				placeholder: 'Europe/Berlin',
				description: 'Timezone for the start time (e.g., Europe/Berlin, America/New_York)',
			},
			{
				displayName: 'End Timezone',
				name: 'endTzid',
				type: 'string',
				default: '',
				placeholder: 'Europe/Berlin',
				description: 'Timezone for the end time (e.g., Europe/Berlin, America/New_York)',
			},
			{
				displayName: 'Due Timezone',
				name: 'dueTzid',
				type: 'string',
				default: '',
				placeholder: 'Europe/Berlin',
				description: 'Timezone for the due date (for tasks, e.g., Europe/Berlin, America/New_York)',
			},
		],
	},

	// Recurrence Rule
	{
		displayName: 'Recurrence',
		name: 'recurrence',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Recurrence Rule',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Rule',
				name: 'rule',
				values: [
					{
						displayName: 'Frequency',
						name: 'freq',
						type: 'options',
						options: [
							{ name: 'Daily', value: 'DAILY' },
							{ name: 'Weekly', value: 'WEEKLY' },
							{ name: 'Monthly', value: 'MONTHLY' },
							{ name: 'Yearly', value: 'YEARLY' },
						],
						default: 'WEEKLY',
						description: 'How often the event repeats',
					},
					{
						displayName: 'Interval',
						name: 'interval',
						type: 'number',
						default: 1,
						typeOptions: {
							minValue: 1,
						},
						description: 'The interval between occurrences (e.g., every 2 weeks)',
					},
					{
						displayName: 'Count',
						name: 'count',
						type: 'number',
						default: 0,
						description: 'Number of occurrences (0 for unlimited)',
					},
					{
						displayName: 'Until',
						name: 'until',
						type: 'dateTime',
						default: '',
						description: 'Repeat until this date',
					},
					{
						displayName: 'By Day',
						name: 'byday',
						type: 'multiOptions',
						options: [
							{ name: 'Monday', value: 'MO' },
							{ name: 'Tuesday', value: 'TU' },
							{ name: 'Wednesday', value: 'WE' },
							{ name: 'Thursday', value: 'TH' },
							{ name: 'Friday', value: 'FR' },
							{ name: 'Saturday', value: 'SA' },
							{ name: 'Sunday', value: 'SU' },
						],
						default: [],
						description: 'Days of the week for the recurrence',
					},
				],
			},
		],
	},

	// Alarms
	{
		displayName: 'Alarms',
		name: 'alarms',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Alarm',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Alarm',
				name: 'alarm',
				values: [
					{
						displayName: 'Action',
						name: 'action',
						type: 'options',
						options: [
							{ name: 'Display (Popup)', value: 'DISPLAY' },
							{ name: 'Audio', value: 'AUDIO' },
							{ name: 'Email', value: 'EMAIL' },
						],
						default: 'DISPLAY',
						description: 'The type of alarm',
					},
					{
						displayName: 'Trigger',
						name: 'trigger',
						type: 'string',
						default: '-PT15M',
						placeholder: '-PT15M',
						description:
							'When to trigger the alarm (e.g., -PT15M for 15 minutes before, -PT1H for 1 hour before)',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description for the alarm (for DISPLAY and EMAIL)',
						displayOptions: {
							show: {
								action: ['DISPLAY', 'EMAIL'],
							},
						},
					},
					{
						displayName: 'Summary',
						name: 'summary',
						type: 'string',
						default: '',
						description: 'Summary for email alarm',
						displayOptions: {
							show: {
								action: ['EMAIL'],
							},
						},
					},
					{
						displayName: 'Attendees',
						name: 'attendees',
						type: 'string',
						default: '',
						placeholder: 'mailto:user@example.com',
						description: 'Comma-separated list of email addresses for the alarm',
						displayOptions: {
							show: {
								action: ['EMAIL'],
							},
						},
					},
				],
			},
		],
	}
];
