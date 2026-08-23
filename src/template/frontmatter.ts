/**
 * Evaluates frontmatter entries against a MediaList context and coerces
 * the results to each entry's declared property type.
 */
import engine from "./engine";
import type { FrontmatterEntry, FrontmatterType } from "./models";
import type { MediaList } from "../generated/anilist-schema";

export async function buildFrontmatterFromEntries(
	entries: FrontmatterEntry[],
	context: MediaList,
): Promise<Record<string, unknown>> {
	const out: Record<string, unknown> = {};

	for (const entry of entries) {
		const key = entry.key.trim();
		if (!key) continue;

		const raw = await (await engine.compileRaw(entry.value))(context);
		out[key] = coerceFrontmatterValue(raw, entry.type);
	}

	return out;
}

/**
 * Coerces a raw template result to the declared property type. Values that
 * cannot be meaningfully coerced are returned unchanged.
 */
export function coerceFrontmatterValue(raw: unknown, type: FrontmatterType): unknown {
	switch (type) {
		case "number": {
			if (typeof raw === "number" && Number.isFinite(raw)) return raw;
			if (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))) return Number(raw);
			return raw;
		}
		case "checkbox": {
			if (typeof raw === "boolean") return raw;
			if (typeof raw === "string") {
				const normalized = raw.trim().toLowerCase();
				if (normalized === "true") return true;
				if (normalized === "false") return false;
			}
			return raw;
		}
		case "list": {
			if (Array.isArray(raw)) return raw;
			if (raw === null || raw === undefined || raw === "") return raw;
			return [raw];
		}
		case "text":
		case "date":
		case "datetime":
			return raw;
	}
}
