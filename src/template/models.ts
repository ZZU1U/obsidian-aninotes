export interface FrontmatterEntry {
	key: string;
	value: string;
	type: "text" | "list" | "number" | "date" | "datetime" | "checkbox";
}

export interface NoteTemplateSettings {
    fileNameT: string,
    fileDir: string,
    frontMatterT: FrontmatterEntry[],
    noteBodyT: string
}