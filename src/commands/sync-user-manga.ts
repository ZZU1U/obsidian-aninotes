import { Notice } from "obsidian";
import MANPlugin from "main";
import { getUserMangaList } from "api/manga";
import { REQUIRED_FIELDS } from "template/constant";
import hb from "template/engine";
import { buildFrontmatterFromEntries } from "template/frontmatter";
import type { MediaList } from "generated/anilist-schema";

export default async function syncUserMangaList(this: MANPlugin) {
    if (!this.settings.tokenAL?.access_token) {
        new Notice("You need to log in first");
        return;
    }

    if (!this.settings.accountALInfo) {
        new Notice("You need to fetch your account data in settings");
        return;
    }

    const userList = await getUserMangaList(
        this.settings.tokenAL.access_token,
        this.settings.accountALInfo.id,
        this.settings.apiFetchOptions,
        this.settings.useCustomMangaRequest,
        this.settings.customMangaRequest,
    );

    if (!userList) {
        new Notice("There seems to be a problem with your manga list");
        return;
    }

    const fetchedMangaByID: Record<number, MediaList> = {};
    for (const manga of userList) {
        if (manga.media?.id) fetchedMangaByID[manga.media.id] = manga;
    }

    const notesDir = this.settings.mangaNoteT.fileDir;
    const fileName = hb.compile(this.settings.mangaNoteT.fileNameT);

    if (!this.settings.allowUserNoteNames) {
        for (const file of (await this.app.vault.adapter.list(notesDir)).files) {
            const tfile = this.app.vault.getFileByPath(file);
            if (!tfile) continue;

            await this.app.fileManager.processFrontMatter(tfile, (fm: Record<string, unknown>) => {
                if (fm.man === "man" && fm.id && fetchedMangaByID[fm.id as number]) {
                    const noteManga = fetchedMangaByID[fm.id as number];
                    if (tfile.name !== fileName(noteManga)) {
                        this.app.vault.rename(tfile, `${notesDir}/${fileName(noteManga)}`).catch(()=>{});
                    }
                }
            });
        }
    }

    const fmt = this.settings.mangaNoteT.frontMatterT.concat(REQUIRED_FIELDS);
    const bodyT = hb.compile(this.settings.mangaNoteT.noteBodyT);

    try {
        for (const manga of userList) {
            const fullPath = `${notesDir}/${fileName(manga)}`;
            
            let file = this.app.vault.getFileByPath(fullPath);

            if (!file) {
                const noteContent = bodyT(manga);
                file = await this.app.vault.create(fullPath, noteContent);
            }

            const fmtData = buildFrontmatterFromEntries(fmt, manga);

            await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
                for (const prop of fmt) {
                    fm[prop.key] = fmtData[prop.key];
                }
            });
        }
    } catch (error) {
        console.error(error);
        new Notice("There was an error syncing your manga list. Check the console for more details.");
    }
}
