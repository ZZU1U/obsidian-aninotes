import { FuzzyDate, Maybe, MediaList, MediaFormat, MediaStatus, MediaListGroup, MediaListStatus } from "generated/anilist-schema";
import { RelationshipLink } from "./common";


export interface MangaModel { // TODO: adapt this whole
    id: number,
    idMal?: number,
    englishTtile?: string,
    romajiTitle?: string,
    nativeTitle?: string,
    synonyms?: string[],
    startDate?: Date,
    endDate?: Date,
    completedAt?: Date,
    format?: MediaFormat,
    status?: MediaStatus,
    description?: string,
    episodes?: number,
    country?: string,
    coverLarge?: string,
    coverNormal?: string,
    genres?: string[],
    averageScore?: number,
    isFavorite?: boolean
    siteUrl?: string,
    notes?: string,
    progress?: number,
    userScore?: number,
    userStatus?: MediaListStatus,

    studios?: string[],
    staff?: string[],
    characters?: string[],
    //relations?: RelationshipLink[],
}

export const toPluginFormat = (manga: MediaList, userStatus?: MediaListStatus): MangaModel => {
    const toDate = (date?: Maybe<FuzzyDate>): Date | undefined =>  {
        if (date?.year && date?.month && date?.day) {
            return new Date(date.year, date.month, date.day);
        }
        return undefined;
    }

    return {
        id: manga.id,
        idMal: manga.media?.idMal ?? undefined,
        englishTtile: manga.media?.title?.english ?? undefined,
        romajiTitle: manga.media?.title?.romaji ?? undefined,
        nativeTitle: manga.media?.title?.native ?? undefined,
        synonyms: manga.media?.synonyms?.filter(Boolean) as string[] ?? undefined,
        startDate: toDate(manga.media?.startDate),
        endDate: toDate(manga.media?.endDate),
        completedAt: toDate(manga.completedAt),
        format: manga.media?.format ?? undefined,
        status: manga.media?.status ?? undefined,
        description: manga.media?.description ?? undefined,
        episodes: manga.media?.episodes ?? undefined,
        country: manga.media?.countryOfOrigin as string ?? undefined,
        coverLarge: manga.media?.coverImage?.extraLarge ?? undefined,
        coverNormal: manga.media?.coverImage?.large ?? undefined,
        genres: manga.media?.genres?.filter(Boolean) as string[] ?? undefined,
        averageScore: manga.media?.averageScore ?? undefined,
        isFavorite: manga.media?.isFavourite ?? undefined,
        siteUrl: manga.media?.siteUrl ?? undefined,
        notes: manga.notes ?? undefined,
        progress: manga.progress ?? undefined,
        userScore: manga.score ?? undefined,
        userStatus,

        studios: manga.media?.studios?.nodes?.filter(Boolean).map(studio => studio?.name) as string[] ?? undefined,
        staff: manga.media?.staff?.nodes?.filter(Boolean).map(staff => staff?.name?.full) as string[] ?? undefined,
        characters: manga.media?.characters?.nodes?.filter(Boolean).map(character => character?.name?.full) as string[] ?? undefined,
    }
}

export const listToPluginFormat = (list: MediaListGroup): MangaModel[] => {
    const userStatus: MediaListStatus | undefined = list.status ?? undefined;

    if (!list.entries) {
        return [];
    }

    const formattedList: MangaModel[] = [];

    for (const entry of list.entries) {
        if (entry) formattedList.push(toPluginFormat(entry, userStatus))
    }

    return formattedList;
}