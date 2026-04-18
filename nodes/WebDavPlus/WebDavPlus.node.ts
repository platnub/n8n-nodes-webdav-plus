import type {
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { properties } from './WebDavPlus.properties';
import { execute } from './operations';
import { createCalDavClient, createCardDavClient } from './helpers';

export class WebDavPlus implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WebDAV Plus',
		name: 'webDavPlus',
		icon: 'file:webdavplus.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with CalDAV calendars and CardDAV contacts using tsdav',
		usableAsTool: true,
		defaults: {
			name: 'WebDAV Plus',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'webDavPlusApi',
				required: true,
			},
		],
		codex: {
			categories: ['Productivity'],
			subcategories: {
				Productivity: ['Calendars', 'Contacts'],
			},
		},
		properties,
	};

	methods = {
		listSearch: {
			async getCalendars(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('webDavPlusApi');
				const client = await createCalDavClient(credentials);
				const calendars = await client.fetchCalendars();

				return {
					results: calendars.map((cal) => ({
						name: String(cal.displayName || cal.url),
						value: cal.url,
					})),
				};
			},

			async getAddressBooks(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('webDavPlusApi');
				const client = await createCardDavClient(credentials);
				const addressBooks = await client.fetchAddressBooks();

				return {
					results: addressBooks.map((ab) => ({
						name: String(ab.displayName || ab.url),
						value: ab.url,
					})),
				};
			},
		},
	};

	execute = execute;
}
