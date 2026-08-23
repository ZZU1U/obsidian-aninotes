export type FrontmatterType = "text" | "list" | "number" | "date" | "datetime" | "checkbox";

export interface FrontmatterEntry {
	key: string;
	value: string;
	type: FrontmatterType;
}

export interface NoteTemplateSettings {
	fileNameT: string;
	fileDir: string;
	frontMatterT: FrontmatterEntry[];
	noteBodyT: string;
}
