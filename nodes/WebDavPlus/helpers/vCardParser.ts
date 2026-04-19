import type { IDataObject } from 'n8n-workflow';
import { generateSecureUID, escapeVCardText } from './security';

/**
 * Address structure with type label
 */
export interface VCardAddress {
	type?: string;
	label?: string;
	poBox?: string;
	extended?: string;
	street?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	country?: string;
}

/**
 * Phone/Email/URL with type label
 */
export interface VCardTypedValue {
	value: string;
	type?: string;
	label?: string;
}

/**
 * Relation structure
 */
export interface VCardRelation {
	value: string;
	type?: string;
}

/**
 * Instant messaging handle
 */
export interface VCardIM {
	value: string;
	type?: string;
	protocol?: string;
}

/**
 * Social profile
 */
export interface VCardSocialProfile {
	value: string;
	type?: string;
	platform?: string;
}

/**
 * Parsed contact structure with all vCard fields
 */
export interface ParsedContact {
	uid: string;
	fullName: string;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	namePrefix?: string;
	nameSuffix?: string;
	nickname?: string;
	email?: VCardTypedValue[];
	phone?: VCardTypedValue[];
	address?: VCardAddress[];
	url?: VCardTypedValue[];
	organization?: string;
	department?: string;
	title?: string;
	role?: string;
	birthday?: string;
	anniversary?: string;
	gender?: string;
	notes?: string;
	photo?: string;
	categories?: string[];
	relations?: VCardRelation[];
	impp?: VCardIM[];
	socialProfiles?: VCardSocialProfile[];
	etag?: string;
	href?: string;
}

/**
 * Unfolds vCard content (handles line continuations)
 */
