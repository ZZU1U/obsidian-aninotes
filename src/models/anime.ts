import { RelationType, AgeRating, SourceMediaType } from "./common"
import { RelatedManga } from "./manga"

enum AnimeMediaType {
    UNKNOWN = "unknown",
    TV = "tv",
    OVA = "ova",
    ONA = "ona",
    MOVIE = "movie",
    SPECIAL = "special",
    MUSIC = "music"
}

enum AnimeStatus {
    FINISHED_AIRING = "finished_airing",
    CURRENTLY_AIRING = "currently_airing",
    NOT_YET_AIRED = "not_yet_aired"
}

enum AnimeWatchStatus {
    WATCHING = "watching",
    COMPLETED = "completed",
    ON_HOLD = "on_hold",
    DROPPED = "dropped",
    PLAN_TO_WATCH = "plan_to_watch"
}

interface RelatedAnime {
    node: AnimeSchema,
    relation_type: RelationType,
    realtion_type_formatted: string,
}

interface AnimeUserListStatus {
    status?: AnimeWatchStatus,
    score: number,
    num_episodes_watched: number,
    is_rewatching: boolean,
    start_date?: string,
    finish_date?: string,
    priority: number,
    num_times_rewatched: number,
    rewatch_value: number,
    tags: Array<string>,
    comments: string,
    updated_at: string
}

export interface AnimeSchema {
    id: number,
    title: string,
    main_picture?: {
        large?: string,
        medium: string
    },
    alternative_titles?: {
        synonyms?: string[],
        en?: string,
        ja?: string,
    },
    start_date?: string,
    end_date?: string,
    synopsis?: string,
    mean?: number,
    rank?: number,
    popularity?: number,
    num_list_users: number,
    num_scoring_users: number,
    nsfw?: string,
    genres: Array<{id: number, name: string}>,
    created_at: string,
    updated_at: string,
    media_type: AnimeMediaType,
    status: AnimeStatus,
    my_list_status: AnimeUserListStatus,
    num_episodes: number,
    start_season?: {year: number, season: "winter" | "spring" | "summer" | "fall"},
    broadcast?: {day_of_the_week: string, start_time?: string},
    source?: SourceMediaType,
    average_episode_duration?: number,
    rating?: AgeRating,
    studios: Array<{id: number, name: string}>,
    related_anime?: RelatedAnime[],
    related_manga?: RelatedManga[]
}

export interface UserAnimeListItem {
    node: AnimeSchema,
    list_status: AnimeUserListStatus
}

export interface UserAnimeList {
    data: UserAnimeListItem[],
    paging: {
        previous: string,
        next: string,
    }
}