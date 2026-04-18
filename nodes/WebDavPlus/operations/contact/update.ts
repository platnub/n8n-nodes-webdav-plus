import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVVCard } from 'tsdav';
import { buildUpdateContactData } from '../../helpers/contactBuilder';
import { buildVCardString } from '../../helpers/vCardParser';
import { isValidUID } from '../../helpers';

/**
 * Update an existing contact in an address book
 */
export async function contactUpdate(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		// Build contact data with identifiers (uid, href, etag)
		const contactData = buildUpdateContactData(context, i);

		// Validate UID to prevent path traversal attacks
		if (!isValidUID(contactData.uid)) {
			throw new NodeOperationError(
				context.getNode(),
				'Invalid contact UID format. UIDs must contain only alphanumeric characters, hyphens, dots, underscores, and @',
				{ itemIndex: i },
			);
		}

		// Build vCard string with existing UID
		const vCardString = buildVCardString(contactData);

		// Create the vCard object for update
		const vCard: DAVVCard = {
			url: contactData.href,
			etag: contactData.etag,
			data: vCardString,
		};

		const result = await client.updateVCard({
			vCard,
		});

		returnData.push({
			json: {
				success: result.ok,
				uid: contactData.uid,
				url: result.url,
			},
			pairedItem: { item: i },
		});
	}

	return returnData;
}
