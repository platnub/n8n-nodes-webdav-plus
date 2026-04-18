import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVAddressBook } from 'tsdav';
import { parseVCard, contactToJson, type ParsedContact } from '../../helpers/vCardParser';
import { fuzzyMatch } from '../../helpers';

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
 * Checks if a contact matches the filter query in the specified fields
 * @param contact - The parsed contact to check
 * @param filterLower - Pre-lowercased and trimmed filter query for performance
 * @param searchFields - Array of field names to search in
 * @param searchPattern - Optional regex pattern for advanced matching
 * @param fuzzyTolerance - Levenshtein distance tolerance for fuzzy matching
 */
function matchesSearch(
	contact: ParsedContact,
	filterLower: string,
	searchFields: string[],
	searchPattern: RegExp | null,
	fuzzyTolerance: number,
): boolean {
	if (!filterLower && !searchPattern) return true;
	if (searchFields.length === 0) return true;

	// Check name fields (fullName, firstName, lastName)
	if (searchFields.includes('name')) {
		if (testMatch(contact.fullName, filterLower, searchPattern, fuzzyTolerance)) return true;
		if (testMatch(contact.firstName, filterLower, searchPattern, fuzzyTolerance)) return true;
		if (testMatch(contact.lastName, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	// Check email addresses
	if (searchFields.includes('email') && contact.email) {
		for (const email of contact.email) {
			if (testMatch(email.value, filterLower, searchPattern, fuzzyTolerance)) return true;
		}
	}

	// Check phone numbers
	if (searchFields.includes('phone') && contact.phone) {
		for (const phone of contact.phone) {
			if (testMatch(phone.value, filterLower, searchPattern, fuzzyTolerance)) return true;
		}
	}

	// Check organization
	if (searchFields.includes('organization')) {
		if (testMatch(contact.organization, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	// Check notes
	if (searchFields.includes('notes')) {
		if (testMatch(contact.notes, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	// Check birthday
	if (searchFields.includes('birthday')) {
		if (testMatch(contact.birthday, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	// Check anniversary
	if (searchFields.includes('anniversary')) {
		if (testMatch(contact.anniversary, filterLower, searchPattern, fuzzyTolerance)) return true;
	}

	return false;
}

/**
 * Creates output with only the selected fields
 */
function toSelectedFieldsJson(contact: ParsedContact, outputFields: string[]): IDataObject {
	// If 'all' is selected, return everything
	if (outputFields.includes('all')) {
		return contactToJson(contact);
	}

	const result: IDataObject = {};

	if (outputFields.includes('uid')) result.uid = contact.uid;
	if (outputFields.includes('fullName')) result.fullName = contact.fullName;
	if (outputFields.includes('firstName')) result.firstName = contact.firstName;
	if (outputFields.includes('lastName')) result.lastName = contact.lastName;
	if (outputFields.includes('email')) result.email = contact.email as unknown as IDataObject[];
	if (outputFields.includes('phone')) result.phone = contact.phone as unknown as IDataObject[];
	if (outputFields.includes('address')) result.address = contact.address as unknown as IDataObject[];
	if (outputFields.includes('organization')) result.organization = contact.organization;
	if (outputFields.includes('title')) result.title = contact.title;
	if (outputFields.includes('birthday')) result.birthday = contact.birthday;
	if (outputFields.includes('anniversary')) result.anniversary = contact.anniversary;
	if (outputFields.includes('notes')) result.notes = contact.notes;
	if (outputFields.includes('etag')) result.etag = contact.etag;
	if (outputFields.includes('href')) result.href = contact.href;

	return result;
}

/**
 * Get all contacts from an address book
 */
export async function contactGetAll(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const addressBookLocator = context.getNodeParameter('addressBookUrl', i) as { value: string };
		const addressBookUrl = addressBookLocator.value;
		const returnAll = context.getNodeParameter('returnAll', i) as boolean;
		const limit = returnAll ? 0 : (context.getNodeParameter('limit', i) as number);
		const includePhotos = context.getNodeParameter('includePhotos', i, false) as boolean;
		const outputFields = context.getNodeParameter('outputFields', i, ['uid', 'fullName']) as string[];
		const filterQuery = context.getNodeParameter('filterQuery', i, '') as string;
		const filterLower = filterQuery.trim().toLowerCase(); // Cache for performance
		const searchFields = context.getNodeParameter('searchFields', i, ['name', 'email']) as string[];
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

		// Get address books to find the matching one
		const addressBooks = await client.fetchAddressBooks();
		const addressBook = addressBooks.find((ab: DAVAddressBook) => ab.url === addressBookUrl);

		if (!addressBook) {
			throw new Error(`Address book not found: ${addressBookUrl}`);
		}

		// Fetch vCards
		const vCards = await client.fetchVCards({ addressBook });

		// Parse, filter, and limit results
		let count = 0;
		for (const vCard of vCards) {
			if (!returnAll && limit > 0 && count >= limit) {
				break;
			}

			if (vCard.data) {
				const parsedContact = parseVCard(vCard.data, vCard.etag, vCard.url, includePhotos);

				// Apply filter
				if (!matchesSearch(parsedContact, filterLower, searchFields, searchPattern, fuzzyTolerance)) {
					continue;
				}

				// Build output with selected fields
				const json = toSelectedFieldsJson(parsedContact, outputFields);

				returnData.push({
					json,
					pairedItem: { item: i },
				});
				count++;
			}
		}
	}

	return returnData;
}
