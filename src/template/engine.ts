/**
 * Simple Template Engine for Obsidian Plugin
 * 
 * This is a lightweight template engine that replaces {{variable}} placeholders
 * with values from a data object. Supports nested properties and basic filtering.
 * 
 * Usage:
 * ```typescript
 * import { processTemplate } from './template/engine';
 * 
 * const template = 'Hello {{name}}! Today is {{date}}.';
 * const data = { name: 'World', date: new Date().toLocaleDateString() };
 * const result = processTemplate(template, data);
 * // Result: "Hello World! Today is 2/2/2026."
 * ```
 */

/**
 * Main template processing function
 * 
 * @param template - Template string with {{variable}} placeholders
 * @param data - Object containing variables to fill the template
 * @returns Processed string with variables replaced by their values
 */
export function processTemplate(template: string, data: Record<string, unknown>): string {
	let result = template;
	
	// Replace {{variable}} patterns with actual values
	const regex = /{{([^}]+)}}/g;
	
	return result.replace(regex, (match, variablePath) => {
		const trimmedPath = variablePath.trim();
		
		// Handle basic filters (e.g., {{name | uppercase}})
		const [path, ...filterParts] = trimmedPath.split('|').map((part: string) => part.trim());
		let value = getNestedValue(data, path);
		
		// Apply filters if any
		if (filterParts.length > 0 && value !== undefined) {
			value = applyFilters(String(value), filterParts);
		}
		
		return value !== undefined ? String(value) : match;
	});
}

/**
 * Get nested value from object using dot notation
 * 
 * @param obj - The object to search in
 * @param path - Dot-separated path (e.g., "user.name" or "items.0")
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	const keys = path.split('.');
	let current: unknown = obj;
	
	for (const key of keys) {
		if (current && typeof current === 'object' && key in current) {
			current = (current as Record<string, unknown>)[key];
		} else {
			return undefined;
		}
	}
	
	return current;
}

/**
 * Apply basic filters to a value
 * 
 * @param value - The value to filter
 * @param filters - Array of filter names with optional parameters
 * @returns The filtered value
 */
function applyFilters(value: string, filters: string[]): string {
	let result = value;
	
	for (const filter of filters) {
		const [filterName, ...params] = filter.split(':').map(p => p.trim());
		
		switch (filterName) {
			case 'uppercase':
				result = result.toUpperCase();
				break;
			case 'lowercase':
				result = result.toLowerCase();
				break;
			case 'capitalize':
				result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
				break;
			case 'titlecase':
				result = result.replace(/\w\S*/g, (txt) => 
					txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
				);
				break;
			case 'sentencecase':
				result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
				break;
			case 'camelcase':
				result = result.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
					index === 0 ? word.toLowerCase() : word.toUpperCase()
				).replace(/\s+/g, '');
				break;
			case 'snakecase':
				result = result.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
				break;
			case 'kebabcase':
				result = result.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
				break;
			case 'trim':
				result = result.trim();
				break;
			case 'length':
				result = String(result.length);
				break;
			case 'reverse':
				result = result.split('').reverse().join('');
				break;
			case 'join':
				if (params.length > 0) {
					// For arrays, join with the specified separator
					try {
						const parsed = JSON.parse(result);
						if (Array.isArray(parsed)) {
							result = parsed.join(params[0]!);
						}
					} catch {
						// If not valid JSON, treat as string
						result = result.split(',').join(params[0]!);
					}
				}
				break;
			case 'default':
				if (!result || result === 'undefined' || result === 'null') {
					result = params[0] || '';
				}
				break;
			case 'last':
				// Get last item from array or last word from string
				try {
					const parsed = JSON.parse(result);
					if (Array.isArray(parsed) && parsed.length > 0) {
						result = String(parsed[parsed.length - 1]);
					} else {
						// If not valid JSON or empty array, treat as string and get last word
						const words = result.trim().split(/\s+/);
						result = words[words.length - 1] || '';
					}
				} catch {
					// If not valid JSON, treat as string and get last word
					const words = result.trim().split(/\s+/);
					result = words[words.length - 1] || '';
				}
				break;
			case 'safename':
			case 'safe_name':
				// Create safe filename for Obsidian
				result = result
					.replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
					.replace(/[#[\]^]/g, '') // Remove Obsidian-specific problematic characters
					.replace(/^\./, '_') // Don't start with dot
					.replace(/^\.+/, '') // Remove leading periods
					.trim()
					.slice(0, 245); // Limit length
				if (result.length === 0) {
					result = 'Untitled';
				}
				break;
			case 'wikilink':
				// Convert to Obsidian wikilink format
				result = `[[${result}]]`;
				break;
			case 'link':
				// Convert to markdown link format
				{
					const linkText = params[0] || result;
					result = `[${linkText}](${result})`;
				}
				break;
			case 'unique':
				// For arrays, return unique items
				try {
					const parsed = JSON.parse(result);
					if (Array.isArray(parsed)) {
						result = JSON.stringify([...new Set(parsed)]);
					}
				} catch {
					// If not valid JSON, treat as string and remove duplicate words
					const words = result.split(/\s+/);
					const uniqueWords = [...new Set(words)];
					result = uniqueWords.join(' ');
				}
				break;
			case 'date':
				if (params.length > 0) {
					try {
						const date = new Date(result);
						if (params[0] === 'locale') {
							result = date.toLocaleDateString();
						} else if (params[0] === 'time') {
							result = date.toLocaleTimeString();
						} else if (params[0] === 'datetime') {
							result = date.toLocaleString();
						} else {
							// Custom format (basic implementation)
							result = date.toISOString().split('T')[0] || ''; // YYYY-MM-DD
						}
					} catch {
						// Keep original value if it's not a valid date
					}
				}
				break;
		}
	}
	
	return result;
}

/**
 * Export types for external use
 */
export type TemplateData = Record<string, unknown>;
