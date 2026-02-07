import jsonata from "jsonata";
import { FuzzyDate } from "generated/anilist-schema";

type JsonataExpression = {
	evaluate: (input: unknown) => unknown;
	registerFunction: (name: string, implementation: (...args: unknown[]) => unknown, signature?: string) => void;
};

type JsonataFactory = (expression: string) => JsonataExpression;

type TemplateFunction = (data: Record<string, unknown>) => Promise<string>;
type RawTemplateFunction = (data: Record<string, unknown>) => Promise<unknown>;
type HelperFunction = (...args: unknown[]) => unknown;

const registeredHelpers = new Map<string, { fn: HelperFunction; signature?: string }>();

const jsonataFactory = jsonata as unknown as JsonataFactory;

function coerceString(val: unknown): string {
	if (val === null || val === undefined) return "";
	if (typeof val === "string") return val;
	if (typeof val === "number" || typeof val === "boolean") return String(val);
	try {
		return JSON.stringify(val);
	} catch {
		if (typeof val === "object") return Object.prototype.toString.call(val);
		return String(val);
	}
}

function registerBuiltInHelpers() {
	// Keep parity with previous Handlebars helpers, but as Jsonata functions
	registeredHelpers.set("upper", {
		fn: (str: unknown) => coerceString(str).toUpperCase(),
		signature: "<s:s>",
	});

	registeredHelpers.set("lower", {
		fn: (str: unknown) => coerceString(str).toLowerCase(),
		signature: "<s:s>",
	});

	registeredHelpers.set("capital", {
		fn: (str: unknown) => {
			const s = coerceString(str);
			if (!s) return "";
			return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
		},
		signature: "<s:s>",
	});

	registeredHelpers.set("trim", {
		fn: (str: unknown) => coerceString(str).trim(),
		signature: "<s:s>",
	});

	registeredHelpers.set("safename", {
		fn: (str: unknown) => {
			const s = coerceString(str);
			if (!s) return "";
			return s
				// eslint-disable-next-line no-control-regex
				.replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
				.replace(/[#[\]^]/g, "")
				.replace(/^\./, "_")
				.replace(/^\.+/, "")
				.trim()
				.slice(0, 245);
		},
		signature: "<s:s>",
	});

	registeredHelpers.set("wikilink", {
		fn: (val: unknown) => {
			const s = coerceString(val);
			if (!s) return "";
			return `[[${s}]]`;
		},
		signature: "<s:s>",
	});

	registeredHelpers.set("link", {
		fn: (url: unknown, face: unknown) => {
			const u = coerceString(url);
			const f = coerceString(face);
			if (!u || !f) return "";
			return `[${f}](${u})`;
		},
		signature: "<ss:s>",
	});

	registeredHelpers.set("date", {
		fn: (fzDate: unknown) => {
			const d = fzDate as FuzzyDate | null | undefined;
			if (!d?.year || !d?.month || !d?.day) return "";
			const month = String(d.month).padStart(2, "0");
			const day = String(d.day).padStart(2, "0");
			return `${d.year}-${month}-${day}`;
		},
		// accept any object; return string
		signature: "<x:s>",
	});

	registeredHelpers.set("callout", {
		fn: (type: unknown, title: unknown, content: unknown) => {
			const t = coerceString(type);
			const ti = coerceString(title);
			const c = coerceString(content);
			if (!t || !ti || !c) return "";
			const lines = c.split("\n");
			return `> [!${t}]- ${ti}\n` + lines.map((line) => `> ${line}`).join("\n");
		},
		signature: "<sss:s>",
	});
}

registerBuiltInHelpers();

function applyHelpers(expr: JsonataExpression) {
	for (const [name, { fn, signature }] of registeredHelpers.entries()) {
		expr.registerFunction(name, fn, signature);
	}
}

async function evaluateExpression(expr: JsonataExpression, data: Record<string, unknown>): Promise<unknown> {
	const result = expr.evaluate(data);
	if (
		result &&
		(typeof result === "object" || typeof result === "function") &&
		"then" in (result as Record<string, unknown>) &&
		typeof (result as { then?: unknown }).then === "function"
	) {
		return await (result as Promise<unknown>);
	}
	return result;
}

const JsonataDynamic = {
	registerHelper: async (name: string, fn: HelperFunction, signature?: string) => {
		// NOTE: affects subsequent compile() calls
		registeredHelpers.set(name, { fn, signature });
	},

	compileRaw: async (template: string): Promise<RawTemplateFunction> => {
		const expr = jsonataFactory(template);
		applyHelpers(expr);
		return async (data: Record<string, unknown>) => evaluateExpression(expr, data);
	},

	compile: async (template: string): Promise<TemplateFunction> => {
		const raw = await JsonataDynamic.compileRaw(template);
		return async (data: Record<string, unknown>) => coerceString(await raw(data));
	},
};

export default JsonataDynamic;