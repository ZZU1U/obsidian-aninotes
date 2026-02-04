import { MANSettings } from "settings"
import { DEFAULT_ANIME_T, DEFAULT_MANGA_T } from "template/constant"

export const DEFAULT_SETTINGS: MANSettings = {
    tokenAL: undefined,
    animeNoteT: DEFAULT_ANIME_T,
    mangaNoteT: DEFAULT_MANGA_T,
    dateFormat: "YYYY-MM-DD",
    fetchUserDataAtStartup: true,
    syncOnStartup: false,
    startupDelay: 1000 * 5,
    backgroundSync: false,
    backgroundSyncInterval: 1000 * 60 * 60,
    apiFetchOptions: {
        includeRelations: false,
        includeCharacters: false,
        includeStudios: false,
        includeStaff: false,
        includeTags: false,
        includeExternalLinks: false
    },
    useCustomAnimeRequest: false,
    useCustomMangaRequest: false,
    customMangaRequest: "",
    customAnimeRequest: ""
}
