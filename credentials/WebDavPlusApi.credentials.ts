import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WebDavPlusApi implements ICredentialType {
	name = 'webDavPlusApi';
	displayName = 'WebDAV Plus API';
	documentationUrl = 'https://github.com/platnub/n8n-nodes-webdav-plus';

	properties: INodeProperties[] = [
		{
			displayName: 'Server Preset',
			name: 'serverPreset',
			type: 'options',
			options: [
				{
					name: 'Google Calendar',
					value: 'google',
				},
				{
					name: 'iCloud',
					value: 'icloud',
				},
				{
					name: 'Fastmail',
					value: 'fastmail',
				},
				{
					name: 'Yahoo Calendar',
					value: 'yahoo',
				},
				{
					name: 'GMX',
					value: 'gmx',
				},
				{
					name: 'Nextcloud',
					value: 'nextcloud',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
			default: 'custom',
			description: 'Select your CalDAV server provider or use a custom URL',
		},
		{
			displayName: 'Server URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://caldav.example.com',
			description: 'The base URL of your CalDAV/CardDAV server (HTTPS required)',
			displayOptions: {
				show: {
					serverPreset: ['custom'],
				},
			},
		},
		{
			displayName: 'Nextcloud Server URL',
			name: 'nextcloudUrl',
			type: 'string',
			default: '',
			placeholder: 'https://your-nextcloud.com',
			description: 'Your Nextcloud server URL (without /remote.php/dav)',
			displayOptions: {
				show: {
					serverPreset: ['nextcloud'],
				},
			},
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'Your CalDAV username or email',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your password or app-specific password. For iCloud and Google, you may need to generate an app-specific password.',
		},
		{
			displayName: 'Allow Insecure HTTP',
			name: 'allowInsecureHttp',
			type: 'boolean',
			default: false,
			description: 'WARNING: Enable only for local development or trusted networks. HTTP connections transmit credentials in plain text and are vulnerable to interception.',
		},
	];

	// Server preset URLs
	static readonly SERVER_URLS: Record<string, string> = {
		google: 'https://apidata.googleusercontent.com',
		icloud: 'https://caldav.icloud.com',
		fastmail: 'https://caldav.fastmail.com',
		yahoo: 'https://caldav.calendar.yahoo.com',
		gmx: 'https://caldav.gmx.net',
	};

	// Helper to get the actual base URL from credentials
	// By default enforces HTTPS for security, but allows HTTP if explicitly enabled
	static getBaseUrl(credentials: ICredentialDataDecryptedObject): string {
		const preset = credentials.serverPreset as string;
		const allowInsecureHttp = credentials.allowInsecureHttp as boolean;
		let url: string;

		if (preset === 'custom') {
			url = credentials.baseUrl as string;
		} else if (preset === 'nextcloud') {
			const nextcloudUrl = (credentials.nextcloudUrl as string).replace(/\/$/, '');
			url = `${nextcloudUrl}/remote.php/dav`;
		} else {
			url = WebDavPlusApi.SERVER_URLS[preset] || '';
		}

		// Enforce HTTPS for security unless explicitly allowed
		if (url && url.toLowerCase().startsWith('http://') && !allowInsecureHttp) {
			throw new Error('Insecure HTTP connections are not allowed. Enable "Allow Insecure HTTP" in credentials if you understand the security risks.');
		}

		return url;
	}

	// Use HEAD method to test credentials against CalDAV/CardDAV servers
	// HEAD is efficient as it doesn't download the response body
	// Redirects (301/302) from .well-known are treated as success by n8n
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.serverPreset === "custom" ? $credentials.baseUrl : ($credentials.serverPreset === "nextcloud" ? $credentials.nextcloudUrl + "/remote.php/dav" : {"google": "https://apidata.googleusercontent.com", "icloud": "https://caldav.icloud.com", "fastmail": "https://caldav.fastmail.com", "yahoo": "https://caldav.calendar.yahoo.com", "gmx": "https://caldav.gmx.net"}[$credentials.serverPreset])}}',
			url: '/',
			method: 'HEAD',
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};
}