function unfoldVCard(vcardString: string): string {
	return vcardString.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

/**
 * Unescapes vCard text values
 */
function unescapeVCardText(text: string): string {
	return text
		.replace(/\\n/gi, '\n')
		.replace(/\\,/g, ',')
		.replace(/\\;/g, ';')
		.replace(/\\\\/g, '\\');
}

/**
 * Extracts the value from a vCard property line
 */
function extractValue(line: string): string {
	const colonIndex = line.indexOf(':');
	if (colonIndex === -1) return '';
	return unescapeVCardText(line.substring(colonIndex + 1).trim());
}

/**
 * Extracts TYPE parameter(s) from a property line
 * Handles multiple types like TYPE=WORK,VOICE or TYPE="WORK"
 */
function extractTypes(line: string): string[] {
	const types: string[] = [];
	// Match TYPE=value patterns
	const matches = line.matchAll(/TYPE=([^:;,]+)/gi);
	for (const match of matches) {
		// Handle quoted values and comma-separated types
		const value = match[1].replace(/"/g, '');
		types.push(...value.split(',').map(t => t.toUpperCase().trim()));
	}
	return types;
}

/**
 * Extracts a specific parameter value from a property line
 */
function extractParam(line: string, param: string): string | undefined {
	const regex = new RegExp(`${param}=([^:;]+)`, 'i');
	const match = line.match(regex);
	return match ? match[1].replace(/"/g, '') : undefined;
}

/**
 * Parses an ADR (address) property
 * Format: ADR;TYPE=WORK:PO Box;Extended;Street;City;Region;PostalCode;Country
 */
function parseAddress(line: string): VCardAddress {
	const value = extractValue(line);
	const parts = value.split(';');
	const types = extractTypes(line);

	return {
		type: types.join(',') || undefined,
		label: extractParam(line, 'LABEL'),
		poBox: parts[0] || undefined,
		extended: parts[1] || undefined,
		street: parts[2] || undefined,
		city: parts[3] || undefined,
		region: parts[4] || undefined,
		postalCode: parts[5] || undefined,
		country: parts[6] || undefined,
	};
}

/**
 * Parses N (name) property
 * Format: N:LastName;FirstName;MiddleName;Prefix;Suffix
 */
function parseName(value: string): {
	lastName?: string;
	firstName?: string;
	middleName?: string;
	namePrefix?: string;
	nameSuffix?: string;
} {
	const parts = value.split(';');
	return {
		lastName: parts[0] || undefined,
		firstName: parts[1] || undefined,
		middleName: parts[2] || undefined,
		namePrefix: parts[3] || undefined,
		nameSuffix: parts[4] || undefined,
	};
}

/**
 * Parses a typed value (EMAIL, TEL, URL)
 */
function parseTypedValue(line: string): VCardTypedValue {
	const types = extractTypes(line);
	return {
		value: extractValue(line),
		type: types.join(',') || undefined,
		label: extractParam(line, 'LABEL'),
	};
}

/**
 * Parses IMPP (instant messaging) property
 * Format: IMPP;X-SERVICE-TYPE=Skype:skype:username
 */
function parseIMPP(line: string): VCardIM {
	const value = extractValue(line);
	const types = extractTypes(line);
	const serviceType = extractParam(line, 'X-SERVICE-TYPE');

	// Try to extract protocol from the value (e.g., "xmpp:user@server")
	let protocol: string | undefined;
	let actualValue = value;
	const colonIndex = value.indexOf(':');
	if (colonIndex !== -1 && colonIndex < 10) {
		protocol = value.substring(0, colonIndex);
		actualValue = value.substring(colonIndex + 1);
	}

	return {
		value: actualValue,
		type: types.join(',') || undefined,
		protocol: serviceType || protocol,
	};
}

/**
 * Parses X-SOCIALPROFILE property
 */
function parseSocialProfile(line: string): VCardSocialProfile {
	const value = extractValue(line);
	const types = extractTypes(line);
	const platform = extractParam(line, 'X-SOCIALPROFILE') ||
		extractParam(line, 'TYPE') ||
		extractPlatformFromUrl(value);

	return {
		value,
		type: types.join(',') || undefined,
		platform,
	};
}

/**
 * Attempts to extract platform name from a social URL
 */
function extractPlatformFromUrl(url: string): string | undefined {
	const lowerUrl = url.toLowerCase();
	if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'Twitter';
	if (lowerUrl.includes('facebook.com')) return 'Facebook';
	if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
	if (lowerUrl.includes('instagram.com')) return 'Instagram';
	if (lowerUrl.includes('github.com')) return 'GitHub';
	if (lowerUrl.includes('youtube.com')) return 'YouTube';
	return undefined;
}

/**
 * Parses RELATED property
 */
function parseRelation(line: string): VCardRelation {
	const types = extractTypes(line);
	return {
		value: extractValue(line),
		type: types.join(',') || undefined,
	};
}

/**
 * Parses raw vCard string into a ParsedContact object
 */
export function parseVCard(
	vcardString: string,
	etag?: string,
	href?: string,
	includePhoto: boolean = true,
): ParsedContact {
	const unfolded = unfoldVCard(vcardString);
	const lines = unfolded.split(/\r?\n/);

	const contact: ParsedContact = {
		uid: '',
		fullName: '',
		etag,
		href,
		email: [],
		phone: [],
		address: [],
		url: [],
		categories: [],
		relations: [],
		impp: [],
		socialProfiles: [],
	};

	let inVCard = false;

	for (const line of lines) {
		if (line === 'BEGIN:VCARD') {
			inVCard = true;
			continue;
		}
		if (line === 'END:VCARD') {
			inVCard = false;
			continue;
		}

		if (!inVCard) continue;

		const upperLine = line.toUpperCase();
		const propName = upperLine.split(/[;:]/)[0];

		switch (propName) {
			case 'UID':
				contact.uid = extractValue(line);
				break;

			case 'FN':
				contact.fullName = extractValue(line);
				break;

			case 'N': {
				const name = parseName(extractValue(line));
				contact.firstName = name.firstName;
				contact.lastName = name.lastName;
				contact.middleName = name.middleName;
				contact.namePrefix = name.namePrefix;
				contact.nameSuffix = name.nameSuffix;
				break;
			}

			case 'NICKNAME':
				contact.nickname = extractValue(line);
				break;

			case 'EMAIL': {
				const email = parseTypedValue(line);
				if (email.value) {
					contact.email!.push(email);
				}
				break;
			}

			case 'TEL': {
				const phone = parseTypedValue(line);
				if (phone.value) {
					contact.phone!.push(phone);
				}
				break;
			}

			case 'ADR': {
				const address = parseAddress(line);
				if (address.street || address.city || address.country || address.postalCode) {
					contact.address!.push(address);
				}
				break;
			}

			case 'URL': {
				const url = parseTypedValue(line);
				if (url.value) {
					contact.url!.push(url);
				}
				break;
			}

			case 'ORG': {
				const orgParts = extractValue(line).split(';');
				contact.organization = orgParts[0] || undefined;
				contact.department = orgParts[1] || undefined;
				break;
			}

			case 'TITLE':
				contact.title = extractValue(line);
				break;

			case 'ROLE':
				contact.role = extractValue(line);
				break;

			case 'BDAY':
				contact.birthday = extractValue(line);
				break;

			case 'ANNIVERSARY':
				contact.anniversary = extractValue(line);
				break;

			case 'GENDER':
				contact.gender = extractValue(line);
				break;

			case 'NOTE':
				contact.notes = extractValue(line);
				break;

			case 'PHOTO':
				if (includePhoto) {
					contact.photo = extractValue(line);
				}
				break;

			case 'CATEGORIES': {
				const cats = extractValue(line).split(',').map(c => c.trim()).filter(c => c);
				contact.categories!.push(...cats);
				break;
			}

			case 'RELATED': {
				const relation = parseRelation(line);
				if (relation.value) {
					contact.relations!.push(relation);
				}
				break;
			}

			case 'IMPP': {
				const impp = parseIMPP(line);
				if (impp.value) {
					contact.impp!.push(impp);
				}
				break;
			}

			default:
				// Handle X- properties for social profiles
				if (propName.startsWith('X-SOCIALPROFILE') || propName === 'X-TWITTER' ||
					propName === 'X-FACEBOOK' || propName === 'X-LINKEDIN') {
					const profile = parseSocialProfile(line);
					if (profile.value) {
						// Set platform from property name if not already set
						if (!profile.platform && propName.startsWith('X-')) {
							profile.platform = propName.substring(2).replace('SOCIALPROFILE', '').replace(/^;.*/, '');
						}
						contact.socialProfiles!.push(profile);
					}
				}
				// Handle AIM, MSN, etc. as IMPP
				else if (propName === 'X-AIM' || propName === 'X-MSN' || propName === 'X-YAHOO' ||
					propName === 'X-ICQ' || propName === 'X-JABBER' || propName === 'X-SKYPE') {
					contact.impp!.push({
						value: extractValue(line),
						protocol: propName.substring(2),
					});
				}
				break;
		}
	}

	// Clean up empty arrays
	if (contact.email!.length === 0) delete contact.email;
	if (contact.phone!.length === 0) delete contact.phone;
	if (contact.address!.length === 0) delete contact.address;
	if (contact.url!.length === 0) delete contact.url;
	if (contact.categories!.length === 0) delete contact.categories;
	if (contact.relations!.length === 0) delete contact.relations;
	if (contact.impp!.length === 0) delete contact.impp;
	if (contact.socialProfiles!.length === 0) delete contact.socialProfiles;

	return contact;
}

/**
 * Generates a cryptographically secure UID for new contacts
 * Uses crypto.randomBytes() for security
 */
function generateUID(): string {
	return generateSecureUID('n8n-webdavplus-contact');
}

/**
 * Contact data for building vCard strings
 */
export interface ContactData {
	uid?: string;
	fullName: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	organization?: string;
	title?: string;
	birthday?: string;
	notes?: string;
	street?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	country?: string;
}

/**
 * Builds a vCard 3.0 string from contact data
 */
export function buildVCardString(contactData: ContactData): string {
	const lines: string[] = [];
	const uid = contactData.uid || generateUID();

	lines.push('BEGIN:VCARD');
	lines.push('VERSION:3.0');
	lines.push(`UID:${uid}`);
	lines.push(`FN:${escapeVCardText(contactData.fullName)}`);

	// N property (structured name)
	const lastName = contactData.lastName || '';
	const firstName = contactData.firstName || '';
	if (lastName || firstName) {
		lines.push(`N:${escapeVCardText(lastName)};${escapeVCardText(firstName)};;;`);
	} else {
		// Try to parse from fullName
		const nameParts = contactData.fullName.trim().split(/\s+/);
		if (nameParts.length >= 2) {
			const fn = nameParts[0];
			const ln = nameParts.slice(1).join(' ');
			lines.push(`N:${escapeVCardText(ln)};${escapeVCardText(fn)};;;`);
		} else {
			lines.push(`N:${escapeVCardText(contactData.fullName)};;;;`);
		}
	}

	if (contactData.email) {
		lines.push(`EMAIL;TYPE=INTERNET:${contactData.email}`);
	}

	if (contactData.phone) {
		lines.push(`TEL;TYPE=CELL:${contactData.phone}`);
	}

	if (contactData.organization) {
		lines.push(`ORG:${escapeVCardText(contactData.organization)}`);
	}

	if (contactData.title) {
		lines.push(`TITLE:${escapeVCardText(contactData.title)}`);
	}

	if (contactData.birthday) {
		// Format birthday to YYYYMMDD if it's a full datetime
		let bday = contactData.birthday;
		if (bday.includes('T')) {
			bday = bday.split('T')[0].replace(/-/g, '');
		} else if (bday.includes('-')) {
			bday = bday.replace(/-/g, '');
		}
		lines.push(`BDAY:${bday}`);
	}

	if (contactData.notes) {
		lines.push(`NOTE:${escapeVCardText(contactData.notes)}`);
	}

	// Address
	if (contactData.street || contactData.city || contactData.region ||
		contactData.postalCode || contactData.country) {
		const adr = [
			'', // PO Box
			'', // Extended Address
			contactData.street || '',
			contactData.city || '',
			contactData.region || '',
			contactData.postalCode || '',
			contactData.country || '',
		].map(escapeVCardText).join(';');
		lines.push(`ADR;TYPE=HOME:${adr}`);
	}

	lines.push('END:VCARD');

	return lines.join('\r\n');
}

/**
 * Converts a ParsedContact to a JSON-safe IDataObject
 */
export function contactToJson(contact: ParsedContact): IDataObject {
	return {
		uid: contact.uid,
		fullName: contact.fullName,
		firstName: contact.firstName,
		lastName: contact.lastName,
		middleName: contact.middleName,
		namePrefix: contact.namePrefix,
		nameSuffix: contact.nameSuffix,
		nickname: contact.nickname,
		email: contact.email as unknown as IDataObject[],
		phone: contact.phone as unknown as IDataObject[],
		address: contact.address as unknown as IDataObject[],
		url: contact.url as unknown as IDataObject[],
		organization: contact.organization,
		department: contact.department,
		title: contact.title,
		role: contact.role,
		birthday: contact.birthday,
		anniversary: contact.anniversary,
		gender: contact.gender,
		notes: contact.notes,
		photo: contact.photo,
		categories: contact.categories,
		relations: contact.relations as unknown as IDataObject[],
		impp: contact.impp as unknown as IDataObject[],
		socialProfiles: contact.socialProfiles as unknown as IDataObject[],
		etag: contact.etag,
		href: contact.href,
	};
}
