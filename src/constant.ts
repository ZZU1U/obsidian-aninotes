import { MANSettings } from "settings"
import { MAL_CLIENT_ID } from "api/constant"
import { DEFAULT_ANIME_T, DEFAULT_MANGA_T } from "template/constant"

export const DEFAULT_SETTINGS: MANSettings = {
    clientId: MAL_CLIENT_ID,
    accessToken: "",
    refreshToken: "",
    username: "",
    animeNoteT: DEFAULT_ANIME_T,
    mangaNoteT: DEFAULT_MANGA_T,
    dateFormat: "YYYY-MM-DD",
    fetchRelatedAnimeManga: false,
    syncOnStartup: false,
    startupDelay: 1000 * 5,
    backgroundSync: false,
    backgroundSyncInterval: 1000 * 60 * 60
}