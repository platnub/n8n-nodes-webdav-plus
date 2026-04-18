import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure UID for events and contacts
 * Uses crypto.randomBytes() instead of Math.random() for security
 * @param domain - Domain suffix for the UID (e.g., 'n8n-webdavplus')
 */
export function generateSecureUID(domain: string = 'n8n-webdavplus'): string {
	const timestamp = Date.now();
	const random = randomBytes(12).toString('hex');
	return `${timestamp}-${random}@${domain}`;
}

/**
 * Validates a UID to prevent path traversal attacks
 * Only allows alphanumeric characters, hyphens, dots, underscores, and @
 * @param uid - The UID to validate
 */
export function isValidUID(uid: string): boolean {
	if (!uid || typeof uid !== 'string') {
		return false;
	}
	// Only allow safe characters: alphanumeric, hyphens, dots, underscores, and @
	// Reject any path traversal attempts (../ or ..\)
	const safePattern = /^[a-zA-Z0-9\-\._@]+$/;
	const hasPathTraversal = /\.\.[\\/]/.test(uid);
	return safePattern.test(uid) && !hasPathTraversal && uid.length <= 255;
}

/**
 * Validates and sanitizes a server URL
 * By default enforces HTTPS for security, but allows HTTP if explicitly enabled
 * @param url - The URL to validate
 * @param allowInsecure - If true, allows HTTP connections (use with caution)
 * @throws Error if URL uses insecure HTTP protocol and allowInsecure is false
 */
export function validateServerUrl(url: string, allowInsecure: boolean = false): string {
	if (!url || typeof url !== 'string') {
		throw new Error('Server URL is required');
	}

	const trimmedUrl = url.trim();

	// Reject insecure HTTP unless explicitly allowed
	if (trimmedUrl.toLowerCase().startsWith('http://') && !allowInsecure) {
		throw new Error('Insecure HTTP connections are not allowed. Enable "Allow Insecure HTTP" in credentials if you understand the security risks.');
	}

	// Auto-upgrade if no protocol specified (and not a relative path)
	if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('/')) {
		return `https://${trimmedUrl}`;
	}

	return trimmedUrl;
}

/**
 * Escapes special characters for iCalendar text fields
 * Prevents injection attacks in iCalendar data
 */
export function escapeICalText(text: string): string {
	if (!text || typeof text !== 'string') {
		return '';
	}
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '');
}

/**
 * Escapes special characters for vCard text fields
 * Prevents injection attacks in vCard data
 */
export function escapeVCardText(text: string): string {
	if (!text || typeof text !== 'string') {
		return '';
	}
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '');
}
