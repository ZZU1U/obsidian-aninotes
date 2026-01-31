import { FrontmatterEntry } from "settings";

export interface NoteTemplateSettings {
    fileNameT: string,
    frontMatterT: FrontmatterEntry[],
    noteBodyT: string
}