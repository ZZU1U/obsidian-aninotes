import { RelationType } from "./common";

export interface RelatedManga {
    node: Manga,
    relation_type: RelationType,
    realtion_type_formatted: string,
}

export interface Manga {
    id: string
}