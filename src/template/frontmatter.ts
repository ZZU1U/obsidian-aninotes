/**
 * Build note content from frontmatter entries and body template.
 * Minimal YAML stringify for Obsidian frontmatter (string, number, boolean, string[]).
 */

export interface FrontmatterEntry {
	key: string;
	value: string;
	type: "text" | "list" | "number" | "date" | "datetime" | "checkbox";
}

function escapeYamlString(s: string): string {
	if (s.includes("\n") || s.includes(":") || s.startsWith("#") || s.includes("'") || s === "true" || s === "false" || s === "null") {
		return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
	}
	return s;
}

function stringifyFrontmatter(obj: Record<string, unknown>): string {
	const lines: string[] = [];
	for (const [key, val] of Object.entries(obj)) {
		if (val === undefined || val === null) {
			lines.push(`${key}: null`);
		} else if (Array.isArray(val)) {
			lines.push(`${key}:`);
			for (const item of val) {
				lines.push(`  - ${escapeYamlString(String(item))}`);
			}
		} else if (typeof val === "number" || typeof val === "boolean") {
			lines.push(`${key}: ${val}`);
		} else {
			const str = String(val);
			if (str.includes("\n")) {
				lines.push(`${key}: |`);
				for (const line of str.split("\n")) {
					lines.push(`  ${line.replace(/\s+$/, "")}`);
				}
			} else {
				lines.push(`${key}: "${escapeYamlString(str)}"`);
			}
		}
	}
	return lines.join("\n");
}

/**
 * Build frontmatter object from entries: render each entry's value with context,
 * then assign to key (as string or list by entry.type).
 */
export function buildFrontmatterFromEntries(
	entries: FrontmatterEntry[],
	context: Record<string, unknown>,
	render: (template: string, ctx: Record<string, unknown>) => string
): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	for (const entry of entries) {
		const key = entry.key.trim();
		if (!key) continue;

		const raw = render(entry.value, context);
		if (entry.type === "list") {
			const list = raw
				.split("\n")
				.map((s) => s.trim())
				.filter(Boolean);
			out[key] = list;
		} else {
			out[key] = raw;
		}
	}

	return out;
}

/**
 * Build full note content: YAML frontmatter + "---" + body.
 */
export function buildNoteContent(
	frontmatter: Record<string, unknown>,
	body: string
): string {
	const yaml = stringifyFrontmatter(frontmatter);
	const bodyTrimmed = body.trimEnd();
	return yaml ? `---\n${yaml}\n---\n\n${bodyTrimmed}` : bodyTrimmed;
}
