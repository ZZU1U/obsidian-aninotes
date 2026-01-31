/**
 * Clipper-style template filters.
 * Use in templates as {{variable|filter}} or {{variable|filter:arg}}.
 * Chaining: {{variable|filter1|filter2}}.
 */

export type FilterFn = (value: unknown, arg?: string) => unknown;

function toString(v: unknown): string {
	if (v === null || v === undefined) return "";
	if (typeof v === "string") return v;
	if (typeof v === "number" || typeof v === "boolean") return String(v);
	if (Array.isArray(v)) return v.map(toString).join(", ");
	if (typeof v === "object") return JSON.stringify(v);
	return String(v);
}

function ensureString(v: unknown): string {
	return toString(v);
}

function ensureArray(v: unknown): unknown[] {
	if (Array.isArray(v)) return v;
	if (v === null || v === undefined) return [];
	return [v];
}

/** Registry of filter name -> function (value, optionalArg) -> new value */
export const TEMPLATE_FILTERS: Record<string, FilterFn> = {
	// Text formatting (Clipper-style)
	wikilink: (v) => {
		const arr = ensureArray(v);
		return arr
			.map((item) => {
				const s = ensureString(item).trim();
				return s ? `[[${s}]]` : "";
			})
			.filter(Boolean)
			.join(" ");
	},
	link: (v, arg) => {
		const s = ensureString(v).trim();
		return arg ? `[${s}](${arg})` : s;
	},
	blockquote: (v) => {
		const s = ensureString(v).trim();
		return s ? s.split("\n").map((line) => `> ${line}`).join("\n") : "";
	},
	list: (v) => {
		const arr = ensureArray(v);
		return arr.map((item) => `- ${toString(item)}`).join("\n");
	},

	// Text case
	lower: (v) => ensureString(v).toLowerCase(),
	upper: (v) => ensureString(v).toUpperCase(),
	title: (v) =>
		ensureString(v).replace(/\b\w/g, (c) => c.toUpperCase()),
	capitalize: (v) => {
		const s = ensureString(v);
		return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
	},

	// Text normalization
	trim: (v) => ensureString(v).trim(),
	snake: (v) =>
		ensureString(v)
			.trim()
			.replace(/\s+/g, "_")
			.replace(/[^\w\-]/g, "")
			.toLowerCase(),
	kebab: (v) =>
		ensureString(v)
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^\w\-]/g, "")
			.toLowerCase(),
	safe_name: (v) =>
		ensureString(v)
			.replace(/[<>:"/\\|?*]/g, "")
			.trim(),

	// Default / fallback
	default: (v, arg) => (v !== null && v !== undefined && ensureString(v) !== "" ? v : (arg ?? "")),

	// Arrays and objects
	join: (v, arg) => {
		const arr = ensureArray(v);
		const sep = arg ?? ", ";
		return arr.map(toString).join(sep);
	},
	/** Join with newline (for list-type frontmatter: split by \\n in note builder). */
	lines: (v) => {
		const arr = ensureArray(v);
		return arr.map(toString).join("\n");
	},
	first: (v) => {
		const arr = ensureArray(v);
		return arr.length ? arr[0] : "";
	},
	last: (v) => {
		const arr = ensureArray(v);
		return arr.length ? arr[arr.length - 1] : "";
	},
	nth: (v, arg) => {
		const arr = ensureArray(v);
		const i = parseInt(arg ?? "0", 10);
		return arr[i] ?? "";
	},
	map: (v, arg) => {
		const arr = ensureArray(v);
		if (!arg) return arr;
		return arr.map((item) => {
			if (item !== null && typeof item === "object" && arg in item) {
				return (item as Record<string, unknown>)[arg];
			}
			return item;
		});
	},
	length: (v) => {
		if (Array.isArray(v)) return v.length;
		return ensureString(v).length;
	},

	// Numbers
	round: (v, arg) => {
		const n = Number(v);
		const decimals = parseInt(arg ?? "0", 10);
		return isNaN(n) ? "" : n.toFixed(decimals);
	},
};
