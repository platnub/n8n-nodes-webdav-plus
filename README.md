# n8n-nodes-webdav-plus

A comprehensive n8n community node for **CalDAV** calendar and **CardDAV** contact management.

## Features

### CalDAV (Calendar Operations)
- **Calendar**: List all calendars from your server
- **Event**: Full CRUD operations (Create, Read, Update, Delete)
  - **VEVENT** (events/meetings) and **VTODO** (tasks) component support
  - **Subtask hierarchy**: Tasks can have nested subtasks with multi-level recursion
  - Recurring events (daily, weekly, monthly, yearly with custom intervals)
  - Timezone support with IANA timezone identifiers
  - All-day event support
  - Alarms (display, audio, email reminders)
- **Query Events**: Advanced filtering and search
  - Text filtering with case-insensitive substring matching
  - Regex pattern matching for advanced searches
  - Fuzzy matching with configurable tolerance (handles typos)
  - Search in specific fields (title, description, location)
  - Filter by status (Confirmed, Tentative, Cancelled, Needs Action, Completed, In Process)
  - Filter by component type (VEVENT, VTODO, or both)
  - Date range filtering
  - Customizable output fields

### CardDAV (Contact Operations)
- **Address Book**: List all address books from your server
- **Contact**: Full CRUD operations
  - Name fields (full name, first/last name)
  - Multiple emails and phone numbers
  - Address information (street, city, state, postal code, country)
  - Organization and title
  - Birthday and anniversary
  - Notes and photo support
- **Query Contacts**: Advanced filtering and search
  - Text filtering with case-insensitive substring matching
  - Regex pattern matching for advanced searches
  - Fuzzy matching with configurable tolerance (handles typos)
  - Search in specific fields (name, email, phone, organization, notes, birthday, anniversary)
  - Customizable output fields

## Supported Operations

| Resource | Operation | Description |
|----------|-----------|-------------|
| Address Book | Get Many | List all address books |
| Calendar | Get Many | List all calendars |
| Contact | Create | Create a new contact |
| Contact | Delete | Delete a contact |
| Contact | Get | Get a specific contact by UID |
| Contact | Query | Search and filter contacts with advanced options |
| Contact | Update | Update an existing contact |
| Event | Create | Create a new event or task (VEVENT/VTODO) |
| Event | Delete | Delete an event or task |
| Event | Get | Get a specific event/task by UID (with subtasks) |
| Event | Query | Search and filter events/tasks with advanced options |
| Event | Update | Update an existing event or task |

## Search & Filter Features

### Text Filtering

All Query operations support text-based filtering:

- **Case-insensitive** substring matching
- Search in **multiple fields** simultaneously
- **Regex mode** for pattern matching (e.g., `^John` for names starting with "John")
- **Fuzzy matching** for typo tolerance (Levenshtein distance 1-5)

### Event Filtering Options

| Option | Description |
|--------|-------------|
| Filter Query | Text to search for in events |
| Search Fields | Which fields to search (title, description, location) |
| Use Regex | Enable regex pattern matching |
| Fuzzy Tolerance | Allow N character differences (typo tolerance) |
| Status Filter | Filter by event status (Confirmed, Tentative, etc.) |
| Component Type | Filter by VEVENT, VTODO, or both |
| Date Range | Filter by start/end date |
| Output Fields | Select which fields to return |

### Contact Filtering Options

| Option | Description |
|--------|-------------|
| Filter Query | Text to search for in contacts |
| Search Fields | Which fields to search (name, email, phone, org, notes, birthday, anniversary) |
| Use Regex | Enable regex pattern matching |
| Fuzzy Tolerance | Allow N character differences (typo tolerance) |
| Output Fields | Select which fields to return |

### Fuzzy Matching Examples

- Tolerance 0: Exact match only
- Tolerance 1: `"Jon"` matches `"John"`, `"Joan"`, `"Jon"`
- Tolerance 2: `"Jhon"` matches `"John"`, `"Johnn"`, `"Jhon"`

### Regex Examples

- `^John` - Names starting with "John"
- `@gmail\.com$` - Gmail addresses only
- `meeting.*2024` - "meeting" followed by "2024"
- `\d{3}-\d{4}` - Phone number patterns

## VTODO Subtask Hierarchy

Tasks (VTODO) support parent-child relationships:

### Subtask Features

- **Nested subtasks**: Tasks appear with their subtasks in a `subtasks` array
- **Multi-level recursion**: Subtasks can have their own subtasks
- **Search through hierarchy**: Filtering searches subtask content too
- **Parent assignment**: Create tasks as subtasks by specifying parent UID
- **Re-parenting**: Move tasks between parents via Update

### Creating a Subtask

1. Create the parent task first
2. Create the subtask with **Parent Task UID** set to the parent's UID

### Query Output Structure

```json
{
  "uid": "parent-task-uid",
  "summary": "Main Project",
  "status": "IN-PROCESS",
  "subtasks": [
    {
      "uid": "subtask-uid",
      "summary": "Sub-task 1",
      "status": "COMPLETED",
      "parentUid": "parent-task-uid",
      "subtasks": []
    }
  ]
}
```

