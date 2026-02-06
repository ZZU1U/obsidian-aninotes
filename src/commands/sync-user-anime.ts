import { Notice } from "obsidian";
import MANPlugin from "main";
import { getUserAnimeList } from "api/anime";
import { REQUIRED_FIELDS } from "template/constant";
import hb from "template/engine";
import { buildFrontmatterFromEntries } from "template/frontmatter";
import type { MediaList } from "generated/anilist-schema";

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
        this.settings.apiFetchOptions,
        this.settings.useCustomAnimeRequest,
        this.settings.customAnimeRequest,
    );

    if (!userList) {
        new Notice("There seems to be a problem with your anime list");
        return;
    }

    const fetchedAnimeByID: Record<number, MediaList> = {};
    for (const anime of userList) {
        if (anime.media?.id) fetchedAnimeByID[anime.media.id] = anime;
    }

    const notesDir = this.settings.animeNoteT.fileDir;
    const fileName = hb.compile(this.settings.animeNoteT.fileNameT);

    if (!this.settings.allowUserNoteNames) {
        for (const file of (await this.app.vault.adapter.list(notesDir)).files) {
            const tfile = this.app.vault.getFileByPath(file);
            if (!tfile) continue;

            await this.app.fileManager.processFrontMatter(tfile, (fm: Record<string, unknown>) => {
                if (fm.man === "man" && fm.id && fetchedAnimeByID[fm.id as number]) {
                    const noteAnime = fetchedAnimeByID[fm.id as number];
                    if (tfile.name !== fileName(noteAnime)) {
                        this.app.vault.rename(tfile, `${notesDir}/${fileName(noteAnime)}`).catch(()=>{});
                    }
                }
            });
        }
    }

    const fmt = this.settings.animeNoteT.frontMatterT.concat(REQUIRED_FIELDS);
    const bodyT = hb.compile(this.settings.animeNoteT.noteBodyT);

    try {
        for (const anime of userList) {
            const fullPath = `${notesDir}/${fileName(anime)}`;
            
            let file = this.app.vault.getFileByPath(fullPath);

            if (!file) {
                const noteContent = bodyT(anime);
                file = await this.app.vault.create(fullPath, noteContent);
            }

            const fmtData = buildFrontmatterFromEntries(fmt, anime);

            await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
                for (const prop of fmt) {
                    fm[prop.key] = fmtData[prop.key];
                }
            });
        }
    } catch (error) {
        console.error(error);
        new Notice("There was an error syncing your anime list. Check the console for more details.");
    }
}