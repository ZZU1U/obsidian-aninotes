import { FrontmatterEntry, NoteTemplateSettings } from "./models"

export const REQUIRED_FIELDS: FrontmatterEntry[] = [
	{ key: "id", value: "{{{media.id}}}", type: "number" },
	{ key: "man", value: "man", type: "text" },
]

export const DEFAULT_ANIME_T: NoteTemplateSettings = {
	fileDir: "AL/Anime",
	fileNameT: "{{{safename title.userPreferred}}} ({{{capital format}}}, {{{id}}}).md",
	frontMatterT: [
		{ key: "title", value: "{{{media.title.userPreferred}}}", type: "text" },
		{ key: "format", value: "{{{media.format}}}", type: "text" },
		{ key: "score", value: "{{{score}}}", type: "number" },
		{ key: "status", value: "{{{status}}}", type: "text" },
		{ key: "genres", value: "{{#each media.genres}}{{{wikilink this}}}:::{{/each}}", type: "list" },
	],
	noteBodyT: "{{{notes}}}\n\n{{{callout \"summary\" \"Description\" media.description}}}"
}

export const DEFAULT_MANGA_T: NoteTemplateSettings = {
	fileDir: "AL/Manga",
	fileNameT: "{{{safename title.userPreferred}}} ({{{capital format}}}, {{{id}}}).md",
	frontMatterT: [
		{ key: "title", value: "{{{media.title.userPreferred}}}", type: "text" },
		{ key: "format", value: "{{{media.format}}}", type: "text" },
		{ key: "score", value: "{{{score}}}", type: "number" },
		{ key: "status", value: "{{{status}}}", type: "text" },
		{ key: "genres", value: "{{#each media.genres}}{{{wikilink this}}}:::{{/each}}", type: "list" },
	],
	noteBodyT: "{{{notes}}}\n\n{{{callout \"summary\" \"Description\" media.description}}}"
}
