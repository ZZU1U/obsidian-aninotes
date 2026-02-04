/**
 * Build note content from frontmatter entries and body template.
 * Minimal YAML stringify for Obsidian frontmatter (string, number, boolean, string[]).
 */

import { REQUIRED_FIELDS } from "./constant";
import { FrontmatterEntry } from "./models";
import Handlebars from "./engine";
import { MediaList } from "generated/anilist-schema";

export function buildFrontmatterFromEntries(
	entries: FrontmatterEntry[],
	context: MediaList,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	for (const entry of entries) {
		const key = entry.key.trim();
		if (!key) continue;

		out[key] = Handlebars.compile(entry.value)(context);
		
		if (entry.type === "list" && out[key] && typeof out[key] === "string" && out[key].includes(":::")) {
			out[key] = out[key].split(":::").map(s => s.trim()).filter(Boolean);
		}
	}

	return out;
}