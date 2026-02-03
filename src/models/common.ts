import { Media, MediaFormat } from "generated/anilist-schema";

export interface RelationshipLink {
    id: number,
    title: string,
    format: MediaFormat
}

export const toRelationshipLink = (media: Media): RelationshipLink => {
    return {
        id: media.id,
        title: media.title?.userPreferred ?? '',
        format: media.format ?? MediaFormat.Tv
    }
}