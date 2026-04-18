import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createCalDavClient, createCardDavClient } from '../helpers';
import { calendarGetAll } from './calendar';
import { eventGetAll, eventGet, eventCreate, eventUpdate, eventDelete } from './event';
import { addressBookGetAll } from './addressBook';
import { contactGetAll, contactGet, contactCreate, contactUpdate, contactDelete } from './contact';

/**
 * Sanitize error messages to prevent sensitive data exposure
 * Removes credentials from URLs and limits message length
 */
function sanitizeErrorMessage(error: Error): string {
	let message = error.message || 'Unknown error';
	// Remove any credentials from URLs (user:pass@host pattern)
	message = message.replace(/\/\/[^:]+:[^@]+@/g, '//***:***@');
	// Limit message length to prevent excessive output
	if (message.length > 500) {
		message = message.substring(0, 500) + '...';
	}
	return message;
}

/**
 * Main execute function - routes to appropriate operation handler
 * Handles error handling with continueOnFail support
 */
export async function execute(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
	const resource = this.getNodeParameter('resource', 0) as string;
	const operation = this.getNodeParameter('operation', 0) as string;
	const requestTimeout = this.getNodeParameter('requestTimeout', 0) as number;

	// Get credentials
	const credentials = await this.getCredentials('webDavPlusApi');

	let returnData: INodeExecutionData[] = [];

	try {
		// Calendar and Event operations use CalDAV client
		if (resource === 'calendar' || resource === 'event') {
			let client;
			try {
				client = await createCalDavClient(credentials, requestTimeout);
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Failed to connect to CalDAV server: ${sanitizeErrorMessage(error as Error)}`,
				);
			}

			// Calendar operations
			if (resource === 'calendar') {
				if (operation === 'getAll') {
					returnData = await calendarGetAll(client);
				}
			}

			// Event operations
			if (resource === 'event') {
				if (operation === 'getAll') {
					returnData = await eventGetAll(this, client);
				} else if (operation === 'get') {
					returnData = await eventGet(this, client);
				} else if (operation === 'create') {
					returnData = await eventCreate(this, client);
				} else if (operation === 'update') {
					returnData = await eventUpdate(this, client);
				} else if (operation === 'delete') {
					returnData = await eventDelete(this, client);
				}
			}
		}

		// Address Book and Contact operations use CardDAV client
		if (resource === 'addressBook' || resource === 'contact') {
			let client;
			try {
				client = await createCardDavClient(credentials, requestTimeout);
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Failed to connect to CardDAV server: ${sanitizeErrorMessage(error as Error)}`,
				);
			}

			// Address Book operations
			if (resource === 'addressBook') {
				if (operation === 'getAll') {
					returnData = await addressBookGetAll(client);
				}
			}

			// Contact operations
			if (resource === 'contact') {
				if (operation === 'getAll') {
					returnData = await contactGetAll(this, client);
				} else if (operation === 'get') {
					returnData = await contactGet(this, client);
				} else if (operation === 'create') {
					returnData = await contactCreate(this, client);
				} else if (operation === 'update') {
					returnData = await contactUpdate(this, client);
				} else if (operation === 'delete') {
					returnData = await contactDelete(this, client);
				}
			}
		}
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({
				json: {
					error: sanitizeErrorMessage(error as Error),
					errorName: (error as Error).name || 'Error',
				},
			});
		} else {
			throw error;
		}
	}

	return [returnData];
}