## Provider Compatibility

| Provider | CalDAV | CardDAV | Notes |
|----------|--------|---------|-------|
| Google | Yes | Partial | Requires app-specific password |
| iCloud | Yes | Yes | Requires app-specific password |
| Fastmail | Yes | Yes | Full support |
| Yahoo | Yes | No | Requires app-specific password |
| GMX | Yes | Yes | Full support |
| Nextcloud | Yes | Yes | Full support |
| Custom | Yes | Yes | Any CalDAV/CardDAV compliant server |

## Installation

### Via n8n Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-webdav-plus`

### Manual Installation

```bash
npm install n8n-nodes-webdav-plus
```

## Credentials Setup

1. Create new credentials of type **WebDAV Plus API**
2. Select your server preset (Google, iCloud, Fastmail, etc.) or Custom
3. Enter your username/email
4. Enter your password or app-specific password

### App-Specific Passwords

**iCloud:**
1. Visit [appleid.apple.com](https://appleid.apple.com)
2. Sign in > Sign-In and Security > App-Specific Passwords
3. Generate a password for n8n

**Google:**
1. Enable 2-Step Verification on your Google account
2. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate a password for n8n

## Examples

### List All Calendars

1. Add WebDAV Plus node
2. Resource: **Calendar**
3. Operation: **Get Many**

### Query Events from a Calendar

1. Add WebDAV Plus node
2. Resource: **Event**
3. Operation: **Query**
4. Select the calendar
5. Optional: Set filter query, search fields, status filter
6. Optional: Set date range filters

### Query Tasks (VTODO)

1. Add WebDAV Plus node
2. Resource: **Event**
3. Operation: **Query**
4. Component Type: **VTODO** or **Both**
5. Tasks are returned with nested subtasks automatically

### Create a Calendar Event

1. Add WebDAV Plus node
2. Resource: **Event**
3. Operation: **Create**
4. Component Type: **VEVENT**
5. Select calendar
6. Enter **Summary**, **Start Date**, **End Date**
7. Optional: Add description, location, recurrence, alarms

### Create a Task (VTODO)

1. Add WebDAV Plus node
2. Resource: **Event**
3. Operation: **Create**
4. Component Type: **VTODO**
5. Enter **Summary**
6. Optional: Due date, priority (1-9), percent complete, parent task UID

### Create a Subtask

1. First create or query the parent task to get its UID
2. Create new task with **Parent Task UID** set to parent's UID

### Create a Recurring Event

1. Follow steps for creating an event
2. Enable **Recurrence**
3. Set frequency (daily, weekly, monthly, yearly)
4. Set interval and end condition (count or until date)

### Create a Contact

1. Add WebDAV Plus node
2. Resource: **Contact**
3. Operation: **Create**
4. Select address book
5. Enter **Full Name** and **Email**
6. Optional: Phone, organization, address, birthday, anniversary

### Query Contacts with Fuzzy Matching

1. Add WebDAV Plus node
2. Resource: **Contact**
3. Operation: **Query**
4. Enter filter query (e.g., "Jon" to find "John")
5. Set **Fuzzy Tolerance** to 1 or 2
6. Select search fields (name, email, etc.)

### Update an Event

1. Add WebDAV Plus node
2. Resource: **Event**
3. Operation: **Update**
4. Enter **UID**, **HREF**, and **ETag** (from previous Get/Query operation)
5. Update desired fields

### Delete a Contact

1. Add WebDAV Plus node
2. Resource: **Contact**
3. Operation: **Delete**
4. Enter **UID** and optionally **ETag**

## Event Recurrence

The node supports complex recurrence patterns:

| Frequency | Description |
|-----------|-------------|
| Daily | Repeat every N days |
| Weekly | Repeat every N weeks |
| Monthly | Repeat every N months |
| Yearly | Repeat every N years |

Extra option:
- **By day**: Choose a specific day to repeat on

End conditions:
- **Count**: End after N occurrences
- **Until**: End on a specific date

## Security Features

- **Cryptographically secure UIDs** using Node.js crypto module
- **Path traversal prevention** in UID validation
- **Input escaping** for iCalendar and vCard injection prevention
- **Field length limits** to prevent buffer overflow attacks
- **Email validation** with RFC-compliant pattern matching
- **Timezone validation** using Intl.DateTimeFormat

## Development

```bash
# Clone the repository
git clone https://github.com/platnub/n8n-nodes-webdav-plus.git
cd n8n-nodes-webdav-plus

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link

# In your n8n custom nodes directory
npm link n8n-nodes-webdav-plus
```

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript and build icons |
| `npm run dev` | Watch mode for development |
| `npm run lint` | Run ESLint checks |
| `npm run lintfix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |

## Dependencies

- [tsdav](https://github.com/natelindev/tsdav) - CalDAV/CardDAV client library

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

Built with [tsdav](https://github.com/natelindev/tsdav) library.
