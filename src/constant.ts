import type { AniNotesSettings } from "./settings";
import type { FetchOptions } from "./api/common";
import { DEFAULT_ANIME_T, DEFAULT_MANGA_T } from "./template/constant";

export type AutoSyncIntervalMode = "off" | "hour" | "day" | "week" | "custom";

const AUTO_SYNC_INTERVAL_MODES: readonly string[] = ["off", "hour", "day", "week", "custom"];

export function isAutoSyncIntervalMode(value: unknown): value is AutoSyncIntervalMode {
	return typeof value === "string" && AUTO_SYNC_INTERVAL_MODES.includes(value);
}

export const AUTO_SYNC_PRESET_MINUTES: Record<Exclude<AutoSyncIntervalMode, "custom">, number> = {
	off: 0,
	hour: 60,
	day: 24 * 60,
	week: 7 * 24 * 60,
};

export const MIN_CUSTOM_INTERVAL_MINUTES = 1;
export const MAX_CUSTOM_INTERVAL_MINUTES = 30 * 24 * 60;

/** Resolves the current auto sync interval in minutes; 0 when disabled. */
export function autoSyncIntervalMinutes(settings: AniNotesSettings): number {
	if (settings.autoSyncInterval === "off") return 0;

	if (settings.autoSyncInterval === "custom") {
		const value = settings.autoSyncCustomInterval;
		if (!Number.isFinite(value)) return 0;
		return Math.min(Math.max(Math.round(value), MIN_CUSTOM_INTERVAL_MINUTES), MAX_CUSTOM_INTERVAL_MINUTES);
	}

	return AUTO_SYNC_PRESET_MINUTES[settings.autoSyncInterval];
}

export const DEFAULT_SETTINGS: AniNotesSettings = {
	tokenAL: undefined,
	animeNoteT: DEFAULT_ANIME_T,
	mangaNoteT: DEFAULT_MANGA_T,
	fetchUserDataAtStartup: true,
	apiFetchOptions: {
		includeRelations: false,
		includeCharacters: false,
		includeStudios: false,
		includeStaff: false,
		includeTags: false,
		includeExternalLinks: false,
	},
	useCustomAnimeRequest: false,
	useCustomMangaRequest: false,
	customMangaRequest: "",
	customAnimeRequest: "",
	allowUserNoteNames: false,
	autoSyncOnStartup: false,
	autoSyncInterval: "off",
	autoSyncCustomInterval: 60,
	notifyOnSync: true,
};

function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Shape actually read from data.json: any subset of the settings, with
 * nested fetch options possibly missing keys added in newer versions.
 */
export interface StoredSettings extends Partial<Omit<AniNotesSettings, "apiFetchOptions">> {
	apiFetchOptions?: Partial<FetchOptions>;
}

/**
 * Merges stored settings over a fresh copy of the defaults. Nested objects
 * merge per-key so new defaults reach existing users; arrays (frontmatter
 * entries in particular) replace wholesale so user deletions stick. Keys
 * that no longer exist (removed settings) are dropped.
 */
export function mergeSettings(defaults: AniNotesSettings, stored: StoredSettings | null): AniNotesSettings {
	const base = deepClone(defaults);
	if (!stored) return base;

	const animeNoteT = stored.animeNoteT ?? base.animeNoteT;
	const mangaNoteT = stored.mangaNoteT ?? base.mangaNoteT;

	return {
		tokenAL: stored.tokenAL,
		animeNoteT: {
			...animeNoteT,
			frontMatterT: animeNoteT.frontMatterT.map((entry) => ({ ...entry })),
		},
		mangaNoteT: {
			...mangaNoteT,
			frontMatterT: mangaNoteT.frontMatterT.map((entry) => ({ ...entry })),
		},
		fetchUserDataAtStartup: stored.fetchUserDataAtStartup ?? base.fetchUserDataAtStartup,
		accountALInfo: stored.accountALInfo,
		apiFetchOptions: { ...base.apiFetchOptions, ...stored.apiFetchOptions },
		useCustomAnimeRequest: stored.useCustomAnimeRequest ?? base.useCustomAnimeRequest,
		useCustomMangaRequest: stored.useCustomMangaRequest ?? base.useCustomMangaRequest,
		customMangaRequest: stored.customMangaRequest ?? base.customMangaRequest,
		customAnimeRequest: stored.customAnimeRequest ?? base.customAnimeRequest,
		allowUserNoteNames: stored.allowUserNoteNames ?? base.allowUserNoteNames,
		autoSyncOnStartup: stored.autoSyncOnStartup ?? base.autoSyncOnStartup,
		autoSyncInterval: isAutoSyncIntervalMode(stored.autoSyncInterval) ? stored.autoSyncInterval : base.autoSyncInterval,
		autoSyncCustomInterval: stored.autoSyncCustomInterval ?? base.autoSyncCustomInterval,
		notifyOnSync: stored.notifyOnSync ?? base.notifyOnSync,
	};
}
