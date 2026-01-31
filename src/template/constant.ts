import { NoteTemplateSettings } from "./models"

export const DEFAULT_ANIME_T: NoteTemplateSettings = {
	fileNameT: "MAL/Anime/{{title}}.md",
	frontMatterT: [
		{ key: "title", value: "{{title}}", type: "text" },
		{ key: "mal_id", value: "{{id}}", type: "text" },
		{ key: "media_type", value: "{{media_type}}", type: "text" },
		{ key: "score", value: "{{score}}", type: "text" },
		{ key: "watch_status", value: "{{watch_status}}", type: "text" },
		{ key: "genres", value: "{{genres|map:name|lines}}", type: "list" },
		{ key: "studios", value: "{{studios|map:name|lines}}", type: "list" },
	],
	noteBodyT: "{{synopsis|callout:( \"summary\", \"Synopsis\", true)}} "
}

export const DEFAULT_MANGA_T: NoteTemplateSettings = {
	fileNameT: "MAL/Manga/{{title}}.md",
	frontMatterT: [
		{ key: "title", value: "{{title}}", type: "text" },
		{ key: "mal_id", value: "{{id}}", type: "text" },
		{ key: "score", value: "{{score}}", type: "text" },
	],
	noteBodyT: "{{synopsis|callout:( \"summary\", \"Synopsis\", true)}} "
}