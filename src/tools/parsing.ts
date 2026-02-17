/**
 * Converts HTML tags to their markdown equivalents
 * @param content - The HTML content to convert
 * @returns The content with HTML tags converted to markdown
 */
export function htmlToMarkdown(content: string): string {
	return content
		.replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
		.replace(/<\/?i>/gi, '*')  // Convert <i> and </i> to *
		.replace(/<\/?em>/gi, '*')  // Convert <em> and </em> to *
		.replace(/<\/?b>/gi, '**')  // Convert <b> and </b> to **
		.replace(/<\/?strong>/gi, '**')  // Convert <strong> and </strong> to **
		.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n')  // Double <br> to paragraph break
		.replace(/\n{3,}/g, '\n\n');  // Normalize multiple newlines
}
