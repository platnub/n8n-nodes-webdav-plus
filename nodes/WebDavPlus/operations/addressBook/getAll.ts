import type { INodeExecutionData, IDataObject } from 'n8n-workflow';
import type { DAVClient } from 'tsdav';

/**
 * Get all address books from the CardDAV server
 */
export async function addressBookGetAll(client: DAVClient): Promise<INodeExecutionData[]> {
	const addressBooks = await client.fetchAddressBooks();

	return addressBooks.map((addressBook) => ({
		json: {
			url: addressBook.url,
			displayName: addressBook.displayName,
			description: addressBook.description,
		} as IDataObject,
	}));
}
