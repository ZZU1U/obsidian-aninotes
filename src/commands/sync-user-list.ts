import { Notice, TFile, normalizePath, parseYaml } from "obsidian";
import type AniNotesPlugin from "../main";
import { getUserMediaList } from "../api/anilist";
import { MAN_MARKER, REQUIRED_FIELDS } from "../template/constant";
import engine from "../template/engine";
import { buildFrontmatterFromEntries } from "../template/frontmatter";
import { logger } from "../tools/logger";
import type { MediaList } from "../generated/anilist-schema";
import type { MediaKind } from "../types";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---/;

function customRequestFor(plugin: AniNotesPlugin, kind: MediaKind): string | undefined {
	const enabled = kind === "anime" ? plugin.settings.useCustomAnimeRequest : plugin.settings.useCustomMangaRequest;
	if (!enabled) return undefined;

	const query = kind === "anime" ? plugin.settings.customAnimeRequest : plugin.settings.customMangaRequest;
	return query.trim() ? query : undefined;
}

/** Reads a note's frontmatter without going through the frontmatter write API. */
async function readFrontmatter(plugin: AniNotesPlugin, file: TFile): Promise<Record<string, unknown>> {
	const content = await plugin.app.vault.cachedRead(file);
	const match = FRONTMATTER_PATTERN.exec(content);
	if (!match?.[1]?.trim()) return {};

	try {
		const parsed = parseYaml(match[1]) as unknown;
		return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
	} catch {
		return {};
	}
}

/** Returns the ALId stored in a note's frontmatter, or undefined. */
function readALId(frontmatter: Record<string, unknown>): number | undefined {
	const id = frontmatter.ALId;
	if (typeof id === "number" && Number.isFinite(id)) return id;
	if (typeof id === "string" && id.trim() !== "" && Number.isFinite(Number(id))) return Number(id);
	return undefined;
}

/** Strips the legacy `man` marker written by older plugin versions; no-op otherwise. */
async function stripLegacyMarker(plugin: AniNotesPlugin, file: TFile, frontmatter: Record<string, unknown>): Promise<void> {
	if (!(MAN_MARKER in frontmatter)) return;

	await plugin.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
		delete fm[MAN_MARKER];
	});
}

async function listNoteFiles(plugin: AniNotesPlugin, dir: string): Promise<TFile[]> {
	const listing = await plugin.app.vault.adapter.list(normalizePath(dir));

	const files: TFile[] = [];
	for (const path of listing.files) {
		if (!path.endsWith(".md")) continue;
		const file = plugin.app.vault.getFileByPath(path);
		if (file) files.push(file);
	}
	return files;
}

async function ensureNoteDirExists(plugin: AniNotesPlugin, dir: string): Promise<void> {
	const normalized = normalizePath(dir);
	if (plugin.app.vault.getAbstractFileByPath(normalized)) return;
	await plugin.app.vault.createFolder(normalized);
}

/**
 * Fetches the user's list from AniList and brings the corresponding notes up
 * to date: managed notes are renamed to the filename template (unless custom
 * note names are allowed), then created/updated with rendered body and
 * frontmatter. All errors surface as notices; the promise never rejects.
 */
export async function syncUserMediaList(plugin: AniNotesPlugin, kind: MediaKind): Promise<void> {
	const settings = plugin.settings;
	const templates = kind === "anime" ? settings.animeNoteT : settings.mangaNoteT;

	if (!settings.tokenAL?.access_token) {
		new Notice("You need to log in first");
		return;
	}

	if (!settings.accountALInfo) {
		new Notice("You need to fetch your account data in settings");
		return;
	}

	try {
		const userList = await getUserMediaList({
			accessToken: settings.tokenAL.access_token,
			userId: settings.accountALInfo.id,
			mediaType: kind === "anime" ? "ANIME" : "MANGA",
			options: settings.apiFetchOptions,
			customRequest: customRequestFor(plugin, kind),
		});

		if (userList.length === 0) {
			logger.info(`AniList ${kind} list is empty or could not be read`);
			if (settings.notifyOnSync) {
				new Notice(`Your AniList ${kind} list is empty or could not be read`);
			}
			return;
		}

		const notesDir = templates.fileDir;
		await ensureNoteDirExists(plugin, notesDir);
		const existingFiles = await listNoteFiles(plugin, notesDir);

		const fileNameT = await engine.compile(templates.fileNameT);

		const fetchedById = new Map<number, MediaList>();
		for (const entry of userList) {
			if (entry.media?.id) fetchedById.set(entry.media.id, entry);
		}

		// Rename managed notes to their template names first, so the update
		// pass below always finds files at their canonical paths.
		if (!settings.allowUserNoteNames) {
			const renames: Promise<unknown>[] = [];
			for (const file of existingFiles) {
				const frontmatter = await readFrontmatter(plugin, file);
				await stripLegacyMarker(plugin, file, frontmatter);
				const alId = readALId(frontmatter);
				const media = alId !== undefined ? fetchedById.get(alId)?.media : undefined;
				if (!media) continue;

				const desiredName = await fileNameT(media);
				if (file.name !== desiredName) {
					renames.push(plugin.app.vault.rename(file, `${notesDir}/${desiredName}`));
				}
			}

			const results = await Promise.allSettled(renames);
			const failures = results.filter((result) => result.status === "rejected");
			if (failures.length > 0) {
				if (settings.notifyOnSync) {
					new Notice(`Failed to rename ${failures.length} ${kind} ${failures.length === 1 ? "note" : "notes"} (name conflict?). Check the plugin log in settings for details.`);
				}
				for (const failure of failures) {
					logger.warn(`Failed to rename a ${kind} note during sync`, failure.reason);
				}
			}
		}

		// With custom note names allowed, managed notes are located by ALId
		// instead of by their template path.
		const fileByALId = new Map<number, TFile>();
		if (settings.allowUserNoteNames) {
			for (const file of existingFiles) {
				const frontmatter = await readFrontmatter(plugin, file);
				await stripLegacyMarker(plugin, file, frontmatter);
				const alId = readALId(frontmatter);
				if (alId !== undefined) fileByALId.set(alId, file);
			}
		}

		const frontmatterT = templates.frontMatterT.concat(REQUIRED_FIELDS);
		const bodyT = await engine.compile(templates.noteBodyT);

		let created = 0;
		let updated = 0;
		for (const entry of userList) {
			const media = entry.media;
			if (!media) continue;

			const fullPath = `${notesDir}/${await fileNameT(media)}`;

			let file: TFile | null | undefined = plugin.app.vault.getFileByPath(fullPath);
			if (!file && settings.allowUserNoteNames && media.id) {
				file = fileByALId.get(media.id);
			}

			if (!file) {
				file = await plugin.app.vault.create(fullPath, await bodyT(entry));
				created++;
			} else {
				updated++;
			}

			const frontmatterData = await buildFrontmatterFromEntries(frontmatterT, entry);

			await plugin.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
				delete fm[MAN_MARKER];
				for (const prop of frontmatterT) {
					if (!prop.key.trim()) continue;
					fm[prop.key] = frontmatterData[prop.key];
				}
			});
		}

		const summary = `Synced ${kind} list: ${created} ${created === 1 ? "note" : "notes"} created, ${updated} updated.`;
		logger.info(summary);
		if (settings.notifyOnSync) {
			new Notice(summary);
		}
	} catch (error) {
		logger.error(`Failed to sync ${kind} list`, error);
		new Notice(`There was an error syncing your ${kind} list. Check the plugin log in settings for more details.`);
	}
}
