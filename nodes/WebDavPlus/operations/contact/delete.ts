import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { DAVClient, DAVVCard } from 'tsdav';
import { isValidUID } from '../../helpers';

/**
 * Delete a contact from an address book
 */
export async function contactDelete(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const addressBookLocator = context.getNodeParameter('addressBookUrl', i) as { value: string };
		const addressBookUrl = addressBookLocator.value;
		const contactUid = context.getNodeParameter('contactUid', i) as string;
		const contactEtag = context.getNodeParameter('contactEtag', i, '') as string;

		// Validate UID to prevent path traversal attacks
		if (!isValidUID(contactUid)) {
			throw new NodeOperationError(
				context.getNode(),
				'Invalid contact UID format. UIDs must contain only alphanumeric characters, hyphens, dots, underscores, and @',
				{ itemIndex: i },
			);
		}

		// Build the vCard object for deletion
		const vCard: DAVVCard = {
			url: `${addressBookUrl.replace(/\/$/, '')}/${contactUid}.vcf`,
			etag: contactEtag || undefined,
			data: '',
		};

		await client.deleteVCard({
			vCard,
		});

		returnData.push({
			json: {
				success: true,
				uid: contactUid,
				deleted: true,
			},
			pairedItem: { item: i },
		});
	}

	return returnData;
}
