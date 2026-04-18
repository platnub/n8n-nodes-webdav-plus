/**
 * Fuzzy string matching using Levenshtein distance
 */

/**
 * Calculates Levenshtein distance between two strings
 * Counts minimum edits (insertions, deletions, substitutions) to transform a into b
 */
export function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1, // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Checks if query fuzzy-matches within text using Levenshtein distance
 * Returns true if any word or substring matches within tolerance
 */
export function fuzzyMatch(text: string, query: string, tolerance: number): boolean {
	if (tolerance === 0) {
		return text.toLowerCase().includes(query.toLowerCase());
	}

	const textLower = text.toLowerCase();
	const queryLower = query.toLowerCase();

	// For short queries, check if any word matches
	const words = textLower.split(/\s+/);
	for (const word of words) {
		if (levenshteinDistance(word, queryLower) <= tolerance) {
			return true;
		}
	}

	// Check sliding window for substring matches
	const windowSize = queryLower.length;
	for (let i = 0; i <= textLower.length - windowSize; i++) {
		const substring = textLower.substring(i, i + windowSize);
		if (levenshteinDistance(substring, queryLower) <= tolerance) {
			return true;
		}
	}

	// Also check slightly larger windows for insertions
	for (let i = 0; i <= textLower.length - windowSize - tolerance; i++) {
		const substring = textLower.substring(i, i + windowSize + tolerance);
		if (levenshteinDistance(substring, queryLower) <= tolerance) {
			return true;
		}
	}

	return false;
}
