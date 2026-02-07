import { FuzzyDate } from "generated/anilist-schema";
import { registerPartial } from "handlebars";

type HandlebarsHelperFunction = (...args: unknown[]) => unknown;
type HandlebarsTemplateFunction = string | HandlebarsHelperFunction;

type HandlebarsInstance = {
	registerHelper: (name: string, fn: HandlebarsHelperFunction) => void;
	registerPartial: (name: string, fn: HandlebarsTemplateFunction) => void;
	compile: (template: string) => (data: Record<string, unknown>) => string;
};

// Dynamic import cache
let Handlebars: HandlebarsInstance | null = null;
let helpersRegistered = false;

async function getHandlebars(): Promise<HandlebarsInstance> {
	if (!Handlebars) {
		const imported = await import("handlebars");
		Handlebars = imported.default || imported;
		if (!helpersRegistered) {
			registerHelpers();
			helpersRegistered = true;
		}
	}
	return Handlebars;
}

function registerHelpers() {
	// Register helpers only once
	if (Handlebars) {
		Handlebars.registerHelper('upper', function (str: string) {
			if (!str) return "";
			return str.toUpperCase();
		});

		Handlebars.registerHelper('lower', function (str: string) {
			if (!str) return "";
			return str.toLowerCase();
		});

		Handlebars.registerHelper('capital', function (str: string) {
			if (!str) return "";
			return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
		});

		Handlebars.registerHelper('trim', function (str: string) {
			if (!str) return "";
			return str.trim();
		});

		Handlebars.registerHelper('safename', function (str: string) {
			if (!str) return "";
			return str
				// eslint-disable-next-line no-control-regex
				.replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
				.replace(/[#[\]^]/g, '') // Remove Obsidian-specific problematic characters
				.replace(/^\./, '_') // Don't start with dot
				.replace(/^\.+/, '') // Remove leading periods
				.trim()
				.slice(0, 245); // Limit length
		});

		Handlebars.registerHelper('wikilink', function (val: string) {
			if (!val) return "";
			return `[[${val}]]`;
		});

		Handlebars.registerHelper('link', function (url: string, face: string) {
			if (!url || !face) return "";
			return `[${face}](${url})`;
		});

		Handlebars.registerHelper('date', function (fzDate: FuzzyDate) {
			if (!fzDate.year || !fzDate.month || !fzDate.day) return "";
			const month = String(fzDate.month).padStart(2, '0');
			const day = String(fzDate.day).padStart(2, '0');
			return `${fzDate.year}-${month}-${day}`;
		});

		Handlebars.registerHelper('callout', function (type: string, title: string, content: string) {
			if (!type || !title || !content) return "";
			const lines = content.split('\n');
			return `> [!${type}]- ${title}\n` + lines.map(line => `> ${line}`).join('\n');
		});
	}
}

// Export API that matches Handlebars but with dynamic loading
const HandlebarsDynamic = {
	registerHelper: async (name: string, fn: HandlebarsHelperFunction) => {
		const hb = await getHandlebars();
		hb.registerHelper(name, fn);
	},
	
	compile: async (template: string) => {
		const hb = await getHandlebars();
		return hb.compile(template);
	},

	registerPartial: async (name: string, fn: HandlebarsTemplateFunction) => {
		const hb = await getHandlebars();
		hb.registerPartial(name, fn);
	}
};

export default HandlebarsDynamic;