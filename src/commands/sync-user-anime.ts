import { Notice } from "obsidian";
import MANPlugin from "main";
import { processTemplate, buildFrontmatterFromEntries, buildNoteContent } from "template";
import { getUserAnimeList } from "api/anime";
import { getNoteFilename } from "tools/fs";
import path from "path";

export default async function syncUserAnimeList(this: MANPlugin) {
    if (!this.settings.tokenAL?.access_token) {
        new Notice("You need to log in first");
        return;
    }

    if (!this.settings.accountALInfo) {
        new Notice("You need to fetch your account data in settings");
        return;
    }

    const userList = await getUserAnimeList(this.settings.tokenAL.access_token, this.settings.accountALInfo.id);

    if (!userList) {
        new Notice("There seems to be a problem with your anime list");
        return;
    }

    const fmt = this.settings.animeNoteT.frontMatterT;
    const notesDir = this.settings.animeNoteT.fileDir;
    const bodyT = this.settings.animeNoteT.noteBodyT;

    console.debug(fmt);

    for (const anime of userList) {
        const context = anime as unknown as Record<string, unknown>;
        console.debug(context);
        //const fullPath = path.join(notesDir, getNoteFilename(anime));
        const fullPath = processTemplate("{{romajiTitle|safe_name}} ({{format|title_case}}, {{id}}).md", context);
        const noteContent = processTemplate(bodyT, context)
        const file = await this.app.vault.create(fullPath, noteContent);
        await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
            for (const prop of fmt) {
                fm[prop.key] = processTemplate(prop.value, context);
            }
        });
    }
}