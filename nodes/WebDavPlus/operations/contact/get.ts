import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVAddressBook } from 'tsdav';
import { parseVCard, contactToJson } from '../../helpers/vCardParser';
import { isValidUID } from '../../helpers';

/**
 * Get a specific contact by UID
 */
export async function contactGet(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const addressBookLocator = context.getNodeParameter('addressBookUrl', i) as { value: string };
		const addressBookUrl = addressBookLocator.value;
		const contactUid = context.getNodeParameter('contactUid', i) as string;
		const includePhotos = context.getNodeParameter('includePhotos', i, false) as boolean;

		// Validate UID to prevent path traversal attacks
		if (!isValidUID(contactUid)) {
			throw new NodeOperationError(
				context.getNode(),
				'Invalid contact UID format. UIDs must contain only alphanumeric characters, hyphens, dots, underscores, and @',
				{ itemIndex: i },
			);
		}

		// Get address books to find the matching one
		const addressBooks = await client.fetchAddressBooks();
		const addressBook = addressBooks.find((ab: DAVAddressBook) => ab.url === addressBookUrl);

		if (!addressBook) {
			throw new NodeOperationError(
				context.getNode(),
				`Address book not found: ${addressBookUrl}`,
				{ itemIndex: i },
			);
		}

		// Fetch all vCards and find the one with matching UID
		const vCards = await client.fetchVCards({ addressBook });

		let foundContact = null;
		for (const vCard of vCards) {
			if (vCard.data) {
				const parsedContact = parseVCard(vCard.data, vCard.etag, vCard.url, includePhotos);
				if (parsedContact.uid === contactUid) {
					foundContact = parsedContact;
					break;
				}
			}
		}

		if (!foundContact) {
			throw new NodeOperationError(
				context.getNode(),
				`Contact with UID "${contactUid}" not found`,
				{ itemIndex: i },
			);
		}

		returnData.push({
			json: contactToJson(foundContact),
			pairedItem: { item: i },
		});
	}

	return returnData;
}
