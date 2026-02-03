import { FrontmatterEntry, NoteTemplateSettings } from "./models"

export const REQUIRED_FIELDS: FrontmatterEntry[] = [
	{ key: "id", value: "{{id}}", type: "text" },
	{ key: "man", value: "man", type: "text" },
]

export const DEFAULT_ANIME_T: NoteTemplateSettings = {
	fileDir: "AL/Anime",
	frontMatterT: [
		{ key: "title", value: "{{title}}", type: "text" },
		{ key: "media_type", value: "{{media_type}}", type: "text" },
		{ key: "score", value: "{{score}}", type: "text" },
		{ key: "watch_status", value: "{{watch_status}}", type: "text" },
		{ key: "genres", value: "{{genres}}", type: "list" },
		{ key: "studios", value: "{{studios}}", type: "list" },
	],
	noteBodyT: "{{synopsis|callout:( \"summary\", \"Synopsis\", true)}} "
}

export const DEFAULT_MANGA_T: NoteTemplateSettings = {
	fileDir: "AL/Manga",
	frontMatterT: [
		{ key: "title", value: "{{title}}", type: "text" },
		{ key: "mal_id", value: "{{id}}", type: "text" },
		{ key: "score", value: "{{score}}", type: "text" },
	],
	noteBodyT: "{{synopsis|callout:( \"summary\", \"Synopsis\", true)}} "
}

export const FILE_NAME_TEMPLATE = "{{title|safename}} ({{media_type|capitalize}}, {{id}}).md"