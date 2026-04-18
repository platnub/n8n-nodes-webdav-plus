import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { DAVClient } from 'tsdav';
import { WebDavPlusApi } from '../../../credentials/WebDavPlusApi.credentials';

/**
 * Creates a CalDAV client from n8n credentials
 * @param credentials - The decrypted credentials from n8n
 * @param requestTimeout - timeout in seconds (used for future timeout support)
 */
export async function createCalDavClient(
	credentials: ICredentialDataDecryptedObject,
	requestTimeout: number = 60,
): Promise<DAVClient> {
	const baseUrl = WebDavPlusApi.getBaseUrl(credentials);

	if (!baseUrl) {
		throw new Error('WebDAV Plus server URL is required. Please configure your credentials.');
	}

	const client = new DAVClient({
		serverUrl: baseUrl,
		credentials: {
			username: credentials.username as string,
			password: credentials.password as string,
		},
		authMethod: 'Basic',
		defaultAccountType: 'caldav',
	});

	await client.login();

	return client;
}

/**
 * Creates a CardDAV client from n8n credentials
 * @param credentials - The decrypted credentials from n8n
 * @param requestTimeout - timeout in seconds (used for future timeout support)
 */
export async function createCardDavClient(
	credentials: ICredentialDataDecryptedObject,
	requestTimeout: number = 60,
): Promise<DAVClient> {
	const baseUrl = WebDavPlusApi.getBaseUrl(credentials);

	if (!baseUrl) {
		throw new Error('WebDAV Plus server URL is required. Please configure your credentials.');
	}

	const client = new DAVClient({
		serverUrl: baseUrl,
		credentials: {
			username: credentials.username as string,
			password: credentials.password as string,
		},
		authMethod: 'Basic',
		defaultAccountType: 'carddav',
	});

	await client.login();

	return client;
}
