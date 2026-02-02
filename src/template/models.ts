import { FrontmatterEntry } from "settings";

export interface NoteTemplateSettings {
    fileDir: string,
    frontMatterT: FrontmatterEntry[],
    noteBodyT: string
}