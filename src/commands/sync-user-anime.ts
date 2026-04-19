import { Notice, TFile } from "obsidian";
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
    const fileName = await hb.compile(this.settings.animeNoteT.fileNameT);

    if (!this.settings.allowUserNoteNames) {
        for (const file of (await this.app.vault.adapter.list(notesDir)).files) {
            const tfile = this.app.vault.getFileByPath(file);
            if (!tfile) continue;

            await this.app.fileManager.processFrontMatter(tfile, (fm: Record<string, unknown>) => {
                if (fm.man === "man" && fm.ALId && fetchedAnimeByID[fm.ALId as number]) {
                    const noteAnime = fetchedAnimeByID[fm.ALId as number];
                    hb.compile(this.settings.animeNoteT.fileNameT).then(async (fn) => {
                        const desiredName = await fn(noteAnime!.media!);
                        if (tfile.name !== desiredName) {
                            this.app.vault.rename(tfile, `${notesDir}/${desiredName}`).catch(() => {});
                        }
                    }).catch(() => {});
                }
            });
        }
    }

    const fmt = this.settings.animeNoteT.frontMatterT.concat(REQUIRED_FIELDS);
    const bodyT = await hb.compile(this.settings.animeNoteT.noteBodyT);

    // Build map of ALId to file path for custom name lookup
    let alIdToFileMap: Record<number, TFile> = {};
    if (this.settings.allowUserNoteNames) {
        const files = (await this.app.vault.adapter.list(notesDir)).files;
        for (const filePath of files) {
            const tfile = this.app.vault.getFileByPath(filePath);
            if (!tfile) continue;
            
            await this.app.fileManager.processFrontMatter(tfile, (fm: Record<string, unknown>) => {
                if (fm.man === "man" && fm.ALId) {
                    alIdToFileMap[fm.ALId as number] = tfile;
                }
            });
        }
    }

    try {
        for (const anime of userList) {
            const fullPath = `${notesDir}/${await fileName(anime.media!)}`;
            
            let file: TFile | null | undefined = this.app.vault.getFileByPath(fullPath);

            // If file not found and custom names are allowed, use the map
            if (!file && this.settings.allowUserNoteNames && anime.media?.id) {
                file = alIdToFileMap[anime.media.id];
            }

            if (!file) {
                const noteContent = await bodyT(anime);
                file = await this.app.vault.create(fullPath, noteContent);
            }

            const fmtData = await buildFrontmatterFromEntries(fmt, anime);

            await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
                for (const prop of fmt) {
                    fm[prop.key] = fmtData[prop.key];
                }
            });
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        new Notice(`There was an error syncing your anime list. ${errorMessage}`);
    }
}