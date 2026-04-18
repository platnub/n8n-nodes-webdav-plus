import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import type { ContactData } from './vCardParser';

/**
 * Contact data structure for create operations
 */
export interface CreateContactData extends ContactData {
	uid?: string;
}

/**
 * Contact data structure for update operations (requires identifiers)
 */
export interface UpdateContactData extends ContactData {
	uid: string;
	href: string;
	etag: string;
}

/**
 * Builds contact data from node parameters for create operation
 */
export function buildCreateContactData(
	context: IExecuteFunctions,
	itemIndex: number,
): CreateContactData {
	const fullName = context.getNodeParameter('fullName', itemIndex) as string;
	const email = context.getNodeParameter('email', itemIndex, '') as string;
	const additionalFields = context.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

	const contactData: CreateContactData = {
		fullName,
	};

	if (email) {
		contactData.email = email;
	}

	// Add additional fields
	if (additionalFields.firstName) {
		contactData.firstName = additionalFields.firstName as string;
	}
	if (additionalFields.lastName) {
		contactData.lastName = additionalFields.lastName as string;
	}
	if (additionalFields.phone) {
		contactData.phone = additionalFields.phone as string;
	}
	if (additionalFields.organization) {
		contactData.organization = additionalFields.organization as string;
	}
	if (additionalFields.title) {
		contactData.title = additionalFields.title as string;
	}
	if (additionalFields.birthday) {
		contactData.birthday = additionalFields.birthday as string;
	}
	if (additionalFields.notes) {
		contactData.notes = additionalFields.notes as string;
	}
	if (additionalFields.street) {
		contactData.street = additionalFields.street as string;
	}
	if (additionalFields.city) {
		contactData.city = additionalFields.city as string;
	}
	if (additionalFields.region) {
		contactData.region = additionalFields.region as string;
	}
	if (additionalFields.postalCode) {
		contactData.postalCode = additionalFields.postalCode as string;
	}
	if (additionalFields.country) {
		contactData.country = additionalFields.country as string;
	}

	return contactData;
}

/**
 * Builds contact data for update operation (includes uid, href, etag)
 */
export function buildUpdateContactData(
	context: IExecuteFunctions,
	itemIndex: number,
): UpdateContactData {
	const baseData = buildCreateContactData(context, itemIndex);

	return {
		...baseData,
		uid: context.getNodeParameter('contactUid', itemIndex) as string,
		href: context.getNodeParameter('contactHref', itemIndex) as string,
		etag: context.getNodeParameter('contactEtag', itemIndex) as string,
	};
}
