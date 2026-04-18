import type { DAVClient, DAVCalendar, DAVAddressBook } from 'tsdav';
import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Finds a calendar by URL from the client
 * @param client - The DAV client
 * @param calendarUrl - URL of the calendar to find
 * @param node - The n8n node (for error context)
 * @param itemIndex - Optional item index for batch operations
 * @throws NodeOperationError if calendar not found
 */
export async function findCalendarByUrl(
	client: DAVClient,
	calendarUrl: string,
	node: INode,
	itemIndex?: number,
): Promise<DAVCalendar> {
	const calendars = await client.fetchCalendars();
	const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl);

	if (!calendar) {
		throw new NodeOperationError(
			node,
			`Calendar not found: ${calendarUrl}`,
			itemIndex !== undefined ? { itemIndex } : undefined,
		);
	}

	return calendar;
}

/**
 * Finds an address book by URL from the client
 * @param client - The DAV client
 * @param addressBookUrl - URL of the address book to find
 * @param node - The n8n node (for error context)
 * @param itemIndex - Optional item index for batch operations
 * @throws NodeOperationError if address book not found
 */
export async function findAddressBookByUrl(
	client: DAVClient,
	addressBookUrl: string,
	node: INode,
	itemIndex?: number,
): Promise<DAVAddressBook> {
	const addressBooks = await client.fetchAddressBooks();
	const addressBook = addressBooks.find((ab: DAVAddressBook) => ab.url === addressBookUrl);

	if (!addressBook) {
		throw new NodeOperationError(
			node,
			`Address book not found: ${addressBookUrl}`,
			itemIndex !== undefined ? { itemIndex } : undefined,
		);
	}

	return addressBook;
}

/**
 * Extracts calendar URL from resource locator parameter
 * @param calendarLocator - The resource locator object
 * @returns The calendar URL string
 */
export function getCalendarUrl(calendarLocator: { value: string }): string {
	return calendarLocator.value;
}

/**
 * Extracts address book URL from resource locator parameter
 * @param addressBookLocator - The resource locator object
 * @returns The address book URL string
 */
export function getAddressBookUrl(addressBookLocator: { value: string }): string {
	return addressBookLocator.value;
}
