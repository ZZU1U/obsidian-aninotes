import type { FrontmatterEntry, NoteTemplateSettings } from "./models";

/**
 * Legacy frontmatter marker written by older plugin versions. New notes no
 * longer carry it; sync strips it from existing notes.
 */
export const MAN_MARKER = "man";

export const REQUIRED_FIELDS: FrontmatterEntry[] = [
	{ key: "ALId", value: "media.id", type: "number" },
];

export const DEFAULT_ANIME_T: NoteTemplateSettings = {
	fileDir: "AL/Anime",
	fileNameT: "$safename(title.userPreferred) & \" (\" & $capital(format) & \", \" & $string(id) & \").md\"",
	frontMatterT: [
		{ key: "title", value: "media.title.userPreferred", type: "text" },
		{ key: "format", value: "media.format", type: "text" },
		{ key: "score", value: "score", type: "number" },
		{ key: "status", value: "status", type: "text" },
		{ key: "genres", value: "media.genres.$wikilink($)", type: "list" },
	],
	noteBodyT: "$string(notes) & \"\\n\\n\" & $callout(\"summary\", \"Description\", media.description)"
}

export const DEFAULT_MANGA_T: NoteTemplateSettings = {
	fileDir: "AL/Manga",
	fileNameT: "$safename(title.userPreferred) & \" (\" & $capital(format) & \", \" & $string(id) & \").md\"",
	frontMatterT: [
		{ key: "title", value: "media.title.userPreferred", type: "text" },
		{ key: "format", value: "media.format", type: "text" },
		{ key: "score", value: "score", type: "number" },
		{ key: "status", value: "status", type: "text" },
		{ key: "genres", value: "media.genres.$wikilink($)", type: "list" },
	],
	noteBodyT: "$string(notes) & \"\\n\\n\" & $callout(\"summary\", \"Description\", media.description)"
}
