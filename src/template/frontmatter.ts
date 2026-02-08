/**
 * Build note content from frontmatter entries and body template.
 * Minimal YAML stringify for Obsidian frontmatter (string, number, boolean, string[]).
 */

import { FrontmatterEntry } from "./models";
import Handlebars from "./engine";
import { MediaList } from "generated/anilist-schema";

export async function buildFrontmatterFromEntries(
	entries: FrontmatterEntry[],
	context: MediaList,
): Promise<Record<string, unknown>> {
	const out: Record<string, unknown> = {};

	for (const entry of entries) {
		const key = entry.key.trim();
		if (!key) continue;

		out[key] = await (await Handlebars.compileRaw(entry.value))(context);
	}

	return out;
}