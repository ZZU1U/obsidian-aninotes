/**
 * Test the new filters in the template engine
 */

function processTemplate(template: string, data: Record<string, unknown>): string {
	let result = template;
	
	const regex = /{{([^}]+)}}/g;
	
	return result.replace(regex, (match, variablePath) => {
		const trimmedPath = variablePath.trim();
		const [path, ...filterParts] = trimmedPath.split('|').map((part: string) => part.trim());
		let value = getNestedValue(data, path);
		
		if (filterParts.length > 0 && value !== undefined) {
			value = applyFilters(String(value), filterParts);
		}
		
		return value !== undefined ? String(value) : match;
	});
}

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
			case 'last':
				try {
					const parsed = JSON.parse(result);
					if (Array.isArray(parsed) && parsed.length > 0) {
						result = String(parsed[parsed.length - 1]);
					}
				} catch {
					const words = result.trim().split(/\s+/);
					result = words[words.length - 1];
				}
				break;
			case 'safename':
			case 'safe_name':
				result = result
					.replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
					.replace(/[#[\]^]/g, '')
					.replace(/^\./, '_')
					.replace(/^\.+/, '')
					.trim()
					.slice(0, 245);
				if (result.length === 0) {
					result = 'Untitled';
				}
				break;
			case 'wikilink':
				result = `[[${result}]]`;
				break;
			case 'link':
				{
					const linkText = params[0] || result;
					result = `[${linkText}](${result})`;
				}
				break;
			case 'unique':
				try {
					const parsed = JSON.parse(result);
					if (Array.isArray(parsed)) {
						result = JSON.stringify([...new Set(parsed)]);
					}
				} catch {
					const words = result.split(/\s+/);
					const uniqueWords = [...new Set(words)];
					result = uniqueWords.join(' ');
				}
				break;
		}
	}
	
	return result;
}

// Test the new filters
function runTests() {
	console.log('=== Testing New Filters ===');
	
	const testData = {
		title: 'hello world from obsidian plugin',
		tags: ['obsidian', 'plugin', 'template', 'obsidian'],
		url: 'https://example.com/page',
		filename: 'My<File>Name:With*Bad#[Characters]^.txt'
	};
	
	// Test case filters
	console.log('\n--- Case Filters ---');
	console.log('Original:', testData.title);
	console.log('uppercase:', processTemplate('{{title | uppercase}}', testData));
	console.log('lowercase:', processTemplate('{{title | lowercase}}', testData));
	console.log('capitalize:', processTemplate('{{title | capitalize}}', testData));
	console.log('titlecase:', processTemplate('{{title | titlecase}}', testData));
	console.log('sentencecase:', processTemplate('{{title | sentencecase}}', testData));
	console.log('camelcase:', processTemplate('{{title | camelcase}}', testData));
	console.log('snakecase:', processTemplate('{{title | snakecase}}', testData));
	console.log('kebabcase:', processTemplate('{{title | kebabcase}}', testData));
	
	// Test other filters
	console.log('\n--- Other Filters ---');
	console.log('last tag:', processTemplate('{{tags | last}}', testData));
	console.log('unique tags:', processTemplate('{{tags | unique}}', testData));
	console.log('safe filename:', processTemplate('{{filename | safe_name}}', testData));
	console.log('wikilink:', processTemplate('{{title | wikilink}}', testData));
	console.log('markdown link:', processTemplate('{{url | link:Click here}}', testData));
}

runTests();
