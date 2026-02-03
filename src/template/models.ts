export interface FrontmatterEntry {
	key: string;
	value: string;
	type: "text" | "list" | "number" | "date" | "datetime" | "checkbox";
}

export interface NoteTemplateSettings {
    fileDir: string,
    frontMatterT: FrontmatterEntry[],
    noteBodyT: string
}