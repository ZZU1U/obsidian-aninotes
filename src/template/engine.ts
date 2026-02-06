import { FuzzyDate } from "generated/anilist-schema";

type HandlebarsInstance = {
	registerHelper: (name: string, fn: Function) => void;
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
			return str.toUpperCase();
		});

		Handlebars.registerHelper('lower', function (str: string) {
			return str.toLowerCase();
		});

		Handlebars.registerHelper('capital', function (str: string) {
			return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
		});

		Handlebars.registerHelper('trim', function (str: string) {
			return str.trim();
		});

		Handlebars.registerHelper('safename', function (str: string) {
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
			return `[[${val}]]`;
		});

		Handlebars.registerHelper('link', function (url: string, face: string) {
			return `[${face}](${url})`;
		});

		Handlebars.registerHelper('date', function (fzDate: FuzzyDate) {
			return `${fzDate.year}-${fzDate.month}-${fzDate.day}`;
		});

		Handlebars.registerHelper('callout', function (type: string, title: string, content: string) {
			const lines = content.split('\n');
			return `> [!${type}]- ${title}\n` + lines.map(line => `> ${line}`).join('\n');
		});
	}
}

// Export API that matches Handlebars but with dynamic loading
const HandlebarsDynamic = {
	registerHelper: async (name: string, fn: Function) => {
		const hb = await getHandlebars();
		hb.registerHelper(name, fn);
	},
	
	compile: async (template: string) => {
		const hb = await getHandlebars();
		return hb.compile(template);
	}
};

export default HandlebarsDynamic;