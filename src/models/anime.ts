import { FuzzyDate, Maybe, MediaList, MediaFormat, MediaStatus, MediaListGroup, MediaListStatus } from "generated/anilist-schema";
import { RelationshipLink } from "./common";


export interface AnimeModel {
    id: number,
    idMal?: number,
    englishTitle?: string,
    romajiTitle?: string,
    nativeTitle?: string,
    synonyms?: string[],
    startDate?: Date,
    endDate?: Date,
    completedAt?: Date,
    format?: string, // MediaFormat,
    status?: string, // MediaStatus,
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
    userStatus?: string, // MediaListStatus, 

    studios?: string[],
    staff?: string[],
    characters?: string[],
    //relations?: RelationshipLink[],
}

export const toPluginFormat = (anime: MediaList, userStatus?: MediaListStatus): AnimeModel => {
    const toDate = (date?: Maybe<FuzzyDate>): Date | undefined =>  {
        if (date?.year && date?.month && date?.day) {
            return new Date(date.year, date.month, date.day);
        }
        return undefined;
    }

    return {
        id: anime.id,
        idMal: anime.media?.idMal ?? undefined,
        englishTitle: anime.media?.title?.english ?? undefined,
        romajiTitle: anime.media?.title?.romaji ?? undefined,
        nativeTitle: anime.media?.title?.native ?? undefined,
        synonyms: anime.media?.synonyms?.filter(Boolean) as string[] ?? undefined,
        startDate: toDate(anime.media?.startDate),
        endDate: toDate(anime.media?.endDate),
        completedAt: toDate(anime.completedAt),
        format: anime.media?.format ?? undefined,
        status: anime.media?.status ?? undefined,
        description: anime.media?.description ?? undefined,
        episodes: anime.media?.episodes ?? undefined,
        country: anime.media?.countryOfOrigin as string ?? undefined,
        coverLarge: anime.media?.coverImage?.extraLarge ?? undefined,
        coverNormal: anime.media?.coverImage?.large ?? undefined,
        genres: anime.media?.genres?.filter(Boolean) as string[] ?? undefined,
        averageScore: anime.media?.averageScore ?? undefined,
        isFavorite: anime.media?.isFavourite ?? undefined,
        siteUrl: anime.media?.siteUrl ?? undefined,
        notes: anime.notes ?? undefined,
        progress: anime.progress ?? undefined,
        userScore: anime.score ?? undefined,
        userStatus,

        studios: anime.media?.studios?.nodes?.filter(Boolean).map(studio => studio?.name) as string[] ?? undefined,
        staff: anime.media?.staff?.nodes?.filter(Boolean).map(staff => staff?.name?.full) as string[] ?? undefined,
        characters: anime.media?.characters?.nodes?.filter(Boolean).map(character => character?.name?.full) as string[] ?? undefined,
    }
}

export const listToPluginFormat = (list: MediaListGroup): AnimeModel[] => {
    const userStatus: MediaListStatus | undefined = list.status ?? undefined;

    if (!list.entries) {
        return [];
    }

    const formattedList: AnimeModel[] = [];

    for (const entry of list.entries) {
        if (entry) formattedList.push(toPluginFormat(entry, userStatus))
    }

    return formattedList;
}