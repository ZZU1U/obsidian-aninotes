import { FrontmatterEntry, NoteTemplateSettings } from "./models"

export const REQUIRED_FIELDS: FrontmatterEntry[] = [
	{ key: "id", value: "{{id}}", type: "text" },
	{ key: "man", value: "man", type: "text" },
]

export const DEFAULT_ANIME_T: NoteTemplateSettings = {
	fileDir: "AL/Anime",
	frontMatterT: [
		{ key: "title", value: "{{{media.title.userPreferred}}}", type: "text" },
		{ key: "id", value: "{{{media.id}}}", type: "text" },
		{ key: "format", value: "{{{media.format}}}", type: "text" },
		{ key: "score", value: "{{{score}}}", type: "text" },
		{ key: "status", value: "{{{status}}}", type: "text" },
		{ key: "genres", value: "{{#each media.genres}}{{{wikilink this}}}:::{{/each}}", type: "list" },
	],
	noteBodyT: "{{{notes}}}\n\n{{{callout \"summary\" \"Description\" media.description}}}"
}

export const DEFAULT_MANGA_T: NoteTemplateSettings = {
	fileDir: "AL/Manga",
	frontMatterT: [
		{ key: "title", value: "{{{media.title.userPreferred}}}", type: "text" },
		{ key: "id", value: "{{{media.id}}}", type: "text" },
		{ key: "format", value: "{{{media.format}}}", type: "text" },
		{ key: "score", value: "{{{score}}}", type: "text" },
		{ key: "status", value: "{{{status}}}", type: "text" },
		{ key: "genres", value: "{{#each media.genres}}{{{wikilink this}}}:::{{/each}}", type: "list" },
	],
	noteBodyT: "{{{notes}}}\n\n{{{callout \"summary\" \"Description\" media.description}}}"
}

export const FILE_NAME_TEMPLATE = "{{title|safename}} ({{media_type|capitalize}}, {{id}}).md"