import { FuzzyDate, Maybe, MediaList, MediaFormat, MediaStatus, MediaListGroup, MediaListStatus, MediaRelation, CharacterName, StaffName } from "generated/anilist-schema";
import { RelationshipLink, toRelationshipLink } from "./common";


export interface AnimeModel {
    id: number,
    idMal?: number,
    title?: string,
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
    userList?: string,

    characters?: CharacterName[],
    staff?: StaffName[],
    studios?: string[],
    relations?: {
        adaptations?: RelationshipLink[],
        alternatives?: RelationshipLink[],
        parents?: RelationshipLink[],
        prequels?: RelationshipLink[],
        sequels?: RelationshipLink[],
        sideStories?: RelationshipLink[],
        sources?: RelationshipLink[],
        spinOffs?: RelationshipLink[],
        summaries?: RelationshipLink[],
    },
}

export const toPluginFormat = (anime: MediaList, userList?: string): AnimeModel => {
    const toDate = (date?: Maybe<FuzzyDate>): Date | undefined =>  {
        if (date?.year && date?.month && date?.day) {
            return new Date(date.year, date.month, date.day);
        }
        return undefined;
    }

    const studios = anime.media?.studios?.nodes?.filter(Boolean).map(studio => studio?.name) as string[] ?? undefined;
    const staff = anime.media?.staff?.nodes?.filter(Boolean).map(staff => staff?.name) as StaffName[] ?? undefined;
    const characters = anime.media?.characters?.nodes?.filter(Boolean).map(character => character?.name) as CharacterName[] ?? undefined;

    const relations = {
        adaptatons: [] as RelationshipLink[],
        alternatives: [] as RelationshipLink[],
        parents: [] as RelationshipLink[],
        prequels: [] as RelationshipLink[],
        sequels: [] as RelationshipLink[],
        sideStories: [] as RelationshipLink[],
        sources: [] as RelationshipLink[],
        spinOffs: [] as RelationshipLink[],
        summaries: [] as RelationshipLink[],
    }

    for (const rel of anime.media?.relations?.edges ?? []) {
        if (!rel?.relationType || !rel?.node) continue;
        const relLink = toRelationshipLink(rel.node);
        switch (rel.relationType) {
            case MediaRelation.Alternative:
                relations.alternatives.push(relLink);
                break;
            case MediaRelation.Parent:
                relations.parents.push(relLink);
                break;
            case MediaRelation.Prequel:
                relations.prequels.push(relLink);
                break;
            case MediaRelation.Sequel:
                relations.sequels.push(relLink);
                break;
            case MediaRelation.SideStory:
                relations.sideStories.push(relLink);
                break;
            case MediaRelation.Source:
                relations.sources.push(relLink);
                break;
            case MediaRelation.SpinOff:
                relations.spinOffs.push(relLink);
                break;
            case MediaRelation.Summary:
                relations.summaries.push(relLink);
                break;
        }
    }

    return {
        id: anime.id,
        idMal: anime.media?.idMal ?? undefined,
        title: anime.media?.title?.userPreferred ?? undefined,
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
        userStatus: anime.status ?? undefined,
        userList,

        studios,
        staff,
        characters,
        relations,
    }
}

export const listToPluginFormat = (list: MediaListGroup): AnimeModel[] => {
    const userList: string | undefined = list.name ?? undefined;

    if (!list.entries) {
        return [];
    }

    const formattedList: AnimeModel[] = [];

    for (const entry of list.entries) {
        if (entry) formattedList.push(toPluginFormat(entry, userList))
    }

    return formattedList;
}