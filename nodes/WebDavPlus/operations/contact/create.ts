import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { DAVClient, DAVAddressBook } from 'tsdav';
import { buildCreateContactData } from '../../helpers/contactBuilder';
import { buildVCardString } from '../../helpers/vCardParser';
import { generateSecureUID } from '../../helpers';

/**
 * Create a new contact in an address book
 */
export async function contactCreate(
	context: IExecuteFunctions,
	client: DAVClient,
): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const addressBookLocator = context.getNodeParameter('addressBookUrl', i) as { value: string };
		const addressBookUrl = addressBookLocator.value;

		const addressBooks = await client.fetchAddressBooks();
		const addressBook = addressBooks.find((ab: DAVAddressBook) => ab.url === addressBookUrl);

		if (!addressBook) {
			throw new Error(`Address book not found: ${addressBookUrl}`);
		}

		const contactData = buildCreateContactData(context, i);

		// Generate cryptographically secure UID
		const uid = generateSecureUID('n8n-webdavplus-contact');
		contactData.uid = uid;

		const vCardString = buildVCardString(contactData);
		const filename = `${uid}.vcf`;

		// Create the vCard
		const result = await client.createVCard({
			addressBook,
			vCardString,
			filename,
		});

		returnData.push({
			json: {
				success: result.ok,
				uid,
				url: result.url,
			},
			pairedItem: { item: i },
		});
	}

	return returnData;
}
