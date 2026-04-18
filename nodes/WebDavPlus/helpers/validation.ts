/**
 * Input validation helpers for WebDAV Plus node
 * Provides validation for emails, dates, timezones, and field lengths
 */

/**
 * Field length limits for security and data integrity
 */
export const FIELD_LIMITS = {
	summary: 500,
	description: 10000,
	location: 500,
	fullName: 200,
	email: 254,
	phone: 50,
	notes: 10000,
	street: 500,
	city: 100,
	region: 100,
	postalCode: 20,
	country: 100,
	organization: 200,
	title: 200,
	url: 2000,
} as const;

/**
 * Validates email address format
 * @param email - The email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') {
		return false;
	}
	// RFC 5322 compliant email regex (simplified)
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= FIELD_LIMITS.email;
}

/**
 * Validates email and throws if invalid
 * @param email - The email address to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if email format is invalid
 */
export function validateEmail(email: string, fieldName: string = 'email'): void {
	if (email && !isValidEmail(email)) {
		throw new Error(`Invalid ${fieldName} format: ${email.substring(0, 50)}`);
	}
}

/**
 * Validates that start date is before end date
 * @param start - Start date
 * @param end - End date
 * @throws Error if start is not before end
 */
export function validateDateRange(start: Date, end: Date): void {
	if (!(start instanceof Date) || !(end instanceof Date)) {
		throw new Error('Invalid date objects provided');
	}
	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		throw new Error('Invalid date values');
	}
	if (start >= end) {
		throw new Error('Start date must be before end date');
	}
}

/**
 * Validates timezone string against Intl API
 * @param tzid - The IANA timezone identifier
 * @returns true if valid timezone
 */
export function isValidTimezone(tzid: string): boolean {
	if (!tzid || typeof tzid !== 'string') {
		return false;
	}
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tzid });
		return true;
	} catch {
		return false;
	}
}

/**
 * Validates timezone and throws if invalid
 * @param tzid - The IANA timezone identifier
 * @throws Error if timezone is invalid
 */
export function validateTimezone(tzid: string | undefined): void {
	if (tzid && !isValidTimezone(tzid)) {
		throw new Error(`Invalid timezone: ${tzid}. Use IANA timezone format (e.g., Europe/Berlin, America/New_York)`);
	}
}

/**
 * Validates field length
 * @param value - The value to check
 * @param fieldName - Name of the field (must be key of FIELD_LIMITS)
 * @throws Error if value exceeds limit
 */
export function validateFieldLength(
	value: string | undefined,
	fieldName: keyof typeof FIELD_LIMITS,
): void {
	const limit = FIELD_LIMITS[fieldName];
	if (value && value.length > limit) {
		throw new Error(`${fieldName} exceeds maximum length of ${limit} characters`);
	}
}

/**
 * Validates and trims a string field
 * @param value - The value to validate
 * @param fieldName - Name of the field
 * @param maxLength - Maximum allowed length
 * @returns Trimmed string or empty string if undefined
 */
export function validateStringField(
	value: string | undefined,
	fieldName: string,
	maxLength: number,
): string {
	if (!value) {
		return '';
	}
	const trimmed = value.trim();
	if (trimmed.length > maxLength) {
		throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
	}
	return trimmed;
}

/**
 * Type guard to check if value is a resource locator object
 */
export function isResourceLocator(value: unknown): value is { value: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'value' in value &&
		typeof (value as { value: unknown }).value === 'string'
	);
}

/**
 * Extracts value from resource locator with validation
 * @param locator - The resource locator object
 * @param paramName - Name of the parameter for error message
 * @returns The extracted string value
 * @throws Error if invalid format
 */
export function extractResourceLocatorValue(
	locator: unknown,
	paramName: string,
): string {
	if (!isResourceLocator(locator)) {
		throw new Error(`Invalid ${paramName} parameter format`);
	}
	return locator.value;
}
