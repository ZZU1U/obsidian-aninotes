import { Notice, TFile } from "obsidian";
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
    const fileName = await hb.compile(this.settings.mangaNoteT.fileNameT);

    if (!this.settings.allowUserNoteNames) {
        for (const file of (await this.app.vault.adapter.list(notesDir)).files) {
            const tfile = this.app.vault.getFileByPath(file);
            if (!tfile) continue;

            await this.app.fileManager.processFrontMatter(tfile, (fm: Record<string, unknown>) => {
                if (fm.man === "man" && fm.ALId && fetchedMangaByID[fm.ALId as number]) {
                    const noteManga = fetchedMangaByID[fm.ALId as number];
                    hb.compile(this.settings.mangaNoteT.fileNameT).then(async (fn) => {
                        const desiredName = await fn(noteManga!.media!);
                        if (tfile.name !== desiredName) {
                            this.app.vault.rename(tfile, `${notesDir}/${desiredName}`).catch(() => {});
                        }
                    }).catch(() => {});
                }
            });
        }
    }

    const fmt = this.settings.mangaNoteT.frontMatterT.concat(REQUIRED_FIELDS);
    const bodyT = await hb.compile(this.settings.mangaNoteT.noteBodyT);

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
        for (const manga of userList) {
            const fullPath = `${notesDir}/${await fileName(manga.media!)}`;
            
            let file: TFile | null | undefined = this.app.vault.getFileByPath(fullPath);

            // If file not found and custom names are allowed, use the map
            if (!file && this.settings.allowUserNoteNames && manga.media?.id) {
                file = alIdToFileMap[manga.media.id];
            }

            if (!file) {
                const noteContent = await bodyT(manga);
                file = await this.app.vault.create(fullPath, noteContent);
            }

            const fmtData = await buildFrontmatterFromEntries(fmt, manga);

            await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
                for (const prop of fmt) {
                    fm[prop.key] = fmtData[prop.key];
                }
            });
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        new Notice(`There was an error syncing your manga list. ${errorMessage}`);
    }
}
