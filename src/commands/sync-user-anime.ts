import { Notice } from "obsidian";
import MANPlugin from "main";
import { getUserAnimeList } from "api/anime";
import { getFilename } from "tools/fs";
import path from "path";
import { REQUIRED_FIELDS } from "template/constant";
import hb from "template/engine";
import { buildFrontmatterFromEntries } from "template/frontmatter";

export default async function syncUserAnimeList(this: MANPlugin) {
    if (!this.settings.tokenAL?.access_token) {
        new Notice("You need to log in first");
        return;
    }

    if (!this.settings.accountALInfo) {
        new Notice("You need to fetch your account data in settings");
        return;
    }

    const userList = await getUserAnimeList(
        this.settings.tokenAL.access_token,
        this.settings.accountALInfo.id,
        this.settings.apiFetchOptions
    );

    if (!userList) {
        new Notice("There seems to be a problem with your anime list");
        return;
    }

    const fmt = this.settings.animeNoteT.frontMatterT.concat(REQUIRED_FIELDS);
    const notesDir = this.settings.animeNoteT.fileDir;
    const bodyT = hb.compile(this.settings.animeNoteT.noteBodyT);

    console.debug(fmt);

    for (const anime of userList) {
        const fullPath = path.join(notesDir, getFilename(anime));
        
        let file = this.app.vault.getFileByPath(fullPath);

        if (!file) {
            const noteContent = bodyT(anime);
            file = await this.app.vault.create(fullPath, noteContent);
        }

        const fmtData = buildFrontmatterFromEntries(fmt, anime);
        console.debug(anime)
        console.debug(fmtData)

        await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
            for (const prop of fmt) {
                fm[prop.key] = fmtData[prop.key];
            }
        });
    }
}